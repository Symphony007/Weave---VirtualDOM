import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – initial mount', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders text content into the DOM', () => {
    const vnode = h('div', null, 'Hello Weave');

    mount(vnode, container);

    expect(container.textContent).toBe('Hello Weave');
  });
});
