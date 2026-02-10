/**
 * A VNode represents an immutable description of UI intent.
 *
 * It is a pure data structure that describes what should exist,
 * not how it should be created or updated.
 *
 * Important:
 * - No platform-specific logic (no DOM references)
 * - No internal state
 * - Fully immutable once created
 */

/**
 * Valid VNode node types.
 *
 * - string: host elements (e.g. 'div', 'span')
 * - symbol: reserved for special internal nodes
 *   (e.g. Fragment, Portal, etc. in future extensions)
 */
export type VNodeType = string | symbol;

/**
 * Stable identity hint for reconciliation.
 *
 * Keys are used during diffing to:
 * - Preserve DOM node identity
 * - Detect moves instead of replacements
 * - Optimize list updates
 */
export type VNodeKey = string | number | null;

/**
 * Lifecycle hooks for a VNode.
 *
 * Hooks are observational only.
 * They must not influence the diffing algorithm.
 *
 * The renderer is responsible for invoking them
 * at the correct time.
 */
export interface VNodeHooks<Node = unknown> {
  /**
   * Called after the real node is created
   * and inserted into the host environment.
   */
  create?: (vnode: VNode, node: Node) => void;

  /**
   * Called after a VNode is updated
   * while keeping the same underlying node.
   */
  update?: (oldVNode: VNode, newVNode: VNode, node: Node) => void;

  /**
   * Called before a node is removed.
   *
   * The actual removal is delayed until `done()` is called.
   * This enables animations or async cleanup.
   */
  remove?: (vnode: VNode, node: Node, done: () => void) => void;
}

/**
 * Props are plain key-value pairs.
 *
 * Special rule:
 * - Lifecycle hooks must live under the reserved `hooks` key.
 *
 * Props are:
 * - Readonly
 * - Platform-agnostic
 * - Interpreted only by the renderer
 */
export type VNodeProps = Readonly<{
  hooks?: VNodeHooks;
  [key: string]: unknown;
}> | null;

/**
 * A VNode may have:
 * - no children (null)
 * - text children (string)
 * - an array of VNodes
 *
 * Mixed text + element children are not allowed
 * and are normalized in the `h()` function.
 */
export type VNodeChildren = string | readonly VNode[] | null;

/**
 * Core VNode interface.
 *
 * This is the canonical shape of every virtual node.
 * It must remain minimal and platform-agnostic.
 *
 * The object is frozen at creation time to enforce immutability.
 */
export interface VNode {
  readonly type: VNodeType;
  readonly props: VNodeProps;
  readonly children: VNodeChildren;
  readonly key: VNodeKey;
}
