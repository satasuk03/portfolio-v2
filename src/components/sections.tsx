import { Figure } from "@/components/manual";
import { Reveal } from "@/components/reveal";
import { WaveCanvas } from "@/components/wave/wave-field";
import { companies } from "@/content/experience";
import { hobbies } from "@/content/hobbies";
import { about, homeStats } from "@/content/profile";
import { clientChips, projects, workProjects } from "@/content/projects";
import { skillGroups } from "@/content/skills";

/* ─────────────────────────────────────────────────────────────────────────────
   § 01 ABOUT — one figure, four short paragraphs. First person, no adjective
   stacking; the through-line is the same judgment applied further up each time.
   ────────────────────────────────────────────────────────────────────────── */

export function AboutFigure() {
  return (
    <Reveal>
      <Figure tag="01" label="The operator">
        {/* Two columns from `lg`: prose capped at its 68ch measure, and the
            readout stack occupying the space that measure leaves empty inside
            a full-spread frame. Below `lg` the stack drops under the prose as
            a 2×2 block. */}
        <div className="grid gap-step-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-step-7">
          <div>
            <div className="measure flex flex-col gap-step-4">
              {about.paragraphs.map((para, i) => (
                <p
                  key={para.slice(0, 24)}
                  className={
                    i === 0 ? "title-sm text-ink" : "body-copy text-ink-mid"
                  }
                >
                  {para}
                </p>
              ))}
            </div>

            {/* The epigraph closes the figure: the paragraph above states the
                belief in his own words, this cites where it comes from. A 2px
                ink rule separates them — the same panel-edge weight used
                elsewhere, so the quote reads as a distinct register rather
                than a fifth paragraph. */}
            <blockquote className="measure mt-step-6 border-t-2 border-ink pt-step-5">
              <p className="pull-quote text-ink">
                &ldquo;{about.epigraph.text}&rdquo;
              </p>
              <cite className="figure-tag mt-step-3 block not-italic text-ink-mid">
                — {about.epigraph.attribution}
              </cite>
            </blockquote>
          </div>

          <ScaleStack />
        </div>
      </Figure>
    </Reveal>
  );
}

/**
 * The scale readouts beside the About prose.
 *
 * Not "cards" in the elevated sense — there is no elevation on paper. The
 * separation is pure keyline: the grid is ink-coloured with a 2px gap, and
 * each cell is board, so the ground shows through as an exact 2px ink rule
 * between cells in both the 2-column and 1-column arrangements. One border
 * declaration, no last:border-0 special-casing, and it cannot desynchronise
 * from the frame's own rule weight.
 *
 * Source order is dt → dd for assistive tech; `flex-col-reverse` puts the
 * numeral on top visually, where it scans.
 */
function ScaleStack() {
  return (
    <dl className="grid grid-cols-2 gap-[2px] border-2 border-ink bg-ink lg:grid-cols-1">
      {homeStats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col-reverse gap-step-1 bg-board px-step-4 py-step-4"
        >
          {/* `homeStats` is `as const`, so it types as a union and only two of
              the four members carry `note` — narrow, don't index. The guard is
              also why a noteless stat gets no empty line under its label. */}
          <dt className="caption text-ink-mid">
            {stat.label}
            {"note" in stat && (
              <span className="readout-sm mt-step-1 block normal-case tracking-normal text-ink-mid">
                {stat.note}
              </span>
            )}
          </dt>
          <dd className="readout text-ink">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 02 SKILLS — grouped by what it is for, not by logo count. The AI &
   retrieval row leads and takes the yellow highlighter fill — the one place a
   whole row of yellow is allowed, because it is the site's lead claim, and
   yellow is never set as type on paper (1.4:1), only as a fill behind ink.
   ────────────────────────────────────────────────────────────────────────── */

export function SkillsTable() {
  return (
    <Reveal>
      <div className="frame bg-paper">
        {skillGroups.map((group, i) => (
          <div
            key={group.key}
            className={`grid gap-step-3 px-step-4 py-step-4 sm:grid-cols-[11rem_1fr] sm:items-start sm:gap-step-5 ${
              i > 0 ? "border-t-2 border-ink" : ""
            } ${group.lead ? "bg-marker-yellow" : ""}`}
          >
            <h3 className="title-sm text-ink">{group.key}</h3>
            <ul className="flex flex-wrap gap-step-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="readout-sm border-2 border-ink bg-paper px-step-2 py-[0.15rem] text-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 03 EXPERIENCE — grouped by company, per Ze's brief (REDESIGN-PLAN.md §4).
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
                    {role.href && (
                      /* Same link treatment as the § 04 card footers. Sits on
                         its own line — the title row is justify-between and a
                         third child wraps badly. */
                      <a
                        href={role.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="figure-tag mt-step-3 inline-block text-cyan-deep transition-colors duration-150 hover:text-print-cyan"
                      >
                        {role.hrefLabel ?? role.href}
                      </a>
                    )}
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
   § 04 WORK PROJECTS — three cards, short by instruction. The seeded wave
   still stands in for a screenshot: recognisable as a plate, unreadable as a
   spec. Private codebases get a "Private · ask me" footer, not a dead link.
   ────────────────────────────────────────────────────────────────────────── */

export function WorkProjectCards() {
  return (
    <div className="grid gap-step-5 sm:grid-cols-2 lg:grid-cols-3">
      {workProjects.map((project, i) => (
        <Reveal key={project.name} delay={i * 60} className="flex">
          <article className="frame flex flex-1 flex-col bg-paper">
            {/* One band, one aspect ratio, whichever fills it — a cover and a
                wave still must reserve identical space or the grid's rows
                jump as the images decode. The 3px keyline is what makes a
                full-tone plate read as printed rather than as a screen; it is
                the same treatment Fig. 00 gives the photograph. */}
            <div className="aspect-[16/9] shrink-0 overflow-hidden border-b-[3px] border-ink">
              {project.cover ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={project.cover}
                  alt={project.coverAlt ?? ""}
                  loading="lazy"
                  decoding="async"
                  className="block h-full w-full object-cover"
                />
              ) : (
                <WaveCanvas
                  still
                  seed={project.seed}
                  cell={6}
                  gamma={2.0}
                  className="block h-full w-full"
                />
              )}
            </div>
            <div className="flex-1 px-step-4 py-step-4">
              <span
                className={`figure-tag inline-block px-step-2 py-[0.2rem] ${
                  project.live
                    ? "bg-print-cyan text-paper"
                    : "border-2 border-ink text-ink"
                }`}
              >
                {project.chip}
              </span>
              <h3 className="title-sm mt-step-3 text-ink">{project.name}</h3>
              <p className="mt-step-2 text-sm leading-relaxed text-ink-mid">
                {project.body}
              </p>
            </div>
            <footer className="border-t-2 border-ink px-step-4 py-step-2">
              {project.href ? (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="figure-tag text-cyan-deep transition-colors duration-150 hover:text-print-cyan"
                >
                  {project.foot}
                </a>
              ) : (
                <span className="figure-tag text-cyan-deep">
                  {project.foot}
                </span>
              )}
            </footer>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 04's foot — freelance as one chip row. Breadth, not depth; the ruled
   client list with per-site copy was cut with the redesign.
   ────────────────────────────────────────────────────────────────────────── */

export function ClientChips() {
  return (
    <Reveal>
      {/* 04.1, not the old 04.7: Figs. 04.4–04.6 were cut and the cards above
          are not figures, so this is § 04's first and only numbered frame.
          Safe to renumber — nothing in the tree points at an 04.x. */}
      <Figure tag="04.1" label="Shipped for clients" tone="board">
        <p className="body-copy text-ink-mid">
          Freelance and client work, shown as a row rather than cards —
          they&rsquo;re breadth, not depth.
        </p>
        <ul className="mt-step-4 flex flex-wrap gap-step-2">
          {clientChips.map((chip) => (
            <li key={chip.name}>
              {chip.href ? (
                <a
                  href={chip.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="readout-sm inline-block border-2 border-ink bg-paper px-step-2 py-[0.15rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
                >
                  {chip.name} ↗
                </a>
              ) : (
                <span className="readout-sm inline-block border-2 border-ink bg-paper px-step-2 py-[0.15rem] text-ink">
                  {chip.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Figure>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 05 PERSONAL PROJECTS — the load-bearing section for craft. Public, solo,
   hand-built, and the only place a reader can read Ze's actual code; that is
   precisely what lets the XOXONA leverage story be told without defensiveness.
   Five cards, and nothing else — the overflow paragraph was cut.
   ────────────────────────────────────────────────────────────────────────── */

const THREAD_CHIP: Record<string, string> = {
  tooling: "bg-marker-yellow text-ink",
  craft: "border-2 border-ink text-ink",
};

const THREAD_LABEL: Record<string, string> = {
  tooling: "Agent tooling",
  craft: "Craft",
};

export function PersonalProjects() {
  const featured = projects.filter((p) => p.featured);
  return (
    <div className="grid gap-step-5 sm:grid-cols-2">
      {featured.map((project, i) => (
        <Reveal key={project.name} delay={i * 60} className="flex">
          <article className="frame flex flex-1 flex-col bg-paper">
            <div className="flex-1 px-step-4 py-step-4">
              <span
                className={`figure-tag inline-block px-step-2 py-[0.2rem] ${THREAD_CHIP[project.thread]}`}
              >
                {THREAD_LABEL[project.thread]}
              </span>
              <h3 className="title-sm mt-step-3 text-ink">{project.name}</h3>
              <p className="mt-step-2 text-sm leading-relaxed text-ink-mid">
                {project.detail}
              </p>
            </div>
            {/* Repo first: § 05 exists so the code can be read, and the
                running deployment is the second reason to click, not the
                first. Wraps rather than truncates — a long host on a narrow
                card takes a second line. */}
            <footer className="flex flex-wrap gap-x-step-4 gap-y-step-1 border-t-2 border-ink px-step-4 py-step-2">
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="figure-tag text-cyan-deep transition-colors duration-150 hover:text-print-cyan"
              >
                github ↗
              </a>
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="figure-tag text-ink-mid transition-colors duration-150 hover:text-print-cyan"
                >
                  {project.liveLabel ?? "live ↗"}
                </a>
              )}
            </footer>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 06 OFF THE CLOCK — four panels. "AI Builder" is deliberately NOT one of
   them; see hobbies.ts. Every panel is draft copy until Ze supplies a line —
   the DRAFT chip renders in development only, and the step-8 checklist greps
   the data file, so a release cannot carry placeholders by accident.
   ────────────────────────────────────────────────────────────────────────── */

export function OffTheClock() {
  return (
    <Reveal>
      {/* Ink ground plus a 2px gap draws the interior rules for free. */}
      <div className="frame grid grid-cols-1 gap-[2px] bg-ink sm:grid-cols-2 lg:grid-cols-4">
        {hobbies.map((hobby) => (
          <div key={hobby.n} className="bg-paper px-step-4 py-step-5">
            <div className="flex items-baseline justify-between gap-step-3">
              <span className="figure-tag text-cyan-deep">{hobby.n}</span>
              {hobby.draft && process.env.NODE_ENV !== "production" && (
                <span className="figure-tag bg-magenta px-step-2 py-[0.2rem] text-paper">
                  Draft
                </span>
              )}
            </div>
            <h3 className="title-sm mt-step-3 text-ink">{hobby.name}</h3>
            <p className="mt-step-3 body-copy text-ink-mid">{hobby.body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
