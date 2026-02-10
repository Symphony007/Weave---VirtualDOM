import type { VNode } from '../core/types.js';
import type { Patch } from '../core/patch-types.js';
import { diff } from '../core/diff.js';
import { createMetrics, recordUpdate, updateSlowestPatchType, recordPatch } from './metrics.js';

type VNodeWithId = VNode & { __id: number };

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

      // ✅ Stable identity map
      const nodeMap = new Map<number, Node>();
      const metrics = createMetrics();

      function createNode(vnode: VNode, _parent: Node): Node {
        const v = vnode as VNodeWithId;
        const node = host.createElement(v.type as string);

        metrics.nodes.created++;

        if (v.props) {
          for (const key in v.props) {
            if (key !== 'hooks') {
              host.setProp(node, key, v.props[key]);
            }
          }
        }

        if (typeof v.children === 'string') {
          const textNode = host.createText(v.children);
          host.insert(node, textNode, 0);
        } else if (Array.isArray(v.children)) {
          v.children.forEach((child, index) => {
            const childNode = createNode(child, node);
            host.insert(node, childNode, index);
          });
        }

        nodeMap.set(v.__id, node);

        // CREATE hook
        v.props?.hooks?.create?.(v, node);

        return node;
      }

      function commit(patches: Patch[]): void {
        for (const patch of patches) {
          // ✅ Record patch in history BEFORE processing
          recordPatch(metrics, patch);

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
              const v = patch.vnode as VNodeWithId;
              const node = nodeMap.get(v.__id);
              if (node && typeof node.textContent === 'string') {
                node.textContent = patch.value;
              }
              break;
            }

            case 'SET_PROP': {
              const v = patch.vnode as VNodeWithId;
              const node = nodeMap.get(v.__id);
              if (node) {
                host.setProp(node, patch.key, patch.value);
              }
              break;
            }

            case 'REMOVE_PROP': {
              const v = patch.vnode as VNodeWithId;
              const node = nodeMap.get(v.__id);
              if (node) {
                host.removeProp(node, patch.key);
              }
              break;
            }

            case 'INSERT': {
              const parent = patch.parent as VNodeWithId;
              const parentNode = nodeMap.get(parent.__id);
              if (!parentNode) break;

              const childNode = createNode(patch.vnode, parentNode);
              host.insert(parentNode, childNode, patch.index);
              break;
            }

            case 'MOVE': {
              const parent = patch.parent as VNodeWithId;
              const child = patch.vnode as VNodeWithId;

              const parentNode = nodeMap.get(parent.__id);
              const childNode = nodeMap.get(child.__id);
              if (!parentNode || !childNode) break;

              // ✅ DOM-safe MOVE: remove then re-insert
              host.remove(childNode);
              host.insert(parentNode, childNode, patch.to);

              break;
            }


            case 'REMOVE': {
              const v = patch.vnode as VNodeWithId;
              const node = nodeMap.get(v.__id);
              if (!node) break;

              const removeHook = v.props?.hooks?.remove;

              const finalizeRemoval = () => {
                host.remove(node);
                metrics.nodes.removed++;
                nodeMap.delete(v.__id);
              };

              if (removeHook) {
                removeHook(v, node, finalizeRemoval);
              } else {
                finalizeRemoval();
              }

              break;
            }

            case 'UPDATE': {
              const oldV = patch.oldVNode as VNodeWithId;
              const newV = patch.newVNode as VNodeWithId;
              const node = nodeMap.get(oldV.__id);

              if (node) {
                nodeMap.delete(oldV.__id);
                nodeMap.set(newV.__id, node);

                newV.props?.hooks?.update?.(
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

        recordUpdate(metrics, duration, patches.length);
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