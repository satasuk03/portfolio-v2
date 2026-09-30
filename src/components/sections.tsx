/*
 * One renderer per home section. Layout only — every word comes from
 * src/content, so the editorial rules (past-tense Radiant, no invented
 * metrics, LinkedIn + GitHub contact, no lead title — see profile.ts) hold by
 * construction. Copy edits go in src/content; this file changes the shape.
 *
 * The card system is the CBRPNK sheet /play's panels use: solid rounded cards
 * in bone, graphite, grey, sage and each section's module spot (nav.ts). Cards
 * are sized by their contents and deliberately NOT a grid of equals — every
 * section mixes a lead card, secondary cards and a small one.
 *
 * Every card is `data-reveal` (lands on entry) and `data-lock` (takes the
 * target-lock frame); the lock label is the card's FIG designation. FIG
 * numbers are stable identifiers: prose and interview notes point at them.
 */

import { Arrow, Barcode, Redacted, StackRow, Tag, spotStyle } from "@/components/hud";
import { education } from "@/content/education";
import { companies } from "@/content/experience";
import { hobbies } from "@/content/hobbies";
import { section } from "@/content/nav";
import { about, homeStats, profile } from "@/content/profile";
import { clientChips, projects, workProjects } from "@/content/projects";
import { skillGroups } from "@/content/skills";

const pad = (n: number) => String(n).padStart(2, "0");

/* ─────────────────────────────────────────────────────────────────────────────
   § 01 ABOUT — the lead card in the section's orange, the three readouts beside
   it, and the epigraph closing the section on bone.
   ────────────────────────────────────────────────────────────────────────── */

export function AboutRecord() {
  const s = section("about");
  const [lead, ...rest] = about.paragraphs;
  return (
    <div className="about">
      <article className="card card-spot about-lead" style={spotStyle(s)} data-reveal data-lock={`FIG 01 · ${s.code}`} data-color={s.color}>
        <div className="card-head">
          <span className="tag tag-ink">Fig. 01</span>
          <span className="hud-label">{s.code}</span>
          <Arrow className="ml-auto" />
        </div>
        <p className="about-lead-copy">{lead}</p>
        {rest.map((p) => (
          <p key={p.slice(0, 24)} className="body-copy mt-step-4 measure">
            {p}
          </p>
        ))}
        <div className="card-foot">
          <span aria-hidden className="numeral">
            {s.n}
          </span>
          <span className="card-foot-meta">
            <Barcode value={profile.name} />
            <span className="hud-label">{profile.location}</span>
          </span>
        </div>
      </article>

      {/* Source order is dt → dd for assistive tech; the numeral is set first
          visually with flex-col-reverse, where it scans. */}
      <dl className="stats">
        {homeStats.map((stat, i) => (
          <div
            key={stat.label}
            className={`card stat ${["card-graphite", "card-sage", "card-grey"][i % 3]} ${i === homeStats.length - 1 && homeStats.length % 2 ? "stat-wide" : ""}`}
            data-reveal
            data-lock={`FIG 01.${i + 1} · READOUT`}
            data-color={s.color}
          >
            <dt className="stat-label">
              <span className="hud-label">{stat.label}</span>
              {/* `homeStats` is `as const`, so only two members carry `note` —
                  narrow, don't index. Never print the years value without its
                  start year (profile.ts). */}
              {"note" in stat && <span className="hud-label stat-note">{stat.note}</span>}
            </dt>
            <dd className="readout">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <blockquote className="card card-bone quote" data-reveal data-lock="FIG 01.4 · EPIGRAPH" data-color={s.color}>
        <span aria-hidden className="quote-mark">
          &ldquo;
        </span>
        <p className="pull-quote">{about.epigraph.text}</p>
        <cite className="hud-label">— {about.epigraph.attribution}</cite>
      </blockquote>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 02 SKILLS — grouped by what it is for, not by logo count. AI & retrieval
   leads, full width, on the section's yellow (yellow is a fill; ink sits on
   it). The rest flow as cards that grow with their item count, so a group of
   four is visibly smaller than a group of eight.
   ────────────────────────────────────────────────────────────────────────── */

export function SkillsLoadout() {
  const s = section("skills");
  let alt = 0;
  return (
    <div className="skills">
      {skillGroups.map((group, i) => {
        const tone = group.lead ? "card-spot" : ["card-graphite", "card-bone"][alt++ % 2];
        return (
          <article
            key={group.key}
            className={`card skill ${tone} ${group.lead ? "skill-lead" : ""}`}
            style={{ ...spotStyle(s), flexGrow: group.items.length }}
            data-reveal
            data-lock={`FIG 02.${i + 1} · ${group.key.toUpperCase()}`}
            data-color={s.color}
          >
            <div className="card-head">
              <span className={`tag ${group.lead ? "tag-ink" : "tag-soft"}`}>02.{i + 1}</span>
              {group.lead && <Tag className="tag-outline">Lead</Tag>}
              <span className="hud-label hud-dim ml-auto">{pad(group.items.length)} items</span>
            </div>
            <h3 className={group.lead ? "title-lg" : "title"}>{group.key}</h3>
            <StackRow items={group.items} className={`chips-pop ${group.lead ? "chips-lg" : ""}`} />
          </article>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 03 EXPERIENCE — one card per company, newest first, roles nested newest
   first with their dates on a left rail. The current company is bone; past
   ones graphite. Education closes the record as one more card in the series,
   on sage, much shorter — sized by its contents, not padded to match.
   ────────────────────────────────────────────────────────────────────────── */

export function ServiceRecord() {
  const s = section("experience");
  return (
    <div className="record">
      {companies.map((company, i) => (
        <article
          key={company.id}
          className={`card company ${company.current ? "card-bone" : "card-graphite"}`}
          style={spotStyle(s)}
          data-reveal
          data-lock={`FIG 03.${i + 1} · ${company.name.toUpperCase()}`}
          data-color={s.color}
        >
          <header className="company-head">
            <div className="card-head">
              <span className="tag tag-spot">Fig. 03.{i + 1}</span>
              {company.current && (
                /* Single-selection by contract — see experience.ts. */
                <span className="tag tag-cyan">Current</span>
              )}
              <span className="hud-label hud-dim ml-auto">{company.when}</span>
            </div>
            <h3 className="company-name">{company.name}</h3>
            <p className="hud-label company-meta">{company.meta}</p>
            <span aria-hidden className="numeral numeral-ghost">
              {pad(i + 1)}
            </span>
          </header>

          <ol className="roles">
            {company.roles.map((role) => (
              <li key={role.title} className="role">
                <span className="role-when readout-sm">{role.when}</span>
                <div>
                  <h4 className="role-title">
                    <Redacted text={role.title} />
                  </h4>
                  <p className="body-copy measure mt-step-3 role-body">{role.body}</p>
                  {role.href && (
                    <a href={role.href} target="_blank" rel="noopener noreferrer" className="pill-link mt-step-4">
                      {role.hrefLabel ?? role.href}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </article>
      ))}

      {/* The tag is derived, not written "03.4": a fourth company must not be
          able to mint a duplicate FIG number. */}
      <article
        className="card card-sage education"
        data-reveal
        data-lock={`FIG 03.${companies.length + 1} · EDUCATION`}
        data-color={s.color}
      >
        <div className="card-head">
          <span className="tag tag-ink">Fig. 03.{companies.length + 1}</span>
          <span className="hud-label ml-auto">{education.when}</span>
        </div>
        <div className="education-grid">
          <div>
            <h3 className="title">{education.institution}</h3>
            <p className="hud-label mt-step-2">{education.meta}</p>
          </div>
          <div>
            <p className="role-title">{education.qualification}</p>
            <p className="body-copy mt-step-2">{education.body}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 04 WORK PROJECTS — three private codebases, short by instruction. The
   products' key art is the plate (never a screenshot of the code). Private
   codebases get a "Private · ask me" foot, not a dead link. Freelance closes
   the section as one row of chips on grey — breadth, not depth.
   ────────────────────────────────────────────────────────────────────────── */

export function Deployments() {
  const s = section("work");
  const tones = ["card-spot", "card-graphite", "card-bone"];
  return (
    <div className="work">
      {workProjects.map((project, i) => (
        <article
          key={project.name}
          className={`card work-card ${tones[i % tones.length]} ${i === 0 ? "work-lead" : ""}`}
          style={spotStyle(s)}
          data-reveal
          data-lock={`FIG 04.${i + 1} · DEPLOYMENT`}
          data-color={s.color}
        >
          {/* One aspect ratio whichever image fills it, so rows never jump as
              covers decode. */}
          <div className="work-cover">
            {project.cover ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={project.cover} alt={project.coverAlt ?? ""} loading="lazy" decoding="async" />
            ) : (
              <span aria-hidden className="work-cover-blank" />
            )}
            <span className={`tag work-chip ${project.live ? "tag-live" : "tag-ink"}`}>{project.chip}</span>
          </div>
          <div className="work-body">
            <div className="card-head">
              <span className="tag tag-soft">04.{i + 1}</span>
              <Arrow className="ml-auto" />
            </div>
            <h3 className="title">
              <Redacted text={project.name} />
            </h3>
            <p className="body-copy mt-step-3">{project.body}</p>
          </div>
          <footer className="card-foot">
            {project.href ? (
              <a href={project.href} target="_blank" rel="noopener noreferrer" className="pill-link">
                {project.foot}
              </a>
            ) : (
              <span className="hud-label">{project.foot}</span>
            )}
            <Barcode value={project.chip + i} />
          </footer>
        </article>
      ))}

      <article className="card card-grey clients" data-reveal data-lock={`FIG 04.${workProjects.length + 1} · CLIENTS`} data-color={s.color}>
        <div className="clients-head">
          <span className="tag tag-ink">Fig. 04.{workProjects.length + 1}</span>
          <h3 className="title">Shipped for clients</h3>
          <p className="body-copy">Freelance and client work, shown as a row rather than cards — they&rsquo;re breadth, not depth.</p>
        </div>
        <ul className="chips chips-links chips-pop">
          {clientChips.map((chip) => (
            <li key={chip.name}>
              {chip.href ? (
                <a href={chip.href} target="_blank" rel="noopener noreferrer">
                  {chip.name} ↗
                </a>
              ) : (
                <span>{chip.name}</span>
              )}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 05 PERSONAL PROJECTS — the load-bearing section for craft: public, solo,
   hand-built, and the only place a reader can read Ze's actual code. Two wide
   cards, then three; repo link first, the running deployment second.
   ────────────────────────────────────────────────────────────────────────── */

const THREAD_LABEL: Record<string, string> = {
  tooling: "Agent tooling",
  craft: "Craft",
};

export function SideOps() {
  const s = section("personal");
  const featured = projects.filter((p) => p.featured);
  const tones = ["card-spot", "card-graphite", "card-bone", "card-graphite", "card-grey"];
  return (
    <div className="side-ops">
      {featured.map((project, i) => (
        <article
          key={project.name}
          className={`card op ${tones[i % tones.length]} ${i < 2 ? "op-wide" : ""}`}
          style={spotStyle(s)}
          data-reveal
          data-lock={`FIG 05.${i + 1} · ${project.name.toUpperCase()}`}
          data-color={s.color}
        >
          {project.cover && (
            <div className="op-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.cover} alt={project.coverAlt ?? ""} width={1600} height={1000} loading="lazy" decoding="async" />
            </div>
          )}
          <div className="card-head">
            <span className={`tag ${project.thread === "tooling" ? "tag-yellow" : "tag-outline"}`}>{THREAD_LABEL[project.thread]}</span>
            <span className="hud-label hud-dim ml-auto">{project.year}</span>
          </div>
          <h3 className="title">
            {project.name}
            {project.nativeName && (
              <span className="native" lang="zh">
                {" "}
                {project.nativeName}
              </span>
            )}
          </h3>
          <p className="op-pitch">{project.pitch}</p>
          <p className="body-copy mt-step-3">{project.detail}</p>
          <StackRow items={project.stack} className="chips-sm" />
          <div className="op-links">
            <a href={project.href} target="_blank" rel="noopener noreferrer" className="pill-link">
              Repository ↗
            </a>
            {project.live && (
              <a href={project.live} target="_blank" rel="noopener noreferrer" className="pill-link pill-link-ghost">
                {project.liveLabel ?? "Live ↗"}
              </a>
            )}
            <span aria-hidden className="numeral numeral-sm ml-auto">
              {pad(i + 1)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   § 06 OFF THE CLOCK — three panels. "AI Builder" is deliberately NOT one of
   them; see hobbies.ts. A panel with a photograph bleeds it off the right edge
   and dissolves it under the copy; one without is a plain card.
   ────────────────────────────────────────────────────────────────────────── */

export function OffDuty() {
  const s = section("off-the-clock");
  const tones = ["card-spot", "card-graphite", "card-graphite"];
  return (
    <div className="off-duty">
      {hobbies.map((hobby, i) => (
        <article
          key={hobby.n}
          className={`card hobby ${tones[i % tones.length]} ${hobby.image ? "hobby-has-image" : ""}`}
          style={spotStyle(s)}
          data-reveal
          data-lock={`FIG 06.${i + 1} · R & R`}
          data-color={s.color}
        >
          {hobby.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={hobby.image}
              alt={hobby.imageAlt ?? ""}
              aria-hidden={hobby.imageAlt ? undefined : true}
              loading="lazy"
              decoding="async"
              className="hobby-plate"
            />
          )}
          {hobby.draft && process.env.NODE_ENV !== "production" && <span className="tag tag-magenta hobby-draft">Draft</span>}
          <div className="hobby-copy">
            <span aria-hidden className="numeral numeral-sm">
              {hobby.n}
            </span>
            <h3 className="title">{hobby.name}</h3>
            <p className="body-copy mt-step-3">{hobby.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
