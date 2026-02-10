import type { VNode } from './types.js';
import type { Patch } from './patch-types.js';

export function diff(
  oldVNode: VNode | null,
  newVNode: VNode | null
): Patch[] {
  // ---- ROOT / NULL TRANSITIONS ----

  if (oldVNode === null && newVNode !== null) {
    return [{ type: 'REPLACE', vnode: newVNode }];
  }

  if (oldVNode !== null && newVNode === null) {
    return [{ type: 'REPLACE', vnode: null }];
  }

  if (oldVNode === null && newVNode === null) {
    return [];
  }

  if (oldVNode && newVNode) {
    return diffNonNull(oldVNode, newVNode);
  }

  return [];
}

function diffNonNull(prev: VNode, next: VNode): Patch[] {
  const patches: Patch[] = [];

  // ---- TYPE CHANGE ----
  if (prev.type !== next.type) {
    return [{ type: 'REPLACE', vnode: next }];
  }

  // ---- TEXT CHILDREN ----
  if (
    typeof prev.children === 'string' &&
    typeof next.children === 'string'
  ) {
    if (prev.children !== next.children) {
      patches.push({
        type: 'UPDATE_TEXT',
        vnode: prev,
        value: next.children
      });
    }

    // ✅ Always emit UPDATE to keep nodeMap in sync
    patches.push({
      type: 'UPDATE',
      oldVNode: prev,
      newVNode: next
    });

    return patches;
  }

  // ---- PROPS ----
  const oldProps = prev.props ?? {};
  const newProps = next.props ?? {};

  for (const key in newProps) {
    if (key === 'hooks') continue;

    if (newProps[key] !== oldProps[key]) {
      patches.push({
        type: 'SET_PROP',
        vnode: prev,
        key,
        value: newProps[key]
      });
    }
  }

  for (const key in oldProps) {
    if (key === 'hooks') continue;

    if (!(key in newProps)) {
      patches.push({
        type: 'REMOVE_PROP',
        vnode: prev,
        key
      });
    }
  }


  // ---- CHILDREN ----
  const oldChildren = Array.isArray(prev.children) ? prev.children : [];
  const newChildren = Array.isArray(next.children) ? next.children : [];

  const hasKeys =
    oldChildren.some(c => c.key != null) ||
    newChildren.some(c => c.key != null);

  // ---- KEYED DIFF ----
  if (hasKeys) {
    const oldKeyMap = new Map<string | number, VNode>();
    const oldIndexMap = new Map<VNode, number>();

    oldChildren.forEach((child, index) => {
      if (child.key != null) {
        oldKeyMap.set(child.key, child);
      }
      oldIndexMap.set(child, index);
    });

    const usedOld = new Set<VNode>();

    newChildren.forEach((newChild, newIndex) => {
      const key = newChild.key;

      if (key != null && oldKeyMap.has(key)) {
        const oldChild = oldKeyMap.get(key)!;
        usedOld.add(oldChild);

        // Type change → remove + insert
        if (oldChild.type !== newChild.type) {
          patches.push({
            type: 'REMOVE',
            parent: prev,
            vnode: oldChild
          });

          patches.push({
            type: 'INSERT',
            parent: prev,
            vnode: newChild,
            index: newIndex
          });

          return;
        }

        patches.push(...diffNonNull(oldChild, newChild));

        const oldIndex = oldIndexMap.get(oldChild)!;
        if (oldIndex !== newIndex) {
          patches.push({
            type: 'MOVE',
            parent: prev,
            vnode: oldChild,
            from: oldIndex,
            to: newIndex
          });
        }
      } else {
        patches.push({
          type: 'INSERT',
          parent: prev,
          vnode: newChild,
          index: newIndex
        });
      }
    });

    oldChildren.forEach(oldChild => {
      if (!usedOld.has(oldChild)) {
        patches.push({
          type: 'REMOVE',
          parent: prev,
          vnode: oldChild
        });
      }
    });
  } else {
    // ---- INDEX DIFF ----
    const max = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < max; i++) {
      const oldChild = oldChildren[i] ?? null;
      const newChild = newChildren[i] ?? null;

      if (oldChild === null && newChild !== null) {
        patches.push({
          type: 'INSERT',
          parent: prev,
          vnode: newChild,
          index: i
        });
        continue;
      }

      if (oldChild !== null && newChild === null) {
        patches.push({
          type: 'REMOVE',
          parent: prev,
          vnode: oldChild
        });
        continue;
      }

      if (oldChild && newChild) {
        if (oldChild.type !== newChild.type) {
          patches.push({
            type: 'REMOVE',
            parent: prev,
            vnode: oldChild
          });
          patches.push({
            type: 'INSERT',
            parent: prev,
            vnode: newChild,
            index: i
          });
        } else {
          patches.push(...diffNonNull(oldChild, newChild));
        }
      }
    }
  }

  // ---- FINAL UPDATE (ALWAYS) ----
  // ✅ FIX: Always emit UPDATE to keep nodeMap in sync with new VNode IDs
  // The hook will only run if it exists, but the nodeMap always needs updating
  patches.push({
    type: 'UPDATE',
    oldVNode: prev,
    newVNode: next
  });

  return patches;
}