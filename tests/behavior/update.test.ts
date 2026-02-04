import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – update', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('updates text without recreating the root element', () => {
    const vnode1 = h('div', null, 'First');
    const vnode2 = h('div', null, 'Second');

    const root = mount(vnode1, container);
    const firstElement = container.firstChild;

    root.update(vnode2);
    const secondElement = container.firstChild;

    expect(container.textContent).toBe('Second');
    expect(secondElement).toBe(firstElement); // no remount
  });
});
