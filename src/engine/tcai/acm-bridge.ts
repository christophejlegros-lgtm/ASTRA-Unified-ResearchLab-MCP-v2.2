/**
 * ASTRA × the_consciousness_ai — Consciousness System Orchestrator
 * ═════════════════════════════════════════════════════════════════
 * TypeScript port of the upstream ACM perception–emotion–memory–workspace
 * loop (models/core/consciousness_core.py orchestration, simplified to the
 * analytically computable path):
 *
 *   specialists → bids → AKOrN binding → GNW competition → ignition
 *        → broadcast → qualia → emotion appraisal → reward shaping
 *        → emotional memory (attention-gated) → self-model update
 *        → metrics (GNW · EI · Φ̃-RIIU) → composite report
 *
 * The system is fed from live ASTRA state (SNN layer firing rates, sensor
 * latents, world-model surprise), making the vendored ACM architecture an
 * operational layer of the ASTRA MCP server.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 * Upstream Python: © tlcdv/the_consciousness_ai (vendored in /python)
 */

import {
  type WorkspaceMessage, type CompetitionResult, type ConsciousnessReport,
  type EmotionalState, PROXY_DISCLAIMER,
} from './types.js';
import { GlobalWorkspace, type GWConfig } from './global-workspace.js';
import { EmotionalMemoryCore } from './emotional-memory.js';
import { EmotionalProcessor, EmotionalRewardShaper, type RewardMetrics } from './emotion.js';
import { SelfRepresentationCore } from './self-model.js';
import { GNWMetrics, RIIUPhi, computeEffectiveInformation, discretizeContinuous } from './metrics.js';

export interface CycleInput {
  /** Per-specialist signal vectors (e.g. SNN layer rates, sensor latents). */
  signals: Partial<Record<'vision' | 'audio' | 'memory' | 'body' | 'semantic', number[]>>;
  /** Optional explicit bids; otherwise derived from signal energy. */
  bids?: Partial<Record<'vision' | 'audio' | 'memory' | 'body' | 'semantic', number>>;
  rewardSignal?: number;        // task feedback ∈ [−1, 1]
  novelty?: number;             // e.g. world-model surprise (normalized)
  threat?: number;
  controllability?: number;
  predictionError?: number;     // raw WM surprise
  predictionConfidence?: number;
  narrative?: string;           // textual annotation for the memory record
  goalVector?: number[];
}

export interface CycleResult {
  competition: CompetitionResult;
  emotion: EmotionalState;
  reward: RewardMetrics;
  memoryStored: boolean;
  selfContinuity: number;
  phiRIIU: number;
}

export class TCAIConsciousnessSystem {
  readonly workspace: GlobalWorkspace;
  readonly memory: EmotionalMemoryCore;
  readonly emotionProcessor: EmotionalProcessor;
  readonly rewardShaper: EmotionalRewardShaper;
  readonly selfModel: SelfRepresentationCore;
  readonly gnwMetrics: GNWMetrics;
  readonly riiu: RIIUPhi;
  private ignitionTrajectory: number[] = [];
  private cycles = 0;

  constructor(gwConfig?: Partial<GWConfig>) {
    this.workspace = new GlobalWorkspace(gwConfig);
    this.memory = new EmotionalMemoryCore();
    this.emotionProcessor = new EmotionalProcessor();
    this.rewardShaper = new EmotionalRewardShaper();
    this.selfModel = new SelfRepresentationCore();
    this.gnwMetrics = new GNWMetrics();
    this.riiu = new RIIUPhi();
  }

  /** One full perception → workspace → emotion → memory → self cycle. */
  runCycle(input: CycleInput): CycleResult {
    this.cycles++;
    const now = Date.now();

    // 1 — Build specialist messages (bid = signal RMS unless explicit)
    const messages: WorkspaceMessage[] = [];
    for (const [source, vec] of Object.entries(input.signals)) {
      if (!vec || vec.length === 0) continue;
      const rms = Math.sqrt(vec.reduce((a, v) => a + v * v, 0) / vec.length);
      const bid = input.bids?.[source as keyof CycleInput['bids']] ?? Math.tanh(rms);
      messages.push({ source, content: vec, priority: Math.max(0, Math.min(1, bid)), timestamp: now });
    }

    // 2 — Affective modulation feeds forward into the competition
    this.workspace.affectiveState = this.emotionProcessor.getState();
    const competition = this.workspace.runCompetition(messages, input.goalVector);

    // 3 — Emotion appraisal (novelty defaults to WM surprise if provided)
    const novelty = input.novelty ?? (input.predictionError !== undefined
      ? Math.tanh(input.predictionError) : 0);
    const emotion = this.emotionProcessor.appraise({
      rewardSignal: input.rewardSignal,
      novelty,
      threat: input.threat,
      controllability: input.controllability,
    });

    // 4 — Reward shaping with memory influence
    const reward = this.rewardShaper.computeReward({
      baseReward: input.rewardSignal ?? 0,
      emotion,
      stability: this.emotionProcessor.stability(),
      memory: this.memory,
      contextEmbedding: competition.broadcast,
    });

    // 5 — Attention-gated emotional memory storage (gate = ignition)
    const stored = this.memory.store({
      narrative: input.narrative ?? `cycle ${this.cycles} · focus ${competition.winners[0] ?? 'idle'}`,
      embedding: competition.broadcast,
      emotionalContext: emotion,
      attentionLevel: competition.ignition,
      timestamp: now,
    });

    // 6 — Self-model update
    const self = this.selfModel.update({
      emotionalState: emotion,
      effort: competition.ignition * 0.6 + 0.2,
      predictionError: input.predictionError,
      predictionConfidence: input.predictionConfidence,
      reward: reward.totalReward,
      attentionTarget: competition.winners[0] ?? 'idle',
      attentionIntensity: competition.ignition,
    });

    // 7 — Metrics accumulation
    this.gnwMetrics.update(competition.ignition, competition.ignited);
    if (competition.ignited && stored.stored) this.gnwMetrics.logReuse();
    this.riiu.push(competition.broadcast);
    this.ignitionTrajectory.push(competition.ignition);
    if (this.ignitionTrajectory.length > 512) this.ignitionTrajectory.shift();

    return {
      competition,
      emotion,
      reward,
      memoryStored: stored.stored,
      selfContinuity: self.temporalContinuity,
      phiRIIU: this.riiu.computeValue(),
    };
  }

  /** Composite consciousness proxy report (consciousness_metrics.py spirit). */
  report(): ConsciousnessReport {
    const gnw = this.gnwMetrics.report();
    const phi = this.riiu.computeValue();
    const ei = computeEffectiveInformation(discretizeContinuous(this.ignitionTrajectory, 8), 8);
    const eiNorm = Math.min(1, ei / 3); // log2(8) = 3 bits max
    const unity = this.workspace.getUnityMetrics();
    const composite = Math.max(0, Math.min(1,
      0.35 * gnw.meanIgnition + 0.25 * phi + 0.2 * eiNorm + 0.2 * unity.unity));
    return {
      gnw,
      phiRIIUProxy: phi,
      effectiveInformation: ei,
      workspace: {
        ignition: this.workspace.state.broadcastStrength,
        syncR: this.workspace.state.syncR,
        focus: this.workspace.state.focusTopic,
      },
      composite,
      disclaimer: PROXY_DISCLAIMER,
    };
  }

  getCycles(): number { return this.cycles; }

  reset(): void {
    this.workspace.reset();
    this.memory.clear();
    this.emotionProcessor.reset();
    this.gnwMetrics.reset();
    this.riiu.reset();
    this.ignitionTrajectory = [];
    this.cycles = 0;
  }
}

/** Singleton instance shared by the MCP server (mirrors acmModule pattern). */
export const tcaiSystem = new TCAIConsciousnessSystem();
