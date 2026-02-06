import type { VNode } from './types.js';

/**
 * Patch operations describe WHAT changed,
 * never HOW to apply it.
 *
 * Every patch is explicitly targeted.
 */

/**
 * Replace an entire subtree.
 */
export interface ReplacePatch {
  readonly type: 'REPLACE';
  readonly vnode: VNode;
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
 *
 * IMPORTANT:
 * Removal is identity-based, never index-based.
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
 * Identity-based; indices are positional targets only.
 */
export interface MovePatch {
  readonly type: 'MOVE';
  readonly parent: VNode;
  readonly vnode: VNode;
  readonly from: number;
  readonly to: number;
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
  | MovePatch;
