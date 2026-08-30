# Contributing to CrowdChain

Thanks for your interest in contributing! This guide covers the development workflow.

## Getting Started

1. Fork and clone the repository
2. Install dependencies (see [GETTING_STARTED.md](GETTING_STARTED.md))
3. Start Docker: `docker compose up -d`
4. Run `bash scripts/check-connections.sh` to verify your setup

## Project Structure

```
contracts/   → Solidity + Hardhat (compile, test, deploy)
subgraph/    → The Graph indexing (schema, handlers, queries)
backend/     → Hono API server (routes, services, Prisma)
frontend/    → React + Vite + wagmi (pages, components, hooks)
```

## Development Workflow

### Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation changes

### Code Style

**TypeScript/JavaScript:**
- ESLint + Prettier (run `npm run lint` and `npm run format`)
- 2-space indentation
- Single quotes for strings
- Trailing commas

**Solidity:**
- Solidity style guide conventions
- NatSpec comments on public/external functions
- Tests for every public function

**Commits:**
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- Keep commits focused — one logical change per commit
- Reference issues when applicable

### Running Tests

```bash
# Smart contracts (run from contracts/)
npm test                    # All 73 tests
npx hardhat coverage        # Coverage report

# Backend (run from backend/)
npm test                    # All 8 tests
npm run lint                # Lint check
npm run typecheck           # TypeScript check

# Frontend (run from frontend/)
npm run typecheck           # TypeScript check
npm run lint                # ESLint check
npm run build               # Production build
npx playwright test         # E2E tests (requires dev server)
```

**Before submitting a PR, all checks must pass:**
- Contracts: `npx hardhat test`
- Backend: `npm test && npm run lint && npm run typecheck`
- Frontend: `npm run typecheck && npm run lint && npm run build`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure all CI checks pass
4. Fill in the PR description with:
   - What changed and why
   - Screenshots (for UI changes)
   - Test results
5. Request a review

## Architecture Decisions

### Smart Contracts
- Factory pattern for campaign creation
- Campaigns are separate contracts (not proxies)
- Events for all state changes (indexed by The Graph)
- ERC-20 token contributions via native ETH

### Backend
- Hono framework (lightweight, fast)
- Prisma ORM for PostgreSQL
- Zod for request validation
- Rate limiting on all endpoints

### Frontend
- React 19 with Vite
- wagmi v2 for wallet connection
- Tailwind CSS v4 for styling
- Optimistic UI updates during transactions

### Subgraph
- Indexes all contract events
- Aggregates platform statistics
- Supports search and filtering
- GraphQL queries for the frontend

## Getting Help

- Check [docs/](docs/) for detailed guides
- Open an issue for bugs or feature requests
- Review [PHASES.md](PHASES.md) for the full project roadmap
