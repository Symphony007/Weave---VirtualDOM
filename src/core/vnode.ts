import type {
  VNode,
  VNodeChildren,
  VNodeKey,
  VNodeProps,
  VNodeType
} from './types.js';

/**
 * Internal VNode identity counter.
 *
 * Each VNode receives a unique, stable internal ID.
 * This ID is:
 * - Used only by the renderer
 * - Not visible to users
 * - Not part of the public VNode shape
 *
 * It enables:
 * - Stable node identity
 * - Efficient node reuse
 * - Correct MOVE and UPDATE operations
 */
let vnodeId = 0;

/**
 * Create an immutable VNode.
 *
 * This is the only legal way to construct a VNode.
 * All VNodes in the system must pass through here.
 *
 * Responsibilities:
 * 1. Create the VNode object
 * 2. Attach an internal stable identity (__id)
 * 3. Freeze the object to enforce immutability
 */
export function createVNode(
  type: VNodeType,
  props: VNodeProps,
  children: VNodeChildren,
  key: VNodeKey = null
): VNode {
  const vnode: VNode = {
    type,
    props,
    children,
    key
  };

  /**
   * Attach internal stable identity.
   *
   * This property:
   * - Is non-enumerable (won’t show in logs or spreads)
   * - Cannot be changed or removed
   * - Is used by the renderer to map VNodes to real nodes
   */
  Object.defineProperty(vnode, '__id', {
    value: vnodeId++,
    enumerable: false,
    writable: false,
    configurable: false
  });

  /**
   * Freeze the VNode and its immediate data.
   *
   * This guarantees:
   * - No accidental mutation
   * - Predictable diff behavior
   * - Easier debugging
   *
   * Only shallow freezing is needed because:
   * - Props are already plain objects
   * - Children arrays are frozen
   */
  Object.freeze(vnode);
  if (props) Object.freeze(props);
  if (Array.isArray(children)) Object.freeze(children);

  return vnode;
}
