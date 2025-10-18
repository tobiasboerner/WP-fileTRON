# Security Policy

## Our Commitment

WP fileTRON is an open-source WordPress plugin. Security and transparency are our top priorities.

**We promise:**
- ✅ No backdoors or hidden admin access
- ✅ No telemetry or tracking without explicit opt-in
- ✅ No data collection or sharing with third parties
- ✅ Transparent and auditable code
- ✅ Fast response to security issues

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please follow these steps:

1. **Private Disclosure**: Use GitHub Security Advisories (preferred)
   - Go to: https://github.com/[your-username]/wp-filetron/security/advisories
   - Click "Report a vulnerability"

2. **Email**: If you prefer email, contact us at:
   - [YOUR-EMAIL] (add your security contact email here)
   - Subject: "Security Vulnerability in WP fileTRON"

3. **What to include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

4. **Response Time:**
   - We will acknowledge your report within **48 hours**
   - We will provide a detailed response within **7 days**
   - We aim to release a fix within **30 days** for critical issues

## Responsible Disclosure

We kindly ask security researchers to:
- Give us reasonable time to fix the issue before public disclosure
- Avoid exploiting the vulnerability beyond what's necessary to demonstrate it
- Keep vulnerability details confidential until we've released a fix

## Security Best Practices for Users

When using WP fileTRON:
- Always use the latest version
- Keep WordPress core and other plugins up to date
- Use strong passwords and 2FA
- Limit user permissions (use WordPress capabilities properly)
- Regular backups of your media library

## Security Features

WP fileTRON implements:
- Input validation and sanitization on all user inputs
- Output escaping to prevent XSS
- Prepared statements for all database queries (SQL injection protection)
- WordPress nonces for CSRF protection
- Capability checks before sensitive operations
- File upload validation (MIME type, size, extension)
- No use of dangerous functions (eval, exec, etc.)

## Acknowledgments

We're grateful to security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged in our release notes (unless they prefer to remain anonymous).

---

**Thank you for helping keep WP fileTRON and its users safe!**
