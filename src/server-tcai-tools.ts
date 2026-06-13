/**
 * ASTRA — the_consciousness_ai (TCAI/ACM) MCP Tools
 * ══════════════════════════════════════════════════
 * Registers 8 tools + 1 resource + 1 prompt into the ASTRA MCP server,
 * exposing the TypeScript port of tlcdv/the_consciousness_ai:
 *
 *   tcai_cycle            — full GNW cycle fed from live SNN layer rates
 *   tcai_workspace_state  — workspace state + unity metrics
 *   tcai_emotion_appraise — PAD appraisal of raw signals
 *   tcai_memory_store     — attention-gated emotional memory storage
 *   tcai_memory_retrieve  — blended similarity/congruence/salience recall
 *   tcai_self_model       — self-representation + attention schema state
 *   tcai_metrics          — GNW · EI · Φ̃-RIIU composite report
 *   tcai_reset            — reset the consciousness system
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 * Upstream Python: © tlcdv/the_consciousness_ai (vendored in /python)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tcaiSystem, type CycleInput } from './engine/tcai/acm-bridge.js';
import { PROXY_DISCLAIMER } from './engine/tcai/types.js';

const MODULES = ['vision', 'audio', 'memory', 'body', 'semantic'] as const;

const emotionSchema = {
  valence: z.number().min(-1).max(1).optional().describe('Pleasure ∈ [−1,1]'),
  arousal: z.number().min(0).max(1).optional().describe('Arousal ∈ [0,1]'),
  dominance: z.number().min(0).max(1).optional().describe('Dominance ∈ [0,1]'),
};

/** Derive per-specialist signal vectors from live ASTRA SNN layer metrics. */
function deriveSignals(getState: () => any, dim: number): CycleInput['signals'] {
  const st = getState();
  const layerMetrics: Array<{ firingRate: number }> = st?.snn?.layerMetrics ?? [];
  const tick: number = st?.snn?.timestep ?? 0;
  const signals: CycleInput['signals'] = {};
  MODULES.forEach((name, i) => {
    const rate = (layerMetrics[i % Math.max(1, layerMetrics.length)]?.firingRate ?? 20) / 100;
    const vec = new Array<number>(dim);
    for (let j = 0; j < dim; j++) {
      vec[j] = rate * Math.sin(0.13 * (j + 1) * (i + 1) + 0.01 * tick) +
               0.1 * rate * Math.cos(0.07 * j + i);
    }
    signals[name] = vec;
  });
  return signals;
}

const json = (o: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(o, null, 2) }] });

export function registerTCAICapabilities(server: McpServer, getState: () => any): void {

  // ── Tool 1: full consciousness cycle ─────────────────────────────
  server.tool('tcai_cycle',
    'Run one ACM cycle (the_consciousness_ai port): SNN signals → AKOrN binding → GNW ignition → qualia → emotion → reward shaping → emotional memory → self-model',
    {
      cycles: z.number().int().min(1).max(50).optional().describe('Number of cycles (default 1)'),
      rewardSignal: z.number().min(-1).max(1).optional().describe('Task feedback ∈ [−1,1]'),
      novelty: z.number().min(0).max(1).optional().describe('Surprise/curiosity ∈ [0,1]'),
      threat: z.number().min(0).max(1).optional(),
      controllability: z.number().min(0).max(1).optional(),
      predictionError: z.number().min(0).optional().describe('World-model surprise (raw)'),
      predictionConfidence: z.number().min(0).max(1).optional(),
      narrative: z.string().max(500).optional().describe('Annotation for the memory record'),
    },
    async (args) => {
      const n = args.cycles ?? 1;
      let last = null as ReturnType<typeof tcaiSystem.runCycle> | null;
      for (let i = 0; i < n; i++) {
        last = tcaiSystem.runCycle({
          signals: deriveSignals(getState, tcaiSystem.workspace.config.workspaceDim),
          rewardSignal: args.rewardSignal,
          novelty: args.novelty,
          threat: args.threat,
          controllability: args.controllability,
          predictionError: args.predictionError,
          predictionConfidence: args.predictionConfidence,
          narrative: args.narrative,
        });
      }
      return json({
        cyclesRun: n, totalCycles: tcaiSystem.getCycles(),
        ignition: last?.competition.ignition, ignited: last?.competition.ignited,
        winners: last?.competition.winners, syncR: last?.competition.syncR,
        qualia: last?.competition.qualia, phiProxy: last?.competition.phiProxy,
        emotion: last?.emotion, reward: last?.reward,
        memoryStored: last?.memoryStored, selfContinuity: last?.selfContinuity,
        phiRIIU: last?.phiRIIU, disclaimer: PROXY_DISCLAIMER,
      });
    });

  // ── Tool 2: workspace state ──────────────────────────────────────
  server.tool('tcai_workspace_state',
    'Global Neuronal Workspace state: ignition, focus, qualia, sync R, unity metrics, access history',
    {},
    async () => json({
      state: { ...tcaiSystem.workspace.state, broadcastPayload: undefined,
        activeContent: Object.keys(tcaiSystem.workspace.state.activeContent) },
      unity: tcaiSystem.workspace.getUnityMetrics(),
      config: tcaiSystem.workspace.config,
    }));

  // ── Tool 3: emotion appraisal ────────────────────────────────────
  server.tool('tcai_emotion_appraise',
    'Appraise raw signals into PAD emotional space (Mehrabian) with inertia',
    {
      rewardSignal: z.number().min(-1).max(1).optional(),
      novelty: z.number().min(0).max(1).optional(),
      threat: z.number().min(0).max(1).optional(),
      controllability: z.number().min(0).max(1).optional(),
    },
    async (args) => {
      const emotion = tcaiSystem.emotionProcessor.appraise(args);
      return json({ emotion, stability: tcaiSystem.emotionProcessor.stability() });
    });

  // ── Tool 4: memory store ─────────────────────────────────────────
  server.tool('tcai_memory_store',
    'Store an experience in emotional memory (attention-gated, salience-indexed)',
    {
      narrative: z.string().max(1000).describe('Description of the experience'),
      embedding: z.array(z.number()).min(2).max(256).optional().describe('Feature vector (defaults to current broadcast)'),
      attentionLevel: z.number().min(0).max(1).optional(),
      ...emotionSchema,
    },
    async (args) => {
      const embedding = args.embedding ??
        tcaiSystem.workspace.state.broadcastPayload ??
        new Array(tcaiSystem.workspace.config.workspaceDim).fill(0);
      const res = tcaiSystem.memory.store({
        narrative: args.narrative,
        embedding,
        emotionalContext: { valence: args.valence, arousal: args.arousal, dominance: args.dominance },
        attentionLevel: args.attentionLevel,
      });
      return json({ ...res, stats: tcaiSystem.memory.stats() });
    });

  // ── Tool 5: memory retrieve ──────────────────────────────────────
  server.tool('tcai_memory_retrieve',
    'Retrieve memories by blended cosine similarity, PAD congruence and salience',
    {
      topK: z.number().int().min(1).max(25).optional(),
      embedding: z.array(z.number()).min(2).max(256).optional().describe('Query vector (defaults to current broadcast)'),
      ...emotionSchema,
    },
    async (args) => {
      const hits = tcaiSystem.memory.retrieve({
        embedding: args.embedding ?? tcaiSystem.workspace.state.broadcastPayload ?? undefined,
        emotion: (args.valence !== undefined || args.arousal !== undefined || args.dominance !== undefined)
          ? { valence: args.valence, arousal: args.arousal, dominance: args.dominance } : undefined,
        topK: args.topK,
      });
      return json({
        hits: hits.map((h) => ({
          id: h.record.id, narrative: h.record.narrative,
          emotion: h.record.emotionalContext, salience: h.record.salience,
          similarity: h.similarity, congruence: h.emotionalCongruence, score: h.score,
        })),
        stats: tcaiSystem.memory.stats(),
      });
    });

  // ── Tool 6: self model ───────────────────────────────────────────
  server.tool('tcai_self_model',
    'Self-representation state: interoception, epistemic model, temporal continuity, attention schema',
    {},
    async () => json({
      self: tcaiSystem.selfModel.getCurrentState(),
      attention: tcaiSystem.selfModel.attentionSchema.getCurrentFocus(),
    }));

  // ── Tool 7: metrics report ───────────────────────────────────────
  server.tool('tcai_metrics',
    'Consciousness proxy report: GNW metrics, Effective Information, Φ̃-RIIU, composite score',
    {},
    async () => json(tcaiSystem.report()));

  // ── Tool 8: reset ────────────────────────────────────────────────
  server.tool('tcai_reset',
    'Reset the TCAI consciousness system (workspace, memory, emotion, metrics)',
    {},
    async () => {
      tcaiSystem.reset();
      return json({ reset: true, cycles: tcaiSystem.getCycles() });
    });

  // ── Resource ─────────────────────────────────────────────────────
  server.resource('tcai-state', 'astra://tcai/state',
    { description: 'the_consciousness_ai integrated system state', mimeType: 'application/json' },
    async () => ({ contents: [{ uri: 'astra://tcai/state', mimeType: 'application/json',
      text: JSON.stringify({
        report: tcaiSystem.report(),
        workspace: tcaiSystem.workspace.getUnityMetrics(),
        memory: tcaiSystem.memory.stats(),
        self: tcaiSystem.selfModel.getCurrentState(),
      }, null, 2) }] }));

  // ── Prompt ───────────────────────────────────────────────────────
  server.prompt('tcai-consciousness-cycle', 'Guided ACM consciousness cycle experiment', {},
    async () => ({
      messages: [{ role: 'user' as const, content: { type: 'text' as const,
        text: 'TCAI experiment: tcai_reset → snn_step 10 → tcai_cycle 10 (novelty 0.7) → tcai_workspace_state → tcai_emotion_appraise (rewardSignal 0.8) → tcai_cycle 10 (rewardSignal 0.8) → tcai_memory_retrieve → tcai_self_model → tcai_metrics. Compare ignition dynamics, emotional trajectory and Φ̃-RIIU before/after reward; flag proxy-metric caveats.' } }],
    }));
}
