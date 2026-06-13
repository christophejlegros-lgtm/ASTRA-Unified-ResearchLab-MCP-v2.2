# ASTRA — Unified Research Lab + MCP Server

**Autonomous Sentient Thoughtful Reasoning Agent**

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![CI](https://github.com/christophejlegros-lgtm/ASTRA-Unified-ResearchLab-MCP-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/christophejlegros-lgtm/ASTRA-Unified-ResearchLab-MCP-v2/actions)
[![MCP Spec](https://img.shields.io/badge/MCP_Spec-2025--11--25-blue.svg)](https://modelcontextprotocol.io/specification/2025-11-25)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-1.12+-blueviolet.svg)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-≥20-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://typescriptlang.org)

Production-grade [Model Context Protocol](https://modelcontextprotocol.io) server exposing the ASTRA bio-hybrid neuromorphic simulation pipeline to AI assistants. Built with the official `@modelcontextprotocol/sdk`, it integrates a layered SNN LIF+STDP engine, consciousness proxy assessment, bio-computing platform telemetry, and an IRB ethics monitor — all queryable as MCP tools, resources, and prompts from **Claude Desktop**, **Cursor**, **VS Code**, and any MCP-compatible client.

## 🆕 v2.2 — `the_consciousness_ai` (ACM) Integration

ASTRA v2.2 integrates **[tlcdv/the_consciousness_ai](https://github.com/tlcdv/the_consciousness_ai)** — the Artificial Consciousness Module research codebase — at two levels:

- **Native TypeScript port** (`src/engine/tcai/`): Global Neuronal Workspace with sigmoid ignition & reverberation, Kuramoto/AKOrN oscillatory binding, PAD emotional processing & reward shaping, attention-gated emotional memory, self-representation core + attention schema, and a metrics suite (GNW · Effective Information · Φ̃-RIIU) — all fed live from the SNN/world-model state and exposed as **8 new MCP tools** (`tcai_cycle`, `tcai_workspace_state`, `tcai_emotion_appraise`, `tcai_memory_store`, `tcai_memory_retrieve`, `tcai_self_model`, `tcai_metrics`, `tcai_reset`).
- **Full vendored Python codebase** (`python/the_consciousness_ai/`, 215 files): the complete upstream ACM project for reference and PyTorch-based reproduction.

See **[TCAI-INTEGRATION.md](TCAI-INTEGRATION.md)** for the complete Python → TypeScript mapping and architecture coupling. All consciousness-related metrics remain **computational proxies**, not measurements.

## 🆕 v2.2 — FinalSpark NeuroPlatform v2 Integration

ASTRA v2.2 also integrates the **[FinalSpark NeuroPlatform v2](https://finalspark-np.github.io/np-docs/np_core/doc_v2.html)** wetware control API — the closed-loop interface to living neural organoids on a 128-electrode MEA — at two levels:

- **Native TypeScript port + biophysical simulator** (`src/engine/neuroplatform.ts`): faithful port of the NeuroPlatform controller surface (`StimParam` with charge-balance checking, `IntanController`, `TriggerController`, `DatabaseController`, `CameraController`) backed by a seeded `OrganoidMEA` model — exposed as **9 new MCP tools** (`np_status`, `np_configure_stim`, `np_send_trigger`, `np_count_spikes`, `np_query_spike_count`, `np_query_spike_events`, `np_query_triggers`, `np_camera_capture`, `np_closed_loop`). The MEA's 128 electrodes couple one-to-one with the ASTRA SNN's 128 neurons.
- **Live Python bridge** (`python/neuroplatform/astra_np_bridge.py`): runs a homeostatic closed loop against the physical platform via the genuine `neuroplatformv2` SDK, streaming couplings to ASTRA over JSON-RPC.
- **Standalone dashboard** (`dashboard/ASTRA-NeuroPlatform-Dashboard.html`): live MEA raster, spike scope, `StimParam` editor with charge-balance readout, trigger generator and closed-loop telemetry.

See **[NEUROPLATFORM-INTEGRATION.md](NEUROPLATFORM-INTEGRATION.md)** for the complete API → TypeScript mapping. With no hardware attached the server runs in **simulate mode** (deterministic biophysical model), **not** living-tissue measurements.

```
FinalSpark (800K neurons) ──┐
Cortical Labs CL1 ──────────┼─→ Spike Encoders → SNN (LIF+STDP, 128 neurons) → ACM Proxies
Koniku Kore ────────────────┘         │                    │
                                      │              ┌─────┴─────┐
                                      │              │  Φ̃  GW̃  PAD̃  │
                                      │              └─────┬─────┘
                                      ├─→ TCAI/ACM Layer (GNW · AKOrN · PAD · Φ̃-RIIU · EI)
                                      ├─→ NeuroPlatform v2 Bridge (MEA ↔ SNN · StimParam · closed loop)
                                      ├─→ Ethics IRB Monitor (mode-aware)
                                      └─→ MCP Server (41 tools · 10 resources · 7 prompts)
```

> **Note on data mode:** In the default `sim` mode, all bio-platform data is synthetically generated. The server is designed to connect to live platforms in `live` mode, but this requires hardware access and appropriate IRB approval.

---

## What's New in v2

- **Layered SNN architecture:** Configurable feed-forward + recurrent topology (default: 32→64→16→16 = 128 neurons) replacing the flat random network
- **Event-driven STDP:** O(spikes × fan-out) instead of O(N²) per timestep
- **Ring buffer:** O(1) spike history eviction replacing O(n) `Array.shift()`
- **Sparse weight storage:** Adjacency lists instead of dense N×N matrix
- **Honest ACM naming:** Proxies clearly labelled as `integrationProxy`, `broadcastProxy`, `arousalProxy` with methodological basis strings — no false IIT/GWT/PAD claims
- **Bounds-checked parameters:** `set_parameter` rejects implausible values (NaN, Infinity, out-of-range)
- **Mode-aware ethics:** Reports distinguish simulated vs live data with explicit disclaimers
- **CI pipeline:** GitHub Actions for build, test, and Docker smoke-test
- **Repo hygiene:** `dist/` excluded from VCS, `.gitignore` added, deployment script removed

---

## Quick Start

```bash
git clone https://github.com/christophejlegros-lgtm/ASTRA-Unified-ResearchLab-MCP-v2.1.git
cd ASTRA-Unified-ResearchLab-MCP-v2.1

# Install & build
npm install
npm run build

# Run (stdio — for Claude Desktop / Cursor)
node dist/index.js

# Or dev mode (no build needed)
npm run dev
```

## Transports

| Transport | Command | Port | Clients |
|---|---|---|---|
| **stdio** | `node dist/index.js` | — | Claude Desktop, Cursor, VS Code |
| **SSE** | `node dist/sse-server.js` | 9002 | Web clients, remote agents |
| **Streamable HTTP** | `node dist/http-server.js` | 9003 | Modern MCP clients (spec 2025-11-25) |

---

## Client Configuration

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "astra": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": { "ASTRA_LOG_LEVEL": "info" }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "astra": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "astra": {
        "type": "stdio",
        "command": "node",
        "args": ["${workspaceFolder}/dist/index.js"]
      }
    }
  }
}
```

### Docker (remote SSE + HTTP)

```bash
docker compose up -d
# SSE: http://host:9002/sse
# HTTP: http://host:9003/mcp
```

---

## MCP Tools (41)

All tools declare [MCP annotations](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) (readOnlyHint, destructiveHint, idempotentHint, openWorldHint) and human-readable titles. Core tools below; see [TCAI-INTEGRATION.md](TCAI-INTEGRATION.md) for the 8 `tcai_*` tools and [NEUROPLATFORM-INTEGRATION.md](NEUROPLATFORM-INTEGRATION.md) for the 9 `np_*` tools.

| Tool | Title | Annotations |
|---|---|---|
| `get_system_status` | ASTRA System Status | 📖 read-only |
| `get_metrics` | Real-time Metrics | 📖 read-only |
| `get_snn_state` | SNN Engine State | 📖 read-only |
| `snn_step` | Advance SNN Simulation | ✏️ mutating |
| `snn_reset` | Reset SNN Engine | ⚠️ destructive |
| `inject_spikes` | Spike Injection | ✏️ mutating |
| `get_acm_score` | Consciousness Assessment (Proxy) | 📖 read-only |
| `check_ethics` | IRB Neural Welfare Check | 📖 read-only |
| `set_parameter` | Modify State Parameter | ⚠️ destructive, bounds-checked |
| `get_platform_status` | Bio-Computing Platforms | 📖 read-only · 🌐 open-world |
| `export_snapshot` | Full State Snapshot | 📖 read-only |
| `simulation_control` | Simulation Control | ✏️ mutating |
| `tcai_*` (8) | ACM consciousness cycle, workspace, emotion, memory, self-model, metrics, reset | mixed — see TCAI guide |
| `np_*` (9) | NeuroPlatform v2: status, stim config, triggers, spike queries, camera, closed loop | mixed — see NeuroPlatform guide |

## MCP Resources (10)

| URI | Description |
|---|---|
| `astra://metrics/realtime` | Live metrics from all subsystems |
| `astra://snn/topology` | **Actual** network architecture (reflects engine config) |
| `astra://acm/state` | Current consciousness proxy assessment vector |
| `astra://ethics/welfare` | IRB compliance and welfare report (mode-aware) |
| `astra://snapshot/current` | Complete state dump |
| `astra://tcai/state` | TCAI/ACM workspace, emotion, self-model & metrics |
| `astra://neuroplatform/state` | NeuroPlatform bridge state (MEA activity, viability, coupling) |

## MCP Prompts (7)

Pre-built workflow templates that orchestrate multi-tool sequences:

| Prompt | Description |
|---|---|
| `system-health-report` | Orchestrates multiple tools into a comprehensive system report |
| `snn-experiment` | Controlled SNN experiment: reset → stimulate → observe STDP → assess proxies |
| `ethics-stress-test` | Progressive biomarker degradation: NORMAL → STRESS → DISTRESS → recovery |
| `tcai-consciousness-cycle` | Guided ACM cycle: specialists → binding → ignition → broadcast → qualia → metrics |
| `neuroplatform-experiment` | Guided closed-loop protocol: read MEA → configure charge-balanced stim → trigger → observe |

---

## Architecture

```
.github/workflows/
└── ci.yml                # GitHub Actions: build, test, Docker smoke-test

src/
├── index.ts              # stdio transport entry point
├── sse-server.ts         # SSE transport (Express)
├── http-server.ts        # Streamable HTTP transport (Express)
├── server.ts             # MCP server factory (41 tools + 7 prompts + 10 resources)
│   ├── server-wm-tools.ts    # World Model JEPA tools (6 tools + 2 resources + 1 prompt)
│   ├── server-sensor-tools.ts # Multimodal sensor tools (6 tools + 1 resource + 1 prompt)
│   ├── server-tcai-tools.ts  # TCAI/ACM tools (8 tools + 1 resource + 1 prompt)
│   ├── server-neuroplatform-tools.ts # NeuroPlatform v2 tools (9 tools + 1 resource + 1 prompt)
├── engine/
│   ├── state.ts          # Reactive state store + parameter bounds registry
│   ├── snn.ts            # Layered SNN LIF+STDP engine (Map-indexed sparse weights, event-driven)
│   ├── acm.ts            # Consciousness proxy module (Φ̃ + GW̃ + PAD̃)
│   ├── ethics.ts         # IRB ethics monitor (mode-aware, biomarker thresholds)
│   ├── world-model.ts     # JEPA World Model engine (LeWM adapted)
│   ├── wm-simulation.ts   # WM simulation manager (replay buffer, auto-train)
│   ├── multimodal-sensors.ts # V-JEPA 2 + A-JEPA + Koniku + fusion
│   ├── neuroplatform.ts      # FinalSpark NeuroPlatform v2 port + OrganoidMEA simulator
│   └── simulation.ts     # Background tick loop
└── utils/
    └── logger.ts         # Structured logging (pino → stderr)

tests/
├── astra.test.ts         # Unit tests: state, bounds, SNN, ACM, ethics, security
├── world-model.test.ts   # World Model: encoder, predictor, SIGReg, CEM, surprise
├── wm-simulation.test.ts # WM simulation: buffer, training, planning, lifecycle
├── multimodal-sensors.test.ts # Sensors: V-JEPA, A-JEPA, Koniku, fusion, pipeline
├── tcai.test.ts          # TCAI/ACM: binding, GNW, memory, emotion, self-model, metrics
├── neuroplatform.test.ts # NeuroPlatform: StimParam, OrganoidMEA, controllers, bridge
└── integration.test.ts   # Client SDK integration: tools, resources, prompts, workflow

configs/                  # Ready-to-use client configurations
```

> **Extracted to separate repositories:** The v1 HTML dashboard (4 669 lines) and the legacy Node.js bridge config have been removed from this repo to keep it focused on the MCP server. See [ASTRA-Unified-ResearchLab-MCP-](https://github.com/christophejlegros-lgtm/ASTRA-Unified-ResearchLab-MCP-) for the original dashboard.

### SNN Engine

**Layered LIF+STDP** — Configurable layered architecture. Default: 32 (input) → 64 (hidden_1) → 16 (hidden_2) → 16 (output) = **128 neurons**.

Connectivity: feed-forward between adjacent layers (30%) + sparse recurrent within layers (10%). Weights stored as sparse adjacency lists, not dense matrices.

Biophysical parameters: τ_m = 20ms, V_th = −50mV, V_reset = −70mV, refractory = 2ms. Background noise range [10, 22] mV produces ~2 spikes/step at steady state with all neurons active. STDP: A+ = 0.01, A− = 0.012, τ± = 20ms, event-driven (processes only spiking neurons per timestep).

The SNN topology resource (`astra://snn/topology`) dynamically reports the **actual** engine configuration, including layer sizes, synapse count, connectivity parameters, and weight storage type (Map-indexed sparse adjacency lists).

### ACM — Consciousness Proxy Module

> ⚠ **Methodological disclaimer:** The metrics below are **computational proxies** inspired by the referenced theories. They are **not** faithful implementations. See source code comments for full details.

Composite score: `ACM = α·Φ̃ + β·GW̃ + γ·PAD̃` (default: α=0.40, β=0.35, γ=0.25)

| Component | Basis | Inspired by | What it actually measures |
|---|---|---|---|
| `integrationProxy` (Φ̃) | Active fraction + mean firing rate + synaptic heterogeneity | IIT (Tononi) | Network participation and complexity proxy. True Φ is NP-hard to compute. |
| `broadcastProxy` (GW̃) | Cross-layer firing rate synchrony (CV-based) | GWT (Baars) | Uniform activation across layers. Does not model competitive coalitions or ignition. |
| `arousalProxy` (PAD̃) | Spike rate + bio coupling + energy | PAD (Mehrabian) | Arousal dimension only. Pleasure and Dominance are not computed. |

### Ethics IRB Monitor

IRB compliance level **N3** (100K–1M neurons). Four biomarkers with three-state classification.

**Mode-aware:** In `sim` mode, reports include explicit disclaimers that data is synthetic and `irbRequired` is `false`. In `live` mode, DISTRESS triggers mandatory IRB notification.

| Biomarker | Normal | Stress | Critical |
|---|---|---|---|
| Cell viability | ≥ 90% | 80–90% | < 80% |
| Firing rate | 15–45 Hz | outside range | ≤ 5 or ≥ 60 Hz |
| ATP/ADP | ≥ 3.0 | 2.0–3.0 | < 2.0 |
| Calcium | < 100 nM | 100–200 nM | ≥ 200 nM |

### Parameter Bounds

The `set_parameter` tool validates all numeric inputs against a bounds registry to prevent injection of absurd values (negative percentages, Infinity, NaN). Bounds are defined per parameter path — see `src/engine/state.ts` for the complete registry.

---

## Testing

```bash
# Full suite
npm test

# Unit tests only
node --import tsx --test tests/astra.test.ts

# Integration tests only (Client SDK)
node --import tsx --test tests/integration.test.ts

# TCAI / NeuroPlatform suites only
npm run test:tcai
npm run test:np

# MCP Inspector
npm run inspect
```

> **Full suite: 188/188 passing** (166 prior + 22 NeuroPlatform), 0 TypeScript errors (strict, Node16 ESM).

## Development

```bash
npm run dev        # stdio (no build)
npm run dev:sse    # SSE on :9002
npm run dev:http   # HTTP on :9003
npm run watch      # TypeScript watch mode
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ASTRA_LOG_LEVEL` | `info` | debug, info, warn, error |
| `ASTRA_SSE_PORT` | `9002` | SSE transport port |
| `ASTRA_HTTP_PORT` | `9003` | Streamable HTTP port |
| `ASTRA_CORS_ORIGIN` | `*` | CORS allowed origin |

---

## Scaling Notes

The default 128-neuron configuration is designed for interactive demonstration. To scale toward the aspirational 256→512→256→128 (1 152 neurons) architecture:

1. Pass custom layers to `SNNEngine`: `new SNNEngine({ layers: [{ name: 'input', size: 256 }, ...] })`
2. Event-driven STDP scales as O(spikes × average fan-out), not O(N²)
3. Map-indexed adjacency lists provide O(1) weight lookup per synapse
4. Sparse storage keeps memory proportional to actual synapses (~18 KB at 128 neurons vs 64 KB dense)
5. Consider increasing `intervalMs` in the simulation loop for larger networks
6. For >10K neurons, a Rust/WASM or Lava SDK backend is recommended

---

## License

MIT — © 2026 Christophe Jean Legros, Geneva

**Assistance Multi IA** · [Assistant-Multi-AI@proton.me](mailto:Assistant-Multi-AI@proton.me)

## References

- [Model Context Protocol](https://modelcontextprotocol.io) · [Spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [FinalSpark](https://finalspark.com) · [Cortical Labs](https://corticallabs.com) · [Koniku](https://koniku.com)
- [Intel Lava / Loihi 2](https://lava-nc.org)
- Gerstner & Kistler (2002) "Spiking Neuron Models"
- Tononi (2004) "An information integration theory of consciousness" — *BMC Neuroscience*
- Baars (1988) "A Cognitive Theory of Consciousness" — Cambridge University Press
- Mehrabian (1996) "Pleasure-Arousal-Dominance: A General Framework" — *Current Psychology*
