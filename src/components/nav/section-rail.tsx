import { sections } from "@/content/nav";

/*
 * The right-edge section rail — /play's ammo rail, one round per section in
 * its module spot; the active one slides out. Redundant by design: the top bar
 * is the real navigation, so the rail is aria-hidden and out of the tab order.
 * It exists as a glanceable "where am I". Hidden below 64rem: it has nowhere to
 * live on a phone or a narrow tablet.
 */
export function SectionRail({ active }: { active: string }) {
  return (
    <nav aria-hidden="true" className="rail">
      <span className="tri tri-up" />
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          tabIndex={-1}
          className="rail-round"
          data-active={active === section.id ? "true" : "false"}
          style={{ ["--spot" as string]: section.color }}
        >
          <i />
          <span className="rail-n">{section.n}</span>
        </a>
      ))}
      <span className="tri tri-down" />
    </nav>
  );
}
