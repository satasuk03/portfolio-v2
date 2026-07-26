import { Figure, StackRow } from "@/components/manual";
import { Reveal } from "@/components/reveal";
import { WaveCanvas } from "@/components/wave/wave-field";
import { companies } from "@/content/experience";
import { hobbies } from "@/content/hobbies";
import { about } from "@/content/profile";
import {
  clientChips,
  personalOverflow,
  projects,
  workProjects,
} from "@/content/projects";
import { retrievalSystems } from "@/content/retrieval";
import { skillGroups } from "@/content/skills";

/* ─────────────────────────────────────────────────────────────────────────────
   § 01 ABOUT — one figure, four short paragraphs. First person, no adjective
   stacking; the through-line is the same judgment applied further up each time.
   ────────────────────────────────────────────────────────────────────────── */

export function AboutFigure() {
  return (
    <Reveal>
      <Figure tag="01" label="The operator">
        <div className="measure flex flex-col gap-step-4">
          {about.paragraphs.map((para, i) => (
            <p
              key={para.slice(0, 24)}
              className={i === 0 ? "title-sm text-ink" : "body-copy text-ink-mid"}
            >
              {para}
            </p>
          ))}
        </div>
      </Figure>
    </Reveal>
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
            <div className="h-[6.5rem] shrink-0 overflow-hidden border-b-[3px] border-ink">
              <WaveCanvas
                still
                seed={project.seed}
                cell={6}
                gamma={2.0}
                className="block h-full w-full"
              />
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
   THE RETRIEVAL WORK, IN DETAIL — the depth under two of the three cards
   above, and the site's strongest technical material. Rehomed out of the
   deleted sticky chapter into § 04 (REDESIGN-PLAN.md §3).
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
   § 04's foot — freelance as one chip row. Breadth, not depth; the ruled
   client list with per-site copy was cut with the redesign.
   ────────────────────────────────────────────────────────────────────────── */

export function ClientChips() {
  return (
    <Reveal>
      <Figure tag="04.7" label="Shipped for clients" tone="board">
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
   Four cards, then the overflow as one paragraph.
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
    <div>
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
              <footer className="border-t-2 border-ink px-step-4 py-step-2">
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="figure-tag text-cyan-deep transition-colors duration-150 hover:text-print-cyan"
                >
                  github ↗
                </a>
              </footer>
            </article>
          </Reveal>
        ))}
      </div>

      <p className="measure mt-step-6 body-copy text-ink-mid">
        Also public:{" "}
        {personalOverflow.map((item, i) => (
          <span key={item.name}>
            {i > 0 && ", "}
            <strong className="font-semibold text-ink">{item.name}</strong>
            {item.note && <> ({item.note})</>}
          </span>
        ))}
        .
      </p>
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
