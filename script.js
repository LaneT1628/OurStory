// Shared by every page with a forward button and a button that runs away.
const forward = document.getElementById("forward");
const runaway = document.getElementById("runaway");
const home = runaway.parentElement;
const message = document.getElementById("chase-message");
const main = document.querySelector("main");

const KEEP_DISTANCE = 24; // gap the button keeps from the pointer, in px
const SMOOTHING = 80; // how slowly the button catches up to where it's headed, in ms
const OBSTACLE_GAP = 8;
const EDGE_MARGIN = 16;
const TURN_STEP = Math.PI / 24;
const CHASE_TIME = 2000; // how long the button must be chased before the message, in ms
const CHASE_DISTANCE = 200; // how far the button must travel in that chase, in px
const CHASE_PAUSE = 1500; // a break this long, in ms, starts the chase over

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// The button's offset from its starting spot: where it is now, and where it's headed.
const current = { x: 0, y: 0 };
const target = { x: 0, y: 0 };
let lastFrame = null;

let chaseStart = 0;
let lastDodge = -Infinity;
let chaseDistance = 0;

// Distance from a point to the nearest edge of a rect (0 if inside it).
function distanceToRect(x, y, rect) {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

function overlaps(a, b, gap) {
  return (
    a.left < b.right + gap &&
    a.right > b.left - gap &&
    a.top < b.bottom + gap &&
    a.bottom > b.top - gap
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function makeRect(left, top) {
  return { left, top, right: left + runaway.offsetWidth, bottom: top + runaway.offsetHeight };
}

// Shows the message once the chase has gone on long enough, waiting until the
// button isn't headed for the spot where the message appears.
function trackChase(trip, spot) {
  const now = performance.now();
  if (now - lastDodge > CHASE_PAUSE) {
    chaseStart = now;
    chaseDistance = 0;
  }
  lastDodge = now;
  chaseDistance += trip;

  const chasedEnough = now - chaseStart >= CHASE_TIME && chaseDistance >= CHASE_DISTANCE;
  if (chasedEnough && !overlaps(spot, message.getBoundingClientRect(), OBSTACLE_GAP)) {
    message.classList.add("shown");
  }
}

// Slides a spot along a heading until it clears the pointer.
function pushClear(spot, heading, pointerX, pointerY) {
  let { left, top } = spot;
  while (distanceToRect(pointerX, pointerY, makeRect(left, top)) < KEEP_DISTANCE) {
    left += Math.cos(heading);
    top += Math.sin(heading);
  }
  return makeRect(
    clamp(left, EDGE_MARGIN, window.innerWidth - runaway.offsetWidth - EDGE_MARGIN),
    clamp(top, EDGE_MARGIN, window.innerHeight - runaway.offsetHeight - EDGE_MARGIN),
  );
}

// Moves the button directly away from the pointer, just far enough to clear
// it. If a wall, the forward button or the message blocks that heading, turns
// as little as needed to slide past.
function stepAway(pointerX, pointerY) {
  const origin = home.getBoundingClientRect();
  const spot = makeRect(origin.left + target.x, origin.top + target.y);
  if (distanceToRect(pointerX, pointerY, spot) >= KEEP_DISTANCE) return;

  const centerX = (spot.left + spot.right) / 2;
  const centerY = (spot.top + spot.bottom) / 2;
  const away = Math.atan2(centerY - pointerY, centerX - pointerX);
  const obstacles = [forward];
  if (message.classList.contains("shown")) obstacles.push(message);
  const obstacleRects = obstacles.map((obstacle) => obstacle.getBoundingClientRect());
  let best = null;

  for (let turn = 0; turn <= Math.PI && !best; turn += TURN_STEP) {
    for (const heading of [away + turn, away - turn]) {
      const candidate = pushClear(spot, heading, pointerX, pointerY);
      const clear = distanceToRect(pointerX, pointerY, candidate) >= KEEP_DISTANCE - 0.5;
      const open = obstacleRects.every((rect) => !overlaps(candidate, rect, OBSTACLE_GAP));
      if (clear && open) {
        best = candidate;
        break;
      }
    }
  }
  if (!best) return;

  trackChase(Math.hypot(best.left - spot.left, best.top - spot.top), best);
  target.x = best.left - origin.left;
  target.y = best.top - origin.top;
  if (lastFrame === null) {
    lastFrame = performance.now();
    requestAnimationFrame(glide);
  }
}

function glide(now) {
  const elapsed = now - lastFrame;
  lastFrame = now;
  const ease = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / SMOOTHING);
  current.x += (target.x - current.x) * ease;
  current.y += (target.y - current.y) * ease;

  if (Math.hypot(target.x - current.x, target.y - current.y) < 0.1) {
    current.x = target.x;
    current.y = target.y;
    lastFrame = null;
  } else {
    requestAnimationFrame(glide);
  }
  runaway.style.transform = `translate(${current.x}px, ${current.y}px)`;
}

document.addEventListener("pointermove", (event) => {
  stepAway(event.clientX, event.clientY);
});

// Touch screens have no hover, so the button only moves once it's tapped.
runaway.addEventListener("pointerdown", (event) => {
  stepAway(event.clientX, event.clientY);
});

// A resize could strand the button off screen, so send it back to its starting spot.
window.addEventListener("resize", () => {
  current.x = current.y = target.x = target.y = 0;
  runaway.style.transform = "";
});

// Fades the page out before moving on to the next page. The last page's
// forward button has nowhere to go, so it's left to that page's own script.
if (forward.href) {
  forward.addEventListener("click", (event) => {
    event.preventDefault();
    main.addEventListener("animationend", () => {
      window.location.href = forward.href;
    }, { once: true });
    main.classList.add("fade-out");
  });
}

// The Back button can restore this page as it was left, fully faded out.
window.addEventListener("pageshow", () => {
  main.classList.remove("fade-out");
});
