"use client";

/*
 * The hero's photograph, as an ID card: the frame in the About spot, the
 * photo set as a duotone into it (CSS only — the file is a plain photograph),
 * a static target reticle over the face, and the Based / Building readout.
 *
 * Clicking opens a native <dialog> with the full-tone frame at reading size:
 * ESC, focus trapping and page inertness come free, and a click on the
 * backdrop closes it. `data-orbit` is where fx.tsx parks its few motes.
 */

import { useRef } from "react";
import { Corners, Redacted } from "@/components/hud";
import { section } from "@/content/nav";
import { heroPlate } from "@/content/profile";

export function HeroPlate() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();
  const s = section("about");

  return (
    <figure className="card card-spot idcard" style={{ ["--spot" as string]: s.color }} data-orbit data-lock="FIG 00 · OPERATOR" data-color={s.color}>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`${heroPlate.lightbox.enlarge} photograph`}
        className="idcard-photo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroPlate.src} alt="" fetchPriority="high" />
        <span aria-hidden className="idcard-reticle">
          <Corners />
        </span>
        <span className="tag tag-ink idcard-tag">Fig. 00 — {heroPlate.label}</span>
        <span aria-hidden className="idcard-vert">
          กรุงเทพฯ
        </span>
      </button>

      <dl className="idcard-cells">
        {heroPlate.cells.map((cell) => (
          <div key={cell.term}>
            <dt className="hud-label">{cell.term}</dt>
            <dd className="readout-sm">
              <Redacted text={cell.value} />
            </dd>
          </div>
        ))}
      </dl>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="lightbox"
      >
        <div className="lightbox-bar">
          <span className="tag tag-ink">Fig. 00</span>
          <span className="hud-label">{heroPlate.label}</span>
          <button type="button" onClick={close} className="hud-btn ml-auto">
            <span className="hud-label">{heroPlate.lightbox.close} ✕</span>
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroPlate.src} alt={heroPlate.alt} className="lightbox-img" />
      </dialog>
    </figure>
  );
}
