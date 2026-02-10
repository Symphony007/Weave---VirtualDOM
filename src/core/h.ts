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
 *
 * This is the primary function used by users (and the demo)
 * to create virtual DOM nodes.
 *
 * It:
 * 1. Extracts the optional key from props
 * 2. Normalizes children into a consistent structure
 * 3. Delegates actual VNode creation to createVNode()
 */
export function h(
  type: VNodeType,
  props: VNodeProps | null,
  ...rawChildren: unknown[]
): VNode {
  let key: VNodeKey = null;

  // Extract key from props if present.
  // Keys are used by the diff algorithm for identity.
  if (props && 'key' in props) {
    key = props.key as VNodeKey;
  }

  // Convert raw children into normalized VNodeChildren
  const children = normalizeChildren(rawChildren);

  // Create the immutable VNode
  return createVNode(type, props, children, key);
}

/**
 * Normalize children into a predictable shape.
 *
 * The diff algorithm expects children to be in one of three forms:
 * - null
 * - string (text node)
 * - array of VNodes
 *
 * Rules:
 * - null / undefined / boolean → ignored
 * - number → converted to string
 * - string → kept as text
 * - array → recursively flattened
 * - mixed text + elements → ❌ disallowed (for now)
 */
function normalizeChildren(input: unknown[]): VNodeChildren {
  const elements: VNode[] = [];
  let text: string | null = null;

  /**
   * Recursive walker that flattens arrays
   * and separates text from element nodes.
   */
  const walk = (child: unknown): void => {
    // Ignore empty or non-renderable values
    if (
      child === null ||
      child === undefined ||
      typeof child === 'boolean'
    ) {
      return;
    }

    // Flatten nested arrays of children
    if (Array.isArray(child)) {
      child.forEach(walk);
      return;
    }

    // Convert text-like values to a single string
    if (typeof child === 'number' || typeof child === 'string') {
      text = (text ?? '') + String(child);
      return;
    }

    // Otherwise, treat as a VNode element
    elements.push(child as VNode);
  };

  // Process all input children
  input.forEach(walk);

  // Mixed text and elements are currently not supported
  // because it complicates diffing logic.
  if (elements.length > 0 && text !== null) {
    throw new Error(
      'Mixed text and element children are not supported yet'
    );
  }

  // Return element children if present
  if (elements.length > 0) return elements;

  // Otherwise return text if present
  if (text !== null) return text;

  // No children
  return null;
}
