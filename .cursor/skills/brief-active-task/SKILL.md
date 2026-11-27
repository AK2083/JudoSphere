---
name: brief-active-task
description: >-
  After start-task, write a top-down knowledge briefing that places the active
  Task in the full Feature/product context, then zooms into concrete repo detail.
  Use when beginning a Task or when orientation before coding is required.
---

# Skill: Brief active Task

## Hook vs skill

| Layer                                      | Responsibility                                                      |
| ------------------------------------------ | ------------------------------------------------------------------- |
| **`engine.py start-task` / `orient-task`** | _When_ + raw **facts** (Feature/Task bodies, roadmap markers)       |
| **This skill**                             | _How_: turn facts + **repo investigation** into a teaching briefing |

## When to run

- Immediately after `python3 .workflow/feature-task/engine.py start-task …`
- Before writing product code for the active Task

## Composition rule (mandatory)

Write **top-down**: start wide, then get more detailed each section.  
Goal: someone new to the Feature should understand _the system_ and _this step_, not a process checklist.

### User-visible structure

Write **prose**, not bullet dumps. Short sentences. Everyday words. One idea per sentence.  
Same tone from Summary through section 5 — no telegraphic lists.

0. **Summary** (program + Feature, before the deep dive)  
   Two short prose blocks, then name the active step:
   - **Program:** 2–3 sentences on where this Feature sits in the broader JudoSphere direction / current milestone (offline crash & feedback, tournament host, …). Use Feature Dependencies/Notes and linked work when present; do not invent a fake roadmap.
   - **Feature:** 2–3 sentences on what this Feature itself is for and what it delivers.
   - End with one sentence: which Task is active and that it is the next building step inside that Feature.

1. **Product / problem**  
   What hurts today? Who cares? Why local/offline matters?  
   2–4 plain sentences.

2. **What the Feature delivers when finished**  
   In 3–5 sentences, describe the finished capability as if explaining to a teammate.  
   Say what the host can store and remember, and that upload/UI may come later.  
   Avoid checkbox wording and stacked nouns without a plain gloss.

3. **How we build it (ordered steps)**  
   A short paragraph per Task (or 2–3 sentences each), in order.  
   For every step: what we add, and what that enables next. Mark which step is active.  
   You may number the steps, but each number needs full sentences — not title-only lines.

4. **This step, simply**  
   After a quick repo look, write three mini-paragraphs:
   - what is already there
   - what we add in this Task
   - what we leave for a later Task (name the number)  
     Paths/table names are fine inside the sentences.

5. **Done when**  
   2–4 full sentences describing checks you could do yourself  
   (e.g. start the app, open the DB, see the new tables, old data still there).  
   No bare “migration OK” stubs.

## Anti-patterns

- Long compound sentences; stacked nouns (“occurrence/cooldown gate state”) without a plain gloss
- Buzzword sections: “in scope / out of scope”, “definition of done”, “likely touchpoints”, “FSD/VSA” with no substance
- Pasting the engine facts block or full issue markdown verbatim
- Briefing that could apply to any Task by swapping the number
- Starting with file paths before the reader knows why the Feature exists
- Repeating the Feature title as if it were an explanation

## Procedure

1. Read facts from `start-task` stderr / `orient-task` (do not show raw facts to the user).
2. Inspect the relevant code (host slice, migrations, `@shared/api`, prior Tasks’ diffs if any).
3. Write the Summary + sections 1–5 above in the **user-visible reply**.
4. Implement **only** the active Task.

## Guardrails

- Orientation does not replace `start-task`
- No product-domain invention that contradicts the Feature text — if unsure, say what you verified in-repo
- Keep it readable in a couple of minutes; depth beats slogans
