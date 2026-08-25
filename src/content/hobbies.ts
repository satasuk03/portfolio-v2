/*
 * Off the clock. Three panels — Ze named five hobbies and "AI Builder" is
 * deliberately NOT one of them: it is the strongest hiring signal on the
 * site, and a hobby chip demotes it to an aside. The agent-tooling repos
 * carry it under Personal Projects instead. Ze can overrule.
 *
 * EVERY entry here is `draft: true`. research/ has nothing on wing chun or
 * climbing beyond the words themselves, and the photography line is
 * inference. The bodies below are placeholders written to be replaced — the
 * renderer shows a magenta DRAFT chip next to each until Ze supplies a real
 * line (REDESIGN-PLAN.md §5.2).
 *
 * What is still needed, per entry:
 * - Wing chun:    lineage/school, how long, still training?
 * - Climbing:     boulder or lead, indoor/outdoor, grade if he wants it stated
 * - Photography:  what he shoots, film or digital (one asset exists:
 *                 sanddune.webp; philm suggests film emulation)
 */

export type Hobby = {
  n: string;
  name: string;
  body: string;
  /**
   * Optional photograph, bled off the panel's right edge and faded leftward
   * under the copy. Absent is a supported state: the panel is simply plain
   * paper, which is what the other two are until Ze shoots them.
   */
  image?: string;
  /** Left empty on purpose where the picture only decorates the panel. */
  imageAlt?: string;
  /** true = copy not yet from Ze. Renders a DRAFT chip. */
  draft?: boolean;
};

export const hobbies: Hobby[] = [
  {
    n: "01",
    name: "Wing chun & Martial Arts",
    body: "Practitioner. Close-range, economy of motion, and force redirection.",
    // draft: true,
  },
  {
    n: "02",
    name: "Rock climbing",
    body: "On the wall most weeks. Love solving route before climbing.",
    image: "/images/hobbies/rock-climbing.webp",
    imageAlt: "",
    // draft: true,
  },
  {
    n: "03",
    name: "Photography",
    body: "Advanced Landscape photographer. Visit my Instagram to see more @zezethewanderer 😉",
    image: "/images/hobbies/photography.webp",
    imageAlt: "",
    // draft: true,
  },
];
