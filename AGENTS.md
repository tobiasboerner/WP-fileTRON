# Repository Guidelines

## Project Structure & Module Organization
- WordPress plugin code lives under `wp-filetron/`; `wp-filetron.php` boots the plugin and loads modules.
- PHP classes sit in `includes/` (installer, REST controllers) and `admin/` (enqueue + bootstrap). Frontend React sources reside in `src/` with subfolders for `components/`, `store/`, `api/`, and `styles/`.
- Compiled assets are emitted to `build/` and must never be edited directly. Static assets stay in `assets/`, translations in `languages/`, and test scaffolding in `tests/`.
- Internal documentation and decision logs are under `.dev-notes/`; update `DELIVERY-ROADMAP.md` when you touch scope or priorities.

## Build, Test, and Development Commands
- `composer install` / `npm install` — set up PHP and JS dependencies.
- `npm start` — run the React dev server with `@wordpress/scripts` watcher.
- `npm run build` — create production bundles in `build/`.
- `composer run phpcs` / `composer run phpcbf` — lint or auto-fix PHP to WordPress standards.
- `composer run phpstan` — static analysis (level 5) for PHP.
- `composer run test` — execute PHPUnit suites configured in `phpunit.xml.dist`.
- `npm run lint:js`, `npm run lint:css`, `npm run test:unit`, `npm run test:e2e` — JavaScript linting, Stylelint, unit tests, and Playwright end-to-end tests.

## Coding Style & Naming Conventions
- Follow WordPress PHP standards with 4-space indentation and PascalCase classes (`class-folder-manager.php` → `Folder_Manager`). Prefix functions, hooks, and constants with `wft_` / `WFT_`.
- React files use PascalCase component names (`MediaGrid.jsx`), camelCase utilities, and `use*` for hooks. Style handles and CSS classes should start with `wft-` or `wp-filetron-`.
- Run formatters before committing; do not edit generated `build/` files.

## Testing Guidelines
- PHPUnit covers backend logic under the `WP_Filetron\Tests` namespace; mirror production class names in test filenames.
- JavaScript tests live alongside components using Testing Library; name specs `<Component>.test.jsx`.
- End-to-end coverage relies on Playwright via `wp-scripts test-e2e`; ensure `.wp-env.json` is configured and note limitations around browser downloads in restricted networks.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) with concise, imperative descriptions.
- Branch naming: `feature/<topic>`, `fix/<bug>`, `chore/<task>`, `docs/<subject>`. Rebase before raising a PR.
- PRs must reference related issues, describe user-facing changes, include screenshots for UI updates, and note which commands or tests were run. Maintainers expect lint, PHPStan, unit, and E2E results or an explicit rationale when skipping.

## Security & Configuration Tips
- Sanitize input (`sanitize_text_field`, `absint`, `wp_kses_post`) and escape output (`esc_html`, `esc_attr`, `esc_url`). Use `$wpdb->prepare` for all SQL and attach WordPress nonces to REST mutations.
- Upload workflows must validate MIME types, enforce size limits, and rely on core media APIs; document any deviations in `DELIVERY-ROADMAP.md`.

## Agentenspezifische Hinweise
- Kommunikation im Agentenchat findet auf Deutsch statt; halte Antworten und Entscheidungen entsprechend bereit.
