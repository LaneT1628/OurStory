// The Brick by Brick page: each click on the button builds the next stage of the house.
const brickButton = document.getElementById("brick-button");
const build = document.getElementById("build");
const buildPhoto = document.getElementById("build-photo");
const house = document.getElementById("house");

// Bricks sit on a grid of half-brick cells, with row 0 at the bottom.
const CELL = 16;
const ROW = 16;
const GAP = 2;
const LEFT = 32; // where cell 0 starts, in SVG units
const GROUND = 376; // the bottom of row 0, in SVG units
const WALL_CELLS = 16;
const BUILD_TIME = 1500; // how long a stage takes to lay its bricks, in ms

const DOOR = { firstCell: 6, lastCell: 9, firstRow: 0, lastRow: 6 };
const WINDOWS = [
  { firstCell: 2, lastCell: 4, firstRow: 6, lastRow: 9 },
  { firstCell: 11, lastCell: 13, firstRow: 6, lastRow: 9 },
];

function isOpening(cell, row) {
  return [DOOR, ...WINDOWS].some((opening) => (
    cell >= opening.firstCell && cell <= opening.lastCell
    && row >= opening.firstRow && row <= opening.lastRow
  ));
}

// One row of staggered bricks, using half bricks at the ends and around openings.
function brickRow(firstCell, lastCell, row, className) {
  const bricks = [];
  let cell = firstCell;
  while (cell <= lastCell) {
    if (isOpening(cell, row)) {
      cell += 1;
    } else {
      const half = (cell === firstCell && row % 2 === 1) || cell === lastCell || isOpening(cell + 1, row);
      const length = half ? 1 : 2;
      bricks.push({
        x: LEFT + cell * CELL,
        y: GROUND - (row + 1) * ROW,
        width: length * CELL - GAP,
        height: ROW - GAP,
        className,
      });
      cell += length;
    }
  }
  return bricks;
}

function wallRows(firstRow, lastRow) {
  const bricks = [];
  for (let row = firstRow; row <= lastRow; row += 1) {
    bricks.push(...brickRow(0, WALL_CELLS - 1, row, "brick"));
  }
  return bricks;
}

function roofRows() {
  const bricks = [];
  for (let step = 0; step < 9; step += 1) {
    bricks.push(...brickRow(step - 1, WALL_CELLS - step, 14 + step, "brick roof-brick"));
  }
  return bricks;
}

function fitting(opening, className) {
  const cells = opening.lastCell - opening.firstCell + 1;
  const rows = opening.lastRow - opening.firstRow + 1;
  return {
    x: LEFT + opening.firstCell * CELL,
    y: GROUND - (opening.lastRow + 1) * ROW,
    width: cells * CELL - GAP,
    height: rows * ROW - GAP,
    className,
  };
}

// Each stage is one click.
const STAGES = [
  {
    parts: wallRows(0, 5),
    photo: {
      src: "images/little-things.jpg",
      alt: "Holding hands on the couch while we both work on our laptops",
      caption: "It's the little things...",
    },
  },
  {
    parts: [
      ...wallRows(6, 13),
      fitting(DOOR, "brick door"),
      ...WINDOWS.map((opening) => fitting(opening, "brick window")),
    ],
    photo: {
      src: "images/foundation.jpg",
      alt: "The two of us in a selfie, holding up a red LEGO rose",
      caption: "that lay the foundation",
    },
  },
  {
    parts: roofRows(),
    photo: {
      src: "images/strong-house.jpg",
      alt: "A selfie of the two of us smiling on the beach, with houses on the dunes behind us",
      caption: "for something that's as strong as a house!",
    },
  },
];

function layPart(part, delay) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", part.x);
  rect.setAttribute("y", part.y);
  rect.setAttribute("width", part.width);
  rect.setAttribute("height", part.height);
  rect.setAttribute("rx", 1.5);
  rect.setAttribute("class", part.className);
  rect.style.animationDelay = `${delay}ms`;
  house.append(rect);
}

function showPhoto({ src, alt, caption }) {
  const image = buildPhoto.querySelector("img");
  image.src = src;
  image.alt = alt;
  buildPhoto.querySelector("figcaption").textContent = caption;
  buildPhoto.hidden = false;
  buildPhoto.animate([{ opacity: 0 }, { opacity: 1 }], 800);
}

let nextStage = 0;

brickButton.addEventListener("click", () => {
  const { parts, photo } = STAGES[nextStage];
  build.hidden = false;
  parts.forEach((part, index) => layPart(part, (index / parts.length) * BUILD_TIME));
  if (photo) showPhoto(photo);

  nextStage += 1;
  if (nextStage === STAGES.length) brickButton.remove();
});
