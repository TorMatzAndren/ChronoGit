Title: ChronoGit Git State Model – Canonical Interpretation Layer Between Git and User
ID: chronogit-docs-000002
Date: 2026-05-04
Author: Matz
Type: docs
Subsystem: chronogit
Updated: 2026-05-04
Revision: 1

---

@role:system-doc
@subsystem:chronogit
@scope:git-state-model
@scope:porcelain-interpretation
@scope:risk-classification
@scope:user-explanation-layer
@scope:staging-model
@scope:temporal-model
@scope:truth-boundary

@entity:doc:chronogit-docs-000002
@entity:/home/dretski/projects/ChronoGit/docs/docs/chronogit-docs-000002.md
@entity:script:git_status_parser
@entity:script:risk_classifier
@entity:script:git_runner
@entity:script:git_temporal

@semantic:git-state
@semantic:porcelain-to-model
@semantic:human-readable-git
@semantic:risk-surface
@semantic:staging-boundary
@semantic:working-vs-history
@semantic:temporal-truth

@state:implemented
@state:enforced
@state:foundational

@truth:git-state
@truth:interpretation
@truth:classification
@truth:user-model

@risk:misinterpretation
@risk:destructive-actions
@risk:hidden-deletions
@risk:untracked-confusion

---

# ChronoGit Git State Model – Canonical Interpretation Layer Between Git and User

**Date:** 2026-05-04  
**Summary:** Defines the canonical ChronoGit Git state model that interprets raw Git porcelain output into a structured, human-readable, and safety-aware system. This model serves as the core truth layer between Git internals and user-facing behavior, enabling safe staging, commit preparation, risk classification, and temporal exploration.  
**Keywords:** Git state model, porcelain parsing, ChronoGit, staging model, risk classification, untracked files, Git interpretation  
**Tags:** docs, chronogit, git, state-model, interpretation, risk, staging, temporal

---

## Purpose

This document defines how ChronoGit interprets Git state.

ChronoGit does not expose raw Git directly.

Instead, it transforms:

Git → structured model → human-understandable system

This model ensures:

- clarity for beginners  
- deterministic behavior  
- safe action surfaces  
- audit-ready state representation  

---

## Core Principle

ChronoGit models:

What the user needs to understand and act safely

Not:

Git internal implementation details

---

## System Layers

ChronoGit operates on three conceptual layers:

1. Working Reality  
2. Prepared Changes  
3. Snapshot History  

Working files → Prepared changes → Snapshots

---

## RepoContext

Defines the active repository state.

Fields:

repo_id  
repo_path  
repo_label  
repo_role  

branch  
upstream_name  
ahead  
behind  

last_commit:
  hash  
  short_hash  
  message  
  timestamp  
  tags[]  

---

## Change Model

The core unit is FileChange.

Fields:

path  
original_path (optional)  

index_status  
worktree_status  
porcelain  

status:
  modified  
  added  
  deleted  
  renamed  
  copied  
  untracked  
  conflict  

risk:
  normal  
  review  
  evidence  
  danger  
  critical  

is_backup_artifact (bool)  

explanation (string)  

---

## WorktreeState

Represents files not yet prepared for commit.

Fields:

unstaged_changes[]

Grouped representation:

conflicts[]  
deletions[]  
evidence[]  
untracked[]  
safe[]  

---

## StagingState

Represents files prepared for the next snapshot.

Fields:

staged_changes[]

Counts:

total  
deleted  
backup_artifacts  
conflict  

---

## HistoryState

Represents commit history.

Fields:

commits[]

Commit:

hash  
short_hash  
message  
timestamp  
tags[]  

---

## DerivedFlags

Computed state used for UI and safety.

Fields:

has_conflicts  
has_staged_deletions  
has_evidence_artifacts  
has_untracked_files  
is_clean  

---

## Porcelain Interpretation Rules

ChronoGit parses:

git status --porcelain=v1 --branch

Examples:

?? file.txt → status: untracked  
A  file.txt → status: added (staged)  
 M file.txt → status: modified (unstaged)  
D  file.txt → status: deleted (staged)  
UU file.txt → status: conflict  

---

## Risk Classification

Deterministic mapping:

IF conflict → critical  
ELSE IF deleted → danger  
ELSE IF filename matches backup patterns → evidence  
ELSE IF untracked → review  
ELSE → normal  

---

## Backup Artifact Detection

Patterns include:

*.bak  
*.tmp  
*.old  
*.orig  
*~  

These are treated as:

evidence  

---

## Explanation Layer

Every FileChange must include a human-readable explanation.

Examples:

Untracked file:
New file not tracked by Git. It will not be included in history unless prepared.

Deletion:
Tracked file marked for removal. It will be removed from the project in the next snapshot if committed.

Backup artifact:
Backup-like file detected. This may be temporary or cleanup evidence and should be reviewed before adding.

Conflict:
Conflict state detected. Manual resolution is required before committing.

---

## Working vs History Distinction

ChronoGit explicitly separates:

Working folder reality  
vs  
Versioned history  

Example:

File exists in folder but not in Git → untracked  

---

## Staging Boundary

Staging defines the boundary between:

Working files  
and  
Next snapshot  

ChronoGit must clearly show:

Prepared for commit  
vs  
Not prepared  

---

## Temporal Model

ChronoGit treats commits as snapshots.

Supports:

file snapshot recall  
commit-to-head comparison  
full repository diff  

All temporal operations are read-only by default.

---

## Truth Boundary

ChronoGit does not execute Git blindly.

All Git operations must pass through:

- validated repo context  
- validated paths  
- controlled command layer  

Frontend never executes Git directly.

---

## Safety Model

ChronoGit must:

- never hide deletions inside generic staging  
- always warn about destructive actions  
- block commits with conflicts  
- clearly explain restore operations  
- treat backup artifacts as evidence, not normal files  

---

## Verification

Model must be verifiable against real Git output.

Verification inputs:

git status --porcelain  
git log  
git diff  

Expected:

deterministic transformation into ChronoGit model  

---

## JARRI RUST PIPELINE HANDOFF

This model defines:

- structured Git state  
- deterministic classification  
- explanation layer  

This will directly feed:

- Rust parser implementation  
- serde data structures  
- audit pipeline integration  
- future ChronoGit explain layer  

---

## Status

@role:summary

ChronoGit Git State Model is:

- defined  
- deterministic  
- based on real Git states  
- ready for Rust implementation  

This model becomes the foundational truth layer for all ChronoGit behavior.
