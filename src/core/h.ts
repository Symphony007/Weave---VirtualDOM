import type {
  VNode,
  VNodeChildren,
  VNodeKey,
  VNodeProps,
  VNodeType
} from './types.js';
import { createVNode } from './vnode.js';

/**
 * Public VNode factory.
 * This is the only user-facing way to describe UI intent.
 */
export function h(
  type: VNodeType,
  props: VNodeProps | null,
  ...rawChildren: unknown[]
): VNode {
  let key: VNodeKey = null;

  if (props && 'key' in props) {
    key = props.key as VNodeKey;
  }

  const children = normalizeChildren(rawChildren);

  return createVNode(type, props, children, key);
}

/**
 * Normalize children into a predictable shape.
 *
 * Rules:
 * - null / undefined / boolean → ignored
 * - number → string
 * - nested arrays → flattened
 * - VNodes preserved as-is
 */
function normalizeChildren(input: unknown[]): VNodeChildren {
  const result: VNode[] = [];
  let hasText = false;
  let text = '';

  const walk = (child: unknown): void => {
    if (
      child === null ||
      child === undefined ||
      typeof child === 'boolean'
    ) {
      return;
    }

    if (Array.isArray(child)) {
      for (const c of child) walk(c);
      return;
    }

    if (typeof child === 'number') {
      hasText = true;
      text += String(child);
      return;
    }

    if (typeof child === 'string') {
      hasText = true;
      text += child;
      return;
    }

    // Assume VNode
    result.push(child as VNode);
  };

  for (const c of input) walk(c);

  if (hasText && result.length === 0) {
    return text;
  }

  if (hasText) {
    result.unshift(createVNode('#text', null, text));
  }

  return result.length > 0 ? result : null;
}
