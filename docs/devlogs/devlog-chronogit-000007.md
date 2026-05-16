Title: ChronoGit Branch Relationship Cognition, Guarded Merge Workflows, Conflict Recovery, LLM Merge Analysis, and Deterministic Documentation Verification
ID: devlog-chronogit-000007
Date: 2026-05-16
Author: Matz
Type: devlog
Subsystem: chronogit
Updated: 2026-05-16
Revision: 1

---

@role:devlog
@subsystem:chronogit
@scope:branch-relationship
@scope:merge-preview
@scope:merge-execution
@scope:merge-recovery
@scope:gitignore-conflict-resolution
@scope:llm-merge-analysis
@scope:workspace-state
@scope:panel-navigation
@scope:bulk-unstage
@scope:runtime-types
@scope:script-documentation
@scope:documentation-verification
@scope:frontend-modularization
@scope:tauri-backend
@scope:git-cognition
@scope:jarri-doctrine
@entity:chronogit-app/src/App.tsx
@entity:chronogit-app/src/core/gitActions.ts
@entity:chronogit-app/src/core/chronogitRuntimeTypes.ts
@entity:chronogit-app/src/core/workspaceState.ts
@entity:chronogit-app/src/components/HelpHint.tsx
@entity:chronogit-app/src/panels/BranchPanel.tsx
@entity:chronogit-app/src/panels/ChangeListsPanel.tsx
@entity:chronogit-app/src-tauri/src/lib.rs
@entity:chronogit-app/src-tauri/src/main.rs
@entity:chronogit-app/src/main.tsx
@entity:docs/scripts/scripts-chronogit-000001.md
@entity:docs/scripts/scripts-chronogit-000002.md
@entity:docs/scripts/scripts-chronogit-000005.md
@entity:docs/scripts/scripts-chronogit-000007.md
@entity:docs/scripts/scripts-chronogit-000013.md
@entity:docs/scripts/scripts-chronogit-000021.md
@entity:docs/scripts/scripts-chronogit-000022.md
@entity:docs/scripts/scripts-chronogit-000040.md
@entity:docs/scripts/scripts-chronogit-000041.md
@entity:docs/scripts/scripts-chronogit-000042.md
@entity:docs/scripts/scripts-chronogit-000043.md
@state:active

# ChronoGit Branch Relationship Cognition, Guarded Merge Workflows, Conflict Recovery, LLM Merge Analysis, and Deterministic Documentation Verification

**Date:** 2026-05-16  
**Summary:** This session significantly expanded ChronoGit’s branch cognition and merge safety architecture. Major additions included branch relationship inspection, guarded merge preview/execution workflows, merge abort support, deterministic `.gitignore` conflict auto-resolution, grouped staged-prefix recovery, local LLM merge-risk analysis, panel navigation routing, workspace state extraction, and a full deterministic script↔documentation verification sweep. The session also reinforced ChronoGit’s role as a Git cognition environment rather than a traditional Git GUI.

---

# Context

Prior ChronoGit development had already established:

- branch topology projection
- Time Machine diff cognition
- remote-risk previews
- commit preflight systems
- repository-state visualization
- deterministic frontend/backend boundaries

However, an important operational gap still existed:

> ChronoGit could explain repository state, but could not yet fully guide or cognitively model branch merge workflows.

This session heavily expanded that capability.

The architecture increasingly moved from:

- passive Git visualization

toward:

- active merge cognition
- guarded mutation workflows
- recovery-oriented Git operation handling
- deterministic conflict understanding

---

# Branch Relationship Cognition Expanded

One of the largest additions was the introduction of:

- branch relationship previews
- branch merge previews
- merge execution cognition
- branch relationship classifications

The backend now computes structured relationship truth between branches.

This includes:

- directional commit differences
- directional changed files
- shared touched files
- merge-base awareness
- insertion/deletion churn
- fast-forward possibilities
- merge classification
- merge risk levels

This represented a major conceptual shift.

ChronoGit was no longer merely exposing:

- branch names
- ahead/behind counts

It increasingly modeled:

> branch relationships as semantic repository cognition.

---

# Branch Relationship Classification Introduced

The backend began generating explicit relationship classifications such as:

- `IDENTICAL`
- `FAST_FORWARD_LEFT`
- `FAST_FORWARD_RIGHT`
- `DIVERGED_SHARED_PATHS`
- `DIVERGED_CLEAN_PATHS`
- `HIGH_RISK`

This was important because:

Git users often understand merge danger poorly.

ChronoGit increasingly aims to expose:

- operational meaning
- merge implications
- repository risk surfaces

rather than only raw Git mechanics.

The classifications became part of:

- merge preview logic
- BranchPanel cognition
- LLM explanation systems
- merge-readiness workflows

---

# Merge Preview Architecture Introduced

A major backend addition was:

- `git_merge_branch_preview`

This command introduced a new architectural layer:

> mutation preview before mutation execution.

The preview system now computes:

- whether merging is allowed
- current repository blockers
- operation-state conflicts
- working-tree dirtiness
- merge mode
- required confirmation level
- merge consequence summaries
- risk levels

This aligned strongly with ChronoGit doctrine:

> dangerous Git operations should become cognitively visible before execution.

---

# Guarded Merge Execution Added

The backend also introduced:

- `git_merge_branch_execute`

Important architectural characteristics:

- merge execution revalidates preview state
- confirmation text is mandatory
- fast-forward merges use `--ff-only`
- non-fast-forward merges use `--no-edit`
- execution returns structured stdout/stderr

This was important because ChronoGit intentionally avoids:

- blind Git mutation
- hidden side effects
- unsafe optimistic merge execution

The architecture increasingly emphasized:

> inspect first, mutate second.

---

# Merge Abort Workflow Added

A dedicated:

- `git_merge_abort`

workflow was introduced.

This addition was important because:

interrupted Git operations increasingly became treated as:

> first-class operational states rather than user mistakes.

The frontend now exposes explicit merge recovery actions.

The backend validates:

- merge really is active
- repository state allows abort

before executing:

    git merge --abort

This continued ChronoGit’s direction toward:

- recoverability
- explicit operational safety
- mutation reversibility

---

# Deterministic .gitignore Conflict Resolution Added

One of the most important safety-oriented additions was:

- `.gitignore` auto-resolution support

The system introduced:

- `resolve_gitignore_conflict_text`
- `git_resolve_gitignore_keep_both`

This workflow intentionally supports only:

- a narrow
- deterministic
- easily explainable

conflict class.

Important safety rules:

- only `.gitignore`
- only one conflicted file
- merge must already be active
- nested conflict markers rejected
- malformed conflict blocks rejected

The frontend then exposed:

> “Simple .gitignore conflict detected”

along with deterministic recovery actions.

This was an important philosophical moment.

ChronoGit intentionally avoided:

- generic AI conflict merging
- unsafe automatic resolution
- heuristic mutation systems

Instead it implemented:

> constrained deterministic recovery.

---

# Bulk Staged-Prefix Recovery Added

Another important usability/safety addition was:

- `git_unstage_prefix`

This supported recovery from accidental bulk staging events.

The backend validates:

- prefix exists
- prefix is non-empty
- staged entries actually exist

before executing:

    git reset HEAD -- <prefix>

This became connected to:

- `ChangeListsPanel.tsx`
- grouped staged-folder recovery UI

This addition strongly reinforced ChronoGit’s emerging role as:

> a repository recovery environment rather than merely a Git launcher.

---

# LLM Merge-Risk Analysis Added

A major cognition-oriented addition was:

- `explain_merge_risk_with_ollama`

This introduced structured merge-risk explanation workflows.

Important architectural characteristics:

- local-only LLM execution
- model existence validation
- bounded input clipping
- GPU power-limit handling
- deterministic prompt hardening
- explicit anti-hallucination instructions

The prompt specifically forbids:

- deployment advice
- Docker advice
- speculative refactoring
- invented merge conflicts
- generic project guidance

This represented a critical architectural principle:

> LLM systems must remain subordinate to repository truth.

The merge-risk explanation layer became:

- advisory
- contextual
- bounded

rather than authoritative.

---

# BranchPanel Expanded into Merge Cognition Surface

`BranchPanel.tsx` evolved significantly.

It increasingly became:

- a branch cognition environment
- a merge-readiness surface
- a relationship inspection layer
- a merge explanation entrypoint

rather than merely:

- a branch list
- a branch switcher

The panel now increasingly exposes:

- merge readiness
- merge blockers
- branch relationship state
- merge classifications
- merge risk cognition
- supporting-panel navigation
- LLM merge explanation routing

This represented a major conceptual maturation.

---

# Panel Navigation Routing Introduced

A reusable:

- `openOrAddPanel`

workflow was added.

This allowed panels to request supporting cognition surfaces such as:

- Change Lists
- Commit Preflight
- Time Machine
- LLM Log

without directly owning workspace layout.

This reinforced an important frontend architecture direction:

> panels should coordinate cognition, not own global orchestration.

---

# LLM Log Architecture Expanded

Merge-risk explanations were integrated into the existing:

- centralized LLM log system

rather than creating isolated explanation state.

This was important because:

ChronoGit increasingly treats:

- repository explanations
- merge explanations
- diff cognition
- Time Machine analysis

as part of:

> one persistent repository cognition history.

The architecture therefore increasingly resembles:

- repository memory
- repository reasoning traces
- Git cognition logs

rather than ephemeral AI chat.

---

# Workspace State Extraction Added

A new helper module:

- `workspaceState.ts`

was introduced and documented.

This extracted deterministic workspace state mutation helpers away from root UI orchestration.

The helper layer now owns transformations for:

- tabs
- panels
- workspace movement
- workspace resizing
- panel insertion/removal

This continued the long-term modularization direction:

> structure before scale.

The architecture increasingly moved away from:

- giant monolithic UI mutation logic

toward:

- isolated deterministic transformation layers.

---

# HelpHint Component Added

A reusable:

- `HelpHint.tsx`

component was introduced.

The component provides:

- contextual inline explanations
- compact help interactions
- left/right aligned hint popups
- outside-click dismissal behavior

This addition reinforced ChronoGit’s educational direction.

ChronoGit increasingly aims to teach:

- Git state
- merge meaning
- repository risk
- operational consequences

rather than simply expose Git commands.

---

# Runtime Contract Layer Expanded

`chronogitRuntimeTypes.ts` evolved significantly.

New runtime contracts included:

- `BranchRelationshipPreview`
- `BranchMergePreview`
- `BranchMergeResult`

This was important because:

ChronoGit increasingly depends on:

> explicit semantic runtime contracts rather than implicit frontend assumptions.

The runtime layer increasingly functions as:

- repository cognition schema
- semantic frontend contract layer
- deterministic Git-state model

This strongly mirrors broader Jarri architecture philosophy.

---

# App.tsx Continued Evolving into Orchestration Layer

`App.tsx` continued shrinking conceptually even while operational coordination increased.

Responsibilities increasingly became:

- orchestration
- panel routing
- state ownership
- merge recovery coordination
- centralized log handling

while detailed cognition logic moved outward into:

- panels
- helpers
- runtime contracts
- backend truth systems

This reinforced the intended architecture:

> backend = repository truth  
> frontend = cognition surface  
> App.tsx = orchestration boundary

---

# Deterministic Script Documentation Verification Expanded

A major operational milestone during this session was a deterministic:

- script ↔ documentation verification sweep

The workflow compared:

- active source files
- canonical script documentation entities

The investigation uncovered:

- undocumented helper layers
- undocumented bootstrap surfaces
- documentation audit edge cases
- path-normalization inconsistencies

New canonical script docs added included:

- `scripts-chronogit-000040.md`
- `scripts-chronogit-000041.md`
- `scripts-chronogit-000042.md`
- `scripts-chronogit-000043.md`

This reinforced an increasingly important ChronoGit/Jarri principle:

> undocumented architectural growth is itself a risk surface.

---

# Documentation Philosophy Reinforced Further

A strong doctrine re-emerged during this session:

Documentation should not merely exist.

It should remain:

- verifiable
- mapped
- auditable
- deterministic
- tied directly to real source surfaces

The process increasingly resembled:

1. enumerate active truth
2. compare against canonical docs
3. identify missing surfaces
4. document deterministically
5. verify consistency
6. challenge noise and boilerplate

This was important because:

the session also recognized that:

> not every framework file deserves canonical architectural documentation.

The handling of `vite-env.d.ts` reinforced:

- documentation selectivity
- architectural relevance filtering
- resistance against documentation entropy

---

# Merge Workflow Philosophy Clarified

One of the clearest architectural realizations during this session was:

ChronoGit should not attempt to automate Git recklessly.

Instead:

it should increasingly become:

> a merge cognition and recovery environment.

This distinction is critical.

The value increasingly lies in:

- understanding merges
- understanding risk
- understanding topology
- understanding consequences
- understanding recovery paths

rather than merely executing Git commands quickly.

---

# Current Strengths

ChronoGit now has:

- branch relationship cognition
- guarded merge previews
- guarded merge execution
- merge abort workflows
- deterministic `.gitignore` conflict recovery
- grouped staged-prefix recovery
- merge-risk LLM explanation
- centralized LLM cognition logs
- supporting-panel routing
- stronger runtime contracts
- extracted workspace state helpers
- deterministic script verification workflows
- expanded frontend modularization
- educational inline help surfaces

---

# Current Weaknesses

Still unresolved:

- App.tsx still contains substantial orchestration complexity
- merge preview does not simulate exact line-level conflicts
- `.gitignore` auto-resolution remains intentionally narrow
- merge classifications are still string-based
- no persistent repository cognition cache exists
- no semantic repository graph exists yet
- merge-risk explanations remain non-streaming
- no dedicated provenance/event timeline exists for merge operations
- no generalized safe conflict-resolution framework exists
- runtime type growth risks future centralization pressure

---

# Future Direction

Likely next directions increasingly include:

- semantic merge graph modeling
- repository cognition caching
- provenance-aware Git event timelines
- operation replay systems
- merge history cognition
- conflict timeline visualization
- repository memory systems
- richer branch ancestry projection
- merge simulation layers
- deterministic repository event logging

The architecture increasingly converges toward:

> repository cognition rather than Git command execution.

---

# Jarri Doctrine Reinforced

This session strongly reinforced:

1. Investigate
2. Implement
3. Verify
4. Challenge
5. Document

Especially important lessons included:

- merge systems must remain truthful
- LLMs must remain subordinate to repository evidence
- deterministic constraints are safer than generic automation
- documentation should map directly to active source truth
- recovery workflows are as important as mutation workflows
- modularization reduces architectural entropy
- repository cognition scales better than repository spectacle

---

# Final Principle

This session reinforced a major ChronoGit design truth:

> Git operations are not merely commands.  
> They are cognitive state transitions across repository time.

---

# Status

active
