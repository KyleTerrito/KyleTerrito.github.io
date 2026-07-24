const teams = [
  ["Arizona Cardinals", "ari"], ["Atlanta Falcons", "atl"], ["Baltimore Ravens", "bal"],
  ["Buffalo Bills", "buf"], ["Carolina Panthers", "car"], ["Chicago Bears", "chi"],
  ["Cincinnati Bengals", "cin"], ["Cleveland Browns", "cle"], ["Dallas Cowboys", "dal"],
  ["Denver Broncos", "den"], ["Detroit Lions", "det"], ["Green Bay Packers", "gb"],
  ["Houston Texans", "hou"], ["Indianapolis Colts", "ind"], ["Jacksonville Jaguars", "jax"],
  ["Kansas City Chiefs", "kc"], ["Las Vegas Raiders", "lv"], ["Los Angeles Chargers", "lac"],
  ["Los Angeles Rams", "lar"], ["Miami Dolphins", "mia"], ["Minnesota Vikings", "min"],
  ["New England Patriots", "ne"], ["New Orleans Saints", "no"], ["New York Giants", "nyg"],
  ["New York Jets", "nyj"], ["Philadelphia Eagles", "phi"], ["Pittsburgh Steelers", "pit"],
  ["San Francisco 49ers", "sf"], ["Seattle Seahawks", "sea"], ["Tampa Bay Buccaneers", "tb"],
  ["Tennessee Titans", "ten"], ["Washington Commanders", "wsh"]
];

const STORAGE_KEY = "nfl-futures-board-v1";
const board = document.querySelector("#team-board");
const template = document.querySelector("#team-template");
const resetButton = document.querySelector("#reset-button");
let positions = loadPositions();

for (const [name, abbreviation] of teams) {
  const card = template.content.firstElementChild.cloneNode(true);
  const image = card.querySelector(".team-logo");
  card.dataset.team = abbreviation;
  card.setAttribute("aria-label", `Drag ${name}`);
  image.src = `https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation}.png`;
  image.alt = `${name} logo`;
  card.querySelector(".team-name").textContent = name.replace("Washington ", "");
  board.append(card);
  enableDragging(card);
}

function loadPositions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function savePositions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function layoutCards() {
  const cards = [...board.querySelectorAll(".team-card")];
  if (!cards.length) return;
  const boardWidth = board.clientWidth;
  const cardWidth = cards[0].offsetWidth;
  const cardHeight = cards[0].offsetHeight;
  const columns = Math.max(2, Math.floor(boardWidth / cardWidth));
  const cellWidth = boardWidth / columns;
  const rowHeight = cardHeight + (boardWidth < 620 ? 13 : 20);
  const startY = 16;

  cards.forEach((card, index) => {
    const saved = positions[card.dataset.team];
    let left;
    let top;
    if (saved) {
      left = saved.x * Math.max(0, boardWidth - cardWidth);
      top = saved.y * Math.max(0, board.clientHeight - cardHeight);
    } else {
      left = (index % columns) * cellWidth + (cellWidth - cardWidth) / 2;
      top = Math.floor(index / columns) * rowHeight + startY;
    }
    card.style.left = `${clamp(left, 0, boardWidth - cardWidth)}px`;
    card.style.top = `${clamp(top, 0, board.clientHeight - cardHeight)}px`;
  });
}

function enableDragging(card) {
  let drag = null;

  card.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const cardRect = card.getBoundingClientRect();
    drag = { pointerId: event.pointerId, offsetX: event.clientX - cardRect.left, offsetY: event.clientY - cardRect.top };
    card.setPointerCapture(event.pointerId);
    card.classList.add("dragging");
    event.preventDefault();
  });

  card.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const boardRect = board.getBoundingClientRect();
    const left = clamp(event.clientX - boardRect.left - drag.offsetX, 0, board.clientWidth - card.offsetWidth);
    const top = clamp(event.clientY - boardRect.top - drag.offsetY, 0, board.clientHeight - card.offsetHeight);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  });

  const finishDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    card.classList.remove("dragging");
    positions[card.dataset.team] = {
      x: parseFloat(card.style.left) / Math.max(1, board.clientWidth - card.offsetWidth),
      y: parseFloat(card.style.top) / Math.max(1, board.clientHeight - card.offsetHeight)
    };
    savePositions();
    drag = null;
  };

  card.addEventListener("pointerup", finishDrag);
  card.addEventListener("pointercancel", finishDrag);
}

resetButton.addEventListener("click", () => {
  positions = {};
  localStorage.removeItem(STORAGE_KEY);
  layoutCards();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layoutCards, 100);
});

window.addEventListener("load", layoutCards);
layoutCards();
