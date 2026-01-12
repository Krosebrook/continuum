# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation suite (CONTRIBUTING.md, SECURITY.md, ARCHITECTURE.md, API.md)
- Status badges in README.md
- Code of Conduct

## [0.1.0] - 2026-01-12

### Added
- Initial landing page with hero section
- Waitlist form with email validation
- Supabase database integration with RLS policies
- Resend email integration (optional)
- Rate limiting with Upstash Redis
- Responsive mobile-first design with Tailwind CSS 4.x
- TypeScript strict mode configuration
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- GitHub Actions CI/CD workflows
- Dependabot configuration
- Custom GitHub Copilot agents
- Comprehensive README with quick start guide

### Security
- Row-Level Security policies on database tables
- Input validation with Zod schemas
- Input sanitization with DOMPurify
- Rate limiting (3 requests per hour per IP)
- Security headers configured in vercel.json
- Error message sanitization to prevent information disclosure

### Changed
- Upgraded to Next.js 16.1.1 from 15.x
- Upgraded to Tailwind CSS 4.x
- Upgraded to Zod 4.x

### Documentation
- README.md with deployment guide
- Database schema documentation (schema.sql)
- Environment variable examples (.env.example)
- PR template
- Issue templates
- CODEOWNERS file

---

## Version History

### [0.1.0] - Initial Release
**Release Date**: January 12, 2026

**Highlights**:
- Production-ready landing page
- Waitlist functionality with email capture
- Full database schema for future MVP features
- Security-first architecture with RLS
- Comprehensive documentation

**Tech Stack**:
- Next.js 16.1.1
- React 19.0.0
- TypeScript 5.x
- Tailwind CSS 4.1.18
- Supabase 2.39.3
- Zod 4.3.5
- Resend 6.7.0

**Known Limitations**:
- No user authentication yet (planned for v0.2.0)
- No dashboard functionality (planned for v0.3.0)
- No n8n integration (planned for v0.4.0)
- Email service is optional

**Migration Notes**:
- First release, no migrations needed

---

## Release Guidelines

### Versioning Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.0.0): Incompatible API changes
- **MINOR** version (0.1.0): New functionality in a backwards-compatible manner
- **PATCH** version (0.1.1): Backwards-compatible bug fixes

### Release Process

1. Update CHANGELOG.md with new version
2. Update version in package.json
3. Create git tag: `git tag -a v0.1.0 -m "Release v0.1.0"`
4. Push tag: `git push origin v0.1.0`
5. GitHub Actions automatically creates release
6. Vercel automatically deploys to production

### Change Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security-related changes

---

## Upcoming Releases

### [0.2.0] - Planned (Q1 2026)
- User authentication with Supabase Auth
- Magic link login
- Protected dashboard routes
- User profile management

### [0.3.0] - Planned (Q1 2026)
- ICP (Ideal Customer Profile) builder
- Multi-step form for ICP criteria
- ICP list and management
- ICP validation and scoring

### [0.4.0] - Planned (Q2 2026)
- n8n workflow integration
- Opportunity discovery automation
- Webhook endpoints for data sync
- Background job processing

### [0.5.0] - Planned (Q2 2026)
- Opportunity dashboard
- List view with filtering
- Search functionality
- Enrichment data display

### [1.0.0] - Planned (Q2 2026)
- Full MVP release
- Email digest functionality
- Analytics and reporting
- API v1 finalization
- Production hardening

---

## Support

Questions about releases or changelog?
- Open an issue: [GitHub Issues](https://github.com/Krosebrook/continuum/issues)
- Email: hello@continuum.dev

---

[Unreleased]: https://github.com/Krosebrook/continuum/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Krosebrook/continuum/releases/tag/v0.1.0
