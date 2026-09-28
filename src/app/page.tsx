/*
 * DIRECTION CONTRACT — home (/)
 *
 * THESIS: The reading edition of the hangar /play is set in. An engineer's
 *   record laid out as a field unit's HUD over a live survey map: the page a
 *   recruiter skims in thirty seconds, with the machine's furniture around it
 *   rather than in its way. Refuses the portfolio hero-plus-equal-card-grid:
 *   cards are sized by their contents, and every section mixes a lead card,
 *   secondaries and a small one.
 * OWN-WORLD: Hangar black #040507, blue topographic contours, bone #ece6d6 and
 *   graphite #1b1d22 stock, one module spot per section (nav.ts). CBRPNK
 *   rounded cards in solid colour with huge grotesk numerals, ↗, barcodes and
 *   mono specs; cream enamel plates weathered with /play's rust generator for
 *   the hard-surface pieces. Kanit 900 display, Archivo prose, Azeret Mono on
 *   every HUD label and numeral. No glow on /; glow is /play's.
 * STORY: Six sections in a fixed order — About, Skills, Experience, Work
 *   projects, Personal projects, Off the clock — then the uplink. § numbers are
 *   real: 01…06 encodes reading order. One prominent way into /play.
 * FIRST VIEWPORT: SATASUK as a giant vertical masthead down the left edge
 *   (horizontal across the top on phones) over the live contour field; the
 *   role as the h1, the standfirst, then LinkedIn / GitHub / Instagram. Right
 *   column: the ID-card photo in the About orange and the play cartridge.
 *   HUD corners, BKK timecode, coordinates and the blue status tag frame it.
 * FORM: Brief-pinned by Ze (match /play's hard sci-fi world, reading first), so
 *   the direction roll was not run. Staging: native scroll, nothing gated,
 *   every effect additive over complete server HTML.
 */

import { ActionLinks, Colophon, PlayCartridge, UplinkCards } from "@/components/actions";
import { Clock } from "@/components/hangar/clock";
import { HangarFx } from "@/components/hangar/fx";
import { TopoCanvas } from "@/components/hangar/topo-canvas";
import { WearPlates } from "@/components/hangar/wear";
import { HeroPlate } from "@/components/hero-plate";
import { Corners, Hatch, SectionOpener } from "@/components/hud";
import { SectionNav } from "@/components/nav/section-nav";
import { AboutRecord, Deployments, OffDuty, ServiceRecord, SideOps, SkillsLoadout } from "@/components/sections";
import { hudCopy } from "@/content/hud";
import { section, sections } from "@/content/nav";
import { closer, hero, home, profile } from "@/content/profile";

export default function Home() {
  return (
    <>
      <SectionNav />

      <main>
        <Hero />

        <Bay id="about">
          <AboutRecord />
        </Bay>
        <Bay id="skills">
          <SkillsLoadout />
        </Bay>
        <Bay id="experience">
          <ServiceRecord />
        </Bay>
        <Bay id="work">
          <Deployments />
        </Bay>
        <Bay id="personal">
          <SideOps />
        </Bay>
        <Bay id="off-the-clock">
          <OffDuty />
        </Bay>

        <Uplink />
      </main>

      <Colophon />

      {/* Client layers, all additive: the motion controller (reveals, decode,
          lock, sparks, motes) and the enamel generator for the plates. */}
      <HangarFx />
      <WearPlates />
    </>
  );
}

/**
 * One section bay: the HUD opener, then the section's cards, on the shared
 * rhythm. The divider above each bay is a survey strip, not a blank gap.
 */
function Bay({ id, children }: { id: (typeof sections)[number]["id"]; children: React.ReactNode }) {
  const s = section(id);
  return (
    <section className="bay" aria-labelledby={`${id}-title`}>
      <div className="bay-in">
        <SectionOpener section={s} />
        {children}
      </div>
    </section>
  );
}

/**
 * The first viewport. The topo canvas sits behind everything and takes no
 * events; the hero element forwards the pointer to it (the reticle and the
 * ripple). The masthead is decorative and aria-hidden — the h1 opens with the
 * full name for assistive tech and search, then the role.
 */
function Hero() {
  return (
    <section className="hero" data-field data-color="#1fc3ec" aria-labelledby="hero-title">
      <TopoCanvas />
      <Corners className="hero-corners" />

      <div className="hero-grid">
        <div className="masthead-rail" aria-hidden>
          <span className="rail-bracket">
            <i />
          </span>
          <Hatch />
          <span className="masthead" data-decode>
            {hero.word}
          </span>
          <Hatch />
          <span className="tag tag-inv masthead-unit">{hudCopy.unit}</span>
        </div>

        <div className="hero-main">
          <p className="hero-meta hud-label">
            <span>{profile.location}</span>
            <span className="hud-dim">UTC+7</span>
            <span>
              <span className="hud-dim">{hudCopy.zone}</span> <Clock />
            </span>
          </p>
          <h1 id="hero-title" className="hero-h1">
            <span className="sr-only">{hero.spoken} </span>
            {profile.role}
          </h1>
          <p className="standfirst measure">{home.standfirst}</p>
          <ActionLinks className="mt-step-6" />
        </div>

        <div className="hero-side">
          <HeroPlate />
          <PlayCartridge />
        </div>
      </div>

      <div className="hero-foot">
        <span className="status-tag">
          <span aria-hidden className="status-dot" />
          {hudCopy.status}
        </span>
        <span className="hud-label hud-dim hero-coords">{hudCopy.coords}</span>
        <a href="#about" className="scroll-cue hud-label">
          <span aria-hidden className="tri tri-down" />
          {hudCopy.scrollCue} · § 01 {sections[0].label}
        </a>
      </div>
    </section>
  );
}

/**
 * The closer, as the uplink console: a weathered enamel plate carrying the
 * invitation on its dark screen, then the three links as CBRPNK cards and the
 * play cartridge once more for anyone who read to the end.
 */
function Uplink() {
  return (
    <section className="bay uplink" aria-labelledby="uplink-title">
      <div className="bay-in">
        <div className="plate console" data-reveal>
          <span aria-hidden className="screw s1" />
          <span aria-hidden className="screw s2" />
          <span aria-hidden className="screw s3" />
          <span aria-hidden className="screw s4" />
          <div className="console-screen">
            <div className="opener-row">
              <span className="tag tag-bone">§ 07</span>
              <span className="hud-label">UPLINK</span>
              <span aria-hidden className="opener-scale" />
            </div>
            <h2 id="uplink-title" className="display mt-step-4" data-decode>
              {closer.title}
            </h2>
            <p className="lede measure mt-step-4">{closer.body}</p>
          </div>
          <div className="console-side" aria-hidden>
            <Hatch className="hatch-ink" />
            <span className="console-grille">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
            <span className="hud-label">TX · RX</span>
          </div>
        </div>
        <UplinkCards />
        <PlayCartridge compact className="mt-step-5" />
      </div>
    </section>
  );
}
