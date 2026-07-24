const teams = [
  ["Arizona Cardinals","ari"],["Atlanta Falcons","atl"],["Baltimore Ravens","bal"],["Buffalo Bills","buf"],
  ["Carolina Panthers","car"],["Chicago Bears","chi"],["Cincinnati Bengals","cin"],["Cleveland Browns","cle"],
  ["Dallas Cowboys","dal"],["Denver Broncos","den"],["Detroit Lions","det"],["Green Bay Packers","gb"],
  ["Houston Texans","hou"],["Indianapolis Colts","ind"],["Jacksonville Jaguars","jax"],["Kansas City Chiefs","kc"],
  ["Las Vegas Raiders","lv"],["Los Angeles Chargers","lac"],["Los Angeles Rams","lar"],["Miami Dolphins","mia"],
  ["Minnesota Vikings","min"],["New England Patriots","ne"],["New Orleans Saints","no"],["New York Giants","nyg"],
  ["New York Jets","nyj"],["Philadelphia Eagles","phi"],["Pittsburgh Steelers","pit"],["San Francisco 49ers","sf"],
  ["Seattle Seahawks","sea"],["Tampa Bay Buccaneers","tb"],["Tennessee Titans","ten"],["Washington Commanders","wsh"]
];

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch { return {}; }
}

const boardPositions = load("nfl-futures-board-v2");
const divisionPicks = load("nfl-division-picks-v1");
const conferencePicks = load("nfl-conference-picks-v1");
const winPicks = load("nfl-win-total-picks-v1");
const nameByAbbreviation = Object.fromEntries(teams.map(([name, abbreviation]) => [abbreviation, name]));

function logoUrl(abbreviation) {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation}.png`;
}

function inferredTier(position) {
  if (!position) return "Unranked";
  if (position.tier) return position.tier;
  const isPhone = window.matchMedia("(max-width: 620px)").matches;
  const boardHeight = isPhone ? 1690 : 1400;
  const cardHeight = isPhone ? 70 : 90;
  const tierAreaHeight = isPhone ? 1000 : 1050;
  const cardCenter = position.y * (boardHeight - cardHeight) + cardHeight / 2;
  const tierIndex = Math.floor(cardCenter / (tierAreaHeight / 5));
  return tierIndex < 5 ? ["S","A","B","C","D"][tierIndex] : "Unranked";
}

function renderTiers() {
  const container = document.querySelector("#tier-summary");
  const grouped = Object.fromEntries(["S","A","B","C","D","Unranked"].map((tier) => [tier, []]));
  teams.forEach(([name, abbreviation]) => grouped[inferredTier(boardPositions[abbreviation])].push({ name, abbreviation }));
  for (const [tier, tierTeams] of Object.entries(grouped)) {
    const row = document.createElement("div");
    row.className = "tier-result";
    row.dataset.tier = tier;
    const chips = tierTeams.map(({name, abbreviation}) => `<div class="tier-chip" title="${name}"><img src="${logoUrl(abbreviation)}" alt=""><span>${name.replace("Washington ", "")}</span></div>`).join("");
    row.innerHTML = `<div class="tier-label">${tier}</div><div class="tier-teams">${chips || '<span class="empty-row">No teams</span>'}</div>`;
    container.append(row);
  }
}

function renderPickList(target, picks, order, labelFor) {
  const container = document.querySelector(target);
  let rendered = 0;
  order.forEach((key) => {
    const pick = picks[key];
    if (!pick) return;
    rendered++;
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `<img src="${logoUrl(pick.abbreviation)}" alt=""><div><span>${labelFor(key, pick)}</span><strong>${pick.name}</strong></div><b class="result-odds">${pick.odds || ""}</b>`;
    container.append(row);
  });
  if (!rendered) container.innerHTML = '<p class="empty-row">No picks yet</p>';
}

function buildExportData() {
  const tiers = Object.fromEntries(["S","A","B","C","D","Unranked"].map((tier) => [tier, []]));
  teams.forEach(([name, abbreviation]) => tiers[inferredTier(boardPositions[abbreviation])].push(name));
  return {
    exportedAt: new Date().toISOString(),
    tiers,
    divisionWinners: divisionPicks,
    conferenceWinners: conferencePicks,
    regularSeasonWins: winPicks
  };
}

function buildShareText() {
  const data = buildExportData();
  const lines = ["MY NFL FUTURES", ""];
  lines.push("TIER BOARD");
  for (const [tier, names] of Object.entries(data.tiers)) lines.push(`${tier}: ${names.join(", ") || "—"}`);
  lines.push("", "DIVISION WINNERS");
  for (const [division, pick] of Object.entries(divisionPicks)) lines.push(`${division}: ${pick.name} ${pick.odds}`);
  lines.push("", "CONFERENCE WINNERS");
  for (const [conference, pick] of Object.entries(conferencePicks)) lines.push(`${conference}: ${pick.name} ${pick.odds}`);
  lines.push("", "REGULAR SEASON WINS");
  for (const pick of Object.values(winPicks)) lines.push(`${pick.name}: ${pick.side} ${pick.line} (${pick.odds})`);
  return lines.join("\n");
}

function showStatus(message) {
  const status = document.querySelector("#action-status");
  status.textContent = message;
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => { status.textContent = ""; }, 3000);
}

document.querySelector("#share-results").addEventListener("click", async () => {
  const text = buildShareText();
  if (navigator.share) {
    try { await navigator.share({ title: "My NFL Futures", text }); showStatus("Shared"); }
    catch (error) { if (error.name !== "AbortError") showStatus("Sharing unavailable"); }
  } else {
    try { await navigator.clipboard.writeText(text); showStatus("Copied to clipboard"); }
    catch { showStatus("Use Copy text instead"); }
  }
});

document.querySelector("#copy-results").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(buildShareText()); showStatus("Copied to clipboard"); }
  catch { showStatus("Clipboard access unavailable"); }
});

document.querySelector("#download-results").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(buildExportData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nfl-futures-results.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showStatus("JSON export created");
});

renderTiers();
renderPickList("#division-summary", divisionPicks, ["AFC East","AFC North","AFC South","AFC West","NFC East","NFC North","NFC South","NFC West"], (key) => key);
renderPickList("#conference-summary", conferencePicks, ["AFC","NFC"], (key) => `${key} champion`);
renderPickList("#wins-summary", winPicks, teams.map(([, abbreviation]) => abbreviation), (_, pick) => `${pick.side} ${pick.line} wins`);
