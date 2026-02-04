import type { VNode } from './types.js';
import type { Patch } from './patch-types.js';

/**
 * Compute patches required to transform oldVNode into newVNode.
 * This function is pure and deterministic.
 */
export function diff(
  oldVNode: VNode | null,
  newVNode: VNode | null
): Patch[] {
  // ---- REPLACE CASES ----

  if (oldVNode === null && newVNode !== null) {
    return [{ type: 'REPLACE', vnode: newVNode }];
  }

  if (oldVNode !== null && newVNode === null) {
    return [{ type: 'REPLACE', vnode: newVNode as unknown as VNode }];
  }

  if (oldVNode === null && newVNode === null) {
    return [];
  }

  if (oldVNode!.type !== newVNode!.type) {
    return [{ type: 'REPLACE', vnode: newVNode! }];
  }

  const patches: Patch[] = [];

  // ---- TEXT DIFF ----

  if (
    typeof oldVNode!.children === 'string' &&
    typeof newVNode!.children === 'string'
  ) {
    if (oldVNode!.children !== newVNode!.children) {
      patches.push({
        type: 'UPDATE_TEXT',
        value: newVNode!.children
      });
    }
    return patches;
  }

  // ---- PROPS DIFF ----

  const oldProps = oldVNode!.props ?? {};
  const newProps = newVNode!.props ?? {};

  for (const key in newProps) {
    if (newProps[key] !== oldProps[key]) {
      patches.push({
        type: 'SET_PROP',
        key,
        value: newProps[key]
      });
    }
  }

  for (const key in oldProps) {
    if (!(key in newProps)) {
      patches.push({
        type: 'REMOVE_PROP',
        key
      });
    }
  }

  // ---- CHILDREN DIFF (INDEX-BASED) ----

  const oldChildren = Array.isArray(oldVNode!.children)
    ? oldVNode!.children
    : [];

  const newChildren = Array.isArray(newVNode!.children)
    ? newVNode!.children
    : [];

  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i++) {
    const oldChild = oldChildren[i] ?? null;
    const newChild = newChildren[i] ?? null;

    // Insert
    if (oldChild === null && newChild !== null) {
      patches.push({
        type: 'INSERT',
        vnode: newChild,
        index: i
      });
      continue;
    }

    // Remove
    if (oldChild !== null && newChild === null) {
      patches.push({
        type: 'REMOVE',
        index: i
      });
      continue;
    }

    // Update (recursive diff)
    const childPatches = diff(oldChild, newChild);
    patches.push(...childPatches);
  }

  return patches;
}
