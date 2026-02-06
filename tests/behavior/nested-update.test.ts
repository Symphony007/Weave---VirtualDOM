import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – nested update', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('updates nested text without recreating parent or child elements', () => {
    const vnode1 = h('div', null, [
      h('span', null, 'Hello')
    ]);

    const vnode2 = h('div', null, [
      h('span', null, 'World')
    ]);

    const root = mount(vnode1, container);

    const divBefore = container.firstChild as HTMLElement;
    const spanBefore = divBefore.firstChild as HTMLElement;

    root.update(vnode2);

    const divAfter = container.firstChild as HTMLElement;
    const spanAfter = divAfter.firstChild as HTMLElement;

    expect(container.textContent).toBe('World');

    // Critical identity guarantees
    expect(divAfter).toBe(divBefore);     // parent reused
    expect(spanAfter).toBe(spanBefore);   // child reused
  });
});
