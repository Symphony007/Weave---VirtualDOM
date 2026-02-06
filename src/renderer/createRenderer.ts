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

      // -----------------------------
      // Node creation
      // -----------------------------
      function createNode(vnode: VNode, _parent: Node): Node {
        const node = host.createElement(vnode.type as string);

        if (vnode.props) {
          for (const key in vnode.props) {
            if (key !== 'hooks') {
              host.setProp(node, key, vnode.props[key]);
            }
          }
        }

        if (typeof vnode.children === 'string') {
          const textNode = host.createText(vnode.children);
          host.insert(node, textNode, 0);
        } else if (Array.isArray(vnode.children)) {
          vnode.children.forEach((child, index) => {
            const childNode = createNode(child, node);
            host.insert(node, childNode, index);
          });
        }

        nodeMap.set(vnode, node);

        // CREATE hook
        vnode.props?.hooks?.create?.(vnode, node);

        return node;
      }

      // -----------------------------
      // Patch commit
      // -----------------------------
      function commit(patches: Patch[]): void {
        for (const patch of patches) {
          switch (patch.type) {
            case 'REPLACE': {
              if (rootNode) {
                host.remove(rootNode);
                rootNode = null;
                nodeMap.clear();
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

            case 'MOVE': {
              const parentNode = nodeMap.get(patch.parent);
              const childNode = nodeMap.get(patch.vnode);
              if (!parentNode || !childNode) break;

              // insertBefore moves if already attached
              host.insert(parentNode, childNode, patch.to);
              break;
            }

            case 'REMOVE': {
              const node = nodeMap.get(patch.vnode);
              if (!node) break;

              const removeHook = patch.vnode.props?.hooks?.remove;

              if (removeHook) {
                removeHook(patch.vnode, node, () => {
                  host.remove(node);
                  nodeMap.delete(patch.vnode);
                });
              } else {
                host.remove(node);
                nodeMap.delete(patch.vnode);
              }
              break;
            }

            case 'UPDATE': {
              const node = nodeMap.get(patch.oldVNode);
              if (!node) break;

              patch.newVNode.props?.hooks?.update?.(
                patch.oldVNode,
                patch.newVNode,
                node
              );
              break;
            }
          }
        }
      }

      // -----------------------------
      // Public API
      // -----------------------------
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
        }
      }

      // Initial mount
      update(vnode);

      return { update, unmount };
    }
  };
}
