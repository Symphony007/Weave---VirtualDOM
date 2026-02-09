import type { VNode } from '../core/types.js';
import type { Patch } from '../core/patch-types.js';
import { diff } from '../core/diff.js';
import { createMetrics, recordUpdate, updateSlowestPatchType } from './metrics.js'; // 🆕 Import helpers

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
  metrics: ReturnType<typeof createMetrics>;
}

export function createRenderer<Node extends { textContent?: string }>(
  host: HostConfig<Node>
) {
  return {
    mount(vnode: VNode, container: Node): Root {
      let currentVNode: VNode | null = null;
      let rootNode: Node | null = null;

      const nodeMap = new Map<VNode, Node>();
      const metrics = createMetrics();

      function createNode(vnode: VNode, _parent: Node): Node {
        const node = host.createElement(vnode.type as string);

        metrics.nodes.created++;

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

      function commit(patches: Patch[]): void {
        for (const patch of patches) {
          metrics.patches.total++;
          metrics.patches.byType[patch.type]++;

          switch (patch.type) {
            case 'REPLACE': {
              if (rootNode) {
                host.remove(rootNode);
                metrics.nodes.removed++;
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

              host.insert(parentNode, childNode, patch.to);
              break;
            }

            case 'REMOVE': {
              const node = nodeMap.get(patch.vnode);
              if (!node) break;

              const removeHook = patch.vnode.props?.hooks?.remove;

              const finalizeRemoval = () => {
                host.remove(node);
                metrics.nodes.removed++;
                nodeMap.delete(patch.vnode);
              };

              if (removeHook) {
                removeHook(patch.vnode, node, finalizeRemoval);
              } else {
                finalizeRemoval();
              }

              break;
            }

            case 'UPDATE': {
              const node = nodeMap.get(patch.oldVNode);
              if (node) {
                // 🆕 Remap to new VNode
                nodeMap.delete(patch.oldVNode);
                nodeMap.set(patch.newVNode, node);

                patch.newVNode.props?.hooks?.update?.(
                  patch.oldVNode,
                  patch.newVNode,
                  node
                );
              }
              break;
            }
          }
        }
      }

      function update(nextVNode: VNode): void {
        const start = performance.now();

        const patches = diff(currentVNode, nextVNode);
        commit(patches);
        currentVNode = nextVNode;

        const duration = performance.now() - start;

        // 🆕 Record update with new helper
        recordUpdate(metrics, duration, patches.length);
        
        // 🆕 Update slowest patch type
        updateSlowestPatchType(metrics);
      }

      function unmount(): void {
        if (rootNode) {
          host.remove(rootNode);
          metrics.nodes.removed++;
          rootNode = null;
          currentVNode = null;
          nodeMap.clear();
        }
      }

      update(vnode);

      return {
        update,
        unmount,
        metrics
      };
    }
  };
}