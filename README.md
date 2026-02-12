# Weave VDOM

A production-grade Virtual DOM reconciler built from scratch in TypeScript. Weave implements a platform-agnostic diffing algorithm with keyed reconciliation, lifecycle hooks, and strict immutability guarantees.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

Weave is a minimal yet complete Virtual DOM implementation that demonstrates the core concepts behind modern UI libraries like React, Vue, and Preact.

It provides:

* **Platform-agnostic core** — The diffing algorithm has zero DOM dependencies
* **Efficient reconciliation** — Keyed and non-keyed diffing with minimal DOM operations
* **Type safety** — Full TypeScript support with strict type checking
* **Performance metrics** — Built-in instrumentation for debugging and optimization
* **Production-ready patterns** — Immutable VNodes, stable identity, and declarative patches

### Why Weave?

Weave was built to understand Virtual DOM internals from first principles.
Unlike production libraries that prioritize features and bundle size, Weave prioritizes **clarity and correctness**.

Every design decision is explicit, making it an excellent learning resource or foundation for custom renderers.

---

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/weave.git
cd weave
npm install
npm run build
```

### Basic Usage

```ts
import { h, mount } from './dist/src/index.js';

const vnode = h('div', { class: 'app' }, [
  h('h1', null, 'Hello Weave'),
  h('p', null, 'A minimal VDOM implementation')
]);

const container = document.getElementById('root');
const root = mount(vnode, container);

const updatedVNode = h('div', { class: 'app' }, [
  h('h1', null, 'Hello Updated World'),
  h('p', null, 'The DOM was efficiently patched')
]);

root.update(updatedVNode);

root.unmount();
```

---

## Architecture

Weave follows a **strict separation of concerns**:

```
src/
├── core/
│   ├── types.ts
│   ├── vnode.ts
│   ├── h.ts
│   ├── diff.ts
│   └── patch-types.ts
├── renderer/
│   ├── createRenderer.ts
│   └── metrics.ts
└── platforms/
    └── dom/
        └── host.ts
```

### Design Principles

1. **Immutability** — VNodes are frozen using `Object.freeze()`
2. **Stable Identity** — Each VNode has an internal `__id`
3. **Declarative Patches** — Diff produces instructions; renderer executes them
4. **No Platform Coupling** — Core never imports from renderer or platforms

---

## How It Works

### 1. VNode Creation

```ts
const vnode = h('button', {
  class: 'primary',
  onclick: () => console.log('clicked')
}, 'Click me');
```

Produces:

```ts
{
  type: 'button',
  props: { class: 'primary', onclick: [Function] },
  children: 'Click me',
  key: null,
  __id: 42
}
```

**Key Features:**

* Immutable VNodes
* Stable internal identity
* Shallow prop comparison
* Flexible children (`null | string | VNode[]`)

---

### 2. Diffing Algorithm

```ts
function diff(oldVNode: VNode | null, newVNode: VNode | null): Patch[]
```

Algorithm:

1. Type comparison
2. Text fast path
3. Prop diffing
4. Children reconciliation (keyed & non-keyed)

Keyed example:

```ts
[
  h('li', { key: 'c' }, 'Cherry'),
  h('li', { key: 'a' }, 'Apple'),
  h('li', { key: 'b' }, 'Banana')
]
```

Generates `MOVE` patches instead of recreating DOM nodes.

---

### 3. Patch Types

| Patch       | Purpose               |
| ----------- | --------------------- |
| REPLACE     | Replace subtree       |
| UPDATE_TEXT | Update text           |
| INSERT      | Insert child          |
| REMOVE      | Remove child          |
| MOVE        | Reorder child         |
| SET_PROP    | Set/update prop       |
| REMOVE_PROP | Remove prop           |
| UPDATE      | Sync identity & hooks |

---

### 4. Renderer

The renderer:

* Receives patches
* Maintains `Map<vnodeId, realNode>`
* Delegates to a HostConfig

```ts
interface HostConfig<Node> {
  createElement(type: string): Node;
  createText(text: string): Node;
  setProp(node: Node, key: string, value: unknown): void;
  removeProp(node: Node, key: string): void;
  insert(parent: Node, child: Node, index: number): void;
  remove(node: Node): void;
}
```

Swap HostConfig → target any platform.

---

## API Reference

### `h(type, props, ...children)`

Create a VNode.

### `mount(vnode, container)`

Returns:

* `update(vnode)`
* `unmount()`
* `metrics`

---

## Lifecycle Hooks

```ts
h('div', {
  hooks: {
    create(vnode, node) {},
    update(oldVNode, newVNode, node) {},
    remove(vnode, node, done) { done(); }
  }
});
```

---

## Demos

### Simple Demo

```bash
npm run build
```

Shows:

* Initial render
* Text update
* Node reuse

---

### Dashboard Demo

A real-time metrics dashboard built entirely with Weave.

```bash
npm run build
npm run build:demo
```

**Features:**

* FPS tracking
* Patch timeline
* Patch heatmap
* Update duration chart
* Live interactive updates

![Dashboard Screenshot](https://github.com/user-attachments/assets/03e23582-59bd-4424-81ac-db30a8454385)

This demo proves Weave can power complex, stateful UIs using only its VDOM engine.

---

## Performance Metrics

```ts
console.log(root.metrics.updates);
console.log(root.metrics.avgUpdateDurationMs);
console.log(root.metrics.patches.total);
console.log(root.metrics.nodes.active);
console.log(root.metrics.patches.byType);
```

Built-in instrumentation makes debugging and optimization transparent.

---

## Testing

Covers:

* Mount/unmount
* Text updates
* Nested updates
* Keyed reordering
* Lifecycle hooks
* DOM identity preservation

```bash
npm test
```

---

## Development

### Build

```bash
npm run build
npm run build:demo
```

### Lint

```bash
npm run lint
```

Rules enforced:

* No `any`
* Strict import boundaries
* Unused vars must start with `_`

---

## Extending Weave

### Custom Platform

```ts
const customHost: HostConfig<MyNode> = {
  createElement: () => {},
  createText: () => {},
  setProp: () => {},
  removeProp: () => {},
  insert: () => {},
  remove: () => {}
};
```

### Custom Patch Types

Extend the Patch union for advanced features like transitions.

---

## Architectural Constraints

```
core/       → imports nothing
renderer/   → imports core/
platforms/  → imports core/ + renderer/
```

Strict boundaries ensure portability and testability.

---

## Comparison

| Feature       | Weave    | React      | Preact     |
| ------------- | -------- | ---------- | ---------- |
| Virtual DOM   | ✅        | ✅          | ✅          |
| Keyed Diffing | ✅        | ✅          | ✅          |
| Components    | ❌        | ✅          | ✅          |
| State         | ❌        | ✅          | ✅          |
| Bundle        | ~3KB     | ~40KB      | ~3KB       |
| Focus         | Learning | Production | Production |

---

## Contributing

Potential enhancements:

* Fragment support
* Portal support
* Component abstraction
* Async rendering
* Benchmarks

Before contributing:

```bash
npm test
npm run lint
```

---

## License

MIT License

---

**Built by Deep to understand Virtual DOM from first principles.**

Open an issue for discussions or questions.
