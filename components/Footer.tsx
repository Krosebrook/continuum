export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
              C
            </div>
            <span className="text-xl font-bold text-gray-900">Continuum</span>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm text-gray-600">
            <a
              href="mailto:hello@continuum.dev"
              className="transition-colors hover:text-brand-600"
            >
              Contact
            </a>
            <a
              href="https://twitter.com/continuum"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-brand-600"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com/company/continuum"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-brand-600"
            >
              LinkedIn
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500">
            &copy; {currentYear} Continuum. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
