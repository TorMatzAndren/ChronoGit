Title: ChronoGitShell.tsx
ID: scripts-chronogit-000009
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: shell-ui
Updated: 2026-05-07
Revision: 1

---

@role:shell-ui
@subsystem:shell-ui
@entity:script:chronogit-app/src/shell/ChronoGitShell.tsx
@entity:/chronogit-app/src/shell/ChronoGitShell.tsx
@semantic:workspace-shell
@semantic:application-shell
@semantic:truth-strip
@semantic:repository-selection
@semantic:workspace-tabs
@semantic:beginner-mode
@semantic:refresh-surface
@semantic:workspace-identity
@semantic:topbar-ui
@state:active

# ChronoGitShell.tsx

**Date:** 2026-05-07
**Summary:** Primary shell and top-level workspace chrome component for ChronoGit. Provides repository selection, deterministic truth-strip display, workspace identity/header rendering, beginner-mode controls, refresh controls, and workspace tab integration through the TabBar subsystem.
**Keywords:** shell UI, workspace shell, repository selector, truth strip, topbar, beginner mode, tab workspace, Git workspace
**Tags:** scripts, shell-ui, workspace, frontend, topbar, tabs, truth-surface, repository-management

Primary workspace shell component for ChronoGit.

---

## Purpose

`ChronoGitShell.tsx` defines the top-level shell interface surrounding the ChronoGit workspace.

Responsibilities include:

- application identity rendering
- repository selection
- repository scanning controls
- beginner-mode toggle
- refresh controls
- Git truth-strip rendering
- workspace tab integration

This component acts as the persistent shell around the dynamic panel workspace.

---

## Architectural Role

This file functions as the persistent workspace chrome layer.

It sits above:

- panels
- workspace canvas
- floating layout systems

and provides stable application-level interaction surfaces.

It is effectively the main application shell UI.

---

## Imported Dependencies

Imports:

- `jarriLogo`
- `RepoInfo`
- `WorkspaceTab`
- `TabBar`
- `ChronoGitShell.css`

---

## Asset Dependency

Imports:

    ../assets/jarri-logo.png

This establishes Jarri branding integration directly into the shell layer.

---

## CSS Dependency

Imports:

    ./ChronoGitShell.css

All visual styling for the shell component is externalized into CSS.

---

# Component Structure

## Exported Component

Exports:

    ChronoGitShell

Signature:

    export function ChronoGitShell(...)

The component is fully prop-driven.

No internal React state exists.

---

# Props Contract

## Workspace Props

Workspace-related props:

- `tabs`
- `activeTabId`
- `onSelectTab`
- `onAddTab`
- `onRenameTab`
- `onCloseTab`

These drive workspace tab orchestration.

---

## Beginner Mode Props

Beginner-mode props:

- `beginnerMode`
- `onToggleBeginnerMode`

Purpose:

Controls beginner/pro terminology mode switching.

---

## Repository Props

Repository-management props:

- `repoPath`
- `repos`
- `onRepoChange`
- `onScanRepos`

Purpose:

Drive repository discovery and repository switching behavior.

---

## Truth Surface Props

Truth-display props:

- `gitVersion`
- `branch`
- `remoteLabel`
- `lastRefresh`

These populate the deterministic truth strip.

---

## Refresh Props

Refresh control:

- `onRefresh`

Purpose:

Triggers frontend refresh orchestration.

---

# Root Layout

## Root Container

Top-level element:

    <section className="chronogit-shell">

This establishes the persistent shell container.

---

# Titlebar Structure

## Titlebar Container

Main shell header:

    chronogit-shell__titlebar

Contains:

- application identity
- control surfaces

---

# Identity Surface

## Identity Container

Class:

    chronogit-shell__identity

Contains:

- logo
- title
- identity metadata

---

## Logo Rendering

Renders:

    <img src={jarriLogo} ... />

Alt text:

    Jarri

This explicitly ties ChronoGit identity into the Jarri ecosystem.

---

## Identity Text Block

Class:

    chronogit-shell__identity-text

Contains:

- eyebrow label
- main title
- doctrine tagline

---

## Eyebrow Label

Rendered text:

    Deterministic Git Workspace

Purpose:

Defines ChronoGit identity in architectural/doctrinal terms.

---

## Main Title

Rendered element:

    <h1>ChronoGit</h1>

Acts as the primary application identity surface.

---

## Doctrine Tagline

Rendered text:

    Git is truth · layouts are projections

This is a core ChronoGit architectural doctrine statement.

---

## Doctrine Meaning

The tagline explicitly communicates:

- Git state is authoritative
- workspace layouts are interpretive UI surfaces
- UI state does not override Git truth

This reflects broader Jarri truth-surface doctrine.

---

# Control Surface

## Controls Container

Class:

    chronogit-shell__controls

Contains:

- repository selector
- repository scan button
- beginner toggle
- refresh button

---

# Repository Selection

## Repository Label Container

Class:

    chronogit-shell__repo

Contains:

- label text
- repository dropdown

---

## Repository Dropdown

Element:

    <select>

Value source:

    repoPath

Change handler:

    onRepoChange(event.target.value)

---

## Repository Rendering

When repositories exist:

    repos.map(...)

Each option renders:

    <repo name> · <repo path>

---

## Fallback Repository Rendering

When no repositories exist:

A fallback option is rendered using the active repository path.

This prevents an empty selector state.

---

# Repository Scan Control

## Scan Repos Button

Button text:

    Scan repos

Handler:

    onScanRepos

Purpose:

Triggers repository discovery workflow.

---

# Beginner Mode Control

## Beginner Toggle Button

Class:

    chronogit-shell__beginner

Conditional modifier:

    chronogit-shell__beginner--on

This reflects active beginner-mode state visually.

---

## Beginner Toggle Label

Rendered format:

    Beginner: ON
    Beginner: OFF

---

## Beginner Mode Role

This control toggles terminology/UI guidance mode.

It does not directly alter Git behavior.

The frontend terminology layer changes while Git truth remains identical.

---

# Refresh Control

## Refresh Button

Button text:

    Refresh

Handler:

    onRefresh

Purpose:

Triggers workspace state refresh.

---

# Truth Strip

## Truth Strip Container

Class:

    chronogit-shell__truth

Purpose:

Persistent deterministic runtime truth surface.

---

## Truth Fields

Displayed runtime truths:

- Git version
- active branch
- remote label
- refresh timestamp

---

## Git Version Display

Format:

    Git <gitVersion>

Purpose:

Displays active Git runtime version.

---

## Branch Display

Format:

    Branch <branch>

Purpose:

Displays current repository branch.

---

## Remote Display

Format:

    Remote <remoteLabel>

Purpose:

Displays remote synchronization state summary.

---

## Refresh Timestamp Display

Format:

    Refreshed <timestamp>

Fallback:

    not yet

Purpose:

Displays last known refresh state.

---

# Tab System Integration

## TabBar Integration

Renders:

    <TabBar ... />

Passes through:

- tabs
- activeTabId
- select handlers
- add handlers
- rename handlers
- close handlers

---

## Shell / Workspace Separation

This file does not implement:

- panel rendering
- panel layout logic
- drag systems
- persistence
- Git execution
- repository scanning
- tab state storage

It orchestrates higher-level workspace shell surfaces only.

---

# UI Doctrine

The shell reflects several explicit ChronoGit doctrines:

- Git truth visibility
- deterministic runtime visibility
- workspace abstraction
- local-first design
- separation between truth and projection

---

# Stateless Design

The component is entirely stateless.

All state is externally controlled through props.

This creates:

- predictable rendering
- deterministic shell behavior
- centralized state ownership

---

# Relationship to Workspace System

This shell wraps and coordinates:

- workspace tabs
- repository state
- runtime truth surfaces
- global controls

while delegating actual workspace content elsewhere.

---

# Relationship to Tab System

The shell delegates tab rendering and tab interaction to:

    TabBar

This preserves separation between:

- shell chrome
- tab management UI

---

# Relationship to Repository System

Repository operations are externally controlled.

This component only exposes UI surfaces for:

- repository selection
- repository scanning

No repository logic exists locally.

---

# Accessibility Characteristics

Visible accessibility surfaces include:

- logo alt text
- explicit labels
- visible truth fields
- clear button labeling

No advanced accessibility systems are visible in this file.

---

# Dependencies

Imports:

- `../assets/jarri-logo.png`
- `../core/chronogitRuntimeTypes`
- `../core/chronogitWorkspaceTypes`
- `../tabs/TabBar`
- `./ChronoGitShell.css`

---

# Design Characteristics

The shell layer is:

- stateless
- prop-driven
- workspace-oriented
- truth-surface-focused
- repository-aware
- deterministic in presentation structure

---

# Current Known Gaps

- No responsive/mobile behavior is visible in this file.
- No keyboard shortcut handling exists here.
- No loading indicators exist for repository scanning.
- No refresh-progress state exists.
- No repository filtering/search exists.
- No shell-level error display exists.
- No disconnected/offline state exists.
- No runtime health indicators exist beyond the truth strip.
- No workspace-level notification surface exists.
- No persistence behavior exists directly in the shell.

---

# Verification Notes

This document is based on full-file inspection of:

- `src/shell/ChronoGitShell.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
