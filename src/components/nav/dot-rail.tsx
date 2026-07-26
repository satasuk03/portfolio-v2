import { sections } from "@/content/nav";

/*
 * The right-edge progress rail. Redundant by design (REDESIGN-PLAN.md §4):
 * the top bar is the real navigation, so the rail is aria-hidden and out of
 * the tab order — it exists as a glanceable "where am I", not as a second
 * tab stop. Hidden below 48rem: it has nowhere to live on a phone.
 *
 * The dots are circles because the approved mockup draws them round — the
 * one circle on the site.
 */
export function DotRail({ active }: { active: string }) {
  return (
    <nav
      aria-hidden="true"
      className="fixed top-1/2 right-step-3 z-40 hidden -translate-y-1/2 flex-col items-center gap-[7px] min-[48rem]:flex"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          tabIndex={-1}
          className="block p-[3px]"
        >
          <span
            className={`block h-[7px] w-[7px] rounded-full border-2 border-ink transition-colors duration-150 ${
              active === section.id ? "bg-ink" : "bg-paper hover:bg-halftone"
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
