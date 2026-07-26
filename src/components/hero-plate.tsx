"use client";

/*
 * The hero's photograph plate.
 *
 * The plate ships the raw frame cut down to the left column's height; clicking
 * it opens a modal sheet with the full frame at reading size.
 */

import { useRef } from "react";
import { heroPlate } from "@/content/profile";

export function HeroPlate() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => dialogRef.current?.close();

  return (
    <figure className="frame relative bg-board">
      <div className="absolute -top-px left-0 z-10 flex translate-y-[-50%] items-center gap-step-2 pl-step-3">
        <span className="figure-tag bg-ink px-step-2 py-[0.2rem] text-paper">
          Fig. 00
        </span>
        <span className="caption bg-paper px-step-2 text-ink-mid">
          {heroPlate.label}
        </span>
      </div>

      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={heroPlate.lightbox.enlarge}
        className="group relative block w-full cursor-zoom-in"
      >
        {/* Cropped to the left column's height on desktop — The Crop Rule
            applies to plates too. The face sits in the top fifth of the
            frame, so the crop anchors there. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroPlate.src}
          alt=""
          className="block w-full lg:h-52 lg:object-cover lg:object-[50%_20%]"
        />
        <span className="figure-tag absolute right-step-2 bottom-step-2 bg-ink px-step-2 py-[0.2rem] text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {heroPlate.lightbox.enlarge} +
        </span>
      </button>

      <dl className="grid grid-cols-2 border-t-[3px] border-ink bg-paper">
        {heroPlate.cells.map((cell, i) => (
          <div
            key={cell.term}
            className={`px-step-3 py-step-3 ${
              i > 0 ? "border-l-2 border-ink" : ""
            }`}
          >
            <dt className="caption text-ink-mid">{cell.term}</dt>
            <dd
              className={`readout-sm mt-step-1 font-bold ${
                cell.accent ? "text-cyan-deep" : "text-ink"
              }`}
            >
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Native <dialog>: ESC, focus trapping and page inertness come free.
          A click landing on the dialog box itself (not its children) is a
          backdrop click. */}
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-auto max-h-[92vh] max-w-[92vw] border-[3px] border-ink bg-paper p-0 backdrop:bg-ink/70"
      >
        <div className="flex flex-wrap items-center gap-step-2 border-b-[3px] border-ink px-step-3 py-step-2">
          <span className="figure-tag bg-ink px-step-2 py-[0.2rem] text-paper">
            Fig. 00
          </span>
          <span className="caption text-ink-mid">{heroPlate.label}</span>
          <button
            type="button"
            onClick={close}
            className="figure-tag ml-auto border-2 border-ink px-step-2 py-[0.2rem] text-ink transition-colors duration-150 hover:bg-magenta hover:text-paper"
          >
            {heroPlate.lightbox.close} ✕
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroPlate.src}
          alt={heroPlate.alt}
          className="block h-auto max-h-[78vh] w-auto max-w-full"
        />
      </dialog>
    </figure>
  );
}
