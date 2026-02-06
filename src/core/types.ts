/**
 * A VNode represents an immutable description of UI intent.
 * It contains no platform-specific or stateful logic.
 */

/**
 * Valid VNode node types.
 * - string: host elements (e.g. 'div', 'span')
 * - Symbol: special internal nodes (e.g. Fragment in future)
 */
export type VNodeType = string | symbol;

/**
 * Stable identity hint for reconciliation.
 */
export type VNodeKey = string | number | null;

/**
 * Lifecycle hooks for a VNode.
 * Hooks are observational only — they must not affect diffing.
 */
export interface VNodeHooks<Node = unknown> {
  /**
   * Called after the DOM node is created.
   */
  create?: (vnode: VNode, node: Node) => void;

  /**
   * Called after a VNode is updated but identity is preserved.
   */
  update?: (oldVNode: VNode, newVNode: VNode, node: Node) => void;

  /**
   * Called before a DOM node is removed.
   * Removal is delayed until `done()` is called.
   */
  remove?: (vnode: VNode, node: Node, done: () => void) => void;
}

/**
 * Props are plain key-value pairs.
 * Hooks live under the reserved `hooks` key.
 */
export type VNodeProps = Readonly<{
  hooks?: VNodeHooks;
  [key: string]: unknown;
}> | null;

/**
 * A VNode may have:
 * - no children
 * - text children
 * - array of VNodes
 *
 * Mixed children are normalized elsewhere.
 */
export type VNodeChildren = string | readonly VNode[] | null;

/**
 * Core VNode interface.
 * This shape is frozen and must not be extended implicitly.
 */
export interface VNode {
  readonly type: VNodeType;
  readonly props: VNodeProps;
  readonly children: VNodeChildren;
  readonly key: VNodeKey;
}
