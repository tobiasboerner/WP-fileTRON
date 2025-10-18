# WP fileTRON

WP fileTRON ersetzt die Standard-Medienbibliothek von WordPress durch eine moderne React-Oberfläche. Das Plugin kombiniert eine robuste PHP/REST-API mit einer modularen SPA, um Medienverwaltung mit Ordnern, Tags, Upload-Queues und Metadaten-Workflows zu ermöglichen.

> Aktuell läuft die Entwicklung auf die erste Release-Candidate-Version zu. Das Projekt ist nicht für externe Co-Entwicklung geöffnet, Feedback, Wünsche und Verbesserungsideen sind jedoch ausdrücklich willkommen (bitte Issues oder das bestehende Kontaktformular nutzen).

## Aktueller Status

- **Projektphase:** 5 – Datei-Upload & Anzeige (Testvorbereitung)
- **Frontend:** Medienraster mit Pagination, Upload-Panel mit Queue und Snackbar-Feedback, Sidebar für Metadaten, barrierearme Modals
- **Backend:** REST-API für Medien, Ordner und Tags inkl. Validierung, Upload-Endpunkt mit Rollback bei Fehlern
- **Qualitätssicherung:** Unit-Tests für Reducer, Helper und Kernkomponenten; Playwright-E2E-Szenarien für Upload- und Pagination-Flows erfolgreich ausgeführt; weitere REST-Negativtests in Planung

## Hauptfunktionen

- React-UI für Media Grid/List inklusive Upload-Overlay, Pagination-Steuerung und Metadaten-Sidebar
- Ordner- und Tag-Management mit REST-API, inklusive Validierung zyklischer Beziehungen und differenzierter Fehlercodes
- Upload-Queue mit Echtzeit-Status, Snackbar-Notices und Store-Synchronisierung nach erfolgreichen Batches
- Drag-and-Drop-Vorbereitung für Ordnerstrukturen (derzeit deaktiviert, Fix in Arbeit)
- Erweiterbare WordPress-Integration mit Namespaces, Optionen und eigener Datenbanktabelle (`wp_filetron_*`)

## Architekturüberblick

- **PHP (Backend):** Namespace `WP_Filetron\`, WordPress ≥ 6.0, PHP ≥ 7.4, REST-Routen unter `/wp-json/wft/v1/`
- **React (Frontend):** `@wordpress/scripts`, `@wordpress/data`, Tailwind CSS, Snackbar-System in der App-Shell
- **Verzeichnisstruktur:**
  - `wp-filetron/` – Plugin-Quellcode, Einstieg `wp-filetron.php`
  - `includes/` – Installer, REST-Controller, Manager-Klassen
  - `admin/` – Admin-Bootstrap, Asset-Enqueue
  - `src/` – React-Komponenten, Store, API-Clients, Styles
  - `build/` – gebündelte Assets (nicht manuell bearbeiten)
  - `assets/` – statische Ressourcen; `languages/` – Übersetzungen
  - `tests/` – PHPUnit-Suites (`WP_Filetron\Tests`)

Weitere detailspezifische Plugin-Hinweise finden sich in `wp-filetron/README.md`. Dieses Dokument bleibt der Einstiegspunkt für Projektstruktur, Build-Setup und Team-Workflow.

## Voraussetzungen

- WordPress-Installation (lokal oder via `wp-env`)
- PHP ≥ 7.4 mit Composer
- Node.js ≥ 18 mit npm
- Schreibrechte für `wp-content/plugins/wp-filetron`

## Einrichtung & Entwicklung

1. Abhängigkeiten installieren:
   ```bash
   composer install
   npm install
   ```
2. Entwicklung starten (Watch-Build):
   ```bash
   npm start
   ```
3. Produktionsbundle erstellen:
   ```bash
   npm run build
   ```
4. Plugin in WordPress aktivieren (`wp-filetron/wp-filetron.php`).

## Tests & Qualitätssicherung

- PHP-CS & PHPStan:
  ```bash
  composer run phpcs
  composer run phpstan
  ```
- PHPUnit:
  ```bash
  composer run test
  ```
- JavaScript:
  ```bash
  npm run lint:js
  npm run lint:css
  npm run test:unit
  ```
- End-to-End (Playwright, erfordert Browser-Binary):
  ```bash
  npm run test:e2e
  ```
  > Hinweis: Chromium-Download kann in restriktiven Netzwerken blockiert sein. Fallback-Binaries oder manuelle Installation einplanen. `.wp-env.json` muss für lokale Tests eingerichtet werden.

## Sicherheit & Best Practices

- Eingaben validieren (`sanitize_text_field`, `absint`, `wp_kses_post`, `sanitize_file_name`)
- Ausgaben escapen (`esc_html`, `esc_attr`, `esc_url`)
- Datenbankzugriffe nur über `$wpdb->prepare`
- REST-Schreiboperationen mit Nonces und Capability-Checks absichern (`upload_files`)
- Upload-Workflow prüft MIME-Typen, Dateigrößen und sorgt für Rollback bei Fehlern
- Vor Releases Security-Audits einplanen (`npm audit`, `composer audit`, `WPScan`)

## Roadmap & nächste Schritte

1. REST-Negativtests für Tag- und Media-Löschrouten erweitern, um Fehlerszenarien abzudecken.
2. Playwright-E2E-Suite für Upload-/Pagination-Flows stabilisieren und `.wp-env.json` finalisieren.
3. Drag-and-Drop-Verhalten überarbeiten und nach erfolgreicher Stabilisierung wieder aktivieren.
4. Sicherheits-Checks (`npm audit`, `composer audit`, WPScan) als Release-Gate automatisieren.
5. Phase 6 vorbereiten: Dateioperationen (Löschen, Verschieben) und Medienvorschau implementieren.

## Mitwirken & Feedback

- Entwicklungsarbeit liegt derzeit beim Kernteam; externe Pull Requests werden nicht angenommen.
- Feature-Wünsche, Fehlerberichte oder Ideen bitte über den Issue-Tracker oder die bekannten Ansprechpartner melden.

---

Bei Fragen zu Sicherheitsmeldungen siehe `SECURITY.md`. Für API-Endpunkte existieren `API-DOCUMENTATION.md` und die Postman-Collection im Plugin-Verzeichnis.
