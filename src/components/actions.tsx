import Link from "next/link";
import { profile } from "@/content/profile";

/**
 * The only conversion on the site. PRODUCT.md is explicit: LinkedIn and GitHub
 * only — no phone, no email, no contact form — and on mobile at least one of
 * them must be reachable without scrolling.
 */
export function ActionLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-stretch gap-step-3 ${className}`}>
      <a
        href={profile.links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="caption inline-flex items-center gap-step-2 bg-ink px-step-5 py-step-3 text-paper transition-colors duration-150 hover:bg-print-cyan"
      >
        Message on LinkedIn
        <span aria-hidden>→</span>
      </a>
      <a
        href={profile.links.github}
        target="_blank"
        rel="noopener noreferrer"
        className="caption inline-flex items-center gap-step-2 border-2 border-ink px-step-5 py-step-3 text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
      >
        Read the code
        <span aria-hidden>↗</span>
      </a>
    </div>
  );
}

/**
 * The masthead strip. A manual's running head: who this is, and the two places
 * to go. Sticky so the action never scrolls out of reach on a long page.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex h-[var(--topbar-h)] max-w-spread items-center justify-between gap-step-3 px-step-5 sm:px-step-7">
        <Link href="/" className="group flex min-w-0 items-baseline gap-step-3">
          {/* Truncated rather than wrapped on a phone — a two-line running head
              eats a fifth of the first viewport. */}
          <span className="title-sm truncate text-ink">
            {profile.name}
          </span>
          <span className="figure-tag hidden shrink-0 text-ink-mid md:inline">
            {profile.role}
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-step-3 sm:gap-step-4">
          <Link
            href="/log"
            className="caption text-ink transition-colors duration-150 hover:text-cyan-deep"
          >
            Log
          </Link>
          <Link
            href="/arcade"
            className="caption text-ink transition-colors duration-150 hover:text-cyan-deep"
          >
            Arcade
          </Link>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="caption bg-ink px-step-3 py-step-2 text-paper transition-colors duration-150 hover:bg-print-cyan"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}

/**
 * The end-of-page anchor. A manual closes on a rule, not a fade.
 */
export function Colophon() {
  return (
    <footer className="rule-heavy mt-step-8">
      <div className="mx-auto max-w-spread px-step-5 py-step-7 sm:px-step-7">
        <div className="flex flex-wrap items-end justify-between gap-step-6">
          <div>
            <p className="title text-ink">End of manual.</p>
            <p className="readout-sm mt-step-3 text-ink-mid">
              {profile.location} · {profile.availability} · {profile.role}
            </p>
          </div>
          <ActionLinks />
        </div>
      </div>
    </footer>
  );
}
