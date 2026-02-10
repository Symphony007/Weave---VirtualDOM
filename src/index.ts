import { createRenderer } from './renderer/createRenderer.js';
import { domHost } from './platforms/dom/host.js';
import { h } from './core/h.js';
import type { VNode } from './core/types.js';

/**
 * Re-export the public VNode factory.
 *
 * This allows users to import from the main entry:
 * import { h } from 'weave';
 */
export { h };

/**
 * Re-export the VNode type
 * so users don’t need to know the internal file structure.
 */
export type { VNode };

/**
 * Create a renderer using the DOM host implementation.
 *
 * This binds the platform-agnostic renderer
 * to the browser DOM.
 */
const renderer = createRenderer(domHost);

/**
 * Public mount function.
 *
 * This is the main entry point for users.
 *
 * It:
 * 1. Takes a VNode tree
 * 2. Mounts it into a DOM container
 * 3. Returns a Root controller for updates/unmounting
 */
export function mount(vnode: VNode, container: HTMLElement) {
  return renderer.mount(vnode, container);
}
