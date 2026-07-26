"use client";

/*
 * The cabinet, recolored onto paper (REDESIGN-PLAN.md §6). The dark room's
 * neon is gone; the four ink roles are:
 *
 *   ink          the player and the basic attack — the black piece
 *   print-cyan   energy and repair — the player's utility system
 *   cyan-deep    chain lightning (and any cyan that must carry small type)
 *   magenta      the boss and everything dangerous
 *   marker-yellow combo and crits — a fill, never small type
 *
 * Glow was the arcade's entire depth model, and paper has no glow. Emphasis
 * is re-solved with keyline weight, ink fills and cell density: a crit is a
 * heavier frame and a magenta fill, not a brighter one.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOSS,
  PLAYER,
  SKILLS,
  createBattle,
  type BattleHandle,
  type BattleState,
  type Fx,
  type FxTarget,
  type SkillTone,
} from "./engine";
import { createFx } from "./fx";
import { Glyph } from "./glyphs";

/* Neon ink values, kept as hexes for the FX canvas. The tone KEYS come from
   the engine's skill table; the values are the paper palette. */
const INK_HEX = "#111111";
const CYAN_HEX = "#0092b8";
const CYAN_DEEP_HEX = "#006e88";
const MAGENTA_HEX = "#e8195b";
const YELLOW_HEX = "#ffc400";

const TONE: Record<SkillTone, { text: string; border: string; fill: string; hex: string }> = {
  /* Slash — the free, basic attack: the player's own ink. */
  cyan: {
    text: "text-ink",
    border: "border-ink",
    fill: "hover:bg-ink",
    hex: INK_HEX,
  },
  /* Overdrive — the big spend: danger ink, same as the boss. */
  magenta: {
    text: "text-magenta",
    border: "border-magenta",
    fill: "hover:bg-magenta",
    hex: MAGENTA_HEX,
  },
  /* Chain Bolt — lightning: the deep cyan. */
  violet: {
    text: "text-cyan-deep",
    border: "border-cyan-deep",
    fill: "hover:bg-cyan-deep",
    hex: CYAN_DEEP_HEX,
  },
  /* Repair — the utility system: print cyan. */
  green: {
    text: "text-print-cyan",
    border: "border-print-cyan",
    fill: "hover:bg-print-cyan",
    hex: CYAN_HEX,
  },
};

/** A floating damage number, positioned in arena-relative percentages. */
type FloatNumber = Fx & { left: number; top: number };

/** Ambient motes drifting up through the arena — offset, phase and pace.
    Square cells in the three inks: the print equivalent of glowing embers. */
const MOTES = [
  { left: "30%", color: "bg-print-cyan/60", delay: "0s", duration: "7s" },
  { left: "52%", color: "bg-cyan-deep/50", delay: "-2.8s", duration: "8.5s" },
  { left: "70%", color: "bg-magenta/45", delay: "-5s", duration: "6s" },
];

export function BossBattle() {
  const battleRef = useRef<BattleHandle | null>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<ReturnType<typeof createFx> | null>(null);
  /** Set on unmount so a lazy getFx() can never resurrect a disposed layer. */
  const fxDeadRef = useRef(false);
  /** The last skill committed — Chain Bolt's arcs fire per landed hit in onFx. */
  const lastSkillRef = useRef<number | null>(null);

  const [state, setState] = useState<BattleState | null>(null);
  const [numbers, setNumbers] = useState<FloatNumber[]>([]);
  const [impact, setImpact] = useState<{
    target: FxTarget;
    crit: boolean;
    kind: Fx["kind"];
  } | null>(null);
  /** Brief attack thrust for the player craft. */
  const [casting, setCasting] = useState(false);

  /* The null-state placeholder renders no canvas, so the FX layer cannot be
     created at mount — it is created lazily on first use instead. */
  function getFx() {
    if (fxDeadRef.current) return null;
    if (!fxRef.current && canvasRef.current) {
      fxRef.current = createFx(canvasRef.current);
    }
    return fxRef.current;
  }

  function arenaPoint(target: FxTarget) {
    const rect = arenaRef.current?.getBoundingClientRect();
    const w = rect?.width ?? 320;
    const h = rect?.height ?? 190;
    return target === "boss"
      ? { x: w * 0.82, y: h * 0.44 }
      : { x: w * 0.18, y: h * 0.44 };
  }

  useEffect(() => {
    fxDeadRef.current = false;

    const battle = createBattle({
      onChange: () => {
        // A shallow copy per beat is what makes React re-render; the engine
        // keeps mutating one object so its own logic stays readable.
        setState({ ...battle.state, cooldowns: [...battle.state.cooldowns] });
      },
      onFx: (event) => {
        const fx = getFx();
        const point = arenaPoint(event.target);
        const rect = arenaRef.current?.getBoundingClientRect();
        const w = rect?.width ?? 320;
        const h = rect?.height ?? 190;

        setNumbers((current) => [
          ...current,
          {
            ...event,
            left: ((point.x + (Math.random() - 0.5) * 44) / w) * 100,
            top: (point.y / h) * 100,
          },
        ]);

        window.setTimeout(() => {
          setNumbers((current) => current.filter((n) => n.id !== event.id));
        }, 1000);

        const color =
          event.kind === "crit"
            ? YELLOW_HEX
            : event.kind === "heal"
              ? CYAN_HEX
              : event.target === "boss"
                ? INK_HEX
                : MAGENTA_HEX;
        fx?.burst(point.x, point.y, color, event.kind === "crit" ? 34 : 20);

        // A crit gets punctuation beyond sparks.
        if (event.kind === "crit") {
          fx?.ring(point.x, point.y, YELLOW_HEX);
          fx?.flash(YELLOW_HEX, 0.16);
        }

        // Chain Bolt: one crackling arc per landed hit.
        if (event.target === "boss" && lastSkillRef.current === 2) {
          const me = arenaPoint("player");
          fx?.bolt(me.x, me.y, point.x, point.y, TONE.violet.hex);
        }
      },
      onImpact: (target, crit, kind) => {
        setImpact({ target, crit, kind });
        window.setTimeout(() => setImpact(null), 420);
      },
    });

    battleRef.current = battle;
    setState({ ...battle.state, cooldowns: [...battle.state.cooldowns] });

    function onResize() {
      fxRef.current?.resize();
    }
    window.addEventListener("resize", onResize);

    return () => {
      fxDeadRef.current = true;
      window.removeEventListener("resize", onResize);
      battle.dispose();
      fxRef.current?.dispose();
      fxRef.current = null;
    };
  }, []);

  const phase = state?.phase;
  const charging = phase === "enemy";

  /* The boss telegraphs, then returns fire: the engine lands its hit ~650ms
     into the charge, so the bolt leaves early enough to arrive with it. */
  useEffect(() => {
    if (!charging) return;
    const t = window.setTimeout(() => {
      const it = arenaPoint("boss");
      const me = arenaPoint("player");
      getFx()?.shot(it.x, it.y, me.x, me.y, TONE.magenta.hex);
    }, 430);
    return () => window.clearTimeout(t);
  }, [charging]);

  /* The kill and the death get their own punctuation. */
  useEffect(() => {
    const fx = getFx();
    if (!fx) return;
    if (phase === "won") {
      const it = arenaPoint("boss");
      fx.burst(it.x, it.y, YELLOW_HEX, 70);
      fx.ring(it.x, it.y, YELLOW_HEX);
      fx.flash(YELLOW_HEX, 0.22);
    } else if (phase === "lost") {
      const me = arenaPoint("player");
      fx.burst(me.x, me.y, MAGENTA_HEX, 60);
      fx.ring(me.x, me.y, MAGENTA_HEX);
      fx.flash(MAGENTA_HEX, 0.18);
    }
  }, [phase]);

  const use = useCallback((id: number) => {
    const battle = battleRef.current;
    if (!battle?.canUse(id)) return;
    lastSkillRef.current = id;

    const fx = getFx();
    if (fx) {
      const me = arenaPoint("player");
      const it = arenaPoint("boss");

      if (id === 3) {
        // Repair applies synchronously in the engine, so the fill does too.
        fx.rise(me.x, me.y + 12, TONE.green.hex, 16);
        fx.ring(me.x, me.y, TONE.green.hex);
      } else {
        // Attacks land ~200ms after commit; the flourish is timed to the hit.
        setCasting(true);
        window.setTimeout(() => setCasting(false), 320);
        if (id === 0) {
          window.setTimeout(() => fx.slash(it.x, it.y, TONE.cyan.hex), 185);
        } else if (id === 1) {
          fx.ring(me.x, me.y, TONE.magenta.hex); // the charge-up
          window.setTimeout(() => {
            fx.beam(me.x, me.y, it.x, it.y, TONE.magenta.hex);
            fx.flash(TONE.magenta.hex, 0.14);
          }, 185);
        }
        // Chain Bolt's arcs fire in onFx, one per landed hit.
      }
    }

    battle.use(id);
  }, []);

  const reset = useCallback(() => {
    setNumbers([]);
    setImpact(null);
    setCasting(false);
    lastSkillRef.current = null;
    battleRef.current?.reset();
  }, []);

  if (!state) {
    return <div className="frame-inner h-[36rem] bg-board" aria-hidden />;
  }

  const over = state.phase === "won" || state.phase === "lost";
  const bossPct = Math.max(0, (state.bossHp / state.bossHpMax) * 100);
  const hpPct = Math.max(0, (state.hp / state.hpMax) * 100);
  const enPct = Math.max(0, (state.en / state.enMax) * 100);

  return (
    <div className="frame relative bg-paper p-step-4 sm:p-step-5">
      {/* ── boss ─────────────────────────────────────────────────────────── */}
      <div className="flex items-baseline gap-step-3">
        <h2 className="title-sm text-ink">{BOSS.name}</h2>
        <span className="figure-tag bg-magenta px-step-2 py-[0.1rem] text-paper">
          Lv.{BOSS.level}
        </span>
      </div>
      <p className="figure-tag mt-step-1 text-ink-mid">{BOSS.tag}</p>

      <Bar
        pct={bossPct}
        tone="magenta"
        label={`${Math.round(state.bossHp)} / ${state.bossHpMax}`}
        className={`mt-step-3 ${
          bossPct <= 25 && !over
            ? "animate-[enrage-pulse_1.1s_ease-in-out_infinite]"
            : ""
        }`}
        meterClassName="h-6"
      />

      {/* ── arena ────────────────────────────────────────────────────────── */}
      <div
        ref={arenaRef}
        className={`relative mt-step-3 h-[11.5rem] overflow-hidden border-2 border-ink bg-board sm:h-[13rem] ${
          impact
            ? impact.kind === "heal"
              ? ""
              : impact.crit
                ? "animate-[arena-shake-hard_450ms_ease]"
                : "animate-[arena-shake_400ms_ease]"
            : ""
        }`}
      >
        {/* The floor: halftone at figure density. */}
        <div
          aria-hidden
          className="halftone absolute inset-x-0 bottom-0 h-14 border-t-2 border-ink"
        />

        {/* Ambient motes, drifting up between the fighters. */}
        {MOTES.map((m, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              left: m.left,
              animationDelay: m.delay,
              animationDuration: m.duration,
            }}
            className={`pointer-events-none absolute bottom-2 z-[5] size-[3px] animate-[mote-drift_7s_linear_infinite] ${m.color}`}
          />
        ))}

        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />

        {state.combo >= 2 && !over && (
          <div className="pointer-events-none absolute left-1/2 top-step-2 z-30 -translate-x-1/2 text-center">
            <span
              key={state.combo}
              className="readout block animate-[combo-pop_220ms_ease-out] bg-marker-yellow px-step-2 leading-none text-ink"
            >
              ×{state.combo}
            </span>
            <span className="figure-tag text-ink">combo</span>
          </div>
        )}

        <Fighter
          side="player"
          hit={impact?.target === "player" && impact.kind !== "heal"}
          crit={impact?.target === "player" && impact.crit}
          heal={impact?.target === "player" && impact.kind === "heal"}
          casting={casting}
          aura={state.combo >= 3 && !over}
          lowHp={hpPct <= 30 && !over}
        />
        <Fighter
          side="boss"
          hit={impact?.target === "boss"}
          crit={impact?.target === "boss" && impact.crit}
          charging={charging}
        />

        {numbers.map((n) => (
          <span
            key={n.id}
            aria-hidden
            style={{ left: `${n.left}%`, top: `${n.top}%` }}
            className={`pointer-events-none absolute z-30 animate-[dmg-pop_1s_forwards] font-bold ${
              n.kind === "crit"
                ? "bg-magenta px-step-1 text-[2rem] text-paper"
                : n.kind === "heal"
                  ? "text-[1.25rem] text-cyan-deep"
                  : "text-[1.35rem] text-ink"
            }`}
          >
            {n.kind === "heal" ? "+" : ""}
            {n.amount}
            {n.kind === "crit" && (
              <span className="figure-tag block text-center text-paper">
                critical
              </span>
            )}
          </span>
        ))}
      </div>

      {/* ── you ──────────────────────────────────────────────────────────── */}
      <div className="mt-step-4 flex items-center gap-step-3">
        <div className="flex size-10 shrink-0 items-center justify-center border-2 border-ink bg-board text-ink">
          <Glyph name="craft" className="size-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-step-2">
          <Bar
            pct={hpPct}
            tone="green"
            label={`HP ${Math.round(state.hp)} / ${state.hpMax}`}
            meterClassName="h-[1.15rem]"
          />
          <Bar
            pct={enPct}
            tone="cyan"
            label={`EN ${Math.round(state.en)} / ${state.enMax}`}
            meterClassName="h-[1.15rem]"
          />
        </div>
      </div>

      {/* ── skills ───────────────────────────────────────────────────────── */}
      <div className="mt-step-4 grid grid-cols-2 gap-step-3 sm:grid-cols-4">
        {SKILLS.map((skill) => {
          const tone = TONE[skill.tone];
          const cd = state.cooldowns[skill.id] ?? 0;
          const tooPoor = state.en < skill.cost;
          /* Derived from the rendered snapshot rather than the live engine, so
             what the button looks like always matches the frame it is drawn in. */
          const enabled =
            state.phase === "player" && !state.busy && !tooPoor && cd <= 0;

          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => use(skill.id)}
              disabled={!enabled}
              title={skill.blurb}
              className={`group relative overflow-hidden border-2 px-step-2 py-step-3 text-center transition-transform duration-150 ${tone.border} ${
                enabled
                  ? `bg-paper hover:-translate-y-[3px] active:translate-y-0 active:scale-95 ${tone.fill}`
                  : "cursor-not-allowed border-halftone bg-board opacity-45"
              }`}
            >
              <Glyph
                name={skill.glyph}
                className={`mx-auto size-6 transition-colors duration-150 ${
                  enabled
                    ? `${tone.text} group-hover:text-paper`
                    : "text-ink-mid"
                }`}
              />
              <span
                className={`figure-tag mt-step-2 block ${
                  enabled
                    ? "text-ink group-hover:text-paper"
                    : "text-ink-mid"
                }`}
              >
                {skill.name}
              </span>
              <span
                className={`figure-tag mt-[0.15rem] block ${
                  tooPoor
                    ? "text-magenta"
                    : `text-cyan-deep ${enabled ? "group-hover:text-paper" : ""}`
                }`}
              >
                {skill.cost > 0 ? `${skill.cost} EN` : "FREE"}
              </span>

              {cd > 0 && (
                <span className="absolute inset-0 z-10 flex items-center justify-center bg-paper/90 text-[1.6rem] font-bold text-ink">
                  {cd}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── log ──────────────────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        className="mt-step-4 min-h-[3.25rem] border-2 border-ink bg-board px-step-3 py-step-2"
      >
        {!over && (
          <span className="figure-tag flex items-center gap-step-2 text-ink">
            <span
              aria-hidden
              className={`size-[6px] animate-pulse ${
                state.phase === "player" ? "bg-print-cyan" : "bg-magenta"
              }`}
            />
            {state.phase === "player" ? "Your turn" : `${BOSS.name} turn`}
            <span className="text-ink-mid">· turn {state.turn}</span>
          </span>
        )}
        <p className="mt-step-1 text-sm text-ink-mid">{state.log}</p>
      </div>

      {/* ── outcome ──────────────────────────────────────────────────────── */}
      {over && (
        <div className="absolute inset-0 z-40 flex animate-[outcome-in_450ms_ease_both] flex-col items-center justify-center gap-step-4 bg-paper/95 px-step-5 text-center">
          <p
            className={`display px-step-4 ${
              state.phase === "won"
                ? "bg-marker-yellow text-ink"
                : "bg-magenta text-paper"
            }`}
          >
            {state.phase === "won" ? "Victory" : "Defeated"}
          </p>
          <p className="max-w-[36ch] text-sm text-ink-mid">{state.log}</p>
          <button
            type="button"
            onClick={reset}
            className="caption border-2 border-ink bg-ink px-step-6 py-step-3 text-paper transition-colors duration-150 hover:bg-print-cyan"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

function Bar({
  pct,
  tone,
  label,
  className = "",
  meterClassName = "",
}: {
  pct: number;
  /** Keys are historical (the neon roles); fills are the paper palette. */
  tone: "magenta" | "green" | "cyan";
  label: string;
  className?: string;
  meterClassName?: string;
}) {
  const fill = {
    magenta: "bg-magenta",
    green: "bg-ink",
    cyan: "bg-print-cyan",
  }[tone];

  return (
    <div className={className}>
      {/* The readout lives outside the meter — on paper, a label over a fill
          is a contrast problem, so it never sits on one. */}
      <span className="figure-tag block text-right text-ink-mid">{label}</span>
      <div
        className={`relative mt-step-1 overflow-hidden border-2 border-ink bg-paper ${meterClassName}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* The trailing ghost lags the fill, so a big hit reads as a big hit. */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 bg-halftone transition-[width] delay-150 duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div
          aria-hidden
          className={`absolute inset-y-0 left-0 transition-[width] duration-300 ease-out ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Fighter({
  side,
  hit,
  crit,
  heal,
  charging,
  casting,
  aura,
  lowHp,
}: {
  side: "player" | "boss";
  hit?: boolean;
  crit?: boolean;
  heal?: boolean;
  charging?: boolean;
  casting?: boolean;
  aura?: boolean;
  lowHp?: boolean;
}) {
  const isBoss = side === "boss";

  return (
    <div
      className={`absolute bottom-7 z-10 text-center ${
        isBoss ? "right-[16%] translate-x-1/2" : "left-[16%] -translate-x-1/2"
      }`}
    >
      {aura && (
        <div
          aria-hidden
          className="absolute inset-x-[-0.75rem] bottom-6 top-0 animate-[combo-aura_1.1s_ease-in-out_infinite] border-[3px] border-marker-yellow"
        />
      )}
      {/* Recoil, thrust and hover are nested so their transforms never fight. */}
      <div
        className={
          hit
            ? isBoss
              ? "animate-[fighter-hit-r_320ms_ease]"
              : "animate-[fighter-hit-l_320ms_ease]"
            : ""
        }
      >
        <div className={casting ? "animate-[fighter-lunge-r_280ms_ease]" : ""}>
          <div className="animate-[fighter-bob_2.8s_ease-in-out_infinite]">
            <div
              className={`flex items-center justify-center transition-colors duration-200 ${
                isBoss
                  /* The boss plate: heavier keyline than the player's — the
                     bigger piece carries the thicker rule. */
                  ? "border-[3px] border-magenta bg-magenta/10 text-magenta"
                  : "border-2 border-ink bg-board text-ink"
              } ${isBoss ? "size-[5.5rem]" : "size-[4.25rem]"} ${
                /* A hit inverts the plate: filled field, knocked-out glyph. */
                hit ? (isBoss ? "bg-magenta text-paper" : "bg-ink text-paper") : ""
              } ${crit ? "border-[4px]" : ""} ${
                heal ? "border-print-cyan bg-print-cyan/15" : ""
              } ${charging ? "animate-[boss-charge_520ms_ease-in-out_infinite] bg-magenta/25" : ""} ${
                lowHp
                  ? "animate-[low-hp_900ms_ease-in-out_infinite] border-magenta"
                  : ""
              }`}
            >
              <Glyph
                name={isBoss ? "guardian" : "craft"}
                className={isBoss ? "size-14" : "size-9"}
              />
            </div>
          </div>
        </div>
      </div>
      <span className="figure-tag mt-step-2 block text-ink-mid">
        {isBoss ? BOSS.name : "You"}
      </span>
    </div>
  );
}
