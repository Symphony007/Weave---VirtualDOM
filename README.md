# Weave VDOM

A production-grade Virtual DOM reconciler built from scratch with TypeScript. Weave implements a platform-agnostic diffing algorithm with keyed reconciliation, lifecycle hooks, and strict immutability guarantees.

## 🎯 Overview

Weave is a minimal but complete Virtual DOM implementation that demonstrates core concepts behind modern UI frameworks like React, Vue, and Preact. It features a clean separation between platform-agnostic diffing logic and platform-specific rendering, making it suitable for DOM, Canvas, or even native rendering targets.

## ✨ Features

### Core Architecture

- **Platform-Agnostic Core**: Diffing logic has zero dependencies on DOM or any specific platform
- **Keyed Reconciliation**: Efficient list updates using stable keys (similar to React's reconciliation)
- **Non-Keyed Diffing**: Fallback index-based diffing for simple lists
- **Immutable VNodes**: All VNodes are frozen, ensuring predictable behavior and easy debugging
- **Type-Safe Patches**: Closed union of patch operations with full TypeScript inference

### Advanced Features

- **Lifecycle Hooks**: `create`, `update`, and async `remove` hooks
- **Identity Preservation**: DOM nodes are reused whenever possible, never unnecessarily recreated
- **Memory Efficient**: WeakMap-based event handling with automatic garbage collection
- **Zero Dependencies**: Pure TypeScript implementation with no runtime dependencies

### Patch Operations

Weave generates minimal, declarative patch sets:
- `REPLACE` - Replace entire subtree
- `UPDATE_TEXT` - Update text content in-place
- `INSERT` - Add new child at specific index
- `REMOVE` - Remove child with optional async cleanup
- `MOVE` - Reorder existing children (keyed lists only)
- `SET_PROP` / `REMOVE_PROP` - Minimal property updates
- `UPDATE` - Trigger lifecycle hooks on reused nodes

## 🏗️ Architecture

```
src/
├── core/              # Platform-agnostic VDOM core
│   ├── types.ts       # VNode type definitions
│   ├── vnode.ts       # VNode factory with stable identity
│   ├── h.ts           # Public JSX-like factory
│   ├── diff.ts        # Reconciliation algorithm
│   └── patch-types.ts # Declarative patch operations
├── renderer/          # Patch application layer
│   ├── createRenderer.ts  # Platform abstraction
│   └── metrics.ts         # Performance tracking
└── platforms/         # Platform-specific implementations
    └── dom/
        └── host.ts    # DOM operations
```

### Design Principles

1. **Separation of Concerns**: Core diffing is pure logic, renderer applies patches, platforms provide primitives
2. **Immutability**: VNodes are frozen immediately after creation
3. **Identity Stability**: Internal `__id` tracking ensures correct node reuse
4. **Declarative Patches**: Renderer never makes decisions, only executes commands

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v16 or higher
- **npm** or **yarn**
- A modern browser (for the demo)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/weave.git
   cd weave
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   This will install:
   - TypeScript (`typescript`)
   - ESLint + plugins (`eslint`, `@typescript-eslint/*`)
   - Vitest for testing (`vitest`)

3. **Build the project**
   ```bash
   npm run build
   ```

   This compiles TypeScript to JavaScript in the `dist/` directory.

### Running the Demo

1. **Build the project** (if you haven't already)
   ```bash
   npm run build
   ```

2. **Serve the demo**
   
   You can use any static file server. Here are some options:

   **Option A: Using Python**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B: Using Node.js `http-server`**
   ```bash
   npx http-server -p 8000
   ```

   **Option C: Using VS Code Live Server**
   - Install the "Live Server" extension
   - Right-click `demo/index.html` → "Open with Live Server"

3. **Open in browser**
   ```
   http://localhost:8000/demo/index.html
   ```

### What You Should See

The demo performs a simple sanity check:
- **Initial render**: "Hello from Weave"
- **After 2 seconds**: Text updates to "Updated text from Weave 🚀"
- The `<h1>` element is **reused** (not recreated)

## 🧪 Running Tests

Weave includes comprehensive behavior tests that verify DOM identity preservation:

```bash
npm test
```

### Test Coverage

- ✅ Initial mount and unmount
- ✅ Text updates without element recreation
- ✅ Nested updates preserving parent/child identity
- ✅ Keyed list reordering (preserves all DOM nodes)
- ✅ Keyed list removal (preserves remaining nodes)
- ✅ Type changes (replaces only changed nodes)
- ✅ Lifecycle hooks (create, update, async remove)

## 📖 Usage

### Basic Example

```typescript
import { h, mount } from './dist/src/index.js';

// Create a VNode
const vnode = h('div', { class: 'container' }, [
  h('h1', null, 'Hello World'),
  h('p', null, 'This is Weave VDOM')
]);

// Mount to DOM
const container = document.getElementById('app');
const root = mount(vnode, container);

// Update
const updatedVNode = h('div', { class: 'container' }, [
  h('h1', null, 'Hello Updated World'),
  h('p', null, 'This is still Weave VDOM')
]);

root.update(updatedVNode);

// Cleanup
root.unmount();
```

### Keyed Lists

```typescript
const list1 = h('ul', null, [
  h('li', { key: 'a' }, 'Item A'),
  h('li', { key: 'b' }, 'Item B'),
  h('li', { key: 'c' }, 'Item C')
]);

const list2 = h('ul', null, [
  h('li', { key: 'c' }, 'Item C'),  // Moved
  h('li', { key: 'a' }, 'Item A'),  // Moved
  h('li', { key: 'b' }, 'Item B')   // Moved
]);

const root = mount(list1, container);
root.update(list2);  // DOM nodes are moved, not recreated!
```

### Lifecycle Hooks

```typescript
const vnode = h('div', {
  hooks: {
    create: (vnode, node) => {
      console.log('Element created!', node);
    },
    update: (oldVNode, newVNode, node) => {
      console.log('Element updated!', node);
    },
    remove: (vnode, node, done) => {
      // Animate out before removal
      node.style.opacity = '0';
      setTimeout(done, 300);
    }
  }
}, 'Content');
```

### Event Handling

```typescript
const button = h('button', {
  onclick: () => alert('Clicked!'),
  class: 'btn'
}, 'Click Me');
```

## 🔧 Development

### Project Scripts

```bash
npm run build       # Compile TypeScript
npm run lint        # Run ESLint
npm test           # Run tests with Vitest
```

### Architectural Constraints

ESLint enforces strict import boundaries:

- ❌ `core/` cannot import from `renderer/`, `platforms/`, or `runtime/`
- ❌ `renderer/` cannot import from `platforms/`
- ✅ `platforms/` can import from `core/` and `renderer/`

This ensures the core remains platform-agnostic and the architecture stays clean.

### TypeScript Configuration

- **Strict mode** enabled
- **No implicit any**
- **No unchecked indexed access**
- **No fallthrough cases in switch**
- Full type safety across the codebase

## 🎯 Design Decisions

### Why Immutability?

All VNodes are frozen with `Object.freeze()`. This:
- Prevents accidental mutations
- Makes diffing faster (reference equality checks)
- Simplifies debugging (no hidden state changes)
- Enables future optimizations (memoization, time-travel)

### Why Stable Identity?

Each VNode has an internal `__id` (non-enumerable). This allows:
- Correct DOM node reuse across updates
- Identity-based MOVE operations
- Memory-efficient node mapping

### Why Separate Diff + Render?

The `diff()` function returns patches, it doesn't apply them. This:
- Keeps core logic testable without DOM
- Enables batching and prioritization
- Allows custom renderers (Canvas, Native, etc.)
- Makes the patch stream inspectable/debuggable

## 🤝 Contributing

This is a learning project, but contributions are welcome! Areas for improvement:

- Fragment support (`<></>`)
- Component abstraction
- Async rendering / scheduling
- Additional platform targets (Canvas, Native)
- Performance benchmarks

## 📄 License

MIT License - feel free to use this for learning or as a foundation for your own projects.

## 🙏 Acknowledgments

Inspired by:
- [React's Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [Preact](https://preactjs.com/)
- [Snabbdom](https://github.com/snabbdom/snabbdom)
- [Virtual DOM and Diffing Algorithm](https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060)

---

**Built with 💙 by Deepmalya**

Questions? Open an issue or reach out!p