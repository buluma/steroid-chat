# Repository Guidelines

## Project Structure & Module Organization
- App source is in `src/`.
- UI components live in `src/components/` (for example `ChatInput.tsx`, `Settings.tsx`).
- Service logic and provider/network code live in `src/services/`.
- Shared types are in `src/types/`.
- Entry points are `src/main.tsx` and `src/App.tsx`.
- Static assets are in `public/` and `src/assets/`.
- Build output is generated in `dist/` (do not edit manually).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server (default `http://localhost:5173`).
- `npm run build`: run TypeScript project build (`tsc -b`) and production bundle.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint across the repo.

Example workflow:
```bash
npm install
npm run lint
npm run build
npm run dev
```

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Indentation: 2 spaces; prefer semicolon style already used in the codebase.
- Components/types: `PascalCase` (`ChatMessage`, `SettingsProps`).
- Variables/functions/hooks: `camelCase` (`handleSend`, `getProviderModels`).
- Keep provider-specific behavior in `src/services/aiService.ts`; keep UI state logic in components.
- Run `npm run lint` before opening a PR.

## Testing Guidelines
- No test framework is currently configured in `package.json`.
- Minimum validation for changes: `npm run lint` and `npm run build`.
- If adding tests, prefer colocated files named `*.test.ts` / `*.test.tsx` under `src/`.
- Focus test coverage on service parsing logic and critical UI flows.

## Commit & Pull Request Guidelines
- Current history uses short, mixed-style messages (for example `default`, `Update README.md`), so there is no strict enforced convention yet.
- Going forward, use clear imperative commits, e.g.:
  - `feat: add robust stream JSON parser`
  - `fix: skip model polling when API key is empty`
- PRs should include:
  - What changed and why
  - Screenshots/GIFs for UI changes
  - Validation steps (`npm run lint`, `npm run build`)
  - Linked issue/task when available

## Security & Configuration Tips
- Keep secrets in `.env` only; never commit real keys.
- Sentry uses `VITE_SENTRY_DSN` (see `.env.example`).
- For provider integrations, avoid logging raw API keys or sensitive payloads.
