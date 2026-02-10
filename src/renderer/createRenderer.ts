import type { VNode } from '../core/types.js';
import type { Patch } from '../core/patch-types.js';
import { diff } from '../core/diff.js';
import { createMetrics, recordUpdate, updateSlowestPatchType, recordPatch } from './metrics.js';

/**
 * Internal VNode type with renderer-only identity.
 * The core VNode does not expose __id publicly.
 */
type VNodeWithId = VNode & { __id: number };

/**
 * Host configuration interface.
 *
 * Defines the minimal set of operations
 * the renderer needs to manipulate a platform.
 *
 * This keeps the renderer platform-agnostic.
 */
export interface HostConfig<Node> {
  createElement(type: string): Node;
  createText(text: string): Node;
  setProp(node: Node, key: string, value: unknown): void;
  removeProp(node: Node, key: string): void;
  insert(parent: Node, child: Node, index: number): void;
  remove(node: Node): void;
}

/**
 * Root controller returned after mounting.
 *
 * Provides:
 * - update(): apply a new VNode tree
 * - unmount(): remove everything
 * - metrics: performance and patch statistics
 */
export interface Root {
  update(vnode: VNode): void;
  unmount(): void;
  metrics: ReturnType<typeof createMetrics>;
}

/**
 * Create a renderer for a specific host.
 *
 * The renderer:
 * - Runs the diff algorithm
 * - Applies patches to the host
 * - Tracks metrics
 */
export function createRenderer<Node extends { textContent?: string }>(
  host: HostConfig<Node>
) {
  return {
    mount(vnode: VNode, container: Node): Root {
      // Current VNode tree
      let currentVNode: VNode | null = null;

      // Actual root node in the host environment
      let rootNode: Node | null = null;

      /**
       * Stable identity map.
       *
       * Maps internal VNode IDs to real host nodes.
       * This enables:
       * - Fast lookup during patches
       * - Node reuse
       * - MOVE operations
       */
      const nodeMap = new Map<number, Node>();

      // Renderer metrics
      const metrics = createMetrics();

      /**
       * Recursively create a host node from a VNode.
       */
      function createNode(vnode: VNode, _parent: Node): Node {
        const v = vnode as VNodeWithId;

        // Create element
        const node = host.createElement(v.type as string);

        // Track node creation
        metrics.nodes.created++;

        // Apply props
        if (v.props) {
          for (const key in v.props) {
            if (key !== 'hooks') {
              host.setProp(node, key, v.props[key]);
            }
          }
        }

        // Handle children
        if (typeof v.children === 'string') {
          // Text child
          const textNode = host.createText(v.children);
          host.insert(node, textNode, 0);
        } else if (Array.isArray(v.children)) {
          // Element children
          v.children.forEach((child, index) => {
            const childNode = createNode(child, node);
            host.insert(node, childNode, index);
          });
        }

        // Register node in identity map
        nodeMap.set(v.__id, node);

        // Run create lifecycle hook
        v.props?.hooks?.create?.(v, node);

        return node;
      }

      /**
       * Apply a list of patches to the host.
       */
      function commit(patches: Patch[]): void {
        for (const patch of patches) {
          // Record patch before processing
          recordPatch(metrics, patch);

          // Update patch counters
          metrics.patches.total++;
          metrics.patches.byType[patch.type]++;

          switch (patch.type) {
            case 'REPLACE': {
              // Remove old root if it exists
              if (rootNode) {
                host.remove(rootNode);
                metrics.nodes.removed++;
                rootNode = null;
                nodeMap.clear();
              }

              // Mount new root
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

              // Update text content directly
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

              // DOM-safe move:
              // remove first, then insert at new index
              host.remove(childNode);
              host.insert(parentNode, childNode, patch.to);

              break;
            }

            case 'REMOVE': {
              const v = patch.vnode as VNodeWithId;
              const node = nodeMap.get(v.__id);
              if (!node) break;

              const removeHook = v.props?.hooks?.remove;

              // Final removal logic
              const finalizeRemoval = () => {
                host.remove(node);
                metrics.nodes.removed++;
                nodeMap.delete(v.__id);
              };

              // If hook exists, let it control timing
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
                // Update identity mapping
                nodeMap.delete(oldV.__id);
                nodeMap.set(newV.__id, node);

                // Run update hook
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

      /**
       * Update the rendered tree.
       *
       * Runs diff, applies patches,
       * and records performance metrics.
       */
      function update(nextVNode: VNode): void {
        const start = performance.now();

        const patches = diff(currentVNode, nextVNode);
        commit(patches);
        currentVNode = nextVNode;

        const duration = performance.now() - start;

        recordUpdate(metrics, duration, patches.length);
        updateSlowestPatchType(metrics);
      }

      /**
       * Remove the entire rendered tree.
       */
      function unmount(): void {
        if (rootNode) {
          host.remove(rootNode);
          metrics.nodes.removed++;
          rootNode = null;
          currentVNode = null;
          nodeMap.clear();
        }
      }

      // Initial mount
      update(vnode);

      return {
        update,
        unmount,
        metrics
      };
    }
  };
}
