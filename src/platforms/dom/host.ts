import type { HostConfig } from '../../renderer/createRenderer.js';

type DomNode = HTMLElement | Text;

/**
 * Stores event listeners per element.
 *
 * Structure:
 * WeakMap<HTMLElement, Map<eventName, listener>>
 *
 * Why WeakMap?
 * - When a DOM node is removed, the entry is automatically garbage collected.
 * - Prevents memory leaks.
 */
const eventListenerMap = new WeakMap<
  HTMLElement,
  Map<string, EventListener>
>();

/**
 * DOM-specific host implementation.
 *
 * This object translates abstract patch operations
 * into real DOM manipulations.
 *
 * The renderer calls these methods without knowing
 * anything about the actual platform.
 */
export const domHost: HostConfig<DomNode> = {
  /**
   * Create a DOM element.
   */
  createElement(type: string): HTMLElement {
    return document.createElement(type);
  },

  /**
   * Create a text node.
   */
  createText(text: string): Text {
    return document.createTextNode(text);
  },

  /**
   * Set or update a property on a node.
   *
   * Handles:
   * - Event listeners (onClick, onInput, etc.)
   * - Normal attributes
   */
  setProp(node: DomNode, key: string, value: unknown): void {
    // Only elements support attributes and events
    if (!(node instanceof HTMLElement)) return;

    // ---- EVENT HANDLING ----
    // Props starting with "on" are treated as event listeners
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();

      // Get or create listener map for this node
      let listeners = eventListenerMap.get(node);
      if (!listeners) {
        listeners = new Map();
        eventListenerMap.set(node, listeners);
      }

      // Remove existing listener if present
      const existing = listeners.get(eventName);
      if (existing) {
        node.removeEventListener(eventName, existing);
      }

      // Add new listener
      node.addEventListener(eventName, value as EventListener);
      listeners.set(eventName, value as EventListener);
      return;
    }

    // ---- ATTRIBUTE HANDLING ----
    // Remove attribute if value is falsy in a DOM sense
    if (value === false || value === null || value === undefined) {
      node.removeAttribute(key);
      return;
    }

    // Otherwise set as string attribute
    node.setAttribute(key, String(value));
  },

  /**
   * Remove a property from a node.
   *
   * Handles both:
   * - Event listeners
   * - Normal attributes
   */
  removeProp(node: DomNode, key: string): void {
    if (!(node instanceof HTMLElement)) return;

    // Remove event listener
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

    // Remove normal attribute
    node.removeAttribute(key);
  },

  /**
   * Insert a child node into a parent at a specific index.
   *
   * Uses insertBefore with a reference node
   * to preserve correct ordering.
   */
  insert(parent: DomNode, child: DomNode, index: number): void {
    if (!(parent instanceof HTMLElement)) return;

    const refNode = parent.childNodes[index] ?? null;
    parent.insertBefore(child, refNode);
  },

  /**
   * Remove a node from the DOM.
   */
  remove(node: DomNode): void {
    const parent = node.parentNode;
    if (parent) {
      parent.removeChild(node);
    }
  }
};
