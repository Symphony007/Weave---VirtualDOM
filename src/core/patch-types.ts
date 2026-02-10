import type { VNode } from './types.js';

/**
 * Patch operations describe WHAT changed,
 * never HOW to apply it.
 *
 * The core diffing algorithm produces these patches.
 * The renderer is responsible for interpreting them
 * and performing the actual host operations.
 *
 * This separation keeps the core platform-agnostic.
 */

/**
 * Replace an entire subtree.
 *
 * Used when:
 * - Node type changes
 * - Root mount
 * - Full unmount
 *
 * vnode === null means unmount the subtree.
 */
export interface ReplacePatch {
  readonly type: 'REPLACE';
  readonly vnode: VNode | null;
}

/**
 * Update text content of a specific VNode.
 *
 * This is a fast path that avoids recreating the node.
 */
export interface UpdateTextPatch {
  readonly type: 'UPDATE_TEXT';
  readonly vnode: VNode;
  readonly value: string;
}

/**
 * Insert a new child into a parent at a specific index.
 *
 * Used when:
 * - A new node appears
 * - Keyed diff inserts a node
 */
export interface InsertPatch {
  readonly type: 'INSERT';
  readonly parent: VNode;
  readonly vnode: VNode;
  readonly index: number;
}

/**
 * Remove a child from a parent.
 *
 * The renderer may delay actual removal
 * if a lifecycle hook is present.
 */
export interface RemovePatch {
  readonly type: 'REMOVE';
  readonly parent: VNode;
  readonly vnode: VNode;
}

/**
 * Set or update a prop on a VNode.
 *
 * Only emitted when the prop value changes.
 */
export interface SetPropPatch {
  readonly type: 'SET_PROP';
  readonly vnode: VNode;
  readonly key: string;
  readonly value: unknown;
}

/**
 * Remove a prop from a VNode.
 *
 * Emitted when a prop exists in the old VNode
 * but not in the new one.
 */
export interface RemovePropPatch {
  readonly type: 'REMOVE_PROP';
  readonly vnode: VNode;
  readonly key: string;
}

/**
 * Move a child within the same parent.
 *
 * Used only in keyed diffing.
 *
 * NOTE:
 * `from` is metadata only — the renderer
 * performs moves based on node identity.
 */
export interface MovePatch {
  readonly type: 'MOVE';
  readonly parent: VNode;
  readonly vnode: VNode;
  readonly from: number;
  readonly to: number;
}

/**
 * Notify that a vnode was updated but reused.
 *
 * Used to:
 * - Sync internal node identity
 * - Trigger lifecycle update hooks
 */
export interface UpdatePatch {
  readonly type: 'UPDATE';
  readonly oldVNode: VNode;
  readonly newVNode: VNode;
}

/**
 * Closed union of all patch operations.
 *
 * This ensures:
 * - Exhaustive switch handling in renderer
 * - Strong type safety
 * - No unknown patch types at runtime
 */
export type Patch =
  | ReplacePatch
  | UpdateTextPatch
  | InsertPatch
  | RemovePatch
  | SetPropPatch
  | RemovePropPatch
  | MovePatch
  | UpdatePatch;
