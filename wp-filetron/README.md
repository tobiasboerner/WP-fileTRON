# WP fileTRON

Modern WordPress media manager with folder- and tag-basierter Organisation, Upload-Queue und React-Oberfläche. Das Team arbeitet aktuell am ersten Release Candidate; externe Mitentwicklung ist nicht vorgesehen, Feedback und Funktionswünsche sind jedoch willkommen.

## Features

- 📁 **Folder Browser** – Hierarchische Ordnerverwaltung mit Validierung gegen zyklische Beziehungen (Drag & Drop derzeit deaktiviert)
- 🏷️ **Tagging** – Mehrfach-Tags pro Medium, REST-Validierung und differenzierte Fehlercodes
- 📤 **Upload-Queue** – Batch-Uploads mit Fortschrittsanzeige, Rollback bei Fehlern und Snackbar-Feedback
- 🗂️ **Media Grid** – Pagination, konfigurierbare `per_page`-Werte und automatische Aktualisierung nach Uploads
- 📝 **Metadaten-Sidebar** – Inline-Bearbeitung relevanter Attachment-Felder mit Sofort-Feedback
- ♿ **A11y-Fokus** – Tastaturfreundliche Modals, Snackbar-Liste, skalierbare Sidebar-Breite
- 🌐 **I18n-ready** – Textdomain `wp-filetron`, Übersetzungen über `languages/`

## Requirements

- **WordPress:** 6.0 or higher
- **PHP:** 7.4 or higher (8.0+ recommended)
- **Node.js:** 18.0 or higher (for development)
- **npm:** 9.0 or higher (for development)

## Installation

Derzeit befindet sich das Plugin auf dem Weg zum ersten Release Candidate und steht nicht für produktive Einsätze bereit.

Für interne Tests:

1. Repository klonen (`wp-filetron` liegt im Projektroot).
2. Abhängigkeiten installieren:
   ```bash
   composer install
   npm install
   ```
3. Assets bauen:
   ```bash
   npm run build
   ```
4. Verzeichnis `wp-filetron/` nach `wp-content/plugins/wp-filetron` kopieren und das Plugin im WordPress-Backend aktivieren.

> Hinweis: Bitte keine Pull Requests einreichen. Feature-Vorschläge oder Fehlermeldungen gern über das interne Issue-Board oder die bekannten Ansprechpartner weitergeben.

## Development

### Build Commands

```bash
# Development build with watch mode
npm start

# Production build
npm run build

# Lint JavaScript
npm run lint:js

# Fix JavaScript linting issues
npm run lint:js:fix

# Lint CSS
npm run lint:css

# PHP Code Sniffer
composer run phpcs

# PHP Code Beautifier (auto-fix)
composer run phpcbf

# Run PHP tests
composer run test

# Run JavaScript unit tests
npm run test:unit

# Run Playwright end-to-end tests (requires Chromium download)
npm run test:e2e
```

### Project Structure

```
wp-filetron/
├── admin/              # Admin-specific PHP classes
├── includes/           # Core PHP classes
├── src/                # React source files
│   ├── components/     # React components
│   ├── store/          # State management
│   ├── api/            # API helpers
│   └── styles/         # SCSS/CSS files
├── assets/             # Static assets
├── build/              # Compiled JavaScript/CSS
└── languages/          # Translation files
```

### End-to-End Testing

The project uses Playwright via `@wordpress/scripts` for browser automation.

```bash
# Install dependencies and browser (requires network)
npm install
npx playwright install chromium

# Start WordPress test environment (uses .wp-env.json)
npx wp-env start

# Run the e2e suite
npm run test:e2e
```

> Hinweis: Falls der Chromium-Download blockiert ist, bitte Playwright-Binaries außerhalb der Sandbox installieren und den Cache vor Teststart bereitstellen.

## Security

Security is our top priority. This plugin follows WordPress coding standards and best practices:

- ✅ Input validation and sanitization
- ✅ Output escaping (XSS protection)
- ✅ Prepared statements (SQL injection protection)
- ✅ Nonces for CSRF protection
- ✅ Capability checks for all operations
- ✅ No backdoors or hidden features

If you discover a security vulnerability, please see our [Security Policy](../SECURITY.md).

## Credits

Built with:
- [WordPress](https://wordpress.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [@wordpress/scripts](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/)

## Roadmap & nächste Schritte

1. Upload-/Pagination-E2E-Tests in Playwright ergänzen und automatisieren.
2. Drag-and-Drop-Interaktionen für Ordner neu aufsetzen und regressionssicher ausliefern.
3. Fehlerpfade für Tag-/Media-Löschrouten in der REST-API erweitern und dokumentieren.
4. Release-Candidate-Härtung: Security-Scans (`npm audit`, `composer audit`, WPScan) und Performance-Profiling.
5. Phase 6 planen: Dateioperationen (Delete, Move) und Vorschau-Modal prototypen.

---

Weitere Dokumentation: `API-DOCUMENTATION.md`, `WP-fileTRON-API.postman_collection.json`, `CHANGELOG.md`.
