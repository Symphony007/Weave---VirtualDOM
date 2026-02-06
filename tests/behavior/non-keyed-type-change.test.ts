import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – non-keyed child type change', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('replaces a non-keyed child when its type changes without recreating the parent', () => {
    const vnode1 = h('div', null, [
      h('span', null, 'Hello')
    ]);

    const vnode2 = h('div', null, [
      h('p', null, 'Hello')
    ]);

    const root = mount(vnode1, container);

    const parentBefore = container.firstElementChild as HTMLElement;
    const spanBefore = parentBefore.firstElementChild as HTMLElement;

    root.update(vnode2);

    const parentAfter = container.firstElementChild as HTMLElement;
    const pAfter = parentAfter.firstElementChild as HTMLElement;

    // Parent identity must be preserved
    expect(parentAfter).toBe(parentBefore);

    // Child replaced
    expect(pAfter.tagName.toLowerCase()).toBe('p');
    expect(pAfter.textContent).toBe('Hello');

    // Old child removed
    expect(container.querySelector('span')).toBeNull();

    // Sanity: original span node is gone
    expect(spanBefore.isConnected).toBe(false);
  });
});
