import type { VNode } from '../core/types.js';
import type { Patch } from '../core/patch-types.js';
import { diff } from '../core/diff.js';

export interface HostConfig<Node> {
  createElement(type: string): Node;
  createText(text: string): Node;
  setProp(node: Node, key: string, value: unknown): void;
  removeProp(node: Node, key: string): void;
  insert(parent: Node, child: Node, index: number): void;
  remove(node: Node): void;
}

export interface Root {
  update(vnode: VNode): void;
  unmount(): void;
}

export function createRenderer<Node extends { textContent?: string }>(
  host: HostConfig<Node>
) {
  return {
    mount(vnode: VNode, container: Node): Root {
      let currentVNode: VNode | null = null;
      let rootNode: Node | null = null;

      const nodeMap = new Map<VNode, Node>();
      const parentMap = new Map<VNode, Node>();

      function createNode(vnode: VNode, parent: Node): Node {
        const node = host.createElement(vnode.type as string);

        if (vnode.props) {
          for (const key in vnode.props) {
            host.setProp(node, key, vnode.props[key]);
          }
        }

        if (typeof vnode.children === 'string') {
          const textNode = host.createText(vnode.children);
          host.insert(node, textNode, 0);
        } else if (Array.isArray(vnode.children)) {
          vnode.children.forEach((child: VNode, index: number) => {
            const childNode = createNode(child, node);
            host.insert(node, childNode, index);
          });
        }

        nodeMap.set(vnode, node);
        parentMap.set(vnode, parent);

        return node;
      }


      function commit(patches: Patch[]): void {
        for (const patch of patches) {
          switch (patch.type) {
            case 'REPLACE': {
              if (rootNode) {
                host.remove(rootNode);
                rootNode = null;
                nodeMap.clear();
                parentMap.clear();
              }

              if (patch.vnode !== null) {
                const newNode = createNode(patch.vnode, container);
                host.insert(container, newNode, 0);
                rootNode = newNode;
              }
              break;
            }

            case 'UPDATE_TEXT': {
              const node = nodeMap.get(patch.vnode);
              if (node && typeof node.textContent === 'string') {
                node.textContent = patch.value;
              }
              break;
            }

            case 'SET_PROP': {
              const node = nodeMap.get(patch.vnode);
              if (node) {
                host.setProp(node, patch.key, patch.value);
              }
              break;
            }

            case 'REMOVE_PROP': {
              const node = nodeMap.get(patch.vnode);
              if (node) {
                host.removeProp(node, patch.key);
              }
              break;
            }

            case 'INSERT': {
              const parentNode = nodeMap.get(patch.parent);
              if (!parentNode) break;

              const childNode = createNode(patch.vnode, parentNode);
              host.insert(parentNode, childNode, patch.index);
              break;
            }

            case 'REMOVE': {
              const node = nodeMap.get(patch.vnode);
              if (!node) break;

              host.remove(node);
              nodeMap.delete(patch.vnode);
              parentMap.delete(patch.vnode);
              break;
            }

            case 'MOVE': {
              const parentNode = nodeMap.get(patch.parent);
              const childNode = nodeMap.get(patch.vnode);
              if (!parentNode || !childNode) break;

              // IMPORTANT:
              // insertBefore automatically moves an existing node
              host.insert(parentNode, childNode, patch.to);
              break;
            }

          }
        }
      }

      function update(nextVNode: VNode): void {
        const patches = diff(currentVNode, nextVNode);
        commit(patches);
        currentVNode = nextVNode;
      }

      function unmount(): void {
        if (rootNode) {
          host.remove(rootNode);
          rootNode = null;
          currentVNode = null;
          nodeMap.clear();
          parentMap.clear();
        }
      }

      update(vnode);

      return { update, unmount };
    }
  };
}
