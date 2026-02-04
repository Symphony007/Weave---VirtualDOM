import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – unmount', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('removes DOM on unmount', () => {
    const vnode = h('div', null, 'Bye');

    const root = mount(vnode, container);
    expect(container.textContent).toBe('Bye');

    root.unmount();
    expect(container.textContent).toBe('');
  });
});
