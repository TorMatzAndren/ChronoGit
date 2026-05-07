Title: LocalLlmPanel.tsx
ID: scripts-chronogit-000027
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: local-llm
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:local-llm
@entity:script:chronogit-app/src/panels/LocalLlmPanel.tsx
@entity:/chronogit-app/src/panels/LocalLlmPanel.tsx
@semantic:local-model-selection
@semantic:llm-engine-selection
@semantic:offline-ai
@semantic:model-registry
@semantic:deterministic-ai
@semantic:ollama-integration
@state:active

# LocalLlmPanel.tsx

**Date:** 2026-05-07
**Summary:** UI panel for selecting local LLM engines and installed models used for ChronoGit advisory explanation workflows.
**Keywords:** local LLM, Ollama, model selection, AI engine, offline inference
**Tags:** scripts, frontend, react, llm, ollama, model-management, ai

Local model-selection and engine-selection panel for ChronoGit.

---

## Purpose

`LocalLlmPanel.tsx` provides a deterministic UI surface for selecting:

- local AI engine
- installed local models

used by ChronoGit advisory explanation systems.

The panel intentionally operates entirely on local/offline AI infrastructure.

No cloud AI providers are referenced here.

---

# Architectural Role

This component belongs to ChronoGit’s local AI orchestration layer.

It acts as the operator-facing configuration surface for:

- local inference engine selection
- installed-model discovery
- active-model selection
- local advisory AI metadata inspection

This panel is architecturally important because ChronoGit’s AI doctrine is:

    Local-first
    Inspectable
    Deterministic
    Operator-controlled

---

# Core Doctrine Alignment

ChronoGit explicitly separates:

- Git truth
- AI interpretation

This panel configures the advisory AI layer only.

Git state remains authoritative regardless of selected model.

---

# Props Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `localModels`
- `llmEngine`
- `llmModel`
- `setLlmEngine`
- `setLlmModel`
- `loadLocalModels`
- `ui`

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology rendering.

Used through:

    ui(beginnerMode, beginner, pro)

---

## localModels

Type:

    LocalModel[]

Purpose:

Provides discovered local model metadata.

Used for:

- dropdown rendering
- metadata display
- active-model lookup

---

## llmEngine

Type:

    string

Purpose:

Represents currently selected AI engine.

---

## llmModel

Type:

    string

Purpose:

Represents currently selected local model.

---

## setLlmEngine

Type:

    (engine: string) => void

Purpose:

Updates active engine selection.

---

## setLlmModel

Type:

    (model: string) => void

Purpose:

Updates active model selection.

---

## loadLocalModels

Type:

    () => void

Purpose:

Triggers local model discovery/rescan.

---

## ui

Type:

    (beginnerMode: boolean, beginner: string, pro: string) => string

Purpose:

Provides beginner/pro terminology abstraction.

---

# Root Container

Renders:

    <div className="cg-panel-content cg-local-llm-panel">

Purpose:

Defines panel layout root.

---

# Selected Model Resolution

The component resolves:

    selectedModel

via:

    localModels.find(...)

---

## Purpose

Provides metadata lookup for the currently selected model.

Used for:

- metadata rendering
- size display
- parameter visibility

---

# Model Option Construction

The component dynamically builds:

    modelOptions

from:

    localModels

---

## Option Structure

Each option contains:

- value
- title
- subtitle

---

## Subtitle Composition

Subtitle format:

    parameter_size · quantization_level · family

Example conceptual output:

    8B · Q4_K_M · qwen3

---

## Purpose

Provides concise but useful local-model metadata directly in the dropdown UI.

---

# Empty-State Model Handling

If:

    !localModels.length

a fallback option is generated.

Fallback title:

    No models discovered

Fallback subtitle:

    Run scan to refresh local model truth.

---

## Purpose

Provides explicit empty-state visibility instead of silent failure.

---

# Engine Selection Surface

The panel renders:

    <label>Engine</label>

followed by a `ChronoDropdown`.

---

# Engine Dropdown

Uses:

    ChronoDropdown

with:

    value={llmEngine}

---

## Available Engines

Currently hardcoded:

    ollama

with subtitle:

    Local Ollama model registry

---

## Purpose

Defines active inference backend.

Current architecture supports only Ollama.

---

# Engine Selection Doctrine

The engine abstraction exists even though only Ollama is currently available.

This indicates future architectural intent for:

- multiple inference providers
- pluggable local engines
- engine abstraction layer

without changing the surrounding UI architecture.

---

# Model Selection Surface

The panel renders:

    <label>Model</label>

followed by another `ChronoDropdown`.

---

# Model Dropdown

Uses:

    ChronoDropdown

with:

- value={llmModel}
- options={modelOptions}

---

## Purpose

Allows operator selection of installed local models.

---

# Search Support

The dropdown uses:

    placeholder="Search local models..."

---

## Purpose

Supports scalable local-model registries.

This becomes important as local model inventories grow.

---

# Model Scan Button

Renders button:

    Scan installed models

Expert label:

    ollama list

---

## Behavior

Calls:

    loadLocalModels

---

## Purpose

Triggers local model registry refresh/discovery.

The expert label strongly implies backend behavior equivalent to:

    ollama list

---

# Metadata Display

Below the scan button, the panel displays selected-model metadata.

---

## Metadata Format

Displays:

    family · parameter_size · quantization_level · size

---

## Size Conversion

The component converts:

    selectedModel.size

from bytes into gigabytes using:

    / 1024 / 1024 / 1024

with:

    .toFixed(1)

---

## Purpose

Provides practical operator awareness of:

- model scale
- memory footprint
- quantization level
- model family

---

# Metadata Fallback

If:

    !selectedModel

renders:

    Model metadata unavailable

---

## Purpose

Provides deterministic visibility when metadata resolution fails.

---

# ChronoDropdown Dependency

This component depends heavily on:

    ChronoDropdown

for:

- searchable selection
- consistent dropdown UX
- local filtering
- dropdown rendering

---

# Local AI Doctrine

This component strongly reinforces ChronoGit’s local-first AI philosophy.

Notable characteristics:

- local-only inference
- operator-controlled model selection
- visible model metadata
- inspectable engine layer
- explicit engine truth
- no hidden AI routing

---

# Offline AI Alignment

The architecture strongly suggests:

- no cloud dependency
- no remote API inference
- local machine inference only
- deterministic operator-visible model selection

This aligns closely with Jarri doctrine.

---

# React Characteristics

This component:

- is prop-driven
- contains no local state
- contains no hooks
- performs no persistence
- performs no backend invocation directly
- performs no async orchestration internally

Behavior is delegated upward via props.

---

# CSS Dependencies

Uses CSS classes including:

- cg-panel-content
- cg-local-llm-panel
- cg-local-llm-panel__dropdown

Styling likely includes:

- dropdown spacing
- metadata formatting
- control alignment
- panel layout consistency

No component-local CSS import exists.

---

# Separation of Concerns

This component handles:

- engine-selection UI
- model-selection UI
- model metadata rendering
- local-model empty states
- operator-visible AI configuration

It does not handle:

- model execution
- inference
- backend transport
- streaming
- persistence
- model installation
- Ollama orchestration
- AI generation
- prompt execution

---

# Current Known Gaps

- No multi-engine support exists yet.
- No model download/install flow exists.
- No inference testing exists.
- No GPU visibility exists.
- No VRAM estimation exists.
- No performance benchmarking exists.
- No model health verification exists.
- No capability tagging exists.
- No prompt-template selection exists.
- No temperature/top_p controls exist.
- No concurrency controls exist.
- No streaming configuration exists.

---

# Potential Future Expansion

Potential future improvements include:

- multi-engine support
- GPU visibility
- VRAM usage estimates
- inference benchmarking
- model-health checks
- download/install workflows
- prompt-template systems
- streaming configuration
- reasoning-model tagging
- capability classification
- latency telemetry
- context-window visibility
- quantization comparison tools

None currently exist.

---

# Design Characteristics

The component is:

- deterministic
- operator-controlled
- local-first
- audit-friendly
- metadata-aware
- infrastructure-oriented
- modular

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/LocalLlmPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
