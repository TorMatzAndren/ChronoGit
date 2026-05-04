Title: ChronoGit Documentation Contract – Jarri-Grade Canonical Documentation from Project Inception
ID: chronogit-docs-000001
Date: 2026-05-04
Author: Matz
Type: docs
Subsystem: chronogit
Updated: 2026-05-04
Revision: 1

---

@role:system-doc
@subsystem:chronogit
@scope:documentation-contract
@scope:canonical-docs
@scope:script-documentation
@scope:semantic-structure
@scope:truth-boundary
@scope:verification
@scope:project-doctrine

@entity:doc:chronogit-docs-000001
@entity:/home/dretski/projects/ChronoGit/docs/docs/chronogit-docs-000001.md
@entity:/home/dretski/projects/ChronoGit/docs/scripts
@entity:/home/dretski/projects/ChronoGit/docs/devlogs

@semantic:documentation-system
@semantic:canonical-truth-surface
@semantic:script-doc-binding
@semantic:deterministic-documentation
@semantic:jarri-compliance

@state:implemented
@state:enforced

@truth:documentation
@truth:structure
@truth:metadata
@truth:semantic-contract

@risk:undocumented-code
@risk:documentation-drift
@risk:semantic-inconsistency
@risk:invalid-structure

---

# ChronoGit Documentation Contract – Jarri-Grade Canonical Documentation from Project Inception

**Date:** 2026-05-04  
**Summary:** Defines the complete Jarri-compliant documentation system for ChronoGit, including document families, metadata requirements, semantic annotations, script-document binding rules, and truth boundary enforcement. This contract ensures that all ChronoGit components are fully documented, structurally consistent, and audit-ready from the start.  
**Keywords:** ChronoGit, documentation contract, Jarri compliance, canonical docs, semantic metadata, script documentation, truth system  
**Tags:** docs, chronogit, system-doc, documentation, jarri, canonical, structure

---

## Purpose

This document defines the canonical documentation system for ChronoGit.

It establishes:

- documentation structure
- document identity rules
- metadata requirements
- semantic annotation requirements
- script-to-document binding rules
- truth boundary enforcement
- verification expectations

This contract ensures that all ChronoGit code, structure, and behavior is fully documented, traceable, and verifiable as a system.

---

## Documentation Philosophy

ChronoGit documentation follows Jarri doctrine:

Documentation is not support material.  
Documentation is a primary truth surface.

Meaning:

- documents are system objects
- documents define system behavior
- documents must match implementation
- undocumented behavior is invalid behavior

---

## Documentation Families

ChronoGit uses separate document families, each with independent numbering.

### System / Product / Architecture Docs

docs/docs/chronogit-docs-000001.md

Purpose:

- system-level definitions
- architecture
- product design
- contracts
- models

---

### Script / Component Documentation

docs/scripts/chronogit-scripts-000001.md

Purpose:

- Rust modules
- Tauri commands
- React components
- backend helpers

Each script/component MUST have exactly one canonical script document.

---

### Devlogs (Development History)

docs/devlogs/chronogit-devlog-000001.md

Purpose:

- record decisions
- track evolution
- document investigations
- explain changes

---

## Numbering Rules

- each document family has its own counter
- counters are sequential and never reused
- documents are never renumbered
- IDs are stable system identifiers

Example:

chronogit-docs-000001  
chronogit-docs-000002  

chronogit-scripts-000001  
chronogit-scripts-000002  

---

## Required Document Structure

Every canonical document MUST contain:

### 1. Identity Header

Title  
ID  
Date  
Author  
Type  
Subsystem  
Updated  
Revision  

---

### 2. Metadata Block

@role  
@subsystem  
@scope  
@entity  
@semantic  
@state  
@truth  
@risk  

---

### 3. Descriptive Surface

# Title  

**Date**  
**Summary**  
**Keywords**  
**Tags**  

---

## Entity System

All documents must declare entities for traceability.

Supported entity types:

@entity:doc:<id>  
@entity:script:<name>  
@entity:/absolute/path  

Example:

@entity:script:git_status.rs  
@entity:doc:chronogit-scripts-000003  
@entity:/home/dretski/projects/ChronoGit/src/git/git_status.rs  

---

## Script Documentation Contract

Every script or component must have a corresponding document:

Rule:

1 script/component = 1 chronogit-scripts document

The document must define:

- purpose
- inputs
- outputs
- behavior
- safety model
- related files
- verification

---

## Truth Boundary Rules

Documentation defines system truth.

Therefore:

- implementation must match documentation
- undocumented behavior is invalid
- documentation must be updated before or with implementation changes

---

## Verification Expectations

All documentation must be:

- structurally valid
- semantically consistent
- traceable via entities
- aligned with implementation reality

Future validation will include:

- automated doc parsing
- entity resolution
- script-doc linking verification
- drift detection

---

## Non-Negotiable Rules

- no script exists without documentation
- no canonical document may omit required metadata
- no silent system behavior
- no partial truth surfaces
- no undocumented mutation paths

---

## System Role

This document is the root contract for ChronoGit documentation.

All future documents, scripts, and subsystems must comply with this structure.

---

## Status

@role:summary

ChronoGit documentation system is:

- defined
- enforced
- Jarri-compliant from inception

This establishes ChronoGit as:

a fully documented, structurally verifiable system from its first file
test change
