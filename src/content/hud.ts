/*
 * HUD furniture copy for `/` — the words on the frame, not the record. Every
 * label here is either true (Bangkok's coordinates, the time there, what the
 * play edition actually contains) or a plain designation. Nothing here may
 * make a claim about Ze; claims live in profile.ts and the section files.
 */

export const hudCopy = {
  /* Bangkok, to four places — decoration that is also true. Same string as
     playCopy.coords, kept separate because /play sets it with two spaces. */
  coords: "13.7563°N 100.5018°E",
  zone: "BKK",
  /* The blue status tag. Mirrors the closer: "I'm open to remote roles." */
  status: "Open to remote roles",
  /* The unit designation /play prints on its HUD. */
  unit: "S-03",
  sound: { on: "SND ON", off: "SND OFF", labelOn: "Sound on. Turn off", labelOff: "Sound off. Turn on" },
  scrollCue: "Scroll",
  playEntry: {
    /* The one prominent way into /play. Every spec below is true of the
       route: seven cartridges (six sections + uplink), a WebGL scene, and
       synthesised sound. */
    kicker: "Play edition",
    title: "Load the playable edition",
    body: "The same record, loaded into a field unit. Pick a cartridge, slam it into the reader, read the panel.",
    lcd: "INSERT MODULE",
    lcdSub: "7 CARTRIDGES READY",
    specs: ["7 modules", "WebGL", "Synth audio"],
    cta: "Load",
    short: "Play",
  },
  colophon: {
    end: "End of record.",
    edition: "Reading edition",
  },
} as const;
