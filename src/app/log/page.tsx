/*
 * DIRECTION CONTRACT — engineering log (/log)
 *
 * THESIS: The manual's troubleshooting chapter. Home is the thirty-second read;
 *   this is the ten-minute one, and it refuses the case-study-as-marketing shape
 *   by keeping the shape engineers actually use — symptom, diagnosis, fix, and
 *   the rule that came out of it.
 * OWN-WORLD: The same printed world as home. Every entry is a numbered figure;
 *   incidents carry the spot-red mark, the redesign does not, because one is a
 *   failure and the other is a decision.
 * STORY: Here is what broke, here is how it was found, here is what changed — and
 *   here is which codebase I directed rather than typed, in a table.
 * FIRST VIEWPORT: Back to the manual, the chapter title, and the first incident's
 *   symptom already legible without scrolling.
 * FORM: Troubleshooting chapter of the game manual. Read mode — comprehension and
 *   wayfinding outrank expression here, a different bar than home's Persuade.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ActionLinks, Colophon, Topbar } from "@/components/actions";
import { Figure, SectionOpener, SpeedBreak, StackRow } from "@/components/manual";
import { Reveal } from "@/components/reveal";
import { ScalePanel, ServiceRecord } from "@/components/sections";
import { logEntries } from "@/content/incidents";
import { method, provenance } from "@/content/retrieval";

export const metadata: Metadata = {
  title: "Engineering log — Satasuk Viparksinlapin",
  description:
    "The long version: three incidents written up in full, the service record, and a plain account of which codebase was agent-directed.",
};

export default function Log() {
  return (
    <>
      <Topbar />

      <main>
        <Spread>
          <Link
            href="/"
            className="caption inline-flex items-center gap-step-2 text-ink-mid transition-colors duration-150 hover:text-cyan-deep"
          >
            <span aria-hidden>←</span> Back to the manual
          </Link>

          <div className="mt-step-6">
            {/* Cyan Deep — 11px type is below Print Cyan's large-text-only bar. */}
            <p className="figure-tag text-cyan-deep">Chapter 04</p>
            <h1 className="display mt-step-3 text-ink">Troubleshooting</h1>
            <p className="measure mt-step-5 body-copy text-ink-mid">
              Three entries from Radiant. Internal function, table, service and
              queue names are generalised — the reasoning is not. Two are
              failures; the third is a decision I would make again.
            </p>
          </div>
        </Spread>

        <SpeedBreak />

        <Spread>
          {logEntries.map((entry, i) => (
            <Reveal key={entry.seq} className="mb-step-8 last:mb-0">
              <Figure
                tag={entry.seq}
                label={entry.kind === "incident" ? "Incident" : "Redesign"}
                caption={`${entry.system} · ${
                  entry.severity ?? "Architecture decision"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-step-3">
                  <h2 className="title text-ink">{entry.title}</h2>
                  {/* Only a failure gets the red mark. A redesign is not a fault. */}
                  {entry.kind === "incident" && (
                    <span className="figure-tag bg-magenta px-step-2 py-[0.2rem] text-paper">
                      {entry.severity}
                    </span>
                  )}
                </div>

                <dl className="mt-step-5">
                  {entry.fields.map((field) => (
                    <div
                      key={field.label}
                      className="border-t-2 border-ink py-step-4"
                    >
                      <dt className="caption text-cyan-deep">{field.label}</dt>
                      <dd className="measure mt-step-2 body-copy text-ink-mid">
                        {field.body}
                      </dd>
                    </div>
                  ))}
                </dl>

                {entry.lesson && (
                  <div className="border-t-2 border-ink pt-step-4">
                    <p className="caption text-ink-mid">The rule that came out of it</p>
                    <p className="title-sm measure mt-step-3 text-ink">
                      {entry.lesson}
                    </p>
                  </div>
                )}
              </Figure>
              {i === 0 && (
                <p className="readout-sm mt-step-4 text-ink-mid">
                  Fig. 02 below is the same class of problem one layer up: an
                  upstream contract that varied per source.
                </p>
              )}
            </Reveal>
          ))}
        </Spread>

        <SpeedBreak />

        <Spread>
          <SectionOpener
            seq="§ A"
            title="Scale, for the record"
            lede="Radiant's figures, historical throughout. The product is sunset, so none of this is verifiable by clicking through."
          />
          {/* Log numbering: 01–03 incidents · 04 scale · 05 method. Shared with
              the home page, so the tag has to be passed rather than assumed. */}
          <ScalePanel tag="04" />
        </Spread>

        <Spread>
          <SectionOpener
            seq="§ B"
            title="Service record"
            lede="Oldest to newest reads as a career; newest first reads as a record. This is the record."
          />
          <ServiceRecord />
        </Spread>

        <Spread>
          <Reveal>
            <Figure tag="05" label="Method" tone="board">
              <h2 className="title text-ink">{method.title}</h2>
              <div className="grid gap-step-7 lg:grid-cols-[1fr_18rem] lg:items-start">
                <div>
                  <div className="measure mt-step-4 flex flex-col gap-step-4 body-copy text-ink-mid">
                    <p>
                      Most of what is above I built by hand. XOXONA I largely
                      did not, and that is worth stating plainly rather than
                      leaving for someone to discover.
                    </p>
                    {method.body.map((para) => (
                      <p key={para.slice(0, 24)}>{para}</p>
                    ))}
                  </div>

                  <dl className="mt-step-6 grid gap-step-5 border-t-2 border-ink pt-step-4 sm:grid-cols-2">
                    <div>
                      <dt className="caption text-cyan-deep">
                        What I can defend in an interview
                      </dt>
                      <dd className="title-sm mt-step-2 text-ink">
                        {method.defensible}
                      </dd>
                    </div>
                    <div>
                      <dt className="caption text-magenta">
                        What I will not claim
                      </dt>
                      <dd className="title-sm mt-step-2 text-ink">
                        {method.refused}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* The claim, made auditable. */}
                <div className="frame-inner bg-paper p-step-4">
                  <p className="caption mb-step-3 text-ink">Build provenance</p>
                  <dl>
                    {provenance.map((row, i) => (
                      <div
                        key={row.name}
                        className={`flex items-baseline justify-between gap-step-3 py-step-2 ${
                          i > 0 ? "border-t border-halftone" : ""
                        }`}
                      >
                        <dt className="readout-sm text-ink">{row.name}</dt>
                        <dd
                          className={`figure-tag shrink-0 px-step-2 py-[0.15rem] ${
                            row.mode === "hand"
                              ? "text-ink-mid"
                              : "bg-marker-yellow text-ink"
                          }`}
                        >
                          {row.mode === "hand" ? "Hand" : "Directed"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="readout-sm mt-step-4 text-ink-mid">
                    Directed means I specified and reviewed it; an agent typed
                    most of it.
                  </p>
                </div>
              </div>
            </Figure>
          </Reveal>
        </Spread>

        <Spread>
          <StackRow
            items={[
              "TypeScript",
              "Node.js",
              "NestJS",
              "Go",
              "Temporal.io",
              "PostgreSQL",
              "MongoDB",
              "Redis",
              "Neo4j",
              "Typesense",
              "gRPC",
              "tRPC",
              "RabbitMQ",
              "Kubernetes",
              "LangChain",
              "Next.js",
            ]}
          />
          <p className="readout-sm mt-step-4 text-ink-mid">
            Everything above, in one row. Ordered by how much of it I would want
            to be asked about.
          </p>
          <ActionLinks className="mt-step-6" />
        </Spread>
      </main>

      <Colophon />
    </>
  );
}

function Spread({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-spread px-step-5 py-step-7 sm:px-step-7">
      {children}
    </section>
  );
}
