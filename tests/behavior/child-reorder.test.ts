import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – child reordering (keyed)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('reorders children without recreating any DOM nodes', () => {
    const vnode1 = h('div', null, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
      h('p', { key: 'c' }, 'C')
    ]);

    const vnode2 = h('div', null, [
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B')
    ]);

    const root = mount(vnode1, container);

    const divBefore = container.firstElementChild as HTMLElement;
    const aBefore = divBefore.children[0];
    const bBefore = divBefore.children[1];
    const cBefore = divBefore.children[2];

    root.update(vnode2);

    const divAfter = container.firstElementChild as HTMLElement;
    const cAfter = divAfter.children[0];
    const aAfter = divAfter.children[1];
    const bAfter = divAfter.children[2];

    // structural correctness
    expect(divAfter.textContent).toBe('CAB');
    expect(divAfter.children.length).toBe(3);

    // identity preserved
    expect(aAfter).toBe(aBefore);
    expect(bAfter).toBe(bBefore);
    expect(cAfter).toBe(cBefore);
  });
});
