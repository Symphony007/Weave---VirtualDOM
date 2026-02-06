import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – keyed child type change', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('replaces a keyed child when its type changes', () => {
    const vnode1 = h('div', null, [
      h('span', { key: 'a' }, 'Hello')
    ]);

    const vnode2 = h('div', null, [
      h('div', { key: 'a' }, 'Hello')
    ]);

    const root = mount(vnode1, container);

    const parentBefore = container.firstElementChild as HTMLElement;
    const childBefore = parentBefore.firstElementChild as HTMLElement;

    expect(childBefore.tagName).toBe('SPAN');

    root.update(vnode2);

    const parentAfter = container.firstElementChild as HTMLElement;
    const childAfter = parentAfter.firstElementChild as HTMLElement;

    // Parent must be preserved
    expect(parentAfter).toBe(parentBefore);

    // Child must be replaced, not reused
    expect(childAfter.tagName).toBe('DIV');
    expect(childAfter).not.toBe(childBefore);

    // Content must still be correct
    expect(container.textContent).toBe('Hello');
  });
});
