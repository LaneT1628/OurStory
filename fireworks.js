// The first page's clickable heart, which explodes into fireworks.
// Loaded after script.js, which provides reducedMotion.
const secretHeart = document.getElementById("secret-heart");
const fireworksNote = document.getElementById("fireworks-message");
const canvas = document.getElementById("fireworks");
const context = canvas.getContext("2d");

const COLORS = ["#b5475a", "#e0902f", "#d6336c", "#7a3b69", "#f0b429"];
const BURST_COUNT = 7;
const BURST_GAP = 280; // time between bursts, in ms
const SPARKS_PER_BURST = 70;
const SPARK_LIFE = 1300; // how long a spark lasts, in ms
const DRAG = 600; // how quickly sparks slow down, in ms
const GRAVITY = 0.00012; // in px per ms squared
const BURST_REACH = 0.24; // how far sparks fly, as a share of the screen's shorter side

let sparks = [];
let bursts = [];
let lastDraw = 0;

// A spark's direction and speed (0 to 1): round bursts spread out evenly,
// heart bursts follow the outline of a heart.
function sparkDirection(index, shape) {
  const angle = (index / SPARKS_PER_BURST) * Math.PI * 2;
  if (shape === "heart") {
    const x = 16 * Math.sin(angle) ** 3;
    const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
    return { x: x / 17, y: -y / 17 };
  }
  const speed = 0.4 + Math.random() * 0.6;
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

function addBurst({ x, y, shape }) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const topSpeed = (Math.min(window.innerWidth, window.innerHeight) * BURST_REACH) / DRAG;
  for (let i = 0; i < SPARKS_PER_BURST; i += 1) {
    const direction = sparkDirection(i, shape);
    sparks.push({
      x,
      y,
      velocityX: direction.x * topSpeed,
      velocityY: direction.y * topSpeed,
      age: 0,
      color,
    });
  }
}

function drawFrame(now) {
  const elapsed = Math.min(now - lastDraw, 50);
  lastDraw = now;

  while (bursts.length > 0 && bursts[0].at <= now) {
    addBurst(bursts.shift());
    if (bursts.length === 0) fireworksNote.classList.add("shown");
  }

  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  context.lineWidth = 3;
  context.lineCap = "round";
  sparks = sparks.filter((spark) => spark.age < SPARK_LIFE);
  for (const spark of sparks) {
    const slowdown = Math.exp(-elapsed / DRAG);
    spark.velocityX *= slowdown;
    spark.velocityY = spark.velocityY * slowdown + GRAVITY * elapsed;
    const nextX = spark.x + spark.velocityX * elapsed;
    const nextY = spark.y + spark.velocityY * elapsed;
    spark.age += elapsed;

    context.globalAlpha = 1 - spark.age / SPARK_LIFE;
    context.strokeStyle = spark.color;
    context.beginPath();
    context.moveTo(spark.x, spark.y);
    context.lineTo(nextX, nextY);
    context.stroke();

    spark.x = nextX;
    spark.y = nextY;
  }

  if (bursts.length > 0 || sparks.length > 0) {
    requestAnimationFrame(drawFrame);
  } else {
    secretHeart.classList.remove("popped");
  }
}

function launchFireworks() {
  const scale = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * scale;
  canvas.height = window.innerHeight * scale;
  context.setTransform(scale, 0, 0, scale, 0, 0);

  const start = performance.now();
  const box = secretHeart.getBoundingClientRect();
  bursts = [{ at: start, x: box.left + box.width / 2, y: box.top + box.height / 2, shape: "heart" }];
  for (let i = 1; i < BURST_COUNT; i += 1) {
    bursts.push({
      at: start + i * BURST_GAP,
      x: window.innerWidth * (0.15 + Math.random() * 0.7),
      y: window.innerHeight * (0.15 + Math.random() * 0.45),
      shape: i % 2 === 0 ? "heart" : "round",
    });
  }
  lastDraw = start;
  requestAnimationFrame(drawFrame);
}

secretHeart.addEventListener("click", () => {
  if (secretHeart.classList.contains("popped")) return;
  if (reducedMotion.matches) {
    fireworksNote.classList.add("shown");
    return;
  }
  secretHeart.classList.add("popped");
  launchFireworks();
});
