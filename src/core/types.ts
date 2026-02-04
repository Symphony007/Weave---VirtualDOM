// src/core/types.ts

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
 * Props are plain key-value pairs.
 * They must be treated as immutable by the system.
 */
export type VNodeProps = Readonly<Record<string, unknown>> | null;

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
 * Stable identity hint for reconciliation.
 */
export type VNodeKey = string | number | null;

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
