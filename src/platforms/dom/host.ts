import type { HostConfig } from '../../renderer/createRenderer.js';

type DomNode = HTMLElement | Text;

export const domHost: HostConfig<DomNode> = {
  createElement(type: string): HTMLElement {
    return document.createElement(type);
  },

  createText(text: string): Text {
    return document.createTextNode(text);
  },

  setProp(node: DomNode, key: string, value: unknown): void {
    if (!(node instanceof HTMLElement)) return;

    // Event handling will be added later
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      node.addEventListener(eventName, value as EventListener);
      return;
    }

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
      // Listener removal will be improved later
      node.removeEventListener(eventName, () => {});
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
