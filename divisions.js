const divisions = {
  "AFC East": [["Buffalo Bills", "buf", "-130"], ["New England Patriots", "ne", "+130"], ["New York Jets", "nyj", "+1800"], ["Miami Dolphins", "mia", "+4000"]],
  "AFC North": [["Baltimore Ravens", "bal", "-105"], ["Cincinnati Bengals", "cin", "+170"], ["Pittsburgh Steelers", "pit", "+550"], ["Cleveland Browns", "cle", "+2200"]],
  "AFC South": [["Houston Texans", "hou", "+135"], ["Jacksonville Jaguars", "jax", "+190"], ["Indianapolis Colts", "ind", "+360"], ["Tennessee Titans", "ten", "+850"]],
  "AFC West": [["Kansas City Chiefs", "kc", "+175"], ["Los Angeles Chargers", "lac", "+185"], ["Denver Broncos", "den", "+220"], ["Las Vegas Raiders", "lv", "+1600"]],
  "NFC East": [["Philadelphia Eagles", "phi", "+135"], ["Dallas Cowboys", "dal", "+195"], ["Washington Commanders", "wsh", "+470"], ["New York Giants", "nyg", "+550"]],
  "NFC North": [["Detroit Lions", "det", "+150"], ["Green Bay Packers", "gb", "+260"], ["Chicago Bears", "chi", "+320"], ["Minnesota Vikings", "min", "+480"]],
  "NFC South": [["Tampa Bay Buccaneers", "tb", "+200"], ["New Orleans Saints", "no", "+240"], ["Atlanta Falcons", "atl", "+310"], ["Carolina Panthers", "car", "+330"]],
  "NFC West": [["Los Angeles Rams", "lar", "-110"], ["Seattle Seahawks", "sea", "+220"], ["San Francisco 49ers", "sf", "+300"], ["Arizona Cardinals", "ari", "+10000"]]
};

const PICKS_KEY = "nfl-division-picks-v1";
const markets = document.querySelector("#division-markets");
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

for (const [division, teams] of Object.entries(divisions)) {
  const card = marketTemplate.content.firstElementChild.cloneNode(true);
  const title = card.querySelector(".market-title");
  const options = card.querySelector(".market-options");
  title.querySelector("span").textContent = `${division} winner`;

  title.addEventListener("click", () => {
    card.classList.toggle("collapsed");
    title.setAttribute("aria-expanded", String(!card.classList.contains("collapsed")));
  });

  for (const [name, abbreviation, teamOdds] of teams) {
    const row = document.createElement("div");
    row.className = "option-row";
    const option = document.createElement("div");
    option.className = "team-option";
    option.dataset.team = abbreviation;
    option.innerHTML = `<img class="option-logo" src="${logoUrl(abbreviation)}" alt="" draggable="false"><span class="option-name">${name}</span>`;
    const oddsLabel = document.createElement("button");
    oddsLabel.className = "option-odds";
    oddsLabel.type = "button";
    oddsLabel.textContent = teamOdds;
    const isSelected = picks[division]?.abbreviation === abbreviation;
    row.classList.toggle("selected", isSelected);
    oddsLabel.classList.toggle("selected", isSelected);
    oddsLabel.setAttribute("aria-label", `Select ${name} at ${teamOdds}`);
    oddsLabel.setAttribute("aria-pressed", String(isSelected));
    oddsLabel.addEventListener("click", () => selectTeam(division, name, abbreviation, teamOdds, options));
    row.append(option, oddsLabel);
    options.append(row);
  }
  markets.append(card);
}

function selectTeam(division, name, abbreviation, teamOdds, options) {
  const isAlreadySelected = picks[division]?.abbreviation === abbreviation;
  if (isAlreadySelected) delete picks[division];
  else picks[division] = { name, abbreviation, odds: teamOdds };

  options.querySelectorAll(".option-row").forEach((row) => {
    const selected = !isAlreadySelected && row.querySelector(".team-option").dataset.team === abbreviation;
    row.classList.toggle("selected", selected);
    const oddsButton = row.querySelector(".option-odds");
    oddsButton.classList.toggle("selected", selected);
    oddsButton.setAttribute("aria-pressed", String(selected));
  });
  localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
  renderPicks();
}

function renderPicks() {
  picksList.replaceChildren();
  for (const division of Object.keys(divisions)) {
    const pick = picks[division];
    if (!pick) continue;
    if (!pick.odds) pick.odds = divisions[division].find((team) => team[1] === pick.abbreviation)?.[2] || "";
    const row = document.createElement("div");
    row.className = "pick-row";
    const recordedOdds = pick.odds || divisions[division].find((team) => team[1] === pick.abbreviation)?.[2] || "—";
    row.innerHTML = `<img src="${logoUrl(pick.abbreviation)}" alt=""><div><span>${division}</span><strong>${pick.name}</strong></div><b class="pick-odds">${recordedOdds}</b>`;
    picksList.append(row);
  }
  const total = Object.keys(picks).length;
  pickCount.textContent = `${total}/8`;
  emptyPicks.hidden = total > 0;
  localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
}

document.querySelector("#clear-picks").addEventListener("click", () => {
  picks = {};
  localStorage.removeItem(PICKS_KEY);
  document.querySelectorAll(".option-row").forEach((row) => {
    row.classList.remove("selected");
    const oddsButton = row.querySelector(".option-odds");
    oddsButton.classList.remove("selected");
    oddsButton.setAttribute("aria-pressed", "false");
  });
  renderPicks();
});

renderPicks();
