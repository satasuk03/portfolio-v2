/*
 * NEXUS-9 — turn-based boss battle.
 *
 * Ported from the standalone nexus_battle.html Ze supplied, restructured so the
 * rules live here as a framework-free module and React only renders what this
 * reports. Same shape as src/components/figure/engine.ts, for the same reason:
 * a game loop driven by React state re-renders the tree on every tick to
 * achieve nothing.
 *
 * It is deliberately not a metaphor for anything. The site's argument about
 * engineering is made on paper; this room exists because a boss battle is fun,
 * and an earlier attempt to make a game do double duty as a case study is
 * exactly what Ze rejected.
 *
 * All scheduling goes through `schedule()` so `dispose()` can cancel every
 * pending beat — a half-resolved turn firing after unmount is the one bug this
 * shape is prone to.
 */

export type SkillTone = "cyan" | "magenta" | "violet" | "green";

export type Skill = {
  id: number;
  glyph: "blade" | "burst" | "bolt" | "core";
  name: string;
  cost: number;
  cooldown: number;
  min?: number;
  max?: number;
  crit?: number;
  hits?: number;
  heal?: number;
  blurb: string;
  tone: SkillTone;
};

export const SKILLS: Skill[] = [
  {
    id: 0,
    glyph: "blade",
    name: "Slash",
    cost: 0,
    cooldown: 0,
    min: 35,
    max: 55,
    crit: 0.2,
    blurb: "Plasma blade. Free, always available.",
    tone: "cyan",
  },
  {
    id: 1,
    glyph: "burst",
    name: "Overdrive",
    cost: 35,
    cooldown: 2,
    min: 80,
    max: 120,
    crit: 0.35,
    blurb: "Dump the reserve. Highest ceiling, highest crit.",
    tone: "magenta",
  },
  {
    id: 2,
    glyph: "bolt",
    name: "Chain Bolt",
    cost: 25,
    cooldown: 1,
    min: 55,
    max: 75,
    crit: 0.3,
    hits: 3,
    blurb: "Three arcs. Each one builds the combo.",
    tone: "violet",
  },
  {
    id: 3,
    glyph: "core",
    name: "Repair",
    cost: 40,
    cooldown: 3,
    heal: 90,
    blurb: "Rebuild hull integrity. Resets the combo.",
    tone: "green",
  },
];

export const BOSS = {
  name: "NEXUS-9",
  tag: "APEX GUARDIAN // VOID PROTOCOL",
  level: 99,
  hp: 1200,
} as const;

export const PLAYER = {
  hp: 300,
  en: 100,
  /** Energy returned at the start of each of your turns. */
  enRegen: 15,
} as const;

export type Phase = "player" | "enemy" | "won" | "lost";
export type FxTarget = "boss" | "player";

export type Fx = {
  id: number;
  target: FxTarget;
  kind: "hit" | "crit" | "heal";
  amount: number;
};

export type BattleState = {
  bossHp: number;
  bossHpMax: number;
  hp: number;
  hpMax: number;
  en: number;
  enMax: number;
  combo: number;
  cooldowns: number[];
  phase: Phase;
  /** True while a turn is resolving; every control is locked. */
  busy: boolean;
  log: string;
  turn: number;
};

export type BattleHandle = {
  readonly state: BattleState;
  /** True when the skill can be used right now. */
  canUse: (id: number) => boolean;
  use: (id: number) => void;
  reset: () => void;
  dispose: () => void;
};

type Callbacks = {
  onChange: () => void;
  onFx: (fx: Fx) => void;
  /** Screen shake / impact, so the view can flash the right fighter — and so a
     repair reads as a glow rather than a recoil. */
  onImpact: (target: FxTarget, crit: boolean, kind: Fx["kind"]) => void;
};

function freshState(): BattleState {
  return {
    bossHp: BOSS.hp,
    bossHpMax: BOSS.hp,
    hp: PLAYER.hp,
    hpMax: PLAYER.hp,
    en: PLAYER.en,
    enMax: PLAYER.en,
    combo: 0,
    cooldowns: SKILLS.map(() => 0),
    phase: "player",
    busy: false,
    log: "Pick a skill. Slash is free.",
    turn: 1,
  };
}

export function createBattle({
  onChange,
  onFx,
  onImpact,
}: Callbacks): BattleHandle {
  let state = freshState();
  let fxId = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  function schedule(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  }

  function clearTimers() {
    for (const t of timers) clearTimeout(t);
    timers.clear();
  }

  function emit() {
    onChange();
  }

  function fx(target: FxTarget, kind: Fx["kind"], amount: number) {
    onFx({ id: ++fxId, target, kind, amount });
  }

  function canUse(id: number) {
    const skill = SKILLS[id];
    if (!skill) return false;
    return (
      state.phase === "player" &&
      !state.busy &&
      state.en >= skill.cost &&
      state.cooldowns[id] <= 0
    );
  }

  function finish() {
    clearTimers();
    state.busy = true;
    state.phase = state.bossHp <= 0 ? "won" : "lost";
    state.log =
      state.phase === "won"
        ? `${BOSS.name} is down. Nothing left of the void protocol.`
        : `Hull integrity gone. ${BOSS.name} still standing.`;
    emit();
  }

  function enemyTurn() {
    if (state.phase === "won" || state.phase === "lost") return;
    if (state.bossHp <= 0) return finish();

    state.phase = "enemy";
    state.log = `${BOSS.name} is charging.`;
    emit();

    schedule(() => {
      const crit = Math.random() < 0.18;
      const damage = Math.round((28 + Math.random() * 30) * (crit ? 1.8 : 1));

      state.hp = Math.max(0, state.hp - damage);
      fx("player", crit ? "crit" : "hit", damage);
      onImpact("player", crit, crit ? "crit" : "hit");

      // A hit shakes some momentum loose, but never all of it.
      if (state.combo > 0 && Math.random() < 0.4) {
        state.combo = Math.max(0, state.combo - 1);
      }

      state.log = crit
        ? `Critical. ${damage} through the hull.`
        : `${BOSS.name} connects for ${damage}.`;
      emit();

      schedule(() => {
        if (state.hp <= 0) return finish();

        state.cooldowns = state.cooldowns.map((c) => Math.max(0, c - 1));
        state.en = Math.min(state.enMax, state.en + PLAYER.enRegen);
        state.phase = "player";
        state.busy = false;
        state.turn += 1;
        state.log = `Your turn. +${PLAYER.enRegen} EN.`;
        emit();
      }, 700);
    }, 650);
  }

  function use(id: number) {
    if (!canUse(id)) return;
    const skill = SKILLS[id];

    state.busy = true;
    state.en -= skill.cost;
    state.cooldowns[id] = skill.cooldown;

    // ── heal ──────────────────────────────────────────────────────────────
    if (skill.heal) {
      const before = state.hp;
      state.hp = Math.min(state.hpMax, state.hp + skill.heal);
      const gained = state.hp - before;

      state.combo = 0;
      fx("player", "heal", gained);
      onImpact("player", false, "heal");
      state.log =
        gained > 0
          ? `Repair holds. +${gained} HP.`
          : "Already at full integrity. Energy spent for nothing.";
      emit();

      schedule(enemyTurn, 750);
      return;
    }

    // ── attack, possibly multi-hit ────────────────────────────────────────
    const hits = skill.hits ?? 1;
    state.log = `${skill.name} — ${skill.blurb}`;
    emit();

    let landed = 0;

    function strike() {
      if (state.bossHp <= 0) return finish();

      const crit = Math.random() < (skill.crit ?? 0);
      const base = (skill.min ?? 0) + Math.random() * ((skill.max ?? 0) - (skill.min ?? 0));
      // Combo is the reward for chaining rather than healing.
      const damage = Math.round(base * (crit ? 1.9 : 1) * (1 + state.combo * 0.08));

      state.bossHp = Math.max(0, state.bossHp - damage);
      state.combo += 1;
      fx("boss", crit ? "crit" : "hit", damage);
      onImpact("boss", crit, crit ? "crit" : "hit");
      emit();

      landed += 1;

      if (landed < hits && state.bossHp > 0) {
        schedule(strike, 180);
        return;
      }

      schedule(() => {
        if (state.bossHp <= 0) return finish();
        enemyTurn();
      }, 600);
    }

    schedule(strike, 200);
  }

  return {
    get state() {
      return state;
    },
    canUse,
    use,
    reset() {
      clearTimers();
      state = freshState();
      emit();
    },
    dispose: clearTimers,
  };
}
