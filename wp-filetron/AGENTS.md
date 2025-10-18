# Repository Guidelines

## Project Structure & Module Organization
WP fileTRON is a WordPress plugin: core PHP services live in `includes/`, admin UI logic in `admin/`, and the plugin bootstrap in `wp-filetron.php`. React sources sit in `src/` (components, store, api, styles) and compile into `build/`. Assets reside in `assets/`, translations in `languages/`. Add PHP unit scaffolding in `tests/`, mirroring the `WP_Filetron\` namespace hierarchy. Consult `.dev-notes/AGENT-INDEX.md` for the agent knowledge path.

## Build, Test, and Development Commands
- `npm start` launches the @wordpress/scripts dev server targeting `src/index.js`.
- `npm run build` emits production bundles in `build/`.
- `npm run lint:js` and `npm run lint:css` enforce JavaScript and Tailwind/PostCSS standards.
- `npm run test:unit` runs JavaScript unit suites; `npm run test:e2e` covers WordPress dashboard flows.
- `composer install` pulls PHP dependencies; `composer run test` executes PHPUnit via `phpunit.xml.dist`.
- `composer run phpcs`, `composer run phpcbf`, and `composer run phpstan` keep PHP style and static analysis in check.

## Coding Style & Naming Conventions
Adhere to WordPress PHP coding standards (see the PHPCS configuration). Namespaces under `WP_Filetron\` must match directory paths, PHP files follow the `class-{name}.php` pattern, and classes use PascalCase with optional underscores (e.g., `Folder_Manager`). React components and providers use PascalCase filenames, hooks start with `use`, and shared utilities stay camelCase. Co-locate styles with components, group Tailwind utilities by intent, and run `npm run lint:js` plus `wp-scripts format` before committing.

## Testing Guidelines
Author PHPUnit coverage in `tests/Unit/<Feature>Test.php` with methods such as `test_creates_folder_for_authorized_user`. Place JavaScript specs in `src/**/__tests__` using the `.test.js` suffix. Target ≥80% coverage for new code paths, add regression tests for bug fixes, and run `npm run test:e2e` before merging flows that touch CRUD logic. Document any skipped tests in the pull request.

## Commit & Pull Request Guidelines
Write commits in the imperative mood (e.g., “Add media tagging reducer”) and add body rationale when relevant. Reference issues with GitHub keywords. Pull requests should explain the change, list tests run, and attach screenshots or GIFs for UI updates. Flag migrations or API schema updates explicitly and request reviewers familiar with the affected module.

## Security & Configuration Tips
Never commit secrets or production credentials; rely on environment configuration for API keys and endpoints. Mirror existing sanitization, escaping, and capability checks when extending PHP endpoints or REST routes. Review the repository security policy (`SECURITY.md`) before reporting vulnerabilities or merging sensitive changes, and coordinate disclosure timelines with maintainers.
