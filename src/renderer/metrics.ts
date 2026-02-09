import type { Patch } from '../core/patch-types.js';

export interface RendererMetrics {
  updates: number;
  lastUpdateDurationMs: number;
  totalUpdateDurationMs: number;
  avgUpdateDurationMs: number;

  patches: {
    total: number;
    byType: Record<Patch['type'], number>;
  };

  nodes: {
    created: number;
    removed: number;
    active: number;
  };

  // Historical Data for Charts
  history: {
    durations: number[];
    timestamps: number[];
    patchCounts: number[];
    maxHistorySize: number;
  };

  // Performance Tracking
  performance: {
    fps: number;
    peakUpdateMs: number;
    slowestPatchType: Patch['type'] | null;
  };

  // Real-time Counters
  counters: {
    updatesPerSecond: number;
    patchesPerUpdate: number;
    lastFpsUpdate: number;
  };
}

export function createMetrics(): RendererMetrics {
  return {
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
      slowestPatchType: null
    },

    counters: {
      updatesPerSecond: 0,
      patchesPerUpdate: 0,
      lastFpsUpdate: Date.now()
    }
  };
}

/**
 * Record a completed update with timing info
 */
export function recordUpdate(
  metrics: RendererMetrics,
  duration: number,
  patchCount: number
): void {
  const now = performance.now();

  metrics.updates++;
  metrics.lastUpdateDurationMs = duration;
  metrics.totalUpdateDurationMs += duration;
  metrics.avgUpdateDurationMs = metrics.totalUpdateDurationMs / metrics.updates;

  // Track peak performance
  if (duration > metrics.performance.peakUpdateMs) {
    metrics.performance.peakUpdateMs = duration;
  }

  // Update history (circular buffer)
  const { history } = metrics;
  
  history.durations.push(duration);
  history.timestamps.push(now);
  history.patchCounts.push(patchCount);

  // Keep only last N entries
  if (history.durations.length > history.maxHistorySize) {
    history.durations.shift();
    history.timestamps.shift();
    history.patchCounts.shift();
  }

  // Calculate FPS (updates per second)
  const timeSinceLastFps = now - metrics.counters.lastFpsUpdate;
  if (timeSinceLastFps >= 1000) {
    const recentUpdates = history.timestamps.filter(
      t => now - t <= 1000
    ).length;
    
    metrics.performance.fps = recentUpdates;
    metrics.counters.updatesPerSecond = recentUpdates;
    metrics.counters.lastFpsUpdate = now;
  } else if (metrics.updates === 1) {
    // Initialize on first update
    metrics.performance.fps = 1;
    metrics.counters.updatesPerSecond = 1;
  }

  // Patches per update
  metrics.counters.patchesPerUpdate = 
    metrics.patches.total / metrics.updates;

  // Active nodes
  metrics.nodes.active = 
    metrics.nodes.created - metrics.nodes.removed;
}

/**
 * Find which patch type is consuming the most operations
 */
export function updateSlowestPatchType(metrics: RendererMetrics): void {
  let max = 0;
  let slowest: Patch['type'] | null = null;

  for (const [type, count] of Object.entries(metrics.patches.byType)) {
    if (count > max) {
      max = count;
      slowest = type as Patch['type'];
    }
  }

  metrics.performance.slowestPatchType = slowest;
}