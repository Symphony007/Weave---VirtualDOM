import type { Patch } from '../core/patch-types.js';

export interface PatchHistoryEntry {
  timestamp: number;
  patch: Patch;
  vnodeId?: number;
}

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
    history: number[];
  };

  history: {
    durations: number[];
    timestamps: number[];
    patchCounts: number[];
    maxHistorySize: number;
  };

  performance: {
    fps: number;
    peakUpdateMs: number;
    slowestPatchType: Patch['type'] | null;
    updatesPerSecond: number;
  };

  counters: {
    fpsWindowStart: number;
    fpsWindowUpdates: number;
    lastSecondUpdates: number;
  };

  // NEW: Patch timeline
  patchHistory: PatchHistoryEntry[];
  maxPatchHistory: number;
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
      active: 0,
      history: []
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
      slowestPatchType: null,
      updatesPerSecond: 0
    },

    counters: {
      fpsWindowStart: performance.now(),
      fpsWindowUpdates: 0,
      lastSecondUpdates: 0
    },

    // NEW: Initialize patch history
    patchHistory: [],
    maxPatchHistory: 50
  };
}

/**
 * Record a single patch operation
 */
export function recordPatch(
  metrics: RendererMetrics,
  patch: Patch
): void {
  const entry: PatchHistoryEntry = {
    timestamp: performance.now(),
    patch: patch
  };

  // Extract VNode ID if available
  if ('vnode' in patch && patch.vnode) {
    const vnode = patch.vnode as { __id?: number };
    entry.vnodeId = vnode.__id;
  }


  metrics.patchHistory.push(entry);

  // Keep only recent patches
  if (metrics.patchHistory.length > metrics.maxPatchHistory) {
    metrics.patchHistory.shift();
  }
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

  // ---- BASIC COUNTERS ----
  metrics.updates++;
  metrics.lastUpdateDurationMs = duration;
  metrics.totalUpdateDurationMs += duration;
  
  // Safe average calculation (avoid division by zero)
  metrics.avgUpdateDurationMs = metrics.updates > 0 
    ? metrics.totalUpdateDurationMs / metrics.updates 
    : 0;

  // ---- PEAK UPDATE ----
  if (duration > metrics.performance.peakUpdateMs) {
    metrics.performance.peakUpdateMs = duration;
  }

  // ---- HISTORY (FOR CHARTS) ----
  const { history } = metrics;

  history.durations.push(duration);
  history.timestamps.push(now);
  history.patchCounts.push(patchCount);

  if (history.durations.length > history.maxHistorySize) {
    history.durations.shift();
    history.timestamps.shift();
    history.patchCounts.shift();
  }

  // ---- FPS CALCULATION (IMPROVED) ----
  metrics.counters.fpsWindowUpdates++;

  const elapsed = now - metrics.counters.fpsWindowStart;

  // Calculate rolling FPS (more accurate)
  if (elapsed >= 1000) {
    // Exact FPS for completed second
    metrics.performance.fps = Math.round(
      (metrics.counters.fpsWindowUpdates / elapsed) * 1000
    );
    metrics.performance.updatesPerSecond = metrics.counters.fpsWindowUpdates;
    
    // Reset for next window
    metrics.counters.fpsWindowStart = now;
    metrics.counters.fpsWindowUpdates = 0;
  } else {
    // Estimate FPS for incomplete second
    const estimatedFps = elapsed > 0 
      ? (metrics.counters.fpsWindowUpdates / elapsed) * 1000 
      : 0;
    metrics.performance.fps = Math.round(estimatedFps);
  }

  // ---- ACTIVE NODES ----
  metrics.nodes.active = Math.max(0, metrics.nodes.created - metrics.nodes.removed);

  // ---- NODE HISTORY (PER UPDATE) ----
  metrics.nodes.history.push(metrics.nodes.active);

  if (metrics.nodes.history.length > metrics.history.maxHistorySize) {
    metrics.nodes.history.shift();
  }

  // Update slowest patch type
  updateSlowestPatchType(metrics);
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

/**
 * Calculate average patches per update from recent history
 */
function calculateAvgPatchesPerUpdate(metrics: RendererMetrics): number {
  const recentPatchCounts = metrics.history.patchCounts.slice(-10);
  return recentPatchCounts.length > 0
    ? recentPatchCounts.reduce((sum, count) => sum + count, 0) / recentPatchCounts.length
    : 0;
}

/**
 * Get performance summary for display
 */
export function getPerformanceSummary(metrics: RendererMetrics): {
  fps: number;
  avgUpdateMs: number;
  peakUpdateMs: number;
  updatesPerSecond: number;
  totalUpdates: number;
  avgPatchesPerUpdate: number;
} {
  return {
    fps: metrics.performance.fps,
    avgUpdateMs: metrics.avgUpdateDurationMs,
    peakUpdateMs: metrics.performance.peakUpdateMs,
    updatesPerSecond: metrics.performance.updatesPerSecond,
    totalUpdates: metrics.updates,
    avgPatchesPerUpdate: calculateAvgPatchesPerUpdate(metrics)
  };
}

/**
 * Get patch type breakdown (percentage)
 */
export function getPatchBreakdown(metrics: RendererMetrics): Array<{
  type: Patch['type'];
  count: number;
  percentage: number;
}> {
  const result = [];
  
  for (const [type, count] of Object.entries(metrics.patches.byType)) {
    const percentage = metrics.patches.total > 0 
      ? (count / metrics.patches.total) * 100 
      : 0;
    
    result.push({
      type: type as Patch['type'],
      count,
      percentage: Math.round(percentage * 100) / 100
    });
  }
  
  // Sort by count (descending)
  return result.sort((a, b) => b.count - a.count);
}

/**
 * Reset all metrics (useful for stress tests)
 */
export function resetMetrics(metrics: RendererMetrics): void {
  metrics.updates = 0;
  metrics.lastUpdateDurationMs = 0;
  metrics.totalUpdateDurationMs = 0;
  metrics.avgUpdateDurationMs = 0;
  
  metrics.patches.total = 0;
  for (const key in metrics.patches.byType) {
    metrics.patches.byType[key as Patch['type']] = 0;
  }
  
  metrics.nodes.created = 0;
  metrics.nodes.removed = 0;
  metrics.nodes.active = 0;
  metrics.nodes.history = [];
  
  metrics.history.durations = [];
  metrics.history.timestamps = [];
  metrics.history.patchCounts = [];
  
  metrics.performance.fps = 0;
  metrics.performance.peakUpdateMs = 0;
  metrics.performance.slowestPatchType = null;
  metrics.performance.updatesPerSecond = 0;
  
  metrics.counters.fpsWindowStart = performance.now();
  metrics.counters.fpsWindowUpdates = 0;
  metrics.counters.lastSecondUpdates = 0;

  metrics.patchHistory = [];
}

/**
 * Get a formatted string representation of metrics
 */
export function formatMetrics(metrics: RendererMetrics): string {
  const summary = getPerformanceSummary(metrics);
  const breakdown = getPatchBreakdown(metrics);
  
  let output = `=== Weave VDOM Metrics ===\n`;
  output += `Updates: ${summary.totalUpdates}\n`;
  output += `FPS: ${summary.fps}\n`;
  output += `Avg Update: ${summary.avgUpdateMs.toFixed(2)}ms\n`;
  output += `Peak Update: ${summary.peakUpdateMs.toFixed(2)}ms\n`;
  output += `Updates/sec: ${summary.updatesPerSecond}\n`;
  output += `Avg Patches/Update: ${summary.avgPatchesPerUpdate.toFixed(1)}\n`;
  output += `Active Nodes: ${metrics.nodes.active}\n`;
  output += `Nodes Created: ${metrics.nodes.created}\n`;
  output += `Nodes Removed: ${metrics.nodes.removed}\n`;
  output += `\nPatch Breakdown:\n`;
  
  for (const item of breakdown) {
    output += `  ${item.type}: ${item.count} (${item.percentage}%)\n`;
  }
  
  return output;
}