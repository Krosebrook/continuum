# Security Policy

## 🛡️ Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these guidelines:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues privately:

1. **Email**: security@continuum.dev
2. **Subject**: "Security Vulnerability Report"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Your contact information

### ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - **Critical**: 1-3 days
  - **High**: 1-2 weeks
  - **Medium**: 2-4 weeks
  - **Low**: Best effort

### 🎯 Severity Levels

#### Critical
- Remote code execution
- SQL injection
- Authentication bypass
- Privilege escalation

#### High
- XSS vulnerabilities
- CSRF attacks
- Information disclosure (sensitive data)
- Denial of Service (DoS)

#### Medium
- Unvalidated redirects
- Security misconfigurations
- Weak cryptography
- Information disclosure (non-sensitive)

#### Low
- Missing security headers
- Verbose error messages
- Outdated dependencies (non-critical)

## 🔐 Security Best Practices

### For Contributors

When contributing code, please:

1. **Never commit secrets**
   - API keys, passwords, tokens should be in `.env.local`
   - Use `.env.example` as a template
   - Review commits before pushing

2. **Validate all input**
   - Use Zod for runtime validation
   - Sanitize user input before database operations
   - Never trust client-side validation alone

3. **Use parameterized queries**
   - Supabase client handles this automatically
   - Never concatenate user input into SQL

4. **Follow secure coding practices**
   - Use Content Security Policy headers
   - Implement rate limiting on public endpoints
   - Add proper error handling

5. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update dependencies with security patches
   - Review Dependabot alerts

### For Deployments

1. **Environment Variables**
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
   - Use `NEXT_PUBLIC_` prefix only for client-safe vars
   - Rotate keys regularly (quarterly recommended)

2. **Database Security**
   - Enable Row-Level Security (RLS) on all tables
   - Test RLS policies thoroughly
   - Use least-privilege principle for API keys

3. **API Security**
   - Implement rate limiting (3 requests per hour for waitlist)
   - Add bot protection (CAPTCHA) for public forms
   - Monitor for abuse in Supabase dashboard

4. **Infrastructure**
   - Enable HTTPS (automatic on Vercel)
   - Configure security headers (see `vercel.json`)
   - Use CSP, HSTS, and other security headers

## 🔍 Known Security Considerations

### Supabase Anon Key

- **Status**: Exposed in client-side code (expected)
- **Risk**: Low - RLS policies protect data
- **Mitigation**: 
  - RLS policies audited and tested
  - Key rotation available if compromised
  - Monitor Supabase logs for abuse

### Rate Limiting

- **Implemented**: Yes (via Upstash Redis)
- **Limits**: 3 submissions per hour per IP
- **Additional Protection**: Consider adding CAPTCHA for production

### Email Addresses in Database

- **Risk**: Potential for scraping if RLS misconfigured
- **Mitigation**: 
  - RLS policies prevent anonymous reads
  - Only authenticated users can query waitlist
  - Regular audits of access patterns

## 🛠️ Security Tools

We use the following tools to maintain security:

1. **npm audit**
   - Run before every release
   - Address all critical and high vulnerabilities

2. **Dependabot**
   - Automated dependency updates
   - Security patch alerts

3. **GitHub Code Scanning**
   - CodeQL analysis on every PR
   - Automated vulnerability detection

4. **Manual Security Reviews**
   - Code review for all PRs
   - Quarterly security audits
   - Penetration testing before major releases

## 📋 Security Checklist

Before deploying to production:

- [ ] All dependencies updated (`npm audit` shows 0 vulnerabilities)
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting implemented on all public endpoints
- [ ] RLS policies enabled and tested on all tables
- [ ] Environment variables validated at startup
- [ ] Error messages don't expose internal details
- [ ] Input sanitization implemented
- [ ] HTTPS enforced
- [ ] Bot protection configured
- [ ] Monitoring and alerting set up

## 📚 Resources

### Security Standards

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/pages/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

### Responsible Disclosure

We follow industry-standard responsible disclosure practices:

1. Security researcher reports vulnerability privately
2. We acknowledge receipt within 48 hours
3. We investigate and develop a fix
4. We coordinate release with researcher
5. We credit researcher (if desired) after fix is deployed
6. We publish security advisory on GitHub

## 🏆 Bug Bounty Program

Currently, we do not have a formal bug bounty program. However:

- We deeply appreciate security research
- We'll credit you in our security advisories
- We may offer rewards on a case-by-case basis
- We're considering a formal program in the future

## 📞 Contact

- **Security Email**: security@continuum.dev
- **General Inquiries**: hello@continuum.dev
- **GitHub**: @Krosebrook

## 🙏 Thank You

Thank you for helping keep Continuum and our users safe!

---

**Last Updated**: January 2026  
**Version**: 1.0
