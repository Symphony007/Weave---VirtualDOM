import type { VNode } from './types.js';
import type { Patch } from './patch-types.js';

export function diff(
  oldVNode: VNode | null,
  newVNode: VNode | null
): Patch[] {
  // ---- REPLACE CASES ----

  if (oldVNode === null && newVNode !== null) {
    return [{ type: 'REPLACE', vnode: newVNode }];
  }

  if (oldVNode === null || newVNode === null) {
    return [];
  }

  if (oldVNode.type !== newVNode.type) {
    return [{ type: 'REPLACE', vnode: newVNode }];
  }

  const patches: Patch[] = [];

  // ---- TEXT DIFF ----

  if (
    typeof oldVNode.children === 'string' &&
    typeof newVNode.children === 'string'
  ) {
    if (oldVNode.children !== newVNode.children) {
      patches.push({
        type: 'UPDATE_TEXT',
        vnode: oldVNode,
        value: newVNode.children
      });
    }
    return patches;
  }

  // ---- PROPS DIFF ----

  const oldProps = oldVNode.props ?? {};
  const newProps = newVNode.props ?? {};

  for (const key in newProps) {
    if (newProps[key] !== oldProps[key]) {
      patches.push({
        type: 'SET_PROP',
        vnode: oldVNode,
        key,
        value: newProps[key]
      });
    }
  }

  for (const key in oldProps) {
    if (!(key in newProps)) {
      patches.push({
        type: 'REMOVE_PROP',
        vnode: oldVNode,
        key
      });
    }
  }

  // ---- CHILDREN DIFF ----

  const oldChildren = Array.isArray(oldVNode.children)
    ? oldVNode.children
    : [];

  const newChildren = Array.isArray(newVNode.children)
    ? newVNode.children
    : [];

  const hasKeys =
    oldChildren.some(c => c.key != null) ||
    newChildren.some(c => c.key != null);

  // ---- KEYED DIFF (IDENTITY-FIRST, TWO-PHASE) ----
  if (hasKeys) {
    const oldKeyToVNode = new Map<string | number, VNode>();
    oldChildren.forEach(child => {
      if (child.key != null) {
        oldKeyToVNode.set(child.key, child);
      }
    });

    const matchedOld = new Set<VNode>();

    // Phase A — match & insert/move
    newChildren.forEach((newChild, newIndex) => {
      const key = newChild.key;

      if (key != null && oldKeyToVNode.has(key)) {
        const oldChild = oldKeyToVNode.get(key)!;
        matchedOld.add(oldChild);

        // diff matched nodes
        patches.push(...diff(oldChild, newChild));

        const oldIndex = oldChildren.indexOf(oldChild);
        if (oldIndex !== newIndex) {
          patches.push({
            type: 'MOVE',
            parent: oldVNode,
            vnode: oldChild,
            from: oldIndex,
            to: newIndex
          });
        }
      } else {
        // new node
        patches.push({
          type: 'INSERT',
          parent: oldVNode,
          vnode: newChild,
          index: newIndex
        });
      }
    });

    // Phase B — cleanup removals
    oldChildren.forEach(oldChild => {
      if (oldChild.key != null && !matchedOld.has(oldChild)) {
        patches.push({
          type: 'REMOVE',
          parent: oldVNode,
          vnode: oldChild
        });
      }
    });

    return patches;
  }

  // ---- FALLBACK: INDEX-BASED DIFF (UNCHANGED) ----

  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i++) {
    const oldChild = oldChildren[i] ?? null;
    const newChild = newChildren[i] ?? null;

    if (oldChild === null && newChild !== null) {
      patches.push({
        type: 'INSERT',
        parent: oldVNode,
        vnode: newChild,
        index: i
      });
      continue;
    }

    if (oldChild !== null && newChild === null) {
      patches.push({
        type: 'REMOVE',
        parent: oldVNode,
        vnode: oldChild
      });
      continue;
    }

    patches.push(...diff(oldChild, newChild));
  }

  return patches;
}
