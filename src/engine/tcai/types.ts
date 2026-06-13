/**
 * ASTRA × the_consciousness_ai — Shared Types
 * ════════════════════════════════════════════
 * TypeScript port of core dataclasses from tlcdv/the_consciousness_ai:
 *   models/core/global_workspace.py   → WorkspaceMessage, WorkspaceState
 *   models/core/qualia_mapper.py      → PhenomenologicalState
 *   models/self_model/self_representation_core.py → SelfState
 *   models/memory/emotional_memory_core.py → MemoryRecord
 *
 * ⚠ DISCLAIMER — These structures support computational PROXIES of
 * consciousness-related constructs (GNW, IIT, PAD). They are research
 * heuristics, not measurements of consciousness.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 * Upstream Python: © tlcdv/the_consciousness_ai (vendored in /python)
 */

// ── Emotional space (PAD — Mehrabian) ─────────────────────────────

export interface EmotionalState {
  valence: number;    // Pleasure  ∈ [-1, 1]
  arousal: number;    // Arousal   ∈ [0, 1]
  dominance: number;  // Dominance ∈ [0, 1]
}

export function clampEmotion(e: Partial<EmotionalState>): EmotionalState {
  const c = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
  return {
    valence: c(e.valence ?? 0, -1, 1),
    arousal: c(e.arousal ?? 0.5, 0, 1),
    dominance: c(e.dominance ?? 0.5, 0, 1),
  };
}

// ── Global Workspace (GNW — Dehaene/Baars) ────────────────────────

/** A message broadcast into the global workspace by a specialist module. */
export interface WorkspaceMessage {
  source: string;
  content: number[];          // payload vector (workspace_dim)
  priority: number;           // bid ∈ [0, 1]
  timestamp: number;
}

/** Phenomenological proxy vector — [Intensity, Valence, Complexity]. */
export interface PhenomenologicalState {
  intensity: number;
  valence: number;
  complexity: number;
}

export interface WorkspaceState {
  activeContent: Record<string, number[]>;
  accessHistory: Array<{ step: number; winners: string[]; ignition: number }>;
  broadcastStrength: number;          // activation level ∈ [0, 1]
  competitionResults: Record<string, number>;
  phiValue: number;                   // Φ̃ proxy on broadcast vector
  isConscious: boolean;               // ignition ≥ threshold (proxy label)
  focusTopic: string;
  qualiaVector: PhenomenologicalState;
  broadcastPayload: number[] | null;  // fused broadcast vector
  syncR: number;                      // Kuramoto order parameter R ∈ [0, 1]
}

export interface CompetitionResult {
  winners: string[];
  ignition: number;            // sigmoid ignition value ∈ [0, 1]
  ignited: boolean;
  boundBids: Record<string, number>;
  syncR: number;
  broadcast: number[];
  qualia: PhenomenologicalState;
  phiProxy: number;
  step: number;
}

// ── Emotional Memory ──────────────────────────────────────────────

export interface MemoryRecord {
  id: number;
  timestamp: number;
  narrative: string;
  embedding: number[];                // feature vector of the experience
  emotionalContext: EmotionalState;
  attentionLevel: number;             // gate at storage time ∈ [0, 1]
  salience: number;                   // |valence|·arousal·attention composite
  accessCount: number;
}

export interface RetrievalHit {
  record: MemoryRecord;
  similarity: number;                 // cosine on embeddings
  emotionalCongruence: number;        // 1 − normalized PAD distance
  score: number;                      // blended retrieval score
}

// ── Self Model ────────────────────────────────────────────────────

export interface SelfState {
  interoceptive: { energy: number; stress: number; effort: number };
  epistemic: { uncertainty: number; learningProgress: number };
  temporalContinuity: number;         // similarity to previous self-snapshot
  confidenceCalibration: number;
  emotional: EmotionalState;
  performanceEMA: number;
  updates: number;
  lastTimestamp: number;
}

export interface AttentionFocus {
  target: string;
  intensity: number;
  stability: number;
}

// ── Metrics ───────────────────────────────────────────────────────

export interface GNWMetricsReport {
  ignitionEvents: number;
  ignitionRate: number;
  meanIgnition: number;
  broadcastAvailability: number;      // fraction of steps with active broadcast
  reuseEvents: number;
  steps: number;
}

export interface ConsciousnessReport {
  gnw: GNWMetricsReport;
  phiRIIUProxy: number;
  effectiveInformation: number;
  workspace: { ignition: number; syncR: number; focus: string };
  composite: number;                  // blended TCAI proxy score ∈ [0, 1]
  disclaimer: string;
}

export const PROXY_DISCLAIMER =
  'Computational proxies inspired by GNW/IIT/PAD frameworks — research heuristics, not measurements of consciousness.';
