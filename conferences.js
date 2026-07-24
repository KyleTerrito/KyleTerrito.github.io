const conferences = {
  "AFC": [
    ["Buffalo Bills", "buf", "+500"], ["Baltimore Ravens", "bal", "+550"],
    ["Los Angeles Chargers", "lac", "+750"], ["Kansas City Chiefs", "kc", "+750"],
    ["New England Patriots", "ne", "+800"], ["Cincinnati Bengals", "cin", "+900"],
    ["Houston Texans", "hou", "+950"], ["Denver Broncos", "den", "+950"],
    ["Jacksonville Jaguars", "jax", "+1300"], ["Indianapolis Colts", "ind", "+2200"],
    ["Pittsburgh Steelers", "pit", "+2700"], ["Tennessee Titans", "ten", "+6500"],
    ["Las Vegas Raiders", "lv", "+6500"], ["Cleveland Browns", "cle", "+10000"],
    ["New York Jets", "nyj", "+15000"], ["Miami Dolphins", "mia", "+15000"]
  ],
  "NFC": [
    ["Los Angeles Rams", "lar", "+280"], ["Seattle Seahawks", "sea", "+600"],
    ["San Francisco 49ers", "sf", "+800"], ["Detroit Lions", "det", "+900"],
    ["Philadelphia Eagles", "phi", "+950"], ["Green Bay Packers", "gb", "+1100"],
    ["Dallas Cowboys", "dal", "+1200"], ["Chicago Bears", "chi", "+1400"],
    ["Minnesota Vikings", "min", "+2200"], ["Tampa Bay Buccaneers", "tb", "+2200"],
    ["Washington Commanders", "wsh", "+2700"], ["New York Giants", "nyg", "+3300"],
    ["Carolina Panthers", "car", "+3500"], ["Atlanta Falcons", "atl", "+3500"],
    ["New Orleans Saints", "no", "+3500"], ["Arizona Cardinals", "ari", "+15000"]
  ]
};

const PICKS_KEY = "nfl-conference-picks-v1";
const markets = document.querySelector("#conference-markets");
const marketTemplate = document.querySelector("#market-template");
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

for (const [conference, teams] of Object.entries(conferences)) {
  const card = marketTemplate.content.firstElementChild.cloneNode(true);
  const title = card.querySelector(".market-title");
  const options = card.querySelector(".market-options");
  title.querySelector("span").textContent = `${conference} Championship winner`;

  title.addEventListener("click", () => {
    card.classList.toggle("collapsed");
    title.setAttribute("aria-expanded", String(!card.classList.contains("collapsed")));
  });

  for (const [name, abbreviation, teamOdds] of teams) {
    const row = document.createElement("div");
    row.className = "option-row";
    const team = document.createElement("div");
    team.className = "team-option";
    team.dataset.team = abbreviation;
    team.innerHTML = `<img class="option-logo" src="${logoUrl(abbreviation)}" alt="" draggable="false"><span class="option-name">${name}</span>`;

    const oddsButton = document.createElement("button");
    oddsButton.className = "option-odds";
    oddsButton.type = "button";
    oddsButton.textContent = teamOdds;
    const isSelected = picks[conference]?.abbreviation === abbreviation;
    row.classList.toggle("selected", isSelected);
    oddsButton.classList.toggle("selected", isSelected);
    oddsButton.setAttribute("aria-label", `Select ${name} at ${teamOdds}`);
    oddsButton.setAttribute("aria-pressed", String(isSelected));
    oddsButton.addEventListener("click", () => selectTeam(conference, name, abbreviation, teamOdds, options));
    row.append(team, oddsButton);
    options.append(row);
  }
  markets.append(card);
}

function selectTeam(conference, name, abbreviation, teamOdds, options) {
  const isAlreadySelected = picks[conference]?.abbreviation === abbreviation;
  if (isAlreadySelected) delete picks[conference];
  else picks[conference] = { name, abbreviation, odds: teamOdds };

  options.querySelectorAll(".option-row").forEach((row) => {
    const selected = !isAlreadySelected && row.querySelector(".team-option").dataset.team === abbreviation;
    row.classList.toggle("selected", selected);
    const button = row.querySelector(".option-odds");
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
  renderPicks();
}

function renderPicks() {
  picksList.replaceChildren();
  for (const conference of Object.keys(conferences)) {
    const pick = picks[conference];
    if (!pick) continue;
    const row = document.createElement("div");
    row.className = "pick-row";
    row.innerHTML = `<img src="${logoUrl(pick.abbreviation)}" alt=""><div><span>${conference} champion</span><strong>${pick.name}</strong></div><b class="pick-odds">${pick.odds}</b>`;
    picksList.append(row);
  }
  const total = Object.keys(picks).length;
  pickCount.textContent = `${total}/2`;
  emptyPicks.hidden = total > 0;
}

document.querySelector("#clear-picks").addEventListener("click", () => {
  picks = {};
  localStorage.removeItem(PICKS_KEY);
  document.querySelectorAll(".option-row").forEach((row) => {
    row.classList.remove("selected");
    const button = row.querySelector(".option-odds");
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  renderPicks();
});

renderPicks();
