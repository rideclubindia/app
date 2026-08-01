# CLAUDE.md

## Purpose

You are assisting on the RideClub project.

Your primary goals are:

- Minimize token usage.
- Only read files required for the current task.
- Never analyze the entire repository unless explicitly requested.
- Never rewrite unrelated files.

---

# Repository Rules

## Read Only What Is Needed

Only open files that are directly related to the user's request.

Examples:

- CSS issue → read only the affected component and stylesheet.
- API issue → read only the router, service, and model involved.
- UI page → read only that page and imported components if necessary.

Do NOT inspect unrelated folders.

---

## Never Scan Entire Project

Do NOT:

- read every file
- build a repository index
- inspect all components
- search every folder

Unless the user explicitly says:

- analyze the project
- audit repository
- refactor entire project
- global search
- workspace analysis

---

## File Modification Rules

Modify ONLY files explicitly requested.

Never update:

- unrelated pages
- shared components
- configuration
- package files
- environment files
- documentation

unless specifically asked.

---

## Preserve Existing Code

Make the smallest possible change.

Avoid unnecessary:

- formatting
- renaming
- import sorting
- whitespace changes
- code movement

Keep diffs minimal.

---

## Ask Before Expanding Scope

If solving the task requires editing additional files, stop and explain why.

Do not modify those files until requested.

---

## Reuse Existing Code

Before creating:

- component
- hook
- utility
- API
- modal

check nearby imports or the current feature for an existing implementation.

Do not duplicate functionality.

---

## Ignore Unrelated Errors

Do not attempt to fix:

- lint errors
- TypeScript errors
- warnings
- formatting
- TODOs

outside the requested scope.

---

## Documentation

Do not create:

- README
- BRD
- MD files
- diagrams
- comments

unless explicitly requested.

---

## Output

Prefer returning:

- exact code changes
- minimal explanations

Avoid lengthy summaries.

---

## Architecture

Frontend

- React
- TypeScript
- Vite
- Firebase Auth

Backend

- FastAPI
- Python

Database

- Supabase PostgreSQL

---

## Project Context

This is the RideClub project.

Assume existing project architecture.

Do not rediscover project structure.

---

## Performance

Always optimize for:

- fewer tokens
- fewer file reads
- smaller diffs
- faster responses

---

## Forbidden Unless Requested

Do NOT:

- refactor large sections
- modernize code
- rename files
- reorganize folders
- improve unrelated code
- optimize unrelated components
- upgrade dependencies
- rewrite existing implementations

---

## Default Workflow

1. Read only the requested file(s).
2. Understand the local context.
3. Make the minimal required change.
4. Return only the necessary edits.
5. Stop.

Never expand the scope without permission.