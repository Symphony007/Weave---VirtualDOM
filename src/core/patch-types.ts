import type { VNode } from './types.js';

/**
 * Patch operations describe WHAT changed,
 * never HOW to apply it.
 */

/**
 * Replace an entire node.
 * Used when node type changes.
 */
export interface ReplacePatch {
  readonly type: 'REPLACE';
  readonly vnode: VNode;
}

/**
 * Update text node content.
 */
export interface UpdateTextPatch {
  readonly type: 'UPDATE_TEXT';
  readonly value: string;
}

/**
 * Insert a new child node at an index.
 */
export interface InsertPatch {
  readonly type: 'INSERT';
  readonly vnode: VNode;
  readonly index: number;
}

/**
 * Remove an existing child node at an index.
 */
export interface RemovePatch {
  readonly type: 'REMOVE';
  readonly index: number;
}

/**
 * Set or update a prop.
 */
export interface SetPropPatch {
  readonly type: 'SET_PROP';
  readonly key: string;
  readonly value: unknown;
}

/**
 * Remove a prop.
 */
export interface RemovePropPatch {
  readonly type: 'REMOVE_PROP';
  readonly key: string;
}

/**
 * Move a child from one index to another.
 * (Used later in keyed diffing)
 */
export interface MovePatch {
  readonly type: 'MOVE';
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
