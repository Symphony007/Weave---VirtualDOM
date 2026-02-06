import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – child update hooks', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('calls update hook on updated child vnode', () => {
    const calls: string[] = [];

    const vnode1 = h('div', null, [
      h('p', {
        key: 'a',
        hooks: {
          update: () => calls.push('update:a')
        }
      }, 'Hello')
    ]);

    const vnode2 = h('div', null, [
      h('p', {
        key: 'a',
        hooks: {
          update: () => calls.push('update:a')
        }
      }, 'World')
    ]);

    const root = mount(vnode1, container);
    root.update(vnode2);

    expect(container.textContent).toBe('World');
    expect(calls).toEqual(['update:a']);
  });
});
