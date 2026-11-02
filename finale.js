// The last page: saying yes clears the buttons and sets off falling hearts.
// Loaded after script.js, which provides reducedMotion.
const HEART_COUNT = 120;
const HEART_SPREAD = 6000; // how long new hearts keep starting to fall, in ms

function dropHeart() {
  const heart = document.createElement("div");
  heart.className = "falling-heart";
  heart.textContent = "♥︎"; // the variation selector keeps phones from drawing an emoji
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${16 + Math.random() * 28}px`;
  heart.style.animationDuration = `${3 + Math.random() * 3}s`;
  heart.style.animationDelay = `${Math.random() * HEART_SPREAD}ms`;
  heart.addEventListener("animationend", () => heart.remove());
  document.body.append(heart);
}

document.getElementById("forward").addEventListener("click", () => {
  document.querySelector(".choices").remove();
  document.getElementById("chase-message").remove();
  document.getElementById("ending").hidden = false;

  if (reducedMotion.matches) return;
  for (let i = 0; i < HEART_COUNT; i += 1) dropHeart();
});
