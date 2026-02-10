import type { VNode } from './types.js';
import type { Patch } from './patch-types.js';

/**
 * Entry point for diffing two VNodes.
 *
 * This function compares the previous VNode tree with the next one
 * and produces a list of declarative patches describing the changes.
 *
 * The renderer will later interpret and apply these patches.
 */
export function diff(
  oldVNode: VNode | null,
  newVNode: VNode | null
): Patch[] {
  // ---- ROOT / NULL TRANSITIONS ----
  // These handle mount, unmount, and no-op cases.

  // Initial mount: no old tree, new tree exists
  if (oldVNode === null && newVNode !== null) {
    return [{ type: 'REPLACE', vnode: newVNode }];
  }

  // Full unmount: old tree exists, new tree is null
  if (oldVNode !== null && newVNode === null) {
    return [{ type: 'REPLACE', vnode: null }];
  }

  // Nothing to render
  if (oldVNode === null && newVNode === null) {
    return [];
  }

  // Normal diff between two existing nodes
  if (oldVNode && newVNode) {
    return diffNonNull(oldVNode, newVNode);
  }

  return [];
}

/**
 * Diff two non-null VNodes.
 *
 * This is the core recursive diffing algorithm.
 * It compares:
 * 1. Node type
 * 2. Text children
 * 3. Props
 * 4. Child nodes (keyed or index-based)
 */
function diffNonNull(prev: VNode, next: VNode): Patch[] {
  const patches: Patch[] = [];

  // ---- TYPE CHANGE ----
  // If the element type changed (e.g. div → span),
  // we must replace the entire subtree.
  if (prev.type !== next.type) {
    return [{ type: 'REPLACE', vnode: next }];
  }

  // ---- TEXT CHILDREN ----
  // Fast path for text-only nodes.
  if (
    typeof prev.children === 'string' &&
    typeof next.children === 'string'
  ) {
    // If text content changed, emit text update
    if (prev.children !== next.children) {
      patches.push({
        type: 'UPDATE_TEXT',
        vnode: prev,
        value: next.children
      });
    }

    // Always emit UPDATE so the renderer can:
    // - Sync internal node identity (__id)
    // - Trigger lifecycle hooks
    patches.push({
      type: 'UPDATE',
      oldVNode: prev,
      newVNode: next
    });

    return patches;
  }

  // ---- PROPS ----
  // Compare props shallowly and emit minimal updates.
  const oldProps = prev.props ?? {};
  const newProps = next.props ?? {};

  // Set or update props
  for (const key in newProps) {
    // Hooks are handled separately by the renderer
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

  // Remove props that no longer exist
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
  // Normalize children into arrays for easier diffing.
  const oldChildren = Array.isArray(prev.children) ? prev.children : [];
  const newChildren = Array.isArray(next.children) ? next.children : [];

  // Determine if we should use keyed diffing.
  // If any child has a key, we switch to keyed algorithm.
  const hasKeys =
    oldChildren.some(c => c.key != null) ||
    newChildren.some(c => c.key != null);

  // ---- KEYED DIFF ----
  // Preserves identity and supports moves.
  if (hasKeys) {
    // Map keys → old children for fast lookup
    const oldKeyMap = new Map<string | number, VNode>();
    const oldIndexMap = new Map<VNode, number>();

    oldChildren.forEach((child, index) => {
      if (child.key != null) {
        oldKeyMap.set(child.key, child);
      }
      oldIndexMap.set(child, index);
    });

    // Track which old nodes were reused
    const usedOld = new Set<VNode>();

    newChildren.forEach((newChild, newIndex) => {
      const key = newChild.key;

      // If the key exists in old children, attempt reuse
      if (key != null && oldKeyMap.has(key)) {
        const oldChild = oldKeyMap.get(key)!;
        usedOld.add(oldChild);

        // If types differ, we must replace
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

        // Recursively diff reused child
        patches.push(...diffNonNull(oldChild, newChild));

        // Detect reordering
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
        // New node that didn’t exist before
        patches.push({
          type: 'INSERT',
          parent: prev,
          vnode: newChild,
          index: newIndex
        });
      }
    });

    // Remove any old nodes that were not reused
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
    // Simpler algorithm when no keys are present.
    const max = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < max; i++) {
      const oldChild = oldChildren[i] ?? null;
      const newChild = newChildren[i] ?? null;

      // New node inserted
      if (oldChild === null && newChild !== null) {
        patches.push({
          type: 'INSERT',
          parent: prev,
          vnode: newChild,
          index: i
        });
        continue;
      }

      // Old node removed
      if (oldChild !== null && newChild === null) {
        patches.push({
          type: 'REMOVE',
          parent: prev,
          vnode: oldChild
        });
        continue;
      }

      // Both exist → compare
      if (oldChild && newChild) {
        // Different type → replace
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
          // Same type → recurse
          patches.push(...diffNonNull(oldChild, newChild));
        }
      }
    }
  }

  // ---- FINAL UPDATE (ALWAYS) ----
  // Ensures renderer updates internal node identity
  // and triggers update hooks if present.
  patches.push({
    type: 'UPDATE',
    oldVNode: prev,
    newVNode: next
  });

  return patches;
}
