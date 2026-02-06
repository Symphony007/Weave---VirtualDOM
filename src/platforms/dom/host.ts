import type { HostConfig } from '../../renderer/createRenderer.js';

type DomNode = HTMLElement | Text;

/**
 * Stores event listeners per element.
 * WeakMap ensures garbage collection when nodes are removed.
 */
const eventListenerMap = new WeakMap<
  HTMLElement,
  Map<string, EventListener>
>();

export const domHost: HostConfig<DomNode> = {
  createElement(type: string): HTMLElement {
    return document.createElement(type);
  },

  createText(text: string): Text {
    return document.createTextNode(text);
  },

  setProp(node: DomNode, key: string, value: unknown): void {
    if (!(node instanceof HTMLElement)) return;

    // ---- EVENT HANDLING ----
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();

      let listeners = eventListenerMap.get(node);
      if (!listeners) {
        listeners = new Map();
        eventListenerMap.set(node, listeners);
      }

      const existing = listeners.get(eventName);
      if (existing) {
        node.removeEventListener(eventName, existing);
      }

      node.addEventListener(eventName, value as EventListener);
      listeners.set(eventName, value as EventListener);
      return;
    }

    // ---- ATTRIBUTE HANDLING ----
    if (value === false || value === null || value === undefined) {
      node.removeAttribute(key);
      return;
    }

    node.setAttribute(key, String(value));
  },

  removeProp(node: DomNode, key: string): void {
    if (!(node instanceof HTMLElement)) return;

    if (key.startsWith('on')) {
      const eventName = key.slice(2).toLowerCase();
      const listeners = eventListenerMap.get(node);
      const listener = listeners?.get(eventName);

      if (listener) {
        node.removeEventListener(eventName, listener);
        listeners!.delete(eventName);
      }
      return;
    }

    node.removeAttribute(key);
  },

  insert(parent: DomNode, child: DomNode, index: number): void {
    if (!(parent instanceof HTMLElement)) return;

    const refNode = parent.childNodes[index] ?? null;
    parent.insertBefore(child, refNode);
  },

  remove(node: DomNode): void {
    const parent = node.parentNode;
    if (parent) {
      parent.removeChild(node);
    }
  }
};
