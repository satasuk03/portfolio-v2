import Link from "next/link";
import { Figure, StackRow, StateChip } from "@/components/manual";
import { Reveal } from "@/components/reveal";
import { home, secondaryReadouts } from "@/content/profile";
import { clientSites, projects } from "@/content/projects";
import { retrievalSystems } from "@/content/retrieval";
import { systemsNewestFirst } from "@/content/systems";

/* ─────────────────────────────────────────────────────────────────────────────
   THE LEAD — retrieval. Emphasis decided with Ze: AI leads, platform is depth.
   These figures sit inside the sticky chapter, so they carry a paper fill and
   occupy the left of the spread with the turning wireframe visible beside them.
   ────────────────────────────────────────────────────────────────────────── */

export function RetrievalFigures() {
  return (
    <div className="mx-auto max-w-spread px-step-5 sm:px-step-7">
      {retrievalSystems.map((system) => (
        <Reveal
          key={system.seq}
          className="mb-step-8 lg:w-[62%] lg:last:ml-auto"
        >
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
   THE SCALE PANEL — Radiant, past tense throughout. Spot red carries the sunset,
   because The Red Means Over Rule gives it exactly one job.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Shared by `/` and `/log`, so the figure number is a required prop rather than
 * a hardcoded string. Hardcoding it produced two FIG. 03 on the same page, which
 * breaks the one device the whole design leans on — prose pointing at a figure
 * by number.
 */
export function ScalePanel({ tag }: { tag: string }) {
  return (
    <Reveal>
      <Figure tag={tag} label="Radiant, at peak" caption={home.scaleCaption}>
        <dl className="grid grid-cols-2 gap-x-step-5 gap-y-step-6 lg:grid-cols-4">
          {home.stats.map((stat) => (
            <div key={stat.label}>
              <dd
                className={`readout ${
                  stat.attention ? "text-magenta" : "text-ink"
                }`}
              >
                {stat.value}
                {stat.unit && (
                  <span className="text-[0.55em] text-ink-mid">
                    {stat.unit}
                  </span>
                )}
              </dd>
              <dt className="caption mt-step-3 text-ink-mid">{stat.label}</dt>
            </div>
          ))}
        </dl>

        <ul className="mt-step-7 grid gap-x-step-5 gap-y-step-3 border-t-2 border-ink pt-step-4 sm:grid-cols-2">
          {secondaryReadouts.map((item) => (
            <li
              key={item.label}
              className="flex items-baseline justify-between gap-step-3 border-b border-halftone pb-step-2"
            >
              <span className="readout-sm text-ink">
                {item.label}
                {item.note && (
                  <span className="text-ink-mid"> — {item.note}</span>
                )}
              </span>
              <span className="readout-sm font-bold text-ink">
                {item.value}
                {item.unit}
              </span>
            </li>
          ))}
        </ul>
      </Figure>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   THE SERVICE RECORD — newest first. No lead title appears here; see the note in
   src/content/profile.ts.
   ────────────────────────────────────────────────────────────────────────── */

export function ServiceRecord() {
  return (
    <ol className="border-t-2 border-ink">
      {systemsNewestFirst.map((system, i) => (
        <Reveal
          as="li"
          key={system.seq}
          delay={i * 60}
          className="border-b-2 border-ink"
        >
          <div className="grid gap-step-4 py-step-6 lg:grid-cols-[13rem_1fr] lg:gap-step-7">
            <div>
              <div className="flex items-center gap-step-3">
                <span className="figure-tag text-ink-mid" aria-hidden>
                  {system.seq}
                </span>
                <StateChip state={system.state} />
              </div>
              <p className="readout-sm mt-step-3 text-ink-mid">{system.span}</p>
              <p className="readout-sm text-ink-mid">{system.org}</p>
            </div>

            <div>
              <h3 className="title text-ink">{system.name}</h3>
              <p className="caption mt-step-2 text-cyan-deep">{system.role}</p>
              <p className="measure mt-step-4 body-copy text-ink-mid">
                {system.summary}
              </p>
              <StackRow items={system.stack} />
            </div>
          </div>
        </Reveal>
      ))}
    </ol>
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
   THE ARCADE DOOR — the one place the site goes dark, and it should read as a
   door rather than a link. Paying for the inversion with a metaphor is the whole
   justification for it existing at all.
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
