import Link from "next/link";
import { Figure, StackRow } from "@/components/manual";
import { Reveal } from "@/components/reveal";
import { companies } from "@/content/experience";
import { clientSites, projects } from "@/content/projects";
import { retrievalSystems } from "@/content/retrieval";

/* ─────────────────────────────────────────────────────────────────────────────
   WORK EXPERIENCE — grouped by company, per Ze's brief (REDESIGN-PLAN.md §4).
   One figure per company with roles nested inside; newest company first,
   newest role first within. Numbers live in the prose, not in a stat panel —
   the four-readout grid was cut in the redesign.
   ────────────────────────────────────────────────────────────────────────── */

export function ExperienceRecord() {
  return (
    <div className="flex flex-col gap-step-7">
      {companies.map((company, i) => (
        <Reveal key={company.id}>
          <Figure
            tag={`03.${i + 1}`}
            label={company.name}
            caption={`${company.name} · ${company.meta} · ${company.when}`}
          >
            <div className="grid gap-step-5 lg:grid-cols-[13rem_1fr] lg:gap-step-7">
              <div>
                <p
                  className={`readout-sm ${
                    company.current ? "text-cyan-deep" : "text-ink-mid"
                  }`}
                >
                  {company.when}
                </p>
                <h3 className="title-sm mt-step-2 text-ink">{company.name}</h3>
                <p className="caption mt-step-2 text-ink-mid">{company.meta}</p>
                {company.current && (
                  /* Single-selection by contract — see experience.ts. */
                  <span className="figure-tag mt-step-3 inline-block bg-print-cyan px-step-2 py-[0.2rem] text-paper">
                    Current
                  </span>
                )}
              </div>

              <div>
                {company.roles.map((role, j) => (
                  <div
                    key={role.title}
                    className={
                      j > 0 ? "mt-step-5 border-t border-halftone pt-step-5" : ""
                    }
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-step-3">
                      <h4 className="title-sm text-ink">{role.title}</h4>
                      <span className="readout-sm text-ink-mid">
                        {role.when}
                      </span>
                    </div>
                    <p className="measure mt-step-3 body-copy text-ink-mid">
                      {role.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Figure>
        </Reveal>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   THE RETRIEVAL WORK — the site's strongest technical material. Rehomed out
   of the deleted sticky chapter (REDESIGN-PLAN.md §3): it now follows the
   experience figures, as the depth underneath the two Zentry retrieval roles.
   ────────────────────────────────────────────────────────────────────────── */

export function RetrievalFigures() {
  return (
    <div className="flex flex-col gap-step-7">
      {retrievalSystems.map((system) => (
        <Reveal key={system.seq}>
          <Figure
            tag={system.seq}
            label={system.product}
            caption={`${system.product} · ${system.span} · private codebase, not linkable`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-step-3">
              <h3 className="title text-ink">{system.name}</h3>
              <span className="readout-sm text-ink-mid">{system.span}</span>
            </div>

            {/* The line a thirty-second skimmer leaves with. */}
            <p className="title-sm mt-step-3 text-cyan-deep">{system.brief}</p>

            <p className="mt-step-4 body-copy text-ink">{system.problem}</p>

            <dl className="mt-step-5 border-t-2 border-ink pt-step-4">
              <dt className="caption text-ink-mid">What I built</dt>
              <dd className="mt-step-2 body-copy text-ink-mid">
                {system.built}
              </dd>

              <dt className="caption mt-step-5 text-ink-mid">
                Why it is not the other one
              </dt>
              <dd className="mt-step-2 body-copy text-ink-mid">
                {system.distinct}
              </dd>
            </dl>

            <StackRow items={system.stack} />
          </Figure>
        </Reveal>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PUBLIC WORK — the only place a reader can read the actual code, which is what
   earns the right to talk plainly about the agent-directed codebase.
   ────────────────────────────────────────────────────────────────────────── */

export function ProjectIndex() {
  const threads = [
    { key: "tooling" as const, label: "Agent tooling" },
    { key: "craft" as const, label: "Craft apps" },
  ];

  return (
    <div className="grid gap-step-7 lg:grid-cols-2">
      {threads.map((thread) => (
        <div key={thread.key}>
          <h3 className="caption border-b-2 border-ink pb-step-2 text-ink">
            {thread.label}
          </h3>
          <ul>
            {projects
              .filter((p) => p.thread === thread.key)
              .map((project, i) => (
                <Reveal
                  as="li"
                  key={project.name}
                  delay={i * 50}
                  className="border-b border-halftone"
                >
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block py-step-4 transition-colors duration-150 hover:bg-board"
                  >
                    <div className="flex items-baseline justify-between gap-step-3">
                      <span className="title-sm text-ink group-hover:text-cyan-deep">
                        {project.name}
                        {project.nativeName && (
                          <span className="ml-step-2 text-ink-mid">
                            {project.nativeName}
                          </span>
                        )}
                      </span>
                      <span className="readout-sm shrink-0 text-ink-mid">
                        {project.year}
                      </span>
                    </div>
                    <p className="mt-step-2 body-copy text-ink">
                      {project.pitch}
                    </p>
                    <p className="mt-step-2 text-sm leading-relaxed text-ink-mid">
                      {project.detail}
                    </p>
                    <p className="readout-sm mt-step-3 text-ink-mid">
                      {project.stack.join(" · ")}
                    </p>
                  </a>
                </Reveal>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * A ruled list, not a three-up of equal cards. The card grid this replaces broke
 * two of the system's own rules at once: same-size cards as page structure, and
 * a whole-panel Marker Yellow hover fill (yellow is a marker stroke behind ink,
 * never a large field). Rows also let each entry be as tall as its own copy.
 */
export function ClientSites() {
  return (
    <ul className="border-t-2 border-ink">
      {clientSites.map((site, i) => (
        <Reveal as="li" key={site.name} delay={i * 60} className="border-b-2 border-ink">
          <a
            href={site.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group grid gap-step-2 py-step-5 transition-colors duration-150 hover:bg-board lg:grid-cols-[1fr_1.4fr_auto] lg:items-baseline lg:gap-step-6"
          >
            <span className="title-sm text-ink group-hover:text-cyan-deep">
              {site.name}
            </span>
            <span className="body-copy text-ink-mid">{site.detail}</span>
            <span className="readout-sm shrink-0 text-cyan-deep">
              {site.href.replace("https://", "")} ↗
            </span>
          </a>
        </Reveal>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   THE ARCADE DOOR — recolored into the main palette in step 7 of the redesign;
   until then it keeps its own dark-room tokens.
   ────────────────────────────────────────────────────────────────────────── */

export function ArcadeDoor() {
  return (
    <Reveal>
      <Link
        href="/arcade"
        className="group relative block overflow-hidden border-[3px] border-ink bg-arcade-void px-step-5 py-step-7 sm:px-step-7"
      >
        <div
          aria-hidden
          className="stripes-paper absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.14]"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-step-5">
          <div>
            <p className="figure-tag text-arcade-cyan">Insert coin</p>
            <p className="display mt-step-3 text-arcade-text">
              The arcade
              <br />
              is through here.
            </p>
            <p className="mt-step-4 max-w-[44ch] body-copy text-arcade-dim">
              A boss battle, built for no reason other than that it is fun. The
              only dark room on the site — everything else is printed on paper.
            </p>
          </div>
          <span className="caption border-2 border-arcade-cyan px-step-5 py-step-3 text-arcade-cyan transition-colors duration-150 group-hover:bg-arcade-cyan group-hover:text-arcade-void">
            Enter →
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
