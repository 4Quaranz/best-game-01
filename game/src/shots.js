// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot (chase the nearest pollen, keep clear of bats), so the frame
// is what a short game really looks like and the same seed always gives the same
// frame. The end scene's pilot is careless on purpose: it flies at the bats, so
// a real game over arrives quickly, as it does for a hurried player.
import { FIELD, MOTH, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 120;
const SAMPLE = 1 / 30;
/** How close a bat must be before the play pilot flees from it. */
const FLEE_DISTANCE = 150;
/** How close pollen must be before the end pilot grabs it on the way to a bat. */
const END_GRAB_DISTANCE = 46;

function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function nearestPollen(state) {
  let best = null;
  let bestDist = Infinity;
  for (const orb of state.pollen) {
    if (!orb.active) continue;
    const dist = distance(state.moth.x, state.moth.y, orb.x, orb.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = orb;
    }
  }
  return { orb: best, dist: bestDist };
}

function nearestBat(state) {
  let best = null;
  let bestDist = Infinity;
  for (const bat of state.bats) {
    if (!bat.active) continue;
    const dist = distance(state.moth.x, state.moth.y, bat.x, bat.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = bat;
    }
  }
  return { bat: best, dist: bestDist };
}

/** Steer the moth toward `target` (a point in the field) as the mouse would. */
function steerToward(state, target) {
  return { keys: { x: 0, y: 0 }, mouse: { x: target.x, y: target.y, active: true } };
}

/** The play pilot: flee a near bat, otherwise chase the nearest pollen. */
function playPilot(state) {
  const moth = state.moth;
  const { bat, dist: batDist } = nearestBat(state);
  const { orb, dist: pollenDist } = nearestPollen(state);
  if (bat !== null && batDist < FLEE_DISTANCE && pollenDist > 30) {
    const awayX = moth.x + (moth.x - bat.x) * 2;
    const awayY = moth.y + (moth.y - bat.y) * 2;
    return steerToward(state, {
      x: Math.min(FIELD.width - MOTH.radius, Math.max(MOTH.radius, awayX)),
      y: Math.min(FIELD.gardenY - MOTH.radius, Math.max(MOTH.radius, awayY)),
    });
  }
  if (orb !== null) return steerToward(state, orb);
  return steerToward(state, { x: FIELD.width / 2, y: FIELD.height / 2 });
}

/** The end pilot: fly at the nearest bat, grabbing close pollen on the way. */
function endPilot(state) {
  const { orb, dist: pollenDist } = nearestPollen(state);
  if (orb !== null && pollenDist < END_GRAB_DISTANCE) return steerToward(state, orb);
  const { bat } = nearestBat(state);
  if (bat !== null) return steerToward(state, bat);
  return playPilot(state);
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { keys: { x: 0, y: 0 }, mouse: { x: 0, y: 0, active: false } }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const pilot = name === 'end' ? endPilot : playPilot;
  for (let index = 0; index < limit / STEP; index += 1) {
    if (world.step(STEP, pilot(world.state), false) & EVENT_OVER) break;
  }
  const over = world.state.lives === 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
