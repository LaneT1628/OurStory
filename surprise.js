// The heart on the One Moment page, which turns into a photo for a few seconds.
// The timing lives in style.css: the heart comes back when the fade ends.
const secretHeart = document.getElementById("secret-heart");
const surprise = document.getElementById("surprise");

secretHeart.addEventListener("click", () => {
  secretHeart.hidden = true;
  surprise.hidden = false;
});

surprise.addEventListener("animationend", () => {
  surprise.hidden = true;
  secretHeart.hidden = false;
});
