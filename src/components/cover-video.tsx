"use client";

/*
 * A card's looping cover clip. The clip is a button: a press opens the same
 * native <dialog> lightbox as the hero photo (ESC, focus trap and inertness
 * free; a backdrop click closes it) with the video at full size and controls.
 * The dialog's <video> mounts only while open, so the page never decodes the
 * clip twice, and unmounting on close stops it.
 */

import { useRef, useState } from "react";
import { heroPlate } from "@/content/profile";

type Props = { src: string; poster?: string; alt?: string; label: string };

export function CoverVideo({ src, poster, alt, label }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className="work-cover-btn"
        aria-label={`${heroPlate.lightbox.enlarge} video: ${alt ?? label}`}
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
      >
        <video src={src} poster={poster} autoPlay loop muted playsInline preload="metadata" />
        <span aria-hidden className="work-expand">
          ⤢
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className="lightbox"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="lightbox-bar">
          <span className="hud-label">{label}</span>
          <button type="button" onClick={close} className="hud-btn ml-auto">
            <span className="hud-label">{heroPlate.lightbox.close} ✕</span>
          </button>
        </div>
        {open && <video src={src} poster={poster} aria-label={alt} className="lightbox-img" controls autoPlay loop playsInline />}
      </dialog>
    </>
  );
}
