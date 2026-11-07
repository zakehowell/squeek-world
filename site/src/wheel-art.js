// Original pixel artwork of Squeektoshi, drawn from the approved Squeek Pet hamster.
// Each sprite is a horizontal PNG strip; CSS steps through its frames.
// The hero loop is decorative: its pace is never a hardware or RPM reading.
export const SPRITES = Object.freeze({
  wheel: { src: "assets/pet/wheel-run.png", frames: 6, width: 80, height: 86 },
  run: { src: "assets/pet/scene-run.png", frames: 6, width: 150, height: 107 },
  sleep: { src: "assets/pet/scene-sleep.png", frames: 4, width: 150, height: 107 },
  wake: { src: "assets/pet/scene-wake.png", frames: 1, width: 150, height: 107 },
  eat: { src: "assets/pet/scene-eat.png", frames: 2, width: 150, height: 107 },
  burp: { src: "assets/pet/scene-burp.png", frames: 1, width: 150, height: 107 },
  celebrate: { src: "assets/pet/scene-celebrate.png", frames: 2, width: 150, height: 107 },
  offline: { src: "assets/pet/scene-offline.png", frames: 1, width: 150, height: 107 },
  fault: { src: "assets/pet/scene-fault.png", frames: 1, width: 150, height: 107 },
  pat: { src: "assets/pet/scene-pat.png", frames: 2, width: 150, height: 107 },
  grumpy: { src: "assets/pet/scene-grumpy.png", frames: 1, width: 150, height: 107 },
  // Close-ups for the state gallery: wheel states keep the wheel, the rest the bowl and nest.
  "card-run": { src: "assets/pet/card-run.png", frames: 6, width: 90, height: 107 },
  "card-celebrate": { src: "assets/pet/card-celebrate.png", frames: 2, width: 90, height: 107 },
  "card-pat": { src: "assets/pet/card-pat.png", frames: 2, width: 90, height: 107 },
  "card-sleep": { src: "assets/pet/card-sleep.png", frames: 4, width: 80, height: 107 },
  "card-wake": { src: "assets/pet/card-wake.png", frames: 1, width: 80, height: 107 },
  "card-eat": { src: "assets/pet/card-eat.png", frames: 2, width: 80, height: 107 },
  "card-burp": { src: "assets/pet/card-burp.png", frames: 1, width: 80, height: 107 },
  "card-offline": { src: "assets/pet/card-offline.png", frames: 1, width: 80, height: 107 },
  "card-fault": { src: "assets/pet/card-fault.png", frames: 1, width: 80, height: 107 },
  "card-grumpy": { src: "assets/pet/card-grumpy.png", frames: 1, width: 80, height: 107 },
});

/**
 * Markup for one sprite. `base` is the path back to the site root ("./" on the
 * entry page, "../" on /dashboard/, /pet/ and /world/). The frame size, frame
 * count and speed are CSS variables, so the same strip can be shown at any
 * whole-pixel scale.
 */
export function sprite(name, { base = "./", className = "", speed = "", label = "" } = {}) {
  const s = SPRITES[name];
  if (!s) return "";
  const vars = `--frames: ${s.frames}; --w: ${s.width}px; --h: ${s.height}px${speed ? `; --speed: ${speed}` : ""}`;
  const still = s.frames === 1 ? " is-still" : "";
  const role = label ? ` role="img" aria-label="${label}"` : "";
  return `<span class="px-sprite${still}${className ? " " + className : ""}" style="${vars}"${role}><img class="pixel" src="${base}${s.src}" alt="" width="${s.width * s.frames}" height="${s.height}" decoding="async"></span>`;
}

export function wheelArt(base = "./") {
  return sprite("wheel", { base, className: "hero-sprite" });
}
