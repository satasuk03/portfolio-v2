/*
 * DIRECTION CONTRACT — arcade (/arcade)
 *
 * THESIS: The one dark room, and it pays for the inversion with a metaphor —
 *   the whole site is printed paper, and an arcade is the place you walked into
 *   out of daylight. It refuses the portfolio easter-egg-as-humblebrag: the page
 *   states outright that it is not a metaphor for anything.
 * OWN-WORLD: Void #0A0812 with neon cyan, magenta, gold and green. Glow, bloom
 *   and saturation are permitted here and nowhere else on the site — a CRT emits
 *   light and paper does not. Same hues as the manual, second calibration.
 * STORY: This person builds things for fun, finishes them, and knows the
 *   difference between a toy and a case study.
 * FIRST VIEWPORT: The cabinet. Boss name and health, the arena, your bars, four
 *   skills — playable without scrolling on a laptop.
 * FORM: Arcade cabinet. Experience mode: the artifact leads, chrome recedes to a
 *   single way back to the manual.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { BossBattle } from "@/components/arcade/battle";

export const metadata: Metadata = {
  title: "Arcade — Satasuk Viparksinlapin",
  description:
    "A turn-based boss battle against NEXUS-9. Built for fun; not a metaphor for anything.",
};

export default function Arcade() {
  return (
    <div className="min-h-dvh bg-arcade-void text-arcade-text">
      {/* The grid, faded from the top — the cabinet's backglass. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(90,140,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(90,140,255,0.07)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(120%_90%_at_50%_0%,#000_40%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 [background:radial-gradient(1000px_600px_at_15%_-10%,rgba(55,230,255,0.10),transparent_60%),radial-gradient(900px_600px_at_90%_110%,rgba(255,46,107,0.12),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-[40rem] px-step-4 py-step-6 sm:px-step-5">
        <header className="mb-step-5">
          <Link
            href="/"
            className="caption inline-flex items-center gap-step-2 text-arcade-dim transition-colors duration-150 hover:text-arcade-cyan"
          >
            <span aria-hidden>←</span> Back to the manual
          </Link>

          <h1 className="display mt-step-5 text-arcade-text">Nexus-9</h1>
          <p className="mt-step-3 max-w-[44ch] text-sm leading-relaxed text-arcade-dim">
            A turn-based boss battle. It is here because it is fun to build and
            fun to play — it is not a metaphor for on-call, or shipping, or
            anything else. The rest of the site does that job.
          </p>
        </header>

        <BossBattle />

        <section className="mt-step-6 border-t border-arcade-cyan/20 pt-step-5">
          <h2 className="figure-tag text-arcade-cyan">How it works</h2>
          <ul className="mt-step-3 flex flex-col gap-step-2 text-sm text-arcade-dim">
            <li>
              <span className="text-arcade-text">Slash</span> is free, so you can
              always act. Everything else costs energy, and you regain{" "}
              <span className="mono text-arcade-cyan">15 EN</span> at the start of
              each of your turns.
            </li>
            <li>
              Every hit that lands builds a{" "}
              <span className="text-arcade-gold">combo</span>, worth{" "}
              <span className="mono text-arcade-gold">+8%</span> damage per stack.
              Healing resets it to zero — that is the actual decision in the
              fight.
            </li>
            <li>
              <span className="text-arcade-text">Chain Bolt</span> lands three
              times, so it builds three stacks of combo for one turn.
            </li>
            <li>
              NEXUS-9 crits about{" "}
              <span className="mono text-arcade-magenta">18%</span> of the time
              and can knock a stack loose when it connects.
            </li>
          </ul>
        </section>

        <footer className="mt-step-7 border-t border-arcade-cyan/20 pt-step-5">
          <Link
            href="/"
            className="caption inline-flex items-center gap-step-2 border-2 border-arcade-cyan px-step-5 py-step-3 text-arcade-cyan transition-colors duration-150 hover:bg-arcade-cyan hover:text-arcade-void"
          >
            <span aria-hidden>←</span> Out into the daylight
          </Link>
        </footer>
      </div>
    </div>
  );
}
