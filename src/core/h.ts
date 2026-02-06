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
 * - string → string
 * - array → flattened
 * - mixed text + elements → ❌ disallowed (for now)
 */
function normalizeChildren(input: unknown[]): VNodeChildren {
  const elements: VNode[] = [];
  let text: string | null = null;

  const walk = (child: unknown): void => {
    if (
      child === null ||
      child === undefined ||
      typeof child === 'boolean'
    ) {
      return;
    }

    if (Array.isArray(child)) {
      child.forEach(walk);
      return;
    }

    if (typeof child === 'number' || typeof child === 'string') {
      text = (text ?? '') + String(child);
      return;
    }

    elements.push(child as VNode);
  };

  input.forEach(walk);

  if (elements.length > 0 && text !== null) {
    throw new Error(
      'Mixed text and element children are not supported yet'
    );
  }

  if (elements.length > 0) return elements;
  if (text !== null) return text;

  return null;
}
