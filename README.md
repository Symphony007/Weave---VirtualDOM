# Weave VDOM

A production‑grade Virtual DOM reconciler built from scratch with TypeScript.
Weave implements a platform‑agnostic diffing algorithm with keyed reconciliation, lifecycle hooks, and strict immutability guarantees.

---

## 🎯 Overview

Weave is a minimal but complete Virtual DOM engine designed to demonstrate the core rendering principles used in modern UI frameworks such as React, Vue, and Preact.

The project separates the platform‑agnostic diffing logic from the platform‑specific rendering layer. This makes Weave suitable for multiple targets including the DOM, Canvas, or even native environments.

---

## ✨ Key Features

### Core Architecture

* **Platform‑agnostic diffing core** with zero DOM dependencies
* **Keyed reconciliation** for efficient list updates
* **Fallback non‑keyed diffing** for simple lists
* **Immutable VNodes** using `Object.freeze()`
* **Type‑safe patch operations** with full TypeScript inference

### Advanced Capabilities

* Lifecycle hooks: `create`, `update`, `remove`
* DOM identity preservation (nodes reused when possible)
* WeakMap‑based event handling
* Built‑in performance metrics
* Zero runtime dependencies

---

## 🔧 Patch Operations

Weave generates minimal, declarative patch sets:

* **REPLACE** – Replace entire subtree
* **UPDATE_TEXT** – Update text content in place
* **INSERT** – Add new child at index
* **REMOVE** – Remove child (supports async cleanup)
* **MOVE** – Reorder children (keyed lists)
* **SET_PROP / REMOVE_PROP** – Minimal property updates
* **UPDATE** – Trigger lifecycle hooks

---

## 🏗️ Architecture

```
src/
├── core/              # Platform‑agnostic VDOM core
│   ├── types.ts
│   ├── vnode.ts
│   ├── h.ts
│   ├── diff.ts
│   └── patch-types.ts
├── renderer/          # Patch application layer
│   ├── createRenderer.ts
│   └── metrics.ts
└── platforms/         # Platform‑specific implementations
    └── dom/
        └── host.ts
```

### Design Principles

* **Separation of concerns** – Diffing is pure logic; renderer applies patches
* **Immutability** – VNodes are frozen at creation
* **Stable identity** – Internal `__id` ensures correct node reuse
* **Declarative patches** – Renderer executes instructions only

---

## 🚀 Getting Started

### Prerequisites

* Node.js v16 or higher
* npm or yarn
* A modern browser

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

## ▶️ Running the Demos

Weave includes two demos: a simple text update example and a full metrics dashboard built entirely with the VDOM.

---

### Simple Demo

1. Build the project:

```bash
npm run build
```

2. Open the demo:

* Navigate to `demo/index.html`
* Right‑click the file in VS Code
* Select **“Open with Live Server”**

3. What you should see:

* Initial render: `Hello from Weave`
* After 2 seconds: text updates
* The `<h1>` element is reused (not recreated)

---

### Dashboard Demo

A real‑time metrics dashboard built entirely using Weave itself. This demonstrates that the VDOM is capable of powering complex, stateful interfaces.

![Weave Dashboard Demo](https://github.com/user-attachments/assets/9263a02a-b194-42e4-8cc5-08840fa69ebe)

#### How to run

1. Build the project and dashboard:

```bash
npm run build
npm run build:demo
```

2. Open the dashboard:

* Navigate to `demo/dashboard/index.html`
* Right‑click the file in VS Code
* Select **“Open with Live Server”**

---

### Dashboard Metrics Explained

The dashboard visualizes internal operations of the renderer in real time.

**Performance Metrics**

* **Updates** – Total number of VDOM update cycles
* **Avg Time** – Average duration of each update (ms)
* **Active Nodes** – Current DOM nodes managed by the renderer
* **Total Patches** – Cumulative patch operations applied

**Patch Timeline**

* Chronological list of recent patch operations
* Color‑coded by patch type
* Shows timestamps and affected VNodes

**Patch Heatmap**

* Distribution of patch types
* Helps identify optimization opportunities

**Update Duration Chart**

* Tracks performance over recent updates
* Helps detect regressions

**Interactive Controls**

* Use the **+1** and **–1** buttons
* Generates real VDOM updates
* Watch patches apply in real time

---

## 🧪 Running Tests

```bash
npm test
```

### Test Coverage

* Initial mount and unmount
* Text updates without recreation
* Nested updates
* Keyed list reordering
* Keyed removal
* Type changes
* Lifecycle hooks

---

## 📖 Basic Usage

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

This ensures the core remains platform‑agnostic.

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

The `diff()` function returns patches without applying them:

* Keeps core testable
* Enables batching
* Allows custom renderers

---

## 🤝 Contributing

This is a learning‑focused project, but contributions are welcome.

Possible areas:

* Fragment support
* Component abstraction
* Async rendering
* Additional platform targets
* Performance benchmarks

---

## 📄 License

MIT License


**Built with 💙 by Deep**
