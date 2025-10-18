# WP fileTRON

Modern WordPress media manager with folder structure, tagging, and asset tracking. A powerful alternative to the default media library.

## Features

- 📁 **Hierarchical Folder Structure** - Organize media files in unlimited nested folders
- 🏷️ **Tag System** - Multi-tag support with autocomplete and bulk operations
- 🔍 **Advanced Search & Filters** - Find files quickly by type, date, size, tags, or content
- 📊 **Asset Usage Tracking** - See where each file is used across your site
- 🎨 **Modern UI** - Built with React and Tailwind CSS
- ⚡ **Performance Optimized** - Lazy loading, virtual scrolling, and caching
- 🌐 **i18n Ready** - Fully translatable

## Requirements

- **WordPress:** 6.0 or higher
- **PHP:** 7.4 or higher (8.0+ recommended)
- **Node.js:** 16.0 or higher (for development)
- **npm:** 8.0 or higher (for development)

## Installation

### For Users

1. Download the latest release ZIP file from [GitHub Releases](https://github.com/yourusername/wp-filetron/releases)
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin
3. Choose the ZIP file and click "Install Now"
4. Activate the plugin
5. Access WP fileTRON from the admin menu

### For Developers

```bash
# Clone the repository
git clone https://github.com/yourusername/wp-filetron.git
cd wp-filetron

# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Build the frontend
npm run build

# For development with hot reload
npm start
```

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
├── languages/          # Translation files
└── vendor/             # Composer dependencies
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

If Chromium cannot be downloaded (e.g., due to network restrictions), install it outside the sandbox and copy the Playwright cache into the project before running the suite.

## Security

Security is our top priority. This plugin follows WordPress coding standards and best practices:

- ✅ Input validation and sanitization
- ✅ Output escaping (XSS protection)
- ✅ Prepared statements (SQL injection protection)
- ✅ Nonces for CSRF protection
- ✅ Capability checks for all operations
- ✅ No backdoors or hidden features

If you discover a security vulnerability, please see our [Security Policy](../SECURITY.md).

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the GPL v2 or later - see the [LICENSE](LICENSE) file for details.

## Credits

Built with:
- [WordPress](https://wordpress.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [@wordpress/scripts](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/)

## Support

- 📖 [Documentation](https://github.com/yourusername/wp-filetron/wiki)
- 🐛 [Report Issues](https://github.com/yourusername/wp-filetron/issues)
- 💬 [Discussions](https://github.com/yourusername/wp-filetron/discussions)

## Roadmap

See the [project roadmap](https://github.com/yourusername/wp-filetron/projects) for planned features and improvements.

---

Made with ❤️ by [Your Name](https://yourwebsite.com)
