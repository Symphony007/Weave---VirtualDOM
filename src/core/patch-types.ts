import type { VNode } from './types.js';

/**
 * Patch operations describe WHAT changed,
 * never HOW to apply it.
 *
 * Every patch is explicitly targeted.
 */

/**
 * Replace an entire subtree.
 * vnode === null means unmount.
 */
export interface ReplacePatch {
  readonly type: 'REPLACE';
  readonly vnode: VNode | null;
}

/**
 * Update text content of a specific VNode.
 */
export interface UpdateTextPatch {
  readonly type: 'UPDATE_TEXT';
  readonly vnode: VNode;
  readonly value: string;
}

/**
 * Insert a new child into a parent.
 */
export interface InsertPatch {
  readonly type: 'INSERT';
  readonly parent: VNode;
  readonly vnode: VNode;
  readonly index: number;
}

/**
 * Remove a child from a parent.
 */
export interface RemovePatch {
  readonly type: 'REMOVE';
  readonly parent: VNode;
  readonly vnode: VNode;
}

/**
 * Set or update a prop on a VNode.
 */
export interface SetPropPatch {
  readonly type: 'SET_PROP';
  readonly vnode: VNode;
  readonly key: string;
  readonly value: unknown;
}

/**
 * Remove a prop from a VNode.
 */
export interface RemovePropPatch {
  readonly type: 'REMOVE_PROP';
  readonly vnode: VNode;
  readonly key: string;
}

/**
 * Move a child within the same parent.
 *
 * NOTE:
 * `from` is metadata only — renderer uses identity-based moves.
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
 * Used for lifecycle hooks.
 */
export interface UpdatePatch {
  readonly type: 'UPDATE';
  readonly oldVNode: VNode;
  readonly newVNode: VNode;
}

/**
 * Closed union of all patch operations.
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
