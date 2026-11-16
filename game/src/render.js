// All canvas drawing: the night garden, the moth and its lantern glow, pollen,
// bats, webs, fireflies, the HUD, and the title, pause and game-over screens.
// The renderer scales the fixed 1280x720 playfield to the window, so the game
// looks the same on any desktop screen.

import { BAT, FIELD, FONT, LIGHT, MOTH, PALETTE, POLLEN, WEB } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

/** A tiny local generator for the fixed stars and flowers: same sky every run. */
function makeFixedRandom(seed) {
  let state = seed | 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const fixed = makeFixedRandom(20261116);
  const stars = [];
  for (let index = 0; index < 90; index += 1) {
    stars.push({
      x: fixed() * FIELD.width,
      y: fixed() * 420,
      size: 0.6 + fixed() * 1.6,
      twinkle: fixed() * Math.PI * 2,
    });
  }
  const flowers = [];
  for (let index = 0; index < 26; index += 1) {
    flowers.push({
      x: 30 + fixed() * (FIELD.width - 60),
      y: FIELD.gardenY + 8 + fixed() * 56,
      height: 18 + fixed() * 30,
      petals: 5 + Math.floor(fixed() * 3),
      hue: fixed(),
    });
  }
  const grass = [];
  for (let index = 0; index < 120; index += 1) {
    grass.push({
      x: fixed() * FIELD.width,
      y: FIELD.gardenY + 14 + fixed() * 52,
      height: 10 + fixed() * 22,
      lean: (fixed() - 0.5) * 14,
    });
  }

  function resize() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.clientWidth * scale);
    canvas.height = Math.floor(canvas.clientHeight * scale);
  }

  function fit() {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const offsetX = (canvas.width - FIELD.width * scale) / 2;
    const offsetY = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  }

  function drawSky(elapsed) {
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    for (const star of stars) {
      const alpha = 0.35 + 0.35 * Math.sin(elapsed * 0.8 + star.twinkle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e8ecff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
    // The moon, high on the right, with a soft halo.
    const halo = ctx.createRadialGradient(880, 110, 10, 880, 110, 120);
    halo.addColorStop(0, 'rgba(245, 230, 184, 0.35)');
    halo.addColorStop(1, 'rgba(245, 230, 184, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(750, 0, 260, 240);
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(880, 110, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(190, 175, 130, 0.5)';
    ctx.beginPath();
    ctx.arc(866, 98, 9, 0, Math.PI * 2);
    ctx.arc(892, 122, 7, 0, Math.PI * 2);
    ctx.arc(878, 128, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGardenBack() {
    ctx.fillStyle = PALETTE.gardenBack;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.gardenY);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x, FIELD.gardenY - 14 - Math.sin(x * 0.008) * 12);
    }
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.lineTo(0, FIELD.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawGardenFront() {
    ctx.fillStyle = PALETTE.gardenFront;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.height);
    ctx.lineTo(0, FIELD.gardenY + 34);
    for (let x = 0; x <= FIELD.width; x += 64) {
      ctx.lineTo(x, FIELD.gardenY + 30 + Math.sin(x * 0.011 + 2) * 8);
    }
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.closePath();
    ctx.fill();
    // Grass blades and night flowers along the bottom.
    ctx.strokeStyle = PALETTE.grass;
    ctx.lineWidth = 2;
    for (const blade of grass) {
      ctx.beginPath();
      ctx.moveTo(blade.x, blade.y);
      ctx.quadraticCurveTo(blade.x + blade.lean, blade.y - blade.height * 0.6, blade.x + blade.lean * 1.6, blade.y - blade.height);
      ctx.stroke();
    }
    for (const flower of flowers) {
      ctx.strokeStyle = PALETTE.flower;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(flower.x, flower.y);
      ctx.quadraticCurveTo(flower.x + 3, flower.y - flower.height * 0.6, flower.x, flower.y - flower.height);
      ctx.stroke();
      const glow = flower.hue > 0.7;
      ctx.fillStyle = glow ? PALETTE.flowerGlow : PALETTE.flower;
      for (let petal = 0; petal < flower.petals; petal += 1) {
        const angle = (petal / flower.petals) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(
          flower.x + Math.cos(angle) * 5,
          flower.y - flower.height + Math.sin(angle) * 5,
          3.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(flower.x, flower.y - flower.height, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFireflies(state) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const fly of state.fireflies) {
      const pulse = 0.5 + 0.5 * Math.sin(state.elapsed * 2 + fly.phase);
      const glow = ctx.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, 12);
      glow.addColorStop(0, `rgba(255, 215, 106, ${0.55 * pulse})`);
      glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWebs(state) {
    for (const web of state.webs) {
      if (!web.active) continue;
      const fade = web.age > WEB.lifetime - 3 ? (WEB.lifetime - web.age) / 3 : 1;
      ctx.save();
      ctx.globalAlpha = 0.34 * fade;
      ctx.strokeStyle = PALETTE.web;
      ctx.lineWidth = 1;
      for (let ring = 1; ring <= 3; ring += 1) {
        ctx.beginPath();
        ctx.arc(web.x, web.y, (WEB.radius / 3) * ring, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let spoke = 0; spoke < 8; spoke += 1) {
        const angle = (spoke / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(web.x, web.y);
        ctx.lineTo(web.x + Math.cos(angle) * WEB.radius, web.y + Math.sin(angle) * WEB.radius);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawPollen(state) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const orb of state.pollen) {
      if (!orb.active) continue;
      const pulse = 0.75 + 0.25 * Math.sin(state.elapsed * 3 + orb.phase);
      const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 26);
      glow.addColorStop(0, `rgba(255, 215, 106, ${0.85 * pulse})`);
      glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.pollenCore;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, POLLEN.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBats(state) {
    for (const bat of state.bats) {
      if (!bat.active) continue;
      const flap = Math.sin(state.elapsed * 14 + bat.wobble) * 0.6;
      const heading = Math.atan2(bat.vy, bat.vx);
      ctx.save();
      ctx.translate(bat.x, bat.y);
      ctx.rotate(heading);
      ctx.fillStyle = PALETTE.batWing;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * (0.5 + flap * 0.5));
        ctx.beginPath();
        ctx.ellipse(side * 4, -2, 20, 8, side * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = PALETTE.bat;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.batEye;
      ctx.beginPath();
      ctx.arc(7, -4, 2.2, 0, Math.PI * 2);
      ctx.arc(7, 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawMoth(state) {
    const moth = state.moth;
    const light = state.light;
    const glowRadius = LIGHT.glowMin + (light / LIGHT.max) * (LIGHT.glowMax - LIGHT.glowMin);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(moth.x, moth.y, 0, moth.x, moth.y, glowRadius);
    glow.addColorStop(0, 'rgba(255, 179, 71, 0.5)');
    glow.addColorStop(0.55, 'rgba(255, 179, 71, 0.16)');
    glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(moth.x, moth.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Blink while invulnerable after a hit.
    if (moth.invulnerable > 0 && Math.floor(state.elapsed * 12) % 2 === 0) return;
    ctx.save();
    ctx.translate(moth.x, moth.y);
    ctx.rotate(moth.angle * 0.25);
    const flap = Math.sin(moth.flap) * 0.55;
    ctx.fillStyle = PALETTE.mothWing;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * (0.35 + flap));
      ctx.beginPath();
      ctx.ellipse(side * 13, -6, 13, 9, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.mothWingTip;
      ctx.beginPath();
      ctx.ellipse(side * 20, -10, 6, 4, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.mothWing;
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.mothBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.mothBody;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-3, -12);
    ctx.quadraticCurveTo(-8, -20, -12, -22);
    ctx.moveTo(3, -12);
    ctx.quadraticCurveTo(8, -20, 12, -22);
    ctx.stroke();
    ctx.fillStyle = '#1a1a26';
    ctx.beginPath();
    ctx.arc(-3, -6, 1.8, 0, Math.PI * 2);
    ctx.arc(3, -6, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSparks(state) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const spark of state.sparks) {
      if (!spark.active) continue;
      ctx.globalAlpha = Math.max(0, spark.ttl * 2);
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawWingIcon(x, y, size, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = filled ? PALETTE.mothWing : 'rgba(245, 233, 208, 0.18)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.4, 0, size * 0.55, size * 0.8, -0.5, 0, Math.PI * 2);
    ctx.ellipse(size * 0.4, 0, size * 0.55, size * 0.8, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHud(state, mult) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    // Score, top left.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(String(state.score), 28, 52);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText('SCORE', 28, 76);
    if (mult > 1) {
      ctx.fillStyle = PALETTE.lightBar;
      ctx.font = `700 22px ${FONT}`;
      ctx.fillText(`x${mult}`, 28, 106);
    }
    // Pollen count, under the score.
    ctx.fillStyle = PALETTE.pollen;
    ctx.beginPath();
    ctx.arc(36, 128, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `600 18px ${FONT}`;
    ctx.fillText(`${state.pollenCount} pollen`, 50, 134);
    // Lives as wings, top right.
    for (let index = 0; index < 3; index += 1) {
      drawWingIcon(FIELD.width - 40 - index * 34, 40, 11, index < state.lives);
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 15px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${state.level}`, FIELD.width - 28, 76);
    // Light meter, centred on top.
    const barWidth = 260;
    const barX = (FIELD.width - barWidth) / 2;
    const barY = 30;
    ctx.fillStyle = 'rgba(11, 14, 34, 0.7)';
    ctx.fillRect(barX - 6, barY - 6, barWidth + 12, 30);
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(barX, barY, barWidth, 18);
    const lightFraction = state.light / LIGHT.max;
    ctx.fillStyle = lightFraction < 0.25 ? PALETTE.lightBarLow : PALETTE.lightBar;
    ctx.fillRect(barX, barY, barWidth * lightFraction, 18);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('LANTERN LIGHT', FIELD.width / 2, barY + 34);
    // Corner hints.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('Mouse or WASD to fly · M mute · P pause', 28, FIELD.height - 16);
  }

  function drawPanel() {
    ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawTitle(state, best) {
    drawPanel();
    // The title moth, drawn twice as large so the cover reads at a glance.
    ctx.save();
    ctx.translate(FIELD.width / 2, 250);
    ctx.scale(2, 2);
    ctx.translate(-FIELD.width / 2, -250);
    drawMoth({ ...state, moth: { ...state.moth, x: FIELD.width / 2, y: 250, angle: 0, flap: state.elapsed * 2, invulnerable: 0, speed: 300 }, light: 80 });
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.lightBar;
    ctx.font = `800 92px ${FONT}`;
    ctx.fillText('MOTHLIGHT', FIELD.width / 2, 150);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText('A moth, a lantern, a night garden.', FIELD.width / 2, 330);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 19px ${FONT}`;
    ctx.fillText('Collect glowing pollen to feed your light. Dodge the bats.', FIELD.width / 2, 368);
    ctx.fillText('Spider webs slow you down. Every 15 pollen, the night gets harder.', FIELD.width / 2, 396);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText('Move: mouse or WASD / arrows   ·   M: mute   ·   P: pause', FIELD.width / 2, 448);
    if (best > 0) {
      ctx.fillStyle = PALETTE.pollen;
      ctx.font = `700 22px ${FONT}`;
      ctx.fillText(`Best score: ${best}`, FIELD.width / 2, 496);
    }
    ctx.fillStyle = PALETTE.lightBar;
    ctx.font = `700 26px ${FONT}`;
    const blink = 0.6 + 0.4 * Math.sin(state.elapsed * 3);
    ctx.globalAlpha = blink;
    ctx.fillText('Click or press Enter to fly', FIELD.width / 2, 556);
    ctx.globalAlpha = 1;
  }

  function drawPaused() {
    drawPanel();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 56px ${FONT}`;
    ctx.fillText('Paused', FIELD.width / 2, 330);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText('P or Esc to keep flying · M to mute', FIELD.width / 2, 380);
  }

  function drawOver(state, best) {
    drawPanel();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.lightBar;
    ctx.font = `800 58px ${FONT}`;
    ctx.fillText('The light went out', FIELD.width / 2, 210);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 64px ${FONT}`;
    ctx.fillText(String(state.score), FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 20px ${FONT}`;
    ctx.fillText('SCORE', FIELD.width / 2, 330);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(`Best ${best}   ·   ${state.pollenCount} pollen   ·   Level ${state.level}`, FIELD.width / 2, 384);
    ctx.fillStyle = PALETTE.lightBar;
    ctx.font = `700 26px ${FONT}`;
    const blink = 0.6 + 0.4 * Math.sin(state.elapsed * 3);
    ctx.globalAlpha = blink;
    ctx.fillText('Press R or click to fly again', FIELD.width / 2, 452);
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.45,
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.85,
    );
    gradient.addColorStop(0, 'rgba(5, 6, 16, 0)');
    gradient.addColorStop(1, 'rgba(5, 6, 16, 0.55)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function draw(state, screen, best, mult) {
    if (canvas.width !== Math.floor(canvas.clientWidth * (window.devicePixelRatio || 1))) resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    fit();
    // The screen shake belongs to play only: on the title and game-over screens
    // it would slide the overlay off the playfield and leave a dark seam.
    if (screen === SCREEN_PLAY && state.shake > 0) {
      const magnitude = state.shake * 9;
      const dx = Math.sin(state.elapsed * 91) * magnitude;
      const dy = Math.cos(state.elapsed * 113) * magnitude;
      ctx.translate(dx, dy);
    }
    drawSky(state.elapsed);
    drawGardenBack();
    drawFireflies(state);
    drawWebs(state);
    drawPollen(state);
    drawBats(state);
    drawMoth(state);
    drawSparks(state);
    drawGardenFront();
    drawVignette();
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, mult);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  resize();
  return { draw, resize };
}
