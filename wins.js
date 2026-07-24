const winTotals = [
  ["Arizona Cardinals", "ari", 3.5, "-145", "+125"],
  ["Atlanta Falcons", "atl", 7.5, "+115", "-135"],
  ["Baltimore Ravens", "bal", 10.5, "-140", "+120"],
  ["Buffalo Bills", "buf", 10.5, "-125", "+105"],
  ["Carolina Panthers", "car", 6.5, "-140", "+120"],
  ["Chicago Bears", "chi", 9.5, "+110", "-130"],
  ["Cincinnati Bengals", "cin", 10.5, "+105", "-125"],
  ["Cleveland Browns", "cle", 5.5, "-105", "-115"],
  ["Dallas Cowboys", "dal", 9.5, "+105", "-125"],
  ["Denver Broncos", "den", 9.5, "-115", "-105"],
  ["Detroit Lions", "det", 10.5, "-125", "+105"],
  ["Green Bay Packers", "gb", 9.5, "-110", "-110"],
  ["Houston Texans", "hou", 9.5, "-120", "+100"],
  ["Indianapolis Colts", "ind", 7.5, "-125", "+105"],
  ["Jacksonville Jaguars", "jax", 8.5, "-135", "+115"],
  ["Kansas City Chiefs", "kc", 9.5, "-140", "+120"],
  ["Las Vegas Raiders", "lv", 5.5, "-135", "+115"],
  ["Los Angeles Chargers", "lac", 9.5, "-130", "+110"],
  ["Los Angeles Rams", "lar", 11.5, "-140", "+120"],
  ["Miami Dolphins", "mia", 3.5, "-140", "+120"],
  ["Minnesota Vikings", "min", 8.5, "-105", "-115"],
  ["New England Patriots", "ne", 10.5, "+120", "-140"],
  ["New Orleans Saints", "no", 7.5, "-125", "+105"],
  ["New York Giants", "nyg", 7.5, "+100", "-120"],
  ["New York Jets", "nyj", 5.5, "+100", "-120"],
  ["Philadelphia Eagles", "phi", 9.5, "-140", "+120"],
  ["Pittsburgh Steelers", "pit", 7.5, "-145", "+125"],
  ["San Francisco 49ers", "sf", 10.5, "+115", "-135"],
  ["Seattle Seahawks", "sea", 10.5, "-110", "-110"],
  ["Tampa Bay Buccaneers", "tb", 7.5, "-140", "+120"],
  ["Tennessee Titans", "ten", 6.5, "+115", "-135"],
  ["Washington Commanders", "wsh", 7.5, "-120", "+100"]
];

const PICKS_KEY = "nfl-win-total-picks-v1";
const markets = document.querySelector("#wins-markets");
const picksList = document.querySelector("#picks-list");
const emptyPicks = document.querySelector("#empty-picks");
const pickCount = document.querySelector("#pick-count");
let picks = loadPicks();

function loadPicks() {
  try { return JSON.parse(localStorage.getItem(PICKS_KEY)) || {}; }
  catch { return {}; }
}

function logoUrl(abbreviation) {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation}.png`;
}

for (const [name, abbreviation, line, overOdds, underOdds] of winTotals) {
  const card = document.createElement("article");
  card.className = "win-card";
  card.innerHTML = `<div class="win-team"><img src="${logoUrl(abbreviation)}" alt=""><div><h3>${name}</h3><p>Regular-season wins</p></div><strong class="win-line">${line}</strong></div><div class="win-buttons"></div>`;
  const buttons = card.querySelector(".win-buttons");
  [["Over", overOdds], ["Under", underOdds]].forEach(([side, odds]) => {
    const button = document.createElement("button");
    const selected = picks[abbreviation]?.side === side;
    button.className = `win-button${selected ? " selected" : ""}`;
    button.type = "button";
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-label", `${name} ${side} ${line} wins at ${odds}`);
    button.innerHTML = `<span>${side} ${line}</span><strong>${odds}</strong>`;
    button.addEventListener("click", () => selectPick(name, abbreviation, line, side, odds, buttons));
    buttons.append(button);
  });
  markets.append(card);
}

function selectPick(name, abbreviation, line, side, odds, buttons) {
  const alreadySelected = picks[abbreviation]?.side === side;
  if (alreadySelected) delete picks[abbreviation];
  else picks[abbreviation] = { name, abbreviation, line, side, odds };
  buttons.querySelectorAll(".win-button").forEach((button) => {
    const selected = !alreadySelected && button.textContent.includes(side);
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
  renderPicks();
}

function renderPicks() {
  picksList.replaceChildren();
  for (const [, abbreviation] of winTotals) {
    const pick = picks[abbreviation];
    if (!pick) continue;
    const row = document.createElement("div");
    row.className = "pick-row";
    row.innerHTML = `<img src="${logoUrl(abbreviation)}" alt=""><div><span>${pick.side} ${pick.line} wins</span><strong>${pick.name}</strong></div><b class="pick-odds">${pick.odds}</b>`;
    picksList.append(row);
  }
  const total = Object.keys(picks).length;
  pickCount.textContent = `${total}/32`;
  emptyPicks.hidden = total > 0;
}

document.querySelector("#clear-picks").addEventListener("click", () => {
  picks = {};
  localStorage.removeItem(PICKS_KEY);
  document.querySelectorAll(".win-button").forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  renderPicks();
});

renderPicks();
