/*
 * The panel bodies — one renderer per cartridge, all data from src/content.
 * Layout only: no copy is authored here beyond furniture labels, so the
 * editorial rules (past-tense Radiant, no invented metrics, contact via
 * LinkedIn + GitHub) hold by construction.
 *
 * Every direct child card carries `data-card` — the panel's GSAP timeline
 * staggers them in. Cards alternate stock the way the reference sheet does:
 * the module colour, bone, graphite, sage, grey.
 */

import { glyphs } from "@/components/actions";
import { education } from "@/content/education";
import { companies } from "@/content/experience";
import { hobbies } from "@/content/hobbies";
import { about, closer, heroPlate, home, homeStats, profile } from "@/content/profile";
import { clientChips, projects, workProjects } from "@/content/projects";
import { skillGroups } from "@/content/skills";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="pp-arrow">
      <path d="M5 5h14v14h-3.2V10.5L6.3 20 4 17.7l9.5-9.5H5z" fill="currentColor" />
    </svg>
  );
}

function Ext({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`pp-link ${className}`}>
      {children}
    </a>
  );
}

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="pp-glyph">
      <path d={d} />
    </svg>
  );
}

function Tag({ children, tone = "" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`pp-tag ${tone}`}>{children}</span>;
}

// ── 01 · operator ───────────────────────────────────────────────────────────

function About() {
  return (
    <>
      <div data-card className="pp-card pp-photo">
        <img src={heroPlate.src} alt={heroPlate.alt} />
        <div className="pp-photo-meta">
          <span className="pp-mono">FIG. 00 — {heroPlate.label}</span>
          <span className="pp-vert" aria-hidden>
            กรุงเทพฯ
          </span>
        </div>
      </div>
      <div data-card className="pp-card pp-bone">
        <p className="pp-lead">{home.standfirst}</p>
      </div>
      <div data-card className="pp-grid3">
        {homeStats.map((s, i) => (
          <div key={s.label} className={`pp-card pp-stat ${["pp-graphite", "pp-sage", "pp-grey"][i]}`}>
            <span className="pp-stat-v">{s.value}</span>
            <span className="pp-mono">{s.label}</span>
            {"note" in s && s.note ? <span className="pp-mono pp-dim">{s.note}</span> : null}
          </div>
        ))}
      </div>
      <div data-card className="pp-card pp-graphite">
        {about.paragraphs.map((p) => (
          <p key={p.slice(0, 24)} className="pp-body">
            {p}
          </p>
        ))}
      </div>
      <div data-card className="pp-card pp-grey">
        <p className="pp-quote">“{about.epigraph.text}”</p>
        <p className="pp-mono pp-dim">— {about.epigraph.attribution}</p>
      </div>
      <div data-card className="pp-card pp-bone pp-slip">
        <div>
          <span className="pp-mono pp-dim">Role</span>
          <span>{profile.role}</span>
        </div>
        <div>
          <span className="pp-mono pp-dim">Based</span>
          <span>{profile.location}</span>
        </div>
        <div>
          <span className="pp-mono pp-dim">Available</span>
          <span>{profile.availability}</span>
        </div>
      </div>
    </>
  );
}

// ── 02 · loadout ────────────────────────────────────────────────────────────

function Skills() {
  return (
    <>
      {skillGroups.map((g, i) => (
        <div key={g.key} data-card className={`pp-card ${g.lead ? "pp-yellow" : i % 2 ? "pp-graphite" : "pp-bone"}`}>
          <div className="pp-row">
            <h3 className="pp-h3">{g.key}</h3>
            <span className="pp-mono pp-dim">
              {String(i + 1).padStart(2, "0")} / {String(skillGroups.length).padStart(2, "0")}
            </span>
          </div>
          {g.lead ? <Tag tone="pp-tag-ink">Lead</Tag> : null}
          <ul className="pp-chips">
            {g.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

// ── 03 · service record ─────────────────────────────────────────────────────

function Experience() {
  return (
    <>
      {companies.map((c) => (
        <div key={c.id} data-card className={`pp-card ${c.current ? "pp-bone" : "pp-graphite"}`}>
          <div className="pp-row">
            <h3 className="pp-h2">{c.name}</h3>
            {c.current ? <Tag tone="pp-tag-cyan">Current</Tag> : null}
          </div>
          <p className="pp-mono pp-dim">
            {c.meta} · {c.when}
          </p>
          <ol className="pp-roles">
            {c.roles.map((r) => (
              <li key={r.title}>
                <div className="pp-role-head">
                  <span className="pp-role-t">{r.title}</span>
                  <span className="pp-mono pp-dim">{r.when}</span>
                </div>
                <p className="pp-body">{r.body}</p>
                {r.href ? <Ext href={r.href}>{r.hrefLabel ?? r.href}</Ext> : null}
              </li>
            ))}
          </ol>
        </div>
      ))}
      <div data-card className="pp-card pp-sage">
        <div className="pp-row">
          <h3 className="pp-h3">{education.institution}</h3>
          <span className="pp-mono">{education.when}</span>
        </div>
        <p className="pp-mono pp-dim">{education.meta}</p>
        <p className="pp-role-t">{education.qualification}</p>
        <p className="pp-body">{education.body}</p>
      </div>
    </>
  );
}

// ── 04 · deployments ────────────────────────────────────────────────────────

function Work() {
  return (
    <>
      {workProjects.map((w, i) => (
        <div key={w.name} data-card className={`pp-card pp-cover-card ${i % 2 ? "pp-graphite" : "pp-bone"}`}>
          {w.cover ? (
            <div className="pp-cover">
              <img src={w.cover} alt={w.coverAlt ?? ""} loading="lazy" />
            </div>
          ) : null}
          <div className="pp-row">
            <h3 className="pp-h2">{w.name}</h3>
            <Tag tone={w.live ? "pp-tag-cyan" : ""}>{w.chip}</Tag>
          </div>
          <p className="pp-body">{w.body}</p>
          <p className="pp-mono pp-dim">{w.foot}</p>
        </div>
      ))}
      <div data-card className="pp-card pp-grey">
        <h3 className="pp-h3">Shipped for clients</h3>
        <ul className="pp-chips pp-chips-link">
          {clientChips.map((c) => (
            <li key={c.name}>{c.href ? <Ext href={c.href}>{c.name} ↗</Ext> : c.name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

// ── 05 · side ops ───────────────────────────────────────────────────────────

function Personal() {
  const featured = projects.filter((p) => p.featured);
  return (
    <>
      {featured.map((p, i) => (
        <div key={p.name} data-card className={`pp-card ${["pp-bone", "pp-graphite", "pp-sage", "pp-graphite", "pp-grey"][i % 5]}`}>
          <div className="pp-row">
            <h3 className="pp-h3">
              {p.name}
              {p.nativeName ? <span className="pp-native"> {p.nativeName}</span> : null}
            </h3>
            <span className="pp-mono pp-dim">{p.year}</span>
          </div>
          <p className="pp-role-t">{p.pitch}</p>
          <p className="pp-body">{p.detail}</p>
          <ul className="pp-chips pp-chips-sm">
            {p.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="pp-links">
            <Ext href={p.href}>Repository ↗</Ext>
            {p.live ? <Ext href={p.live}>{p.liveLabel ?? "Live ↗"}</Ext> : null}
          </div>
        </div>
      ))}
    </>
  );
}

// ── 06 · r & r ──────────────────────────────────────────────────────────────

function OffTheClock() {
  return (
    <>
      {hobbies.map((h, i) => (
        <div key={h.name} data-card className={`pp-card pp-hobby ${["pp-graphite", "pp-bone", "pp-sage"][i % 3]}`}>
          {h.image ? <img className="pp-hobby-img" src={h.image} alt={h.imageAlt ?? ""} loading="lazy" /> : null}
          <div className="pp-hobby-copy">
            <span className="pp-stat-v pp-stat-sm">{h.n}</span>
            <h3 className="pp-h3">{h.name}</h3>
            <p className="pp-body">{h.body}</p>
          </div>
        </div>
      ))}
    </>
  );
}

// ── 07 · uplink ─────────────────────────────────────────────────────────────

function Uplink() {
  return (
    <>
      <div data-card className="pp-card pp-graphite">
        <h3 className="pp-h2">{closer.title}</h3>
        <p className="pp-body">{closer.body}</p>
      </div>
      <a data-card className="pp-card pp-cta pp-cyan" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
        <Glyph d={glyphs.linkedin} />
        <span className="pp-cta-t">LinkedIn</span>
        <span className="pp-mono">Message me</span>
        <Arrow />
      </a>
      <a data-card className="pp-card pp-cta pp-bone" href={profile.links.github} target="_blank" rel="noopener noreferrer">
        <Glyph d={glyphs.github} />
        <span className="pp-cta-t">GitHub</span>
        <span className="pp-mono">Read the code</span>
        <Arrow />
      </a>
      <a data-card className="pp-card pp-cta pp-grey pp-cta-sm" href={profile.links.instagram} target="_blank" rel="noopener noreferrer">
        <Glyph d={glyphs.instagram} />
        <span className="pp-cta-t">Instagram</span>
        <span className="pp-mono">Landscape photography</span>
        <Arrow />
      </a>
    </>
  );
}

export const panelBodies: Record<string, () => React.ReactElement> = {
  about: About,
  skills: Skills,
  experience: Experience,
  work: Work,
  personal: Personal,
  "off-the-clock": OffTheClock,
  uplink: Uplink,
};

export { Arrow };
