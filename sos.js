const scheduleStrength = [
  [1,"Chicago Bears","chi",1.2],[2,"Miami Dolphins","mia",-5.8],[3,"Arizona Cardinals","ari",-5.2],[3,"Green Bay Packers","gb",2.8],
  [5,"Kansas City Chiefs","kc",2.4],[6,"New England Patriots","ne",1.4],[7,"Las Vegas Raiders","lv",-4.6],[8,"Buffalo Bills","buf",4.0],
  [9,"Los Angeles Chargers","lac",2.6],[10,"Carolina Panthers","car",-3.0],[11,"Minnesota Vikings","min",-0.4],[12,"New York Jets","nyj",-5.5],
  [13,"Los Angeles Rams","lar",5.6],[14,"Seattle Seahawks","sea",3.6],[15,"Denver Broncos","den",1.3],[16,"Washington Commanders","wsh",-0.8],
  [17,"New York Giants","nyg",-1.2],[18,"San Francisco 49ers","sf",3.3],[19,"Pittsburgh Steelers","pit",-0.9],[20,"Dallas Cowboys","dal",1.8],
  [21,"Tampa Bay Buccaneers","tb",0.1],[22,"Jacksonville Jaguars","jax",1.0],[23,"Philadelphia Eagles","phi",2.0],[24,"Baltimore Ravens","bal",3.7],
  [25,"Tennessee Titans","ten",-3.9],[26,"Houston Texans","hou",1.4],[27,"Detroit Lions","det",2.5],[28,"Atlanta Falcons","atl",-1.5],
  [28,"Indianapolis Colts","ind",-0.6],[30,"Cincinnati Bengals","cin",1.6],[31,"New Orleans Saints","no",-2.7],[32,"Cleveland Browns","cle",-5.5]
];

const logoUrl = (abbr) => `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`;
const signed = (value) => `${value > 0 ? "+" : ""}${value.toFixed(1)}`;

function renderRanking() {
  const list = document.querySelector("#ranking-list");
  const ties = scheduleStrength.reduce((counts,[rank]) => (counts[rank] = (counts[rank] || 0) + 1, counts), {});
  scheduleStrength.forEach(([rank,name,abbr,fpi]) => {
    const row = document.createElement("div");
    row.className = "rank-row";
    row.innerHTML = `<span class="rank-number">${ties[rank] > 1 ? "T-" : ""}${rank}</span><img src="${logoUrl(abbr)}" alt=""><div><strong>${name}</strong><br><small>Schedule strength</small></div><b class="fpi-pill">${signed(fpi)} FPI</b>`;
    list.append(row);
  });
}

function renderChart() {
  const width = 820, height = 640;
  const margin = { top: 36, right: 38, bottom: 60, left: 64 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const xMin = -6.5, xMax = 6.5;
  const x = (value) => margin.left + (value - xMin) / (xMax - xMin) * innerWidth;
  const y = (rank) => margin.top + (rank - 1) / 31 * innerHeight;
  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label","Scatter plot of all 32 NFL teams by preseason FPI and schedule strength rank");
  let markup = `<defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".45"/></filter></defs>`;
  for (let tick = -6; tick <= 6; tick += 2) markup += `<line class="${tick === 0 ? "zero-line" : "grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height-margin.bottom}"/><text class="tick-label" x="${x(tick)}" y="${height-margin.bottom+20}" text-anchor="middle">${tick > 0 ? "+" : ""}${tick}</text>`;
  [1,8,16,24,32].forEach((rank) => { markup += `<line class="grid-line" x1="${margin.left}" y1="${y(rank)}" x2="${width-margin.right}" y2="${y(rank)}"/><text class="tick-label" x="${margin.left-12}" y="${y(rank)+3}" text-anchor="end">${rank}</text>`; });
  markup += `<text class="axis-label" x="${margin.left+innerWidth/2}" y="${height-15}" text-anchor="middle">PRESEASON FPI →</text><text class="axis-label" transform="translate(18 ${margin.top+innerHeight/2}) rotate(-90)" text-anchor="middle">SCHEDULE DIFFICULTY RANK →</text><text class="quadrant-label" x="${margin.left+10}" y="${margin.top+17}">HARD SCHEDULE · LOWER FPI</text><text class="quadrant-label" x="${width-margin.right-10}" y="${margin.top+17}" text-anchor="end">HARD SCHEDULE · HIGHER FPI</text>`;
  svg.innerHTML = markup;
  scheduleStrength.forEach(([rank,name,abbr,fpi],index) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg","g");
    node.setAttribute("class","logo-node"); node.setAttribute("tabindex","0"); node.setAttribute("role","img");
    node.setAttribute("aria-label",`${name}: schedule rank ${rank}, FPI ${signed(fpi)}`);
    const jitter = index % 2 ? 5 : -5;
    const cx = x(fpi), cy = y(rank) + jitter;
    node.innerHTML = `<title>${name} · SOS ${rank} · FPI ${signed(fpi)}</title><circle class="logo-halo" cx="${cx}" cy="${cy}" r="17"/><image href="${logoUrl(abbr)}" x="${cx-15}" y="${cy-14}" width="30" height="28" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>`;
    svg.append(node);
  });
  document.querySelector("#sos-chart").append(svg);
}

const uniqueTeams = new Set(scheduleStrength.map(([, , abbr]) => abbr));
document.querySelector("#team-count").textContent = `${uniqueTeams.size}/32`;
renderChart();
renderRanking();
