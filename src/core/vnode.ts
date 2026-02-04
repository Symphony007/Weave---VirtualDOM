
import type {
  VNode,
  VNodeChildren,
  VNodeKey,
  VNodeProps,
  VNodeType
} from './types.js';

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

  // Always freeze (safe, deterministic, platform-agnostic)
  Object.freeze(vnode);
  if (props) Object.freeze(props);
  if (Array.isArray(children)) Object.freeze(children);

  return vnode;
}
