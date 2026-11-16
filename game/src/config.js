// MOTHLIGHT — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, gardenY: 648 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const MOTH = {
  radius: 16,
  /** Speed toward the mouse target, pixels per second. */
  speed: 420,
  /** Speed while steering with the keyboard. */
  keyboardSpeed: 470,
  /** Seconds of safety after a hit, or after the light dies. */
  invulnerable: 1.5,
};

export const LIVES = 3;

/** The lantern light: 0 to 100. It drains on its own; pollen refills it. */
export const LIGHT = {
  max: 100,
  start: 80,
  /** Points of light lost per second. */
  drain: 1.1,
  /** Points of light one pollen orb restores. */
  pollenRefill: 14,
  /** Light left after the lantern dies and costs a life. */
  afterDeath: 45,
  /** Glow radius at 0 and at full light, in pixels. */
  glowMin: 70,
  glowMax: 235,
  /** Light at or above these marks earns the bigger score multipliers. */
  mult2At: 33,
  mult3At: 66,
};

export const POLLEN = {
  radius: 9,
  points: 10,
  /** Seconds between spawns at level 1; it shortens a little per level. */
  interval: 0.95,
  intervalPerLevel: 0.04,
  minInterval: 0.55,
  intervalJitter: 0.5,
  /** How many orbs may drift at once at level 1, plus one per level after. */
  maxAtLevel1: 12,
  maxPerLevel: 1,
  maxCap: 20,
  /** Slow drift speeds, pixels per second. */
  driftMin: 10,
  driftMax: 28,
};

export const BAT = {
  radius: 15,
  speed: 150,
  speedPerLevel: 22,
  /** Seconds between spawns at level 1; it shortens per level. */
  interval: 2.6,
  intervalScale: 0.9,
  minInterval: 0.9,
  /** Most bats alive at once at level 1, plus one per level after. */
  maxAtLevel1: 2,
  maxPerLevel: 1,
  maxCap: 8,
  /** Side-to-side wobble while a bat chases, in radians per second. */
  wobble: 2.2,
  /** How far a bat is knocked back when it hits the moth. */
  knockback: 130,
};

export const WEB = {
  radius: 72,
  /** Seconds between new webs at level 1. */
  interval: 8,
  intervalPerLevel: 0.7,
  minInterval: 4.5,
  /** Most webs at once at level 1, plus one from level 4 on. */
  maxAtLevel1: 2,
  maxCap: 4,
  /** Seconds a web lasts before it fades away. */
  lifetime: 14,
  /** The moth's speed inside a web, as a fraction of normal. */
  slow: 0.45,
};

/** Pollen per level-up, and the last level: spawns and speeds stop growing there. */
export const LEVEL = { pollenPerLevel: 15, max: 12 };

/** How many things of each kind can exist at once; the pools are allocated once, at boot. */
export const POOL = { pollen: 24, bats: 10, webs: 6, sparks: 96, fireflies: 26 };

export const PALETTE = {
  backdrop: '#0b0e22',
  skyTop: '#171b3d',
  skyBottom: '#0a0c1e',
  moon: '#f5e6b8',
  moonHalo: '#f5e6b8',
  gardenBack: '#141b31',
  gardenFront: '#0b1023',
  flower: '#2c3a63',
  flowerGlow: '#5a6ea8',
  grass: '#1a2440',
  pollen: '#ffd76a',
  pollenCore: '#fff3c4',
  mothBody: '#e8dcc8',
  mothWing: '#f5e9d0',
  mothWingTip: '#ffb347',
  bat: '#2a2438',
  batWing: '#1d1830',
  batEye: '#ff5a4e',
  web: '#cfd6e4',
  text: '#f2ead8',
  muted: '#9aa3c0',
  panel: '#1a2040',
  lightBar: '#ffb347',
  lightBarLow: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'mothlight.best';
