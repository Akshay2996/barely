# Contributing to Barely

Thanks for taking the time to contribute! 🌱 Barely is a small, opinionated project, and clear, well-scoped contributions are the easiest to merge. This guide explains how to propose changes.

The `main` branch is **protected** — nobody pushes to it directly (including the maintainer). Every change lands through a **pull request**, and most PRs should start from an **issue**.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Start with an issue](#start-with-an-issue)
- [Development setup](#development-setup)
- [Branch & pull-request workflow](#branch--pull-request-workflow)
- [Coding standards](#coding-standards)
- [Commit messages](#commit-messages)
- [What makes a PR easy to merge](#what-makes-a-pr-easy-to-merge)

## Code of conduct

Be kind. It's on brand. Assume good intent, keep discussion focused on the work, and remember there's a person on the other side of the screen.

## Ways to contribute

- 🐞 **Report a bug** — [open a bug report](https://github.com/Akshay2996/barely/issues/new/choose).
- 💡 **Suggest a feature** — [open a feature request](https://github.com/Akshay2996/barely/issues/new/choose). Barely deliberately does _less_, so please explain why it fits the philosophy.
- 📖 **Improve docs** — typos, clarifications, and examples are all welcome.
- 🧑‍💻 **Write code** — fix a bug or implement an accepted feature.

## Start with an issue

**Before writing code, open (or find) an issue.** This prevents duplicated effort and lets us agree on the approach before you invest time.

1. Search [existing issues](https://github.com/Akshay2996/barely/issues) to avoid duplicates.
2. Open a new issue using the appropriate template and describe the problem or idea.
3. Wait for a 👍 / "go ahead" from the maintainer on non-trivial changes, or comment that you'd like to work on it so it can be assigned to you.

Small, obvious fixes (typos, broken links) can skip straight to a PR.

## Development setup

**Prerequisites:** Node.js 18+ and npm.

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/barely.git
cd barely
npm install
npm run dev        # http://localhost:5173
```

Before opening a PR, make sure the project is healthy:

```bash
npm run typecheck      # must pass with zero errors
npm run build          # must succeed (runs tsc + vite build)
npm run format         # apply Prettier formatting
```

## Branch & pull-request workflow

Because `main` is protected, use a fork-and-branch flow:

1. **Fork** the repository and clone your fork.
2. Create a descriptive branch off `main`:
   ```bash
   git checkout -b fix/progress-calendar-timezone
   ```
   Use a prefix that matches the change: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`.
3. Make your change. Keep it focused — one logical change per PR.
4. Run `npm run typecheck`, `npm run build`, and `npm run format`.
5. Commit (see [commit messages](#commit-messages)) and push to your fork.
6. Open a **pull request against `Akshay2996/barely:main`**. Fill out the PR template and **link the issue** it resolves (e.g. `Closes #123`).
7. A maintainer reviews it. Address feedback by pushing more commits to the same branch. Once approved, the maintainer merges it.

> Direct pushes to `main` are rejected by branch protection — always go through a PR.

## Coding standards

- **TypeScript** everywhere; no `any` unless genuinely unavoidable, and keep types close to the data.
- **Prettier** is the source of truth for formatting — run `npm run format`. The config lives in `.prettierrc`.
- **Match the surrounding code.** Follow the existing patterns for stores (Zustand), the repository/storage layer, and the CSS design tokens in `src/index.css`.
- **Use plain hyphens** (`-`) in user-facing copy and comments, not em/en dashes — the project keeps this consistent.
- **Keep it accessible:** interactive elements need keyboard support and sensible `aria-*` labels.
- **Keep it responsive:** verify changes at mobile, tablet, and desktop widths, and respect safe-area insets.
- **Stay on philosophy:** features should help people do _less_, kindly. If it adds pressure or clutter, it probably doesn't belong.

## Commit messages

Write clear, imperative commit subjects. [Conventional Commits](https://www.conventionalcommits.org/) are encouraged but not enforced:

```
feat(reminders): add custom time picker
fix(progress): correct month boundary on the last day
docs: clarify PWA install steps
```

## What makes a PR easy to merge

- It's small and does one thing.
- It links to an issue and explains the "why".
- `typecheck` and `build` pass.
- It includes before/after screenshots for UI changes.
- It updates docs when behavior changes.

Thanks again — every tiny contribution counts. 🌱
