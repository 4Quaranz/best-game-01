// The game's rules and state, with no drawing and no browser in it: the moth and
// its lantern light, the drifting pollen, the bats that chase, the spider webs
// that slow, spawning, collisions, score, lives and levels. step() advances one
// fixed step and returns what happened as bit flags, so the caller can react
// without the world knowing about screens or sound. Nothing here allocates after
// createWorld returns.

import { BAT, FIELD, LEVEL, LIGHT, LIVES, MOTH, POLLEN, POOL, WEB } from './config.js';

export const KIND_POLLEN = 0;
export const KIND_BAT = 1;
export const KIND_WEB = 2;

export const EVENT_POLLEN = 1;
export const EVENT_HIT = 2;
export const EVENT_LEVEL = 4;
export const EVENT_OVER = 8;

function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createWorld(random) {
  const moth = {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    angle: 0,
    flap: 0,
    invulnerable: 0,
    speed: 0,
  };
  const pollen = [];
  for (let index = 0; index < POOL.pollen; index += 1) {
    pollen.push({ active: false, x: 0, y: 0, phase: 0, drift: 0, sway: 0 });
  }
  const bats = [];
  for (let index = 0; index < POOL.bats; index += 1) {
    bats.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, wobble: 0, stun: 0 });
  }
  const webs = [];
  for (let index = 0; index < POOL.webs; index += 1) {
    webs.push({ active: false, x: 0, y: 0, age: 0 });
  }
  const sparks = [];
  for (let index = 0; index < POOL.sparks; index += 1) {
    sparks.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, ttl: 0, size: 0 });
  }
  const fireflies = [];
  for (let index = 0; index < POOL.fireflies; index += 1) {
    fireflies.push({
      x: random() * FIELD.width,
      y: 40 + random() * (FIELD.gardenY - 120),
      phase: random() * Math.PI * 2,
      speed: 6 + random() * 14,
    });
  }
  const state = {
    moth,
    pollen,
    bats,
    webs,
    sparks,
    fireflies,
    score: 0,
    lives: LIVES,
    level: 1,
    pollenCount: 0,
    light: LIGHT.start,
    elapsed: 0,
    shake: 0,
    pollenTimer: POLLEN.interval,
    batTimer: BAT.interval,
    webTimer: WEB.interval,
  };

  function reset() {
    moth.x = FIELD.width / 2;
    moth.y = FIELD.height / 2;
    moth.angle = 0;
    moth.flap = 0;
    moth.invulnerable = 0;
    moth.speed = 0;
    for (const orb of pollen) orb.active = false;
    for (const bat of bats) bat.active = false;
    for (const web of webs) web.active = false;
    for (const spark of sparks) spark.active = false;
    state.score = 0;
    state.lives = LIVES;
    state.level = 1;
    state.pollenCount = 0;
    state.light = LIGHT.start;
    state.elapsed = 0;
    state.shake = 0;
    state.pollenTimer = POLLEN.interval;
    state.batTimer = BAT.interval;
    state.webTimer = WEB.interval;
  }

  function freeSlot(list) {
    for (let index = 0; index < list.length; index += 1) {
      if (!list[index].active) return list[index];
    }
    return null;
  }

  function countActive(list) {
    let count = 0;
    for (const item of list) if (item.active) count += 1;
    return count;
  }

  function spawnPollen() {
    const orb = freeSlot(pollen);
    if (orb === null) return;
    orb.active = true;
    orb.x = 40 + random() * (FIELD.width - 80);
    orb.y = 60 + random() * (FIELD.gardenY - 140);
    orb.phase = random() * Math.PI * 2;
    orb.drift = POLLEN.driftMin + random() * (POLLEN.driftMax - POLLEN.driftMin);
    orb.sway = 8 + random() * 14;
  }

  function spawnBat() {
    const bat = freeSlot(bats);
    if (bat === null) return;
    bat.active = true;
    const edge = Math.floor(random() * 3);
    if (edge === 0) {
      bat.x = random() * FIELD.width;
      bat.y = -30;
    } else if (edge === 1) {
      bat.x = -30;
      bat.y = 40 + random() * (FIELD.gardenY - 120);
    } else {
      bat.x = FIELD.width + 30;
      bat.y = 40 + random() * (FIELD.gardenY - 120);
    }
    bat.vx = 0;
    bat.vy = 0;
    bat.wobble = random() * Math.PI * 2;
    bat.stun = 0;
  }

  function spawnWeb() {
    const web = freeSlot(webs);
    if (web === null) return;
    web.active = true;
    web.x = 100 + random() * (FIELD.width - 200);
    web.y = 100 + random() * (FIELD.gardenY - 220);
    web.age = 0;
  }

  function burst(x, y, count, speed) {
    for (let index = 0; index < count; index += 1) {
      const spark = freeSlot(sparks);
      if (spark === null) return;
      const angle = random() * Math.PI * 2;
      const push = speed * (0.4 + random() * 0.6);
      spark.active = true;
      spark.x = x;
      spark.y = y;
      spark.vx = Math.cos(angle) * push;
      spark.vy = Math.sin(angle) * push - 20;
      spark.ttl = 0.4 + random() * 0.3;
      spark.size = 2 + random() * 3;
    }
  }

  /** The score multiplier from the lantern light: bright light earns more. */
  function multiplier() {
    if (state.light >= LIGHT.mult3At) return 3;
    if (state.light >= LIGHT.mult2At) return 2;
    return 1;
  }

  function batSpeed() {
    return BAT.speed + BAT.speedPerLevel * (state.level - 1);
  }

  function batInterval() {
    return Math.max(BAT.minInterval, BAT.interval * BAT.intervalScale ** (state.level - 1));
  }

  function batCap() {
    return Math.min(BAT.maxCap, BAT.maxAtLevel1 + BAT.maxPerLevel * (state.level - 1));
  }

  function pollenCap() {
    return Math.min(POLLEN.maxCap, POLLEN.maxAtLevel1 + POLLEN.maxPerLevel * (state.level - 1));
  }

  function webCap() {
    return state.level >= 4 ? WEB.maxCap : WEB.maxAtLevel1;
  }

  function pollenInterval() {
    return Math.max(
      POLLEN.minInterval,
      POLLEN.interval - POLLEN.intervalPerLevel * (state.level - 1),
    );
  }

  function webInterval() {
    return Math.max(
      WEB.minInterval,
      WEB.interval - WEB.intervalPerLevel * (state.level - 1),
    );
  }

  function hurtMoth(events) {
    state.lives -= 1;
    moth.invulnerable = MOTH.invulnerable;
    state.shake = 1;
    burst(moth.x, moth.y, 10, 120);
    if (state.lives === 0) events |= EVENT_OVER;
    return events;
  }

  /**
   * One fixed step. `steer` carries the keys vector and the mouse target. With
   * `harmless` set (the title screen's backdrop) things drift but nothing touches
   * the moth, nothing scores and the light never drains.
   */
  function step(dt, steer, harmless) {
    let events = 0;
    state.elapsed += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2.2);
    if (moth.invulnerable > 0) moth.invulnerable = Math.max(0, moth.invulnerable - dt);

    // The moth: keyboard steers directly, otherwise it glides toward the mouse.
    let speed = MOTH.speed;
    let inWeb = false;
    for (const web of webs) {
      if (web.active && distance(moth.x, moth.y, web.x, web.y) < WEB.radius) {
        inWeb = true;
        break;
      }
    }
    if (inWeb) speed *= WEB.slow;
    const keys = steer.keys;
    if (keys.x !== 0 || keys.y !== 0) {
      const length = Math.sqrt(keys.x * keys.x + keys.y * keys.y);
      const vx = (keys.x / length) * MOTH.keyboardSpeed * (inWeb ? WEB.slow : 1);
      const vy = (keys.y / length) * MOTH.keyboardSpeed * (inWeb ? WEB.slow : 1);
      moth.x += vx * dt;
      moth.y += vy * dt;
      moth.angle = Math.atan2(vy, vx);
      moth.speed = MOTH.keyboardSpeed;
    } else if (steer.mouse.active) {
      const dx = steer.mouse.x - moth.x;
      const dy = steer.mouse.y - moth.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 6) {
        const move = Math.min(dist, speed * dt);
        moth.x += (dx / dist) * move;
        moth.y += (dy / dist) * move;
        moth.angle = Math.atan2(dy, dx);
        moth.speed = speed;
      } else {
        moth.speed = 0;
      }
    }
    moth.x = Math.min(FIELD.width - MOTH.radius, Math.max(MOTH.radius, moth.x));
    moth.y = Math.min(FIELD.gardenY - MOTH.radius, Math.max(MOTH.radius, moth.y));
    moth.flap += dt * (4 + moth.speed / 60);

    // Wing dust while the moth is moving fast.
    if (moth.speed > 200 && random() < 0.25) {
      burst(moth.x, moth.y + 8, 1, 12);
    }

    // The lantern light slowly fades; at zero it costs a life and relights dimly.
    if (!harmless) {
      state.light = Math.max(0, state.light - LIGHT.drain * dt);
      if (state.light === 0 && moth.invulnerable === 0) {
        state.light = LIGHT.afterDeath;
        events = hurtMoth(events);
        events |= EVENT_HIT;
      }
    }

    // Pollen drifts and is collected on touch.
    state.pollenTimer -= dt;
    if (state.pollenTimer <= 0 && countActive(pollen) < pollenCap()) {
      spawnPollen();
      state.pollenTimer += pollenInterval() + random() * POLLEN.intervalJitter;
    }
    for (const orb of pollen) {
      if (!orb.active) continue;
      orb.y += orb.drift * dt;
      orb.x += Math.sin(state.elapsed * 1.4 + orb.phase) * orb.sway * dt;
      if (orb.y > FIELD.gardenY + 20) {
        orb.active = false;
        continue;
      }
      if (harmless) continue;
      if (distance(moth.x, moth.y, orb.x, orb.y) < MOTH.radius + POLLEN.radius + 6) {
        orb.active = false;
        state.pollenCount += 1;
        state.score += POLLEN.points * multiplier();
        state.light = Math.min(LIGHT.max, state.light + LIGHT.pollenRefill);
        burst(orb.x, orb.y, 8, 90);
        events |= EVENT_POLLEN;
        if (state.pollenCount % LEVEL.pollenPerLevel === 0 && state.level < LEVEL.max) {
          state.level += 1;
          events |= EVENT_LEVEL;
        }
      }
    }

    // Bats chase the moth; a touch costs a life.
    state.batTimer -= dt;
    if (state.batTimer <= 0 && countActive(bats) < batCap()) {
      spawnBat();
      state.batTimer += batInterval();
    }
    for (const bat of bats) {
      if (!bat.active) continue;
      if (bat.stun > 0) {
        bat.stun -= dt;
        bat.x += bat.vx * dt;
        bat.y += bat.vy * dt;
        continue;
      }
      const dx = moth.x - bat.x;
      const dy = moth.y - bat.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const wobble = Math.sin(state.elapsed * BAT.wobble + bat.wobble) * 0.7;
      const nx = dx / dist;
      const ny = dy / dist;
      bat.vx = (nx - ny * wobble) * batSpeed();
      bat.vy = (ny + nx * wobble) * batSpeed();
      bat.x += bat.vx * dt;
      bat.y += bat.vy * dt;
      if (bat.x < -60 || bat.x > FIELD.width + 60 || bat.y < -60 || bat.y > FIELD.height + 60) {
        bat.active = false;
        continue;
      }
      if (harmless || moth.invulnerable > 0) continue;
      if (dist < MOTH.radius + BAT.radius) {
        bat.stun = 0.8;
        bat.vx = -nx * BAT.knockback;
        bat.vy = -ny * BAT.knockback;
        events = hurtMoth(events);
        events |= EVENT_HIT;
        if (state.lives === 0) break;
      }
    }

    // Spider webs appear, slow the moth inside them, then fade away.
    state.webTimer -= dt;
    if (state.webTimer <= 0 && countActive(webs) < webCap()) {
      spawnWeb();
      state.webTimer += webInterval();
    }
    for (const web of webs) {
      if (!web.active) continue;
      web.age += dt;
      if (web.age > WEB.lifetime) web.active = false;
    }

    // Sparks fade; fireflies wander on their own slow paths.
    for (const spark of sparks) {
      if (!spark.active) continue;
      spark.ttl -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 60 * dt;
      if (spark.ttl <= 0) spark.active = false;
    }
    for (const fly of state.fireflies) {
      fly.x += Math.sin(state.elapsed * 0.5 + fly.phase) * fly.speed * dt;
      fly.y += Math.cos(state.elapsed * 0.4 + fly.phase * 2) * fly.speed * 0.5 * dt;
      if (fly.x < 0) fly.x += FIELD.width;
      if (fly.x > FIELD.width) fly.x -= FIELD.width;
      if (fly.y < 30) fly.y = 30;
      if (fly.y > FIELD.gardenY - 30) fly.y = FIELD.gardenY - 30;
    }

    return events;
  }

  reset();
  return { state, reset, step, multiplier };
}
