/*
 * Off the clock. Four panels — Ze named five hobbies and "AI Builder" is
 * deliberately NOT one of them: it is the strongest hiring signal on the
 * site, and a hobby chip demotes it to an aside. The agent-tooling repos
 * carry it under Personal Projects instead. Ze can overrule.
 *
 * EVERY entry here is `draft: true`. research/ has nothing on wing chun or
 * climbing beyond the words themselves, and the design/photography lines are
 * inference. The bodies below are placeholders written to be replaced — the
 * renderer shows a magenta DRAFT chip next to each until Ze supplies a real
 * line (REDESIGN-PLAN.md §5.2).
 *
 * What is still needed, per entry:
 * - Wing chun:    lineage/school, how long, still training?
 * - Climbing:     boulder or lead, indoor/outdoor, grade if he wants it stated
 * - Photography:  what he shoots, film or digital (one asset exists:
 *                 sanddune.webp; philm suggests film emulation)
 * - Design:       UI? graphics? the @3DZeeGee 3D-art work?
 */

export type Hobby = {
  n: string;
  name: string;
  body: string;
  /** true = copy not yet from Ze. Renders a DRAFT chip. */
  draft?: boolean;
};

export const hobbies: Hobby[] = [
  {
    n: "01",
    name: "Wing chun",
    body: "Practitioner. Close-range, economy of motion, and a strong opinion about doing less.",
    draft: true,
  },
  {
    n: "02",
    name: "Rock climbing",
    body: "On the wall most weeks. Reading a problem before touching it is the same skill as reading a system.",
    draft: true,
  },
  {
    n: "03",
    name: "Photography",
    body: "Film emulation is a hobby that turned into a codebase — see philm.",
    draft: true,
  },
  {
    n: "04",
    name: "Design",
    body: "This site is mine, top to bottom.",
    draft: true,
  },
];
