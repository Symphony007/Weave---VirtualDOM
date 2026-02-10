import { h, mount } from '../../src/index.js';
import type { VNode } from '../../src/index.js';
import type { RendererMetrics, PatchHistoryEntry } from '../../src/renderer/metrics.js';

// ==================== STATE ====================

/**
 * Simple counter used by the interactive demo.
 * Each increment/decrement triggers a VDOM update.
 */
let demoCounter = 0;

/**
 * Root controller returned by mount().
 * Used to trigger updates and access metrics.
 */
let dashboardRoot: ReturnType<typeof mount> | null = null;

// ==================== HELPERS ====================

/**
 * Format timestamp to readable time.
 * Used in the patch timeline.
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Generate a short, human-readable description
 * of a patch operation for the timeline.
 */
function getPatchDescription(entry: PatchHistoryEntry): string {
  const { patch } = entry;
  
  switch (patch.type) {
    case 'UPDATE_TEXT':
      return `Text → "${patch.value.substring(0, 20)}"`;
    case 'SET_PROP':
      return `${patch.key}="${String(patch.value).substring(0, 15)}"`;
    case 'REMOVE_PROP':
      return `Remove ${patch.key}`;
    case 'INSERT':
      return `at index ${patch.index}`;
    case 'MOVE':
      return `${patch.from} → ${patch.to}`;
    case 'REMOVE':
      return entry.vnodeId ? `#${entry.vnodeId}` : '';
    case 'UPDATE':
      return entry.vnodeId ? `#${entry.vnodeId}` : 'node';
    case 'REPLACE':
      return patch.vnode ? 'New tree' : 'Unmount';
    default:
      return '';
  }
}

// ==================== COMPONENTS ====================

/**
 * Small reusable metric card.
 * Displays a single metric value.
 */
function MetricCard(label: string, value: string, unit: string): VNode {
  return h('div', { class: 'metric-card' }, [
    h('div', { class: 'metric-label' }, label),
    h('div', { class: 'metric-value' }, value),
    h('div', { class: 'metric-unit' }, unit)
  ]);
}

/**
 * Patch Timeline Component.
 *
 * Displays the most recent patch operations
 * in reverse chronological order.
 */
function PatchTimeline(history: PatchHistoryEntry[]): VNode {
  // Show last 15 patches in reverse order (newest first)
  const recent = history.slice(-15).reverse();
  
  if (recent.length === 0) {
    return h('div', { class: 'timeline-container' }, [
      h('div', { class: 'timeline-empty' }, 'No patches yet. Click +1 or -1 to see updates!')
    ]);
  }

  const items = recent.map((entry, index) => {
    const patchType = entry.patch.type;
    const description = getPatchDescription(entry);
    const time = formatTime(entry.timestamp);
    
    return h('div', { 
      class: `timeline-item timeline-${patchType.toLowerCase()}`,
      key: `${entry.timestamp}-${index}`
    }, [
      h('div', { class: 'timeline-time' }, time),
      h('div', { class: 'timeline-badge' }, patchType),
      h('div', { class: 'timeline-description' }, description)
    ]);
  });

  return h('div', { class: 'timeline-container' }, items);
}

/**
 * Patch Heatmap Component.
 *
 * Shows the distribution of patch types
 * using horizontal bars.
 */
function PatchHeatmap(metrics: RendererMetrics): VNode {
  const patchTypes: Array<keyof RendererMetrics['patches']['byType']> = [
    'INSERT',
    'REMOVE', 
    'UPDATE',
    'SET_PROP',
    'REMOVE_PROP',
    'MOVE',
    'REPLACE',
    'UPDATE_TEXT'
  ];
  
  // Find max count for normalization
  const maxCount = Math.max(
    ...patchTypes.map(type => metrics.patches.byType[type]),
    1
  );

  const rows = patchTypes.map(type => {
    const count = metrics.patches.byType[type];
    const percentage = (count / maxCount) * 100;

    return h('div', { class: 'heatmap-row', key: type }, [
      h('div', { class: 'heatmap-label' }, type),
      h('div', { class: 'heatmap-bar-container' }, [
        h('div', { 
          class: 'heatmap-bar-fill',
          style: `width: ${percentage}%`
        })
      ]),
      h('div', { class: 'heatmap-count' }, String(count))
    ]);
  });

  return h('div', { class: 'heatmap-container' }, rows);
}

/**
 * Live Chart Component.
 *
 * Displays recent update durations as vertical bars.
 * Includes a simple Y-axis for scale.
 */
function LiveChart(durations: number[]): VNode {
  const recentDurations = durations.slice(-20);
  const maxDuration = Math.max(...recentDurations, 0.1);
  
  // Calculate Y-axis labels (5 evenly spaced values)
  const yAxisSteps = 5;
  const yLabels = Array.from({ length: yAxisSteps }, (_, i) => {
    const value = maxDuration * (1 - i / (yAxisSteps - 1));
    return value.toFixed(2);
  });

  const bars = recentDurations.map((duration, index) => {
    const heightPercent = (duration / maxDuration) * 100;
    return h('div', { 
      class: 'chart-bar',
      key: index,
      style: `height: ${heightPercent}%`,
      'data-value': `${duration.toFixed(2)}ms`
    });
  });

  return h('div', { class: 'chart-container' }, [
    h('div', { class: 'chart-content' }, [
      // Y-axis
      h('div', { class: 'chart-y-axis' }, 
        yLabels.map((label, idx) => 
          h('div', { class: 'chart-y-label', key: idx }, `${label}ms`)
        )
      ),
      // Main chart area
      h('div', { class: 'chart-main' }, [
        h('div', { class: 'chart-bars' }, bars),
        // X-axis label
        h('div', { class: 'chart-x-axis' }, [
          h('div', { class: 'chart-x-label' }, `Last ${recentDurations.length} updates`)
        ])
      ])
    ])
  ]);
}

/**
 * Interactive Demo Component.
 *
 * A simple counter that triggers real VDOM updates.
 * Used to generate live metrics.
 */
function InteractiveDemo(
  counter: number, 
  onIncrement: () => void, 
  onDecrement: () => void
): VNode {
  return h('div', { class: 'demo-container' }, [
    h('div', { class: 'demo-counter' }, String(counter)),
    h('div', { class: 'demo-controls' }, [
      h('button', { 
        class: 'demo-button',
        onclick: onDecrement
      }, '−1'),
      h('button', { 
        class: 'demo-button',
        onclick: onIncrement
      }, '+1')
    ]),
    h('div', { class: 'demo-description' }, 
      'Click buttons to generate updates and watch patches flow')
  ]);
}

/**
 * Main Dashboard Component.
 *
 * Composes all sections into a single layout.
 */
function Dashboard(
  metrics: RendererMetrics,
  counter: number,
  handlers: { 
    onIncrement: () => void; 
    onDecrement: () => void;
  }
): VNode {
  return h('div', { class: 'dashboard-container' }, [
    // Header
    h('div', { class: 'dashboard-header' }, [
      h('h1', { class: 'dashboard-title' }, 'Weave VDOM'),
      h('div', { class: 'dashboard-subtitle' }, 'Live Metrics Dashboard')
    ]),

    // Metrics Grid
    h('div', { class: 'section metrics-section' }, [
      h('div', { class: 'section-title' }, 'Performance Metrics'),
      h('div', { class: 'metrics-grid' }, [
        MetricCard('Updates', String(metrics.updates + 1), 'total'),
        MetricCard('Avg Time', metrics.avgUpdateDurationMs.toFixed(2), 'ms'),
        MetricCard('Active Nodes', String(metrics.nodes.active), 'nodes'),
        MetricCard('Total Patches', String(metrics.patches.total), 'ops')
      ])
    ]),

    // Patch Timeline
    h('div', { class: 'section timeline-section' }, [
      h('div', { class: 'section-title' }, 'Patch Timeline'),
      PatchTimeline(metrics.patchHistory)
    ]),

    // Patch Heatmap
    h('div', { class: 'section heatmap-section' }, [
      h('div', { class: 'section-title' }, 'Patch Operations'),
      PatchHeatmap(metrics)
    ]),

    // Duration Chart
    h('div', { class: 'section chart-section' }, [
      h('div', { class: 'section-title' }, 'Update Duration Trend'),
      LiveChart(metrics.history.durations)
    ]),

    // Interactive Demo
    h('div', { class: 'section demo-section' }, [
      h('div', { class: 'section-title' }, 'Interactive Demo'),
      InteractiveDemo(counter, handlers.onIncrement, handlers.onDecrement)
    ])
  ]);
}

// ==================== RENDER LOGIC ====================

/**
 * Re-render the dashboard with current metrics.
 */
function renderDashboard(): void {
  if (!dashboardRoot) return;

  const metrics = dashboardRoot.metrics;

  const vnode = Dashboard(metrics, demoCounter, {
    onIncrement: () => {
      demoCounter++;
      requestAnimationFrame(() => renderDashboard());
    },
    onDecrement: () => {
      demoCounter--;
      requestAnimationFrame(() => renderDashboard());
    }
  });

  dashboardRoot.update(vnode);
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the dashboard.
 */
function init(): void {
  const container = document.getElementById('dashboard');
  if (!container) {
    console.error('Dashboard container not found');
    return;
  }

  // Initial placeholder UI
  const initialVNode = h('div', { class: 'dashboard-container' }, [
    h('div', { class: 'dashboard-header' }, [
      h('h1', { class: 'dashboard-title' }, 'Weave VDOM'),
      h('div', { class: 'dashboard-subtitle' }, 'Loading...')
    ])
  ]);

  // Mount and obtain root controller
  dashboardRoot = mount(initialVNode, container as HTMLElement);

  // Render real dashboard immediately
  renderDashboard();
}

// ==================== ENTRY POINT ====================

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
