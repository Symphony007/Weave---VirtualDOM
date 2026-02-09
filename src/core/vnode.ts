import type {
  VNode,
  VNodeChildren,
  VNodeKey,
  VNodeProps,
  VNodeType
} from './types.js';

/**
 * Internal VNode identity counter.
 * Used by the renderer only — never exposed publicly.
 */
let vnodeId = 0;

/**
 * Create an immutable VNode.
 *
 * This is the only legal way to construct a VNode.
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

  // 🔒 Internal stable identity (non-enumerable, renderer-only)
  Object.defineProperty(vnode, '__id', {
    value: vnodeId++,
    enumerable: false,
    writable: false,
    configurable: false
  });

  // Always freeze (safe, deterministic, platform-agnostic)
  Object.freeze(vnode);
  if (props) Object.freeze(props);
  if (Array.isArray(children)) Object.freeze(children);

  return vnode;
}
