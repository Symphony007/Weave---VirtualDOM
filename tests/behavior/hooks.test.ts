import { describe, it, expect, beforeEach } from 'vitest';
import { h, mount } from '../../src/index.js';

describe('Weave – hooks', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('calls create hook and delays removal until done()', async () => {
    const calls: string[] = [];

    const vnode1 = h('div', null, [
      h('p', {
        key: 'a',
        hooks: {
          create() {
            calls.push('create');
          },
          remove(_vnode, _node, done) {
            calls.push('remove:start');
            setTimeout(() => {
              calls.push('remove:done');
              done();
            }, 10);
          }
        }
      }, 'A')
    ]);

    const vnode2 = h('div', null, []); // remove child

    const root = mount(vnode1, container);

    // create hook should have fired
    expect(calls).toEqual(['create']);
    expect(container.textContent).toBe('A');

    root.update(vnode2);

    // removal should be delayed
    expect(container.textContent).toBe('A');
    expect(calls).toEqual(['create', 'remove:start']);

    // wait for done()
    await new Promise(resolve => setTimeout(resolve, 15));

    expect(container.textContent).toBe('');
    expect(calls).toEqual(['create', 'remove:start', 'remove:done']);
  });
});
