/*
 * DIRECTION CONTRACT — arcade (/arcade)
 *
 * THESIS: The cabinet, printed on the same paper as everything else. It
 *   refuses the portfolio easter-egg-as-humblebrag: the page states outright
 *   that it is not a metaphor for anything.
 * OWN-WORLD: The manual's own palette, one calibration — paper, ink, the
 *   three spot inks. The dark room and its neon are retired (REDESIGN-PLAN.md
 *   §6): glow was the arcade's depth model, and paper has no glow, so combat
 *   emphasis is re-solved with keyline weight, ink fills and cell density.
 * STORY: This person builds things for fun, finishes them, and knows the
 *   difference between a toy and a case study.
 * FIRST VIEWPORT: The cabinet. Boss name and health, the arena, your bars, four
 *   skills — playable without scrolling on a laptop.
 * FORM: Arcade cabinet as a manual figure. Experience mode: the artifact
 *   leads, chrome recedes to a single way back to the manual.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { BossBattle } from "@/components/arcade/battle";
import { Marker } from "@/components/manual";
import { WaveRamp } from "@/components/wave/wave-field";

export const metadata: Metadata = {
  title: "Arcade — Satasuk Viparksinlapin",
  description:
    "A turn-based boss battle against NEXUS-9. Built for fun; not a metaphor for anything.",
};

export default function Arcade() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      {/* Graph paper, faded from the top — the cabinet's backglass. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(17,17,17,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.06)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(120%_90%_at_50%_0%,#000_40%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-[40rem] px-step-4 py-step-6 sm:px-step-5">
        <header className="mb-step-5">
          <Link
            href="/"
            className="caption inline-flex items-center gap-step-2 text-ink-mid transition-colors duration-150 hover:text-cyan-deep"
          >
            <span aria-hidden>←</span> Back to the manual
          </Link>

          <h1 className="display mt-step-5 text-ink">Nexus-9</h1>
          <p className="mt-step-3 max-w-[44ch] text-sm leading-relaxed text-ink-mid">
            A turn-based boss battle. It is here because it is fun to build and
            fun to play — it is not a metaphor for on-call, or shipping, or
            anything else. The rest of the site does that job.
          </p>
        </header>

        {/* The arcade keeps the palette and gains the wave (§6). */}
        <div className="mb-step-5">
          <WaveRamp seed={71} />
        </div>

        <BossBattle />

        <section className="mt-step-6 border-t-2 border-ink pt-step-5">
          <h2 className="figure-tag text-cyan-deep">How it works</h2>
          <ul className="mt-step-3 flex flex-col gap-step-2 text-sm text-ink-mid">
            <li>
              <span className="text-ink">Slash</span> is free, so you can
              always act. Everything else costs energy, and you regain{" "}
              <span className="mono text-cyan-deep">15 EN</span> at the start
              of each of your turns.
            </li>
            <li>
              Every hit that lands builds a <Marker>combo</Marker>, worth{" "}
              <Marker>+8%</Marker> damage per stack. Healing resets it to zero
              — that is the actual decision in the fight.
            </li>
            <li>
              <span className="text-ink">Chain Bolt</span> lands three times,
              so it builds three stacks of combo for one turn.
            </li>
            <li>
              NEXUS-9 crits about{" "}
              <span className="mono bg-magenta px-[0.15em] text-paper">
                18%
              </span>{" "}
              of the time and can knock a stack loose when it connects.
            </li>
          </ul>
        </section>

        <footer className="mt-step-7 border-t-2 border-ink pt-step-5">
          <Link
            href="/"
            className="caption inline-flex items-center gap-step-2 border-2 border-ink px-step-5 py-step-3 text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
          >
            <span aria-hidden>←</span> Back to the manual
          </Link>
        </footer>
      </div>
    </div>
  );
}
