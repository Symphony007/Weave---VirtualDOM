# Weave VDOM

A production-grade Virtual DOM reconciler built from scratch with TypeScript.
Weave implements a platform-agnostic diffing algorithm with keyed reconciliation, lifecycle hooks, and strict immutability guarantees.

---

## 🎯 Overview

Weave is a minimal but complete Virtual DOM implementation that demonstrates core concepts behind modern UI frameworks like React, Vue, and Preact.

It features a clean separation between platform-agnostic diffing logic and platform-specific rendering, making it suitable for DOM, Canvas, or even native rendering targets.

---

## ✨ Features

### Core Architecture

* **Platform-Agnostic Core**
  Diffing logic has zero dependencies on the DOM or any specific platform.
* **Keyed Reconciliation**
  Efficient list updates using stable keys (similar to React).
* **Non-Keyed Diffing**
  Fallback index-based diffing for simple lists.
* **Immutable VNodes**
  All VNodes are frozen, ensuring predictable behavior.
* **Type-Safe Patches**
  Closed union of patch operations with full TypeScript inference.

### Advanced Features

* Lifecycle hooks: `create`, `update`, `remove`
* Identity-preserving DOM updates
* WeakMap-based event handling
* Built-in performance metrics
* Zero runtime dependencies

---

## 🔧 Patch Operations

Weave generates minimal, declarative patch sets:

* **REPLACE** – Replace entire subtree
* **UPDATE_TEXT** – Update text in place
* **INSERT** – Add new child at index
* **REMOVE** – Remove child (supports async cleanup)
* **MOVE** – Reorder existing children (keyed lists)
* **SET_PROP / REMOVE_PROP** – Minimal prop updates
* **UPDATE** – Trigger lifecycle hooks

---

## 🏗️ Architecture

```
src/
├── core/              # Platform-agnostic VDOM core
│   ├── types.ts
│   ├── vnode.ts
│   ├── h.ts
│   ├── diff.ts
│   └── patch-types.ts
├── renderer/          # Patch application layer
│   ├── createRenderer.ts
│   └── metrics.ts
└── platforms/         # Platform-specific implementations
    └── dom/
        └── host.ts
```

### Design Principles

* **Separation of Concerns**
  Core diffing is pure logic; renderer applies patches.
* **Immutability**
  VNodes are frozen immediately after creation.
* **Identity Stability**
  Internal `__id` tracking ensures correct node reuse.
* **Declarative Patches**
  Renderer only executes instructions from the diff.

---

## 🚀 Getting Started

### Prerequisites

* Node.js v16 or higher
* npm or yarn
* Modern browser (for demos)

### Installation

```bash
git clone https://github.com/yourusername/weave.git
cd weave
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript into the `dist/` directory.

---

## 🎮 Running the Demos

### Simple Demo

```bash
npm run build
npx http-server -p 8000
```

Open:

```
http://localhost:8000/demo/index.html
```

**What you’ll see:**

* Initial render: `Hello from Weave`
* After 2 seconds: text updates
* `<h1>` element is reused (not recreated)

---

### Dashboard Demo

A live metrics dashboard built entirely with Weave.

```bash
npm run build
npm run build:demo
npx http-server -p 8000
```

Open:

```
http://localhost:8000/demo/dashboard/index.html
```

#### Dashboard Features

* Real-time performance metrics
* Patch timeline
* Patch heatmap
* Update duration chart
* Interactive counter demo

---

## 🧪 Running Tests

```bash
npm test
```

### Test Coverage

* Initial mount/unmount
* Text updates without recreation
* Nested updates
* Keyed list reordering
* Keyed removal
* Type changes
* Lifecycle hooks

---

## 📖 Usage

### Basic Example

```ts
import { h, mount } from './dist/src/index.js';

const vnode = h('div', { class: 'container' }, [
  h('h1', null, 'Hello World'),
  h('p', null, 'This is Weave VDOM')
]);

const container = document.getElementById('app');
const root = mount(vnode, container);

const updatedVNode = h('div', { class: 'container' }, [
  h('h1', null, 'Hello Updated World'),
  h('p', null, 'Still Weave VDOM')
]);

root.update(updatedVNode);
root.unmount();
```

---

### Keyed Lists

```ts
const list1 = h('ul', null, [
  h('li', { key: 'a' }, 'Item A'),
  h('li', { key: 'b' }, 'Item B'),
  h('li', { key: 'c' }, 'Item C')
]);

const list2 = h('ul', null, [
  h('li', { key: 'c' }, 'Item C'),
  h('li', { key: 'a' }, 'Item A'),
  h('li', { key: 'b' }, 'Item B')
]);

const root = mount(list1, container);
root.update(list2);
```

---

### Lifecycle Hooks

```ts
const vnode = h('div', {
  hooks: {
    create: (vnode, node) => console.log('created'),
    update: (oldVNode, newVNode, node) => console.log('updated'),
    remove: (vnode, node, done) => {
      node.style.opacity = '0';
      setTimeout(done, 300);
    }
  }
}, 'Content');
```

---

### Metrics Access

```ts
console.log(root.metrics.updates);
console.log(root.metrics.avgUpdateDurationMs);
console.log(root.metrics.nodes.active);
console.log(root.metrics.patches.total);
```

---

## 🔧 Development

### Scripts

```bash
npm run build       # Compile TypeScript
npm run build:demo  # Compile dashboard demo
npm run lint        # Run ESLint
npm test            # Run tests
```

### Architectural Constraints

* `core/` cannot import from renderer or platforms
* `renderer/` cannot import from platforms
* `platforms/` can import from core and renderer

Ensures a platform-agnostic core.

---

## 🎯 Design Decisions

### Immutability

All VNodes are frozen using `Object.freeze()`:

* Prevents accidental mutation
* Enables fast reference checks
* Simplifies debugging

### Stable Identity

Each VNode has an internal `__id`:

* Ensures correct DOM reuse
* Enables MOVE operations
* Improves memory efficiency

### Diff + Render Separation

The `diff()` function only returns patches:

* Keeps core testable
* Enables batching
* Allows custom renderers

---

## 🤝 Contributing

This is a learning project, but contributions are welcome.

Possible areas:

* Fragment support
* Component abstraction
* Async rendering
* New platform targets
* Performance benchmarks

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

Inspired by:

* React reconciliation
* Preact
* Snabbdom
* Virtual DOM research

---

**Built with 💙 by Deepmalya**
