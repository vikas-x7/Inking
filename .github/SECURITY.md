# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within Inking, please send an email to the project maintainer at **vikaspal.icu@gmail.com**. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

## Disclosure Policy

When the security team receives a security bug report, they will assign it to a primary handler. This person will coordinate the fix and release process, involving the following steps:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any potential similar problems.
3. Prepare fixes for all releases still under maintenance.
4. Release a new version with the fix.

## Security Recommendations

- Always use HTTPS in production
- Keep your environment variables secure and never commit them
- Use strong, unique secrets for JWT tokens
- Regularly update dependencies
- Enable rate limiting in production

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |