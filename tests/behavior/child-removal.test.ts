import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – child removal (keyed)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('removes a middle child without recreating siblings', () => {
    const vnode1 = h('div', null, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
      h('p', { key: 'c' }, 'C')
    ]);

    const vnode2 = h('div', null, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'c' }, 'C')
    ]);

    const root = mount(vnode1, container);

    const divBefore = container.firstElementChild as HTMLElement;
    const firstBefore = divBefore.children[0];
    const lastBefore = divBefore.children[2];

    root.update(vnode2);

    const divAfter = container.firstElementChild as HTMLElement;
    const firstAfter = divAfter.children[0];
    const lastAfter = divAfter.children[1];

    expect(divAfter.textContent).toBe('AC');
    expect(divAfter.children.length).toBe(2);

    // identity preserved
    expect(firstAfter).toBe(firstBefore);
    expect(lastAfter).toBe(lastBefore);
  });
});
