/*
 * Education. One entry, and it belongs at the tail of § 03 rather than in a
 * section of its own: this audience reads the shipping record first, and a
 * section opener after "Off the clock" would leave 2020 as the last thing the
 * page says. It is also chronologically correct there — § 03 is newest-first
 * and 2016 is the earliest start on the site.
 *
 * Deliberately no GPA. It is verified and publishable (3.15 — PRODUCT.md
 * "Verified facts available to publish"), but a GPA printed on the record of a
 * senior engineer can only read downward. Chulalongkorn B.Eng. Computer
 * Engineering is the signal, and it carries for readers who recognise no Thai
 * employer on the page.
 *
 * `body` is what earns the figure its place. The senior project is the earliest
 * point on the through-line § 01 claims, six years ahead of the AI positioning
 * — without it this is a credential box. Its closing clause resolves the
 * overlap a careful reader will spot between these dates and the part-time
 * Phatra and BlockFint roles above, and restates the provenance `homeStats`
 * depends on ("since 2019", profile.ts).
 *
 * `when` is display-only, exactly as in experience.ts — nothing parses it, so
 * nothing will catch a typo'd year. Check by eye.
 */

export type Education = {
  /** Used for the figure label and the caption. */
  institution: string;
  meta: string;
  when: string;
  qualification: string;
  /** One string. Two paragraphs means changing the type, not embedding \n\n. */
  body: string;
};

export const education: Education = {
  institution: "Chulalongkorn University",
  meta: "Faculty of Engineering · Bangkok",
  when: "2016 — 2020",
  qualification: "B.Eng. Computer Engineering",
  body: "Senior project: predicting cancer type from tumour DNA signatures against a reduced gene set — the first time I had to decide what a model was actually allowed to conclude. I was working at Phatra part-time by the last year, which is why 2019 is the start year everywhere else on this site.",
};
