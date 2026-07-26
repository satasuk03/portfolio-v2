export type EntryKind = "incident" | "redesign";

export type LogEntry = {
  seq: string;
  kind: EntryKind;
  title: string;
  system: string;
  /** Severity drives the lamp. Incidents are fault-lamped; redesigns are not. */
  severity?: string;
  fields: { label: string; body: string }[];
  lesson?: string;
};

/**
 * Internal naming is deliberately genericized — no real function, table,
 * service, or queue names. The reasoning survives intact without them.
 */
export const logEntries: LogEntry[] = [
  {
    seq: "01",
    kind: "incident",
    title: "Connection pool exhaustion",
    system: "Radiant",
    severity: "Production",
    fields: [
      {
        label: "Symptom",
        body: "Worker memory climbed steadily until pods were restarted. Under ordinary load the database connection pool ran dry, and requests that needed a connection simply waited.",
      },
      {
        label: "Diagnosis",
        body: "A singleton heartbeat service — a self-rescheduling one-second timer holding a closure over the connection pool and a rollback registry — was being started inside every workflow worker pod, not once in the API server as intended. At five or more pods per worker type across several worker types, dozens of concurrent loops competed for the same outbox table. Connection-acquisition promises queued in memory indefinitely, and that queue was the leak. A race on the finalize-once guard meant all but one pod threw on every cycle, accumulating error state as it went.",
      },
      {
        label: "Resolution",
        body: "Removed the heartbeat from every worker. It now runs as a true singleton in the API server alone.",
      },
    ],
    lesson:
      "Stateful singletons must never be instantiated inside horizontally scaled stateless processes. Workflow workers are state-free executors by design — anything that remembers belongs somewhere else.",
  },
  {
    seq: "02",
    kind: "incident",
    title: "Event schema drift across five titles",
    system: "Radiant",
    severity: "Data integrity",
    fields: [
      {
        label: "Symptom",
        body: "Quest progress failed silently for some players in some games. Counts diverged from what players had just seen happen on screen — the worst kind of bug in a rewards product, because it reads as theft.",
      },
      {
        label: "Diagnosis",
        body: "The game-events SDK is per-title and not standardised. One battle-royale title emitted a different kill event in its no-build mode than in its standard mode; several titles dropped or delayed events under load. One ingestion path could not honestly satisfy five games.",
      },
      {
        label: "Resolution",
        body: "Per-game adapters that normalise at the boundary, schema validation before anything reaches the engine, and idempotent ingestion so a replayed or duplicated event cannot double-count.",
      },
    ],
    lesson:
      "When an upstream contract varies per source, normalise at the edge and make ingestion idempotent. Holding five schemas in one code path is how silent divergence begins.",
  },
  {
    seq: "03",
    kind: "redesign",
    title: "Quest engine: stateless checks to durable workflows",
    system: "Radiant",
    fields: [
      {
        label: "Before",
        body: "Stateless, binary completion checks against four validation sources — a chat platform, a social platform, partner APIs, and on-chain wallet holdings. No partial progress, no time bounds, no recovery from a half-finished claim.",
      },
      {
        label: "Why it broke down",
        body: "Real-time game events falsified every assumption underneath it. Progress arrives in fragments, out of order, and occasionally twice. A binary check has nowhere to put 'seven of ten kills', and no way to be resumed if it dies halfway through granting a reward.",
      },
      {
        label: "After",
        body: "A durable-workflow engine: partial progress, multi-step objective packs, streaks with retroactive repair, paid rerolls of an objective, long-running passive challenges, and buff multipliers applied to both rewards and costs. Workers isolated per task queue so one slow domain could not stall the others, with execution history as the debugging surface instead of application logs.",
      },
    ],
    lesson:
      "Durable execution is worth its operational cost the moment money and player trust ride on a multi-step operation completing exactly once.",
  },
];
