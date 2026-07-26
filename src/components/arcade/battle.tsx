"use client";

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

const TONE: Record<SkillTone, { text: string; border: string; fill: string; hex: string }> = {
  cyan: {
    text: "text-arcade-cyan",
    border: "border-arcade-cyan",
    fill: "bg-arcade-cyan",
    hex: "#37e6ff",
  },
  magenta: {
    text: "text-arcade-magenta",
    border: "border-arcade-magenta",
    fill: "bg-arcade-magenta",
    hex: "#ff2e6b",
  },
  violet: {
    text: "text-arcade-violet",
    border: "border-arcade-violet",
    fill: "bg-arcade-violet",
    hex: "#a855f7",
  },
  green: {
    text: "text-arcade-green",
    border: "border-arcade-green",
    fill: "bg-arcade-green",
    hex: "#38f5a8",
  },
};

/** A floating damage number, positioned in arena-relative percentages. */
type FloatNumber = Fx & { left: number; top: number };

/** Ambient embers drifting up through the arena — offset, phase and pace. */
const MOTES = [
  { left: "30%", color: "bg-arcade-cyan/70", delay: "0s", duration: "7s" },
  { left: "52%", color: "bg-arcade-violet/70", delay: "-2.8s", duration: "8.5s" },
  { left: "70%", color: "bg-arcade-magenta/60", delay: "-5s", duration: "6s" },
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
            ? "#ffcb2b"
            : event.kind === "heal"
              ? "#38f5a8"
              : event.target === "boss"
                ? "#37e6ff"
                : "#ff2e6b";
        fx?.burst(point.x, point.y, color, event.kind === "crit" ? 34 : 20);

        // A crit gets punctuation beyond sparks.
        if (event.kind === "crit") {
          fx?.ring(point.x, point.y, "#ffcb2b");
          fx?.flash("#ffcb2b", 0.1);
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
      fx.burst(it.x, it.y, "#ffcb2b", 70);
      fx.ring(it.x, it.y, "#ffcb2b");
      fx.flash("#ffcb2b", 0.22);
    } else if (phase === "lost") {
      const me = arenaPoint("player");
      fx.burst(me.x, me.y, "#ff2e6b", 60);
      fx.ring(me.x, me.y, "#ff2e6b");
      fx.flash("#ff2e6b", 0.2);
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
        // Repair applies synchronously in the engine, so the glow does too.
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
    return (
      <div
        className="h-[36rem] border-2 border-arcade-cyan/25 bg-arcade-panel/70"
        aria-hidden
      />
    );
  }

  const over = state.phase === "won" || state.phase === "lost";
  const bossPct = Math.max(0, (state.bossHp / state.bossHpMax) * 100);
  const hpPct = Math.max(0, (state.hp / state.hpMax) * 100);
  const enPct = Math.max(0, (state.en / state.enMax) * 100);

  return (
    <div className="relative border-2 border-arcade-cyan/25 bg-arcade-panel/70 p-step-4 sm:p-step-5">
      {/* ── boss ─────────────────────────────────────────────────────────── */}
      <div className="flex items-baseline gap-step-3">
        <h2 className="title-sm text-arcade-text [text-shadow:0_0_18px_rgba(255,46,107,0.55)]">
          {BOSS.name}
        </h2>
        <span className="figure-tag border border-arcade-magenta/45 bg-arcade-magenta/10 px-step-2 py-[0.1rem] text-arcade-magenta">
          Lv.{BOSS.level}
        </span>
      </div>
      <p className="figure-tag mt-step-1 text-arcade-dim">{BOSS.tag}</p>

      <Bar
        pct={bossPct}
        tone="magenta"
        label={`${Math.round(state.bossHp)} / ${state.bossHpMax}`}
        className={`mt-step-3 h-6 ${
          bossPct <= 25 && !over
            ? "animate-[enrage-pulse_1.1s_ease-in-out_infinite]"
            : ""
        }`}
      />

      {/* ── arena ────────────────────────────────────────────────────────── */}
      <div
        ref={arenaRef}
        className={`relative mt-step-4 h-[11.5rem] overflow-hidden border border-arcade-cyan/20 bg-[radial-gradient(120%_130%_at_50%_120%,rgba(80,60,160,0.3),transparent_60%)] sm:h-[13rem] ${
          impact
            ? impact.kind === "heal"
              ? ""
              : impact.crit
                ? "animate-[arena-shake-hard_450ms_ease]"
                : "animate-[arena-shake_400ms_ease]"
            : ""
        }`}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-14 border-t border-arcade-cyan/20 bg-gradient-to-t from-arcade-cyan/[0.07] to-transparent"
        />

        {/* Ambient embers, drifting up between the fighters. */}
        {MOTES.map((m, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              left: m.left,
              animationDelay: m.delay,
              animationDuration: m.duration,
            }}
            className={`pointer-events-none absolute bottom-2 z-[5] size-[3px] rounded-full blur-[1px] animate-[mote-drift_7s_linear_infinite] ${m.color}`}
          />
        ))}

        {/* CRT scanlines and the slow sweep — the arena is a screen. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[15] opacity-70 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0_1px,transparent_1px_3px)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-10 animate-[scan-sweep_6.5s_linear_infinite] bg-gradient-to-b from-transparent via-arcade-cyan/[0.06] to-transparent"
        />

        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />

        {state.combo >= 2 && !over && (
          <div className="pointer-events-none absolute left-1/2 top-step-2 z-30 -translate-x-1/2 text-center">
            <span
              key={state.combo}
              className="readout block animate-[combo-pop_220ms_ease-out] leading-none text-arcade-gold [text-shadow:0_0_20px_rgba(255,203,43,0.6)]"
            >
              ×{state.combo}
            </span>
            <span className="figure-tag text-arcade-gold">combo</span>
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
            className={`pointer-events-none absolute z-30 animate-[dmg-pop_1s_forwards] font-bold [text-shadow:0_2px_6px_rgba(0,0,0,0.85)] ${
              n.kind === "crit"
                ? "text-[2rem] text-arcade-gold"
                : n.kind === "heal"
                  ? "text-[1.25rem] text-arcade-green"
                  : "text-[1.35rem] text-arcade-text"
            }`}
          >
            {n.kind === "heal" ? "+" : ""}
            {n.amount}
            {n.kind === "crit" && (
              <span className="figure-tag block text-center text-arcade-gold">
                critical
              </span>
            )}
          </span>
        ))}
      </div>

      {/* ── you ──────────────────────────────────────────────────────────── */}
      <div className="mt-step-4 flex items-center gap-step-3">
        <div className="flex size-10 shrink-0 items-center justify-center border border-arcade-green/35 bg-arcade-green/10 text-arcade-green">
          <Glyph name="craft" className="size-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-step-2">
          <Bar
            pct={hpPct}
            tone="green"
            label={`HP ${Math.round(state.hp)} / ${state.hpMax}`}
            className="h-[1.15rem]"
          />
          <Bar
            pct={enPct}
            tone="cyan"
            label={`EN ${Math.round(state.en)} / ${state.enMax}`}
            className="h-[1.15rem]"
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
                  ? "bg-arcade-void/60 hover:-translate-y-[3px] active:translate-y-0 active:scale-95"
                  : "cursor-not-allowed border-arcade-dim/25 bg-arcade-void/30 opacity-45"
              }`}
            >
              <Glyph
                name={skill.glyph}
                className={`mx-auto size-6 transition-[filter] duration-150 ${
                  enabled
                    ? `${tone.text} group-hover:[filter:drop-shadow(0_0_7px_currentColor)]`
                    : "text-arcade-dim"
                }`}
              />
              <span
                className={`figure-tag mt-step-2 block ${
                  enabled ? "text-arcade-text" : "text-arcade-dim"
                }`}
              >
                {skill.name}
              </span>
              <span
                className={`figure-tag mt-[0.15rem] block ${
                  tooPoor ? "text-arcade-magenta" : "text-arcade-cyan"
                }`}
              >
                {skill.cost > 0 ? `${skill.cost} EN` : "FREE"}
              </span>

              {cd > 0 && (
                <span className="absolute inset-0 z-10 flex items-center justify-center bg-arcade-void/85 text-[1.6rem] font-bold text-arcade-text">
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
        className="mt-step-4 min-h-[3.25rem] border border-arcade-cyan/20 bg-black/25 px-step-3 py-step-2"
      >
        {!over && (
          <span
            className={`figure-tag flex items-center gap-step-2 ${
              state.phase === "player" ? "text-arcade-cyan" : "text-arcade-magenta"
            }`}
          >
            <span
              aria-hidden
              className={`size-[6px] rounded-full animate-pulse ${
                state.phase === "player"
                  ? "bg-arcade-cyan"
                  : "bg-arcade-magenta"
              }`}
            />
            {state.phase === "player" ? "Your turn" : `${BOSS.name} turn`}
            <span className="text-arcade-dim">· turn {state.turn}</span>
          </span>
        )}
        <p className="mt-step-1 text-sm text-arcade-dim">{state.log}</p>
      </div>

      {/* ── outcome ──────────────────────────────────────────────────────── */}
      {over && (
        <div className="absolute inset-0 z-40 flex animate-[outcome-in_450ms_ease_both] flex-col items-center justify-center gap-step-4 bg-arcade-void/90 px-step-5 text-center">
          <p
            className={`display [text-shadow:3px_0_rgba(55,230,255,0.55),-3px_0_rgba(255,46,107,0.55)] ${
              state.phase === "won" ? "text-arcade-gold" : "text-arcade-magenta"
            }`}
          >
            {state.phase === "won" ? "Victory" : "Defeated"}
          </p>
          <p className="max-w-[36ch] text-sm text-arcade-dim">{state.log}</p>
          <button
            type="button"
            onClick={reset}
            className="caption border-2 border-arcade-cyan bg-arcade-cyan px-step-6 py-step-3 text-arcade-void transition-colors duration-150 hover:bg-arcade-text"
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
}: {
  pct: number;
  tone: "magenta" | "green" | "cyan";
  label: string;
  className?: string;
}) {
  const fill = {
    magenta: "bg-gradient-to-r from-[#ff2e6b] to-[#ff6fae]",
    green: "bg-gradient-to-r from-[#1fd67a] to-[#8fffca]",
    cyan: "bg-gradient-to-r from-[#0aa5d6] to-[#7ff0ff]",
  }[tone];

  return (
    <div
      className={`relative overflow-hidden border border-arcade-cyan/20 bg-black/55 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {/* The trailing ghost lags the fill, so a big hit reads as a big hit. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 bg-white/30 transition-[width] delay-150 duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
      <div
        aria-hidden
        className={`absolute inset-y-0 left-0 transition-[width] duration-300 ease-out ${fill}`}
        style={{ width: `${pct}%` }}
      />
      <span className="figure-tag absolute inset-0 z-10 flex items-center justify-center text-arcade-text [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">
        {label}
      </span>
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
          className="absolute inset-x-[-0.75rem] bottom-6 top-0 animate-[combo-aura_1.1s_ease-in-out_infinite] border border-arcade-gold/50 [box-shadow:0_0_20px_rgba(255,203,43,0.4),inset_0_0_16px_rgba(255,203,43,0.2)]"
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
              className={`flex items-center justify-center border transition-[filter] duration-200 ${
                isBoss
                  ? "size-[5.5rem] border-arcade-magenta/35 bg-arcade-magenta/15 text-arcade-magenta"
                  : "size-[4.25rem] border-arcade-green/35 bg-arcade-green/15 text-arcade-green"
              } ${hit ? "brightness-[2.2]" : ""} ${
                crit ? "[filter:drop-shadow(0_0_14px_currentColor)]" : ""
              } ${
                heal
                  ? "brightness-150 [filter:drop-shadow(0_0_16px_rgba(56,245,168,0.85))]"
                  : ""
              } ${
                charging
                  ? "animate-[boss-charge_520ms_ease-in-out_infinite] border-arcade-magenta/80"
                  : ""
              } ${
                lowHp
                  ? "animate-[low-hp_900ms_ease-in-out_infinite] border-arcade-magenta/70"
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
      <span className="figure-tag mt-step-2 block text-arcade-dim">
        {isBoss ? BOSS.name : "You"}
      </span>
    </div>
  );
}
