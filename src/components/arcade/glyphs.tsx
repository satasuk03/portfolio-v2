/*
 * Arcade glyphs, drawn rather than borrowed.
 *
 * The source file used emoji (⚔️🔥⚡💠🤖👹). Emoji render as whatever face the
 * visitor's OS ships, which means the one part of this room that is supposed to
 * feel authored would look different on every machine — and would carry none of
 * the angular wireframe language the rest of the site is built from. So these
 * are hand-drawn paths in `currentColor`, sharing the figure's vocabulary:
 * straight segments, hard vertices, no fills except where a core needs mass.
 */

type GlyphName = "blade" | "burst" | "bolt" | "core" | "craft" | "guardian";

const PATHS: Record<GlyphName, React.ReactNode> = {
  // A plasma blade: long edge, short guard.
  blade: (
    <>
      <path d="M5 19 L19 5" />
      <path d="M15 5 L19 5 L19 9" />
      <path d="M4.5 15.5 L8.5 19.5" />
      <path d="M3 21 L6.5 17.5" />
    </>
  ),

  // Overdrive: an outward detonation.
  burst: (
    <>
      <path d="M12 3 L14.4 9.6 L21 12 L14.4 14.4 L12 21 L9.6 14.4 L3 12 L9.6 9.6 Z" />
      <path d="M12 8.5 L13.2 11 L12 15.5 L10.8 11 Z" />
    </>
  ),

  // Chain bolt: three linked arcs.
  bolt: (
    <>
      <path d="M13 2 L6 13 L11 13 L9 22 L18 10 L12.5 10 Z" />
    </>
  ),

  // Repair: a faceted core, the only glyph with mass.
  core: (
    <>
      <path d="M12 2.5 L20 7 L20 17 L12 21.5 L4 17 L4 7 Z" />
      <path d="M12 7.5 L16 10 L16 14.5 L12 17 L8 14.5 L8 10 Z" />
    </>
  ),

  // You: a forward-leaning craft.
  craft: (
    <>
      <path d="M12 2.5 L20.5 20 L12 16 L3.5 20 Z" />
      <path d="M12 2.5 L12 16" />
    </>
  ),

  // NEXUS-9: a hexagonal guardian with a locked-on eye.
  guardian: (
    <>
      <path d="M12 1.5 L21.5 7 L21.5 17 L12 22.5 L2.5 17 L2.5 7 Z" />
      <path d="M7.5 9.5 L12 7 L16.5 9.5 L16.5 14.5 L12 17 L7.5 14.5 Z" />
      <path d="M10.5 12 L13.5 12" />
      <path d="M2.5 7 L7.5 9.5" />
      <path d="M21.5 7 L16.5 9.5" />
      <path d="M12 22.5 L12 17" />
    </>
  ),
};

export function Glyph({
  name,
  className = "",
}: {
  name: GlyphName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
