# GoalOS HF Space Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and publish a Hugging Face Static Space for `GoalOS by AbteeX AI Labs` with a cinematic demo and embedded docs.

**Architecture:** Create a self-contained `hf/space/` bundle with handcrafted HTML/CSS/JS, then add small Node scripts for verification and publishing to the `AbteeXAILab/GoalOS` Space repo. Keep the GitHub site untouched except for cross-links and helper scripts.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js scripts, Hugging Face CLI

---

### Task 1: Add planning documents

**Files:**
- Create: `docs/plans/2026-04-18-goalos-hf-launch-design.md`
- Create: `docs/plans/2026-04-18-goalos-hf-space.md`

**Step 1:** Write the design rationale and success criteria.

**Step 2:** Write the implementation plan with explicit files and scripts.

### Task 2: Create the HF Space bundle

**Files:**
- Create: `hf/space/README.md`
- Create: `hf/space/index.html`
- Create: `hf/space/docs/index.html`
- Create: `hf/space/assets/styles.css`
- Create: `hf/space/assets/app.js`

**Step 1:** Create Space metadata and a public-facing README with launch copy.

**Step 2:** Build the landing page with:
- hero
- cinematic demo shell
- package surface cards
- install snippets
- docs CTA

**Step 3:** Build the docs page with:
- quickstart
- package overview
- CLI/MCP/OpenAPI sections
- GitHub links

**Step 4:** Implement demo playback and UI state in vanilla JS.

### Task 3: Add repeatable publish tooling

**Files:**
- Create: `scripts/publish-hf-space.mjs`
- Create: `scripts/verify-hf-space.mjs`
- Modify: `package.json`

**Step 1:** Add a verification script that checks required files and local links.

**Step 2:** Add a publish script that:
- creates `AbteeXAILab/GoalOS` as a public static Space if needed
- uploads the local `hf/space/` bundle

**Step 3:** Add root npm scripts to invoke both helpers.

### Task 4: Add repo cross-links

**Files:**
- Modify: `README.md`

**Step 1:** Add a short Hugging Face section linking to the public Space.

### Task 5: Verify and publish

**Files:**
- No code changes required if earlier tasks pass

**Step 1:** Run `node scripts/verify-hf-space.mjs`.

**Step 2:** Run `pnpm test` to ensure repo changes did not break package workflows.

**Step 3:** Run `node scripts/publish-hf-space.mjs`.

**Step 4:** Confirm the Space exists and is public with `hf spaces info AbteeXAILab/GoalOS`.
