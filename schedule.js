const teams = [
  ["Arizona Cardinals","ari","ARI"],["Atlanta Falcons","atl","ATL"],["Baltimore Ravens","bal","BAL"],["Buffalo Bills","buf","BUF"],
  ["Carolina Panthers","car","CAR"],["Chicago Bears","chi","CHI"],["Cincinnati Bengals","cin","CIN"],["Cleveland Browns","cle","CLE"],
  ["Dallas Cowboys","dal","DAL"],["Denver Broncos","den","DEN"],["Detroit Lions","det","DET"],["Green Bay Packers","gb","GB"],
  ["Houston Texans","hou","HOU"],["Indianapolis Colts","ind","IND"],["Jacksonville Jaguars","jax","JAX"],["Kansas City Chiefs","kc","KC"],
  ["Las Vegas Raiders","lv","LV"],["Los Angeles Chargers","lac","LAC"],["Los Angeles Rams","lar","LAR"],["Miami Dolphins","mia","MIA"],
  ["Minnesota Vikings","min","MIN"],["New England Patriots","ne","NE"],["New Orleans Saints","no","NO"],["New York Giants","nyg","NYG"],
  ["New York Jets","nyj","NYJ"],["Philadelphia Eagles","phi","PHI"],["Pittsburgh Steelers","pit","PIT"],["San Francisco 49ers","sf","SF"],
  ["Seattle Seahawks","sea","SEA"],["Tampa Bay Buccaneers","tb","TB"],["Tennessee Titans","ten","TEN"],["Washington Commanders","wsh","WSH"]
];

const PICKS_KEY = "nfl-game-picks-2026-v1";
const preseasonFpi = {
  lar: 5.6, buf: 4.0, bal: 3.7, sea: 3.6, sf: 3.3, gb: 2.8, lac: 2.6, det: 2.5,
  kc: 2.4, phi: 2.0, dal: 1.8, cin: 1.6, hou: 1.4, ne: 1.4, den: 1.3, chi: 1.2,
  jax: 1.0, tb: 0.1, min: -0.4, ind: -0.6, wsh: -0.8, pit: -0.9, nyg: -1.2,
  atl: -1.5, no: -2.7, car: -3.0, ten: -3.9, lv: -4.6, ari: -5.2, cle: -5.5,
  nyj: -5.5, mia: -5.8
};
const byEspn = Object.fromEntries(teams.map(([name, abbr, espn]) => [espn, { name, abbr, espn }]));
const teamFilter = document.querySelector("#team-filter");
const weekFilter = document.querySelector("#week-filter");
const list = document.querySelector("#schedule-list");
const status = document.querySelector("#schedule-status");
const emptyState = document.querySelector("#empty-state");
let games = [];
let picks = load(PICKS_KEY);

function load(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
function logoUrl(abbr) { return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`; }

teams.forEach(([name, abbr]) => teamFilter.add(new Option(name, abbr)));
for (let week = 1; week <= 18; week++) weekFilter.add(new Option(`Week ${week}`, String(week)));

async function fetchSchedule() {
  const requests = Array.from({ length: 18 }, (_, index) => {
    const week = index + 1;
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}&limit=100`;
    return fetch(url).then((response) => { if (!response.ok) throw new Error(`Week ${week}`); return response.json(); });
  });
  const results = await Promise.allSettled(requests);
  const unique = new Map();
  results.filter((result) => result.status === "fulfilled").forEach(({ value }) => {
    (value.events || []).forEach((event) => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors || [];
      const awayRaw = competitors.find((team) => team.homeAway === "away");
      const homeRaw = competitors.find((team) => team.homeAway === "home");
      const away = byEspn[awayRaw?.team?.abbreviation];
      const home = byEspn[homeRaw?.team?.abbreviation];
      const week = Number(event.week?.number || value.week?.number);
      if (!away || !home || !week || week > 18) return;
      unique.set(event.id, { id: event.id, week, date: event.date, away, home, venue: competition?.venue?.fullName || "Venue TBD" });
    });
  });
  if (!unique.size) throw new Error("Schedule unavailable");
  return [...unique.values()].sort((a, b) => a.week - b.week || new Date(a.date) - new Date(b.date));
}

function dateLabel(value) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function teamButton(game, team, side, higherFpi) {
  const button = document.createElement("button");
  const selected = picks[game.id] === team.abbr;
  const fpi = preseasonFpi[team.abbr];
  const fpiText = `${fpi > 0 ? "+" : ""}${fpi.toFixed(1)}`;
  const fpiClass = team.abbr === higherFpi ? " fpi-better" : "";
  button.type = "button";
  button.className = `team-pick${selected ? " selected" : ""}`;
  button.setAttribute("aria-pressed", String(selected));
  button.setAttribute("aria-label", `Pick ${team.name} to win`);
  button.innerHTML = side === "away"
    ? `<img src="${logoUrl(team.abbr)}" alt=""><span class="team-copy"><strong>${team.name}</strong><span>${team.espn} · ${side}</span></span><b class="fpi-value${fpiClass}" title="Preseason Football Power Index">${fpiText}<small>FPI</small></b>`
    : `<b class="fpi-value${fpiClass}" title="Preseason Football Power Index">${fpiText}<small>FPI</small></b><span class="team-copy"><strong>${team.name}</strong><span>${team.espn} · ${side}</span></span><img src="${logoUrl(team.abbr)}" alt="">`;
  button.addEventListener("click", () => {
    if (picks[game.id] === team.abbr) delete picks[game.id]; else picks[game.id] = team.abbr;
    localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
    render();
  });
  return button;
}

function render() {
  const selectedTeam = teamFilter.value;
  const selectedWeek = weekFilter.value;
  const filtered = games.filter((game) => (selectedTeam === "all" || game.away.abbr === selectedTeam || game.home.abbr === selectedTeam) && (selectedWeek === "all" || game.week === Number(selectedWeek)));
  list.replaceChildren();
  const weeks = [...new Set(filtered.map((game) => game.week))];
  weeks.forEach((week) => {
    const section = document.createElement("section");
    section.className = "week-group";
    const weekGames = filtered.filter((game) => game.week === week);
    section.innerHTML = `<div class="week-heading"><h2>Week ${week}</h2><span>${weekGames.length} ${weekGames.length === 1 ? "game" : "games"}</span></div><div class="games-grid"></div>`;
    const grid = section.querySelector(".games-grid");
    weekGames.forEach((game) => {
      const awayFpi = preseasonFpi[game.away.abbr];
      const homeFpi = preseasonFpi[game.home.abbr];
      const higherFpi = awayFpi === homeFpi ? null : awayFpi > homeFpi ? game.away.abbr : game.home.abbr;
      const card = document.createElement("article");
      card.className = "game-card";
      card.innerHTML = `<div class="game-meta"><time datetime="${game.date}">${dateLabel(game.date)}</time><span>${game.venue}</span></div><div class="matchup"><span class="away-slot"></span><span class="at-mark">@</span><span class="home-slot"></span></div>`;
      card.querySelector(".away-slot").replaceWith(teamButton(game, game.away, "away", higherFpi));
      card.querySelector(".home-slot").replaceWith(teamButton(game, game.home, "home", higherFpi));
      grid.append(card);
    });
    list.append(section);
  });
  emptyState.hidden = filtered.length > 0;
  document.querySelector("#pick-count").textContent = `${Object.keys(picks).length} / ${games.length}`;
}

teamFilter.addEventListener("change", render);
weekFilter.addEventListener("change", render);
document.querySelector("#clear-picks").addEventListener("click", () => { picks = {}; localStorage.removeItem(PICKS_KEY); render(); });

fetchSchedule().then((result) => {
  games = result;
  status.hidden = true;
  render();
}).catch(() => {
  status.innerHTML = `The live schedule could not be loaded. <button class="reset-button" type="button" onclick="location.reload()">Try again</button>`;
});
