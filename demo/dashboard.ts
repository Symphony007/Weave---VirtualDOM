import { h, mount } from '../src/index.js';
import type { VNode } from '../src/index.js';
import type { RendererMetrics } from '../src/renderer/metrics.js';

/* ==================== TYPES ==================== */

type StressTestMode = 'idle' | 'rapid' | 'large-list' | 'chaos' | 'prop-storm';

interface DashboardState {
  stressMode: StressTestMode;
  stressProgress: number;
  stressResults: {
    peakDuration: number;
    totalPatches: number;
    avgFps: number;
  } | null;
}

interface StressMetricsSnapshot {
  peakDuration: number;
  totalPatches: number;
  startTime: number;
  startUpdates: number;
}

/* ==================== STATE ==================== */

const state: DashboardState = {
  stressMode: 'idle',
  stressProgress: 0,
  stressResults: null
};

const container = document.getElementById('app')!;

/* ==================== UTILITIES ==================== */

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatMs(ms: number): string {
  return ms.toFixed(2);
}

function getPerformanceColor(ms: number): string {
  if (ms < 16) return '#10b981'; // Green - 60fps+
  if (ms < 33) return '#f59e0b'; // Yellow - 30fps+
  return '#ef4444'; // Red - <30fps
}

/* ==================== SVG CHARTS ==================== */

/**
 * Line chart showing update duration over time
 */
function lineChart(data: number[], width: number, height: number): VNode {
  if (data.length < 2) {
    return h('svg', { width, height, viewBox: `0 0 ${width} ${height}` },
      h('text', { x: width / 2, y: height / 2, fill: '#64748b', 'text-anchor': 'middle' }, 
        'Collecting data...'
      )
    );
  }

  const max = Math.max(...data, 16);
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (value / max) * chartHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;
  const areaData = `${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'chart' },
    h('line', { x1: padding, y1: padding, x2: width - padding, y2: padding, stroke: '#1e293b', 'stroke-width': 1 }),
    h('line', { x1: padding, y1: height / 2, x2: width - padding, y2: height / 2, stroke: '#1e293b', 'stroke-width': 1, 'stroke-dasharray': '2,2' }),
    h('line', { x1: padding, y1: height - padding, x2: width - padding, y2: height - padding, stroke: '#1e293b', 'stroke-width': 1 }),
    
    h('defs', null,
      h('linearGradient', { id: 'areaGradient', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
        h('stop', { offset: '0%', 'stop-color': '#3b82f6', 'stop-opacity': 0.3 }),
        h('stop', { offset: '100%', 'stop-color': '#3b82f6', 'stop-opacity': 0 })
      )
    ),
    
    h('path', { d: areaData, fill: 'url(#areaGradient)' }),
    h('path', { 
      d: pathData, 
      fill: 'none', 
      stroke: '#3b82f6', 
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }),

    h('text', { x: padding + 5, y: padding + 10, fill: '#64748b', 'font-size': 10 }, `${max.toFixed(0)}ms`),
    h('text', { x: padding + 5, y: height - padding - 5, fill: '#64748b', 'font-size': 10 }, '0ms')
  );
}

/**
 * Donut chart for patch type distribution
 */
function donutChart(metrics: RendererMetrics, size: number): VNode {
  const total = metrics.patches.total;
  
  if (total === 0) {
    return h('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
      h('text', { x: size / 2, y: size / 2, fill: '#64748b', 'text-anchor': 'middle' }, 
        'No patches yet'
      )
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;

  const colors: Record<string, string> = {
    UPDATE: '#3b82f6',
    INSERT: '#10b981',
    REMOVE: '#ef4444',
    MOVE: '#f59e0b',
    SET_PROP: '#8b5cf6',
    REMOVE_PROP: '#ec4899',
    UPDATE_TEXT: '#06b6d4',
    REPLACE: '#f97316'
  };

  let currentAngle = -90;

  const segments = Object.entries(metrics.patches.byType)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => {
      const percentage = count / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const x3 = cx + innerRadius * Math.cos(endRad);
      const y3 = cy + innerRadius * Math.sin(endRad);
      const x4 = cx + innerRadius * Math.cos(startRad);
      const y4 = cy + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');

      return h('path', { 
        d: pathData, 
        fill: colors[type] || '#64748b',
        stroke: '#0f172a',
        'stroke-width': 2
      });
    });

  return h('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, class: 'chart' },
    ...segments,
    h('text', { 
      x: cx, 
      y: cy - 5, 
      fill: '#e5e7eb', 
      'text-anchor': 'middle', 
      'font-size': 20,
      'font-weight': 'bold'
    }, formatNumber(total)),
    h('text', { 
      x: cx, 
      y: cy + 12, 
      fill: '#64748b', 
      'text-anchor': 'middle', 
      'font-size': 12
    }, 'patches')
  );
}

/**
 * Mini sparkline
 */
function sparkline(data: number[], width: number, height: number, color: string): VNode {
  if (data.length < 2) {
    return h('svg', { width, height });
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'sparkline' },
    h('path', { 
      d: pathData, 
      fill: 'none', 
      stroke: color, 
      'stroke-width': 2,
      'stroke-linecap': 'round'
    })
  );
}

/* ==================== COMPONENTS ==================== */

function statCard(
  label: string, 
  value: string, 
  trend?: { data: number[]; color: string }
): VNode {
  return h('div', { class: 'stat-card' },
    h('div', { class: 'stat-header' },
      h('span', { class: 'stat-label' }, label),
      trend ? sparkline(trend.data, 60, 20, trend.color) : null
    ),
    h('div', { class: 'stat-value' }, value)
  );
}

function metricCard(label: string, value: string, color: string, subtitle?: string): VNode {
  return h('div', { class: 'metric-card' },
    h('div', { class: 'metric-label' }, label),
    h('div', { class: 'metric-value', style: `color: ${color}` }, value),
    subtitle ? h('div', { class: 'metric-subtitle' }, subtitle) : null
  );
}

function progressBar(percentage: number, color: string): VNode {
  return h('div', { class: 'progress-bar' },
    h('div', { 
      class: 'progress-fill', 
      style: `width: ${percentage}%; background: ${color}` 
    })
  );
}

function liveIndicator(): VNode {
  return h('span', { class: 'live-indicator' },
    h('span', { class: 'live-dot' }),
    h('span', null, 'LIVE')
  );
}

function patchLegend(metrics: RendererMetrics): VNode {
  const colors: Record<string, string> = {
    UPDATE: '#3b82f6',
    INSERT: '#10b981',
    REMOVE: '#ef4444',
    MOVE: '#f59e0b',
    SET_PROP: '#8b5cf6',
    REMOVE_PROP: '#ec4899',
    UPDATE_TEXT: '#06b6d4',
    REPLACE: '#f97316'
  };

  const items = Object.entries(metrics.patches.byType)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)
    .map(([type, count]) => 
      h('div', { class: 'legend-item' },
        h('span', { class: 'legend-color', style: `background: ${colors[type] ?? '#64748b'}` }),
        h('span', { class: 'legend-label' }, type),
        h('span', { class: 'legend-count' }, formatNumber(count))
      )
    );

  return h('div', { class: 'legend' }, ...items);
}

function stressTestPanel(
  currentMode: StressTestMode,
  onStart: (mode: StressTestMode) => void
): VNode {
  const tests: Array<{ mode: StressTestMode; label: string; desc: string }> = [
    { mode: 'rapid', label: '⚡ Rapid Fire', desc: '60 updates/sec for 5s' },
    { mode: 'large-list', label: '📋 Large List', desc: '1000 items + reorder' },
    { mode: 'chaos', label: '🔥 Chaos Mode', desc: 'Random add/remove' },
    { mode: 'prop-storm', label: '🎯 Prop Storm', desc: '100 elements x props' }
  ];

  return h('div', { class: 'stress-panel' },
    h('h3', null, 'Stress Tests'),
    h('div', { class: 'stress-buttons' },
      ...tests.map(test => 
        h('button', {
          class: currentMode === test.mode ? 'stress-btn active' : 'stress-btn',
          onclick: () => onStart(test.mode),
          disabled: currentMode !== 'idle'
        },
          h('div', { class: 'stress-btn-label' }, test.label),
          h('div', { class: 'stress-btn-desc' }, test.desc)
        )
      )
    ),
    currentMode !== 'idle' 
      ? h('div', { class: 'stress-progress' },
          h('div', { class: 'stress-status' }, `Running ${currentMode}...`),
          progressBar(state.stressProgress, '#3b82f6')
        )
      : null,
    state.stressResults
      ? h('div', { class: 'stress-results' },
          h('h4', null, 'Last Test Results'),
          h('div', { class: 'stress-result-grid' },
            metricCard('Peak', `${formatMs(state.stressResults.peakDuration)}ms`, '#ef4444'),
            metricCard('Patches', formatNumber(state.stressResults.totalPatches), '#3b82f6'),
            metricCard('Avg FPS', state.stressResults.avgFps.toFixed(0), '#10b981')
          )
        )
      : null
  );
}

/* ==================== MAIN DASHBOARD ==================== */

function renderDashboard(metrics: RendererMetrics): VNode {
  const updateColor = getPerformanceColor(metrics.lastUpdateDurationMs);
  
  const recentAvg = metrics.history.durations.length > 0
    ? metrics.history.durations.slice(-10).reduce((a, b) => a + b, 0) / 
      Math.max(1, Math.min(100, metrics.history.durations.length))
    : 0;

  return h('div', { class: 'dashboard' },
    h('div', { class: 'dashboard-header' },
      h('h1', null, 'Weave VDOM'),
      liveIndicator()
    ),

    h('div', { class: 'top-stats' },
      metricCard(
        'Update Time',
        `${formatMs(metrics.lastUpdateDurationMs)}ms`,
        updateColor,
        `recent avg ${formatMs(recentAvg)}ms`
      ),
      metricCard(
        'FPS',
        metrics.performance.fps.toString(),
        metrics.performance.fps >= 30 ? '#10b981' : '#ef4444',
        'updates/sec'
      ),
      metricCard(
        'Total Updates',
        formatNumber(metrics.updates),
        '#3b82f6',
        `${formatNumber(metrics.patches.total)} patches`
      ),
      metricCard(
        'Active Nodes',
        formatNumber(metrics.nodes.active),
        '#8b5cf6',
        `${formatNumber(metrics.nodes.created)} created`
      )
    ),

    h('div', { class: 'charts-row' },
      h('div', { class: 'chart-card' },
        h('h3', null, 'Update Duration'),
        lineChart(metrics.history.durations, 400, 150)
      ),
      h('div', { class: 'chart-card' },
        h('h3', null, 'Patch Distribution'),
        donutChart(metrics, 150),
        patchLegend(metrics)
      )
    ),

    h('div', { class: 'detail-stats' },
      statCard('Patches/Update', formatMs(metrics.counters.patchesPerUpdate)),
      statCard('Peak Update', `${formatMs(metrics.performance.peakUpdateMs)}ms`),
      statCard('Nodes Created', formatNumber(metrics.nodes.created), {
        data: metrics.history.patchCounts,
        color: '#10b981'
      }),
      statCard('Nodes Removed', formatNumber(metrics.nodes.removed))
    ),

    // 🆕 STRESS CONTAINER - renders inside dashboard
    h('div', { id: 'stress-container', class: 'stress-container' }),

    stressTestPanel(state.stressMode, startStressTest)
  );
}

/* ==================== STRESS TESTS ==================== */

let root: ReturnType<typeof mount>;
let stressRoot: ReturnType<typeof mount> | null = null;
let chaosItems: Array<{ id: number; value: string }> = [];

function renderStress(vnode: VNode): void {
  const container = document.getElementById('stress-container');
  if (!container) return;

  if (!stressRoot) {
    stressRoot = mount(vnode, container as HTMLElement);
  } else {
    stressRoot.update(vnode);
  }
}

function clearStress(): void {
  if (stressRoot) {
    stressRoot.unmount();
    stressRoot = null;
  }
}

function startStressTest(mode: StressTestMode): void {
  state.stressMode = mode;
  state.stressProgress = 0;
  state.stressResults = null;

  const startMetrics: StressMetricsSnapshot = {
    peakDuration: root.metrics.performance.peakUpdateMs,
    totalPatches: root.metrics.patches.total,
    startTime: Date.now(),
    startUpdates: root.metrics.updates
  };

  switch (mode) {
    case 'rapid':
      runRapidFire(startMetrics);
      break;
    case 'large-list':
      runLargeList(startMetrics);
      break;
    case 'chaos':
      runChaos(startMetrics);
      break;
    case 'prop-storm':
      runPropStorm(startMetrics);
      break;
  }
}

function runRapidFire(startMetrics: StressMetricsSnapshot): void {
  const duration = 5000;
  const interval = 1000 / 60;
  let elapsed = 0;
  let counter = 0;

  const timer = setInterval(() => {
    elapsed += interval;
    counter++;
    state.stressProgress = (elapsed / duration) * 100;

    renderStress(
      h('div', { class: 'stress-content' },
        h('h2', null, `Rapid Fire Test`),
        h('p', null, `Frame: ${counter}`),
        h('p', null, `Elapsed: ${elapsed.toFixed(0)}ms`),
        h('div', { 
          class: 'random-box', 
          style: `background: hsl(${counter % 360}, 70%, 50%)` 
        }, Math.random().toFixed(6))
      )
    );

    if (elapsed >= duration) {
      clearInterval(timer);
      clearStress();
      finishStressTest(startMetrics);
    }
  }, interval);
}

function runLargeList(startMetrics: StressMetricsSnapshot): void {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `Item ${i}` }));
  
  state.stressProgress = 50;
  
  renderStress(
    h('div', { class: 'stress-content' },
      h('h2', null, 'Large List Test - Initial Render'),
      h('div', { class: 'large-list' },
        ...items.slice(0, 100).map(item => 
          h('div', { key: item.id, class: 'list-item' }, item.value)
        )
      )
    )
  );

  setTimeout(() => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j]!, items[i]!];
    }

    renderStress(
      h('div', { class: 'stress-content' },
        h('h2', null, 'Large List Test - Shuffled!'),
        h('div', { class: 'large-list' },
          ...items.slice(0, 100).map(item => 
            h('div', { key: item.id, class: 'list-item' }, item.value)
          )
        )
      )
    );

    state.stressProgress = 100;

    setTimeout(() => {
      clearStress();
      finishStressTest(startMetrics);
    }, 1000);
  }, 500);
}

function runChaos(startMetrics: StressMetricsSnapshot): void {
  const duration = 3000;
  const interval = 50;
  let elapsed = 0;
  chaosItems = [];
  let idCounter = 0;

  const timer = setInterval(() => {
    elapsed += interval;
    state.stressProgress = (elapsed / duration) * 100;

    const op = Math.random();
    if (op < 0.4 && chaosItems.length < 100) {
      const count = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < count; i++) {
        chaosItems.push({ id: idCounter++, value: `Chaos ${idCounter}` });
      }
    } else if (op < 0.7 && chaosItems.length > 10) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count && chaosItems.length > 0; i++) {
        chaosItems.splice(Math.floor(Math.random() * chaosItems.length), 1);
      }
    } else if (chaosItems.length > 0) {
      const idx = Math.floor(Math.random() * chaosItems.length);
      chaosItems[idx]!.value = `Updated ${Math.random().toFixed(3)}`;
    }

    renderStress(
      h('div', { class: 'stress-content' },
        h('h2', null, `Chaos Mode - ${chaosItems.length} items`),
        h('div', { class: 'chaos-grid' },
          ...chaosItems.map(item => 
            h('div', { 
              key: item.id, 
              class: 'chaos-item',
              style: `background: hsl(${(item.id * 137) % 360}, 70%, 50%)`
            }, item.value)
          )
        )
      )
    );

    if (elapsed >= duration) {
      clearInterval(timer);
      chaosItems = [];
      clearStress();
      finishStressTest(startMetrics);
    }
  }, interval);
}

function runPropStorm(startMetrics: StressMetricsSnapshot): void {
  const iterations = 100;
  let count = 0;

  const timer = setInterval(() => {
    count++;
    state.stressProgress = (count / iterations) * 100;

    renderStress(
      h('div', { class: 'stress-content' },
        h('h2', null, `Prop Storm - Iteration ${count}/${iterations}`),
        h('div', { class: 'prop-grid' },
          ...Array.from({ length: 100 }, (_, i) => 
            h('div', { 
              key: i,
              class: 'prop-item',
              'data-index': i,
              'data-iteration': count,
              'data-random': Math.random().toFixed(4),
              style: `
                background: rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)});
                transform: rotate(${Math.random() * 360}deg);
              `
            }, `${i}`)
          )
        )
      )
    );

    if (count >= iterations) {
      clearInterval(timer);
      clearStress();
      finishStressTest(startMetrics);
    }
  }, 30);
}

function finishStressTest(startMetrics: StressMetricsSnapshot): void {
  const endTime = Date.now();
  const duration = endTime - startMetrics.startTime;
  const updatesDuringTest = root.metrics.updates - startMetrics.startUpdates;

  state.stressResults = {
    peakDuration: root.metrics.performance.peakUpdateMs,
    totalPatches: root.metrics.patches.total - startMetrics.totalPatches,
    avgFps: updatesDuringTest / (duration / 1000)
  };

  state.stressMode = 'idle';
  state.stressProgress = 0;
}

/* ==================== MOUNT ==================== */

const initialMetrics = {
  updates: 0,
  lastUpdateDurationMs: 0,
  totalUpdateDurationMs: 0,
  avgUpdateDurationMs: 0,
  patches: {
    total: 0,
    byType: {
      REPLACE: 0,
      UPDATE_TEXT: 0,
      INSERT: 0,
      REMOVE: 0,
      SET_PROP: 0,
      REMOVE_PROP: 0,
      MOVE: 0,
      UPDATE: 0
    }
  },
  nodes: {
    created: 0,
    removed: 0,
    active: 0
  },
  history: {
    durations: [],
    timestamps: [],
    patchCounts: [],
    maxHistorySize: 60
  },
  performance: {
    fps: 0,
    peakUpdateMs: 0,
    slowestPatchType: null as null
  },
  counters: {
    updatesPerSecond: 0,
    patchesPerUpdate: 0,
    lastFpsUpdate: Date.now()
  }
} as RendererMetrics;

root = mount(renderDashboard(initialMetrics), container);

setInterval(() => {
  root.update(renderDashboard(root.metrics));
}, 100); 