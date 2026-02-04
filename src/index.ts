import { createRenderer } from './renderer/createRenderer.js';
import { domHost } from './platforms/dom/host.js';
import { h } from './core/h.js';
import type { VNode } from './core/types.js';

export { h };
export type { VNode };

const renderer = createRenderer(domHost);

export function mount(vnode: VNode, container: HTMLElement) {
  return renderer.mount(vnode, container);
}
