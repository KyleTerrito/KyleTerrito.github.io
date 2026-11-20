
const themeButton = document.querySelector(".theme");
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
let themePreference;

try {
  themePreference = localStorage.getItem("kt-theme");
} catch {
  // The theme is still available for the current visit.
}

function applyTheme() {
  const dark = (themePreference ?? (systemTheme.matches ? "dark" : "light")) === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeButton.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}

applyTheme();
themeButton.hidden = false;
themeButton.addEventListener("click", () => {
  themePreference = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("kt-theme", themePreference);
  } catch {
    // Keep the current choice in memory.
  }
  applyTheme();
});
systemTheme.addEventListener("change", applyTheme);

const deck = document.querySelector(".deck-track");
const cards = Array.from(deck.querySelectorAll(".preview-panel"));
const deckLinks = Array.from(document.querySelectorAll(".deck-nav a"));

function updateDeck() {
  const center = deck.scrollLeft + deck.clientWidth / 2;
  let active = cards[0];
  let closest = Infinity;
  for (const card of cards) {
    const distance = Math.abs(center - (card.offsetLeft + card.offsetWidth / 2));
    if (distance < closest) {
      active = card;
      closest = distance;
    }
  }
  for (const link of deckLinks) {
    if (link.hash === "#" + active.id) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }
  for (const card of cards) {
    if (card !== active) card.querySelector("video")?.pause();
  }
}

function centerCard(card) {
  deck.scrollTo({ left: card.offsetLeft - (deck.clientWidth - card.offsetWidth) / 2 });
}

deck.addEventListener("scroll", updateDeck, { passive: true });
new ResizeObserver(updateDeck).observe(deck);
deck.addEventListener("keydown", (event) => {
  if (event.target !== deck || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const index = deckLinks.findIndex(link => link.hasAttribute("aria-current"));
  const next = cards[index + (event.key === "ArrowRight" ? 1 : -1)];
  if (!next) return;
  event.preventDefault();
  centerCard(next);
});
for (const link of deckLinks) {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const card = document.getElementById(link.hash.slice(1));
    event.preventDefault();
    centerCard(card);
  });
}

const galleries = {
  research: [
    { file: "research-interests/modeling-4.png", title: "Modeling figure 1" },
    { file: "research-interests/modeling-9.png", title: "Modeling figure 2" },
    { file: "research-interests/modeling-10.png", title: "Modeling figure 3" },
    { file: "research-interests/modeling-11.mp4", title: "Modeling recording", video: true },
  ],
  software: [
    { file: "software/warp-map-3.jpg", title: "Warp Map · Screenshot" },
    { file: "software/geauxtune-6.mp4", title: "GeauxTune · Recording", video: true, poster: "software/geaux-tune-4.png" },
    { file: "software/fastman-7.mp4", title: "FastMan · Recording", video: true },
    { file: "software/auto-pilot-2.png", title: "Auto Pilot · Screenshot" },
  ],
};

for (const controls of document.querySelectorAll("[data-gallery]")) {
  const items = galleries[controls.dataset.gallery];
  const buttons = controls.querySelectorAll("button");
  const figure = document.getElementById(buttons[0].getAttribute("aria-controls"));
  const caption = figure.querySelector("figcaption");
  caption.setAttribute("aria-live", "polite");
  controls.hidden = false;

  for (const button of buttons) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;

      const item = items[Number(button.dataset.media)];
      const media = document.createElement(item.video ? "video" : "img");
      if (item.video) {
        media.controls = true;
        media.playsInline = true;
        media.preload = "none";
        media.setAttribute("aria-label", item.title);
        if (item.poster) media.poster = "./assets/" + item.poster;
      } else {
        media.alt = item.title;
      }
      media.src = "./assets/" + item.file;
      figure.querySelector("video")?.pause();
      figure.firstElementChild.replaceWith(media);
      caption.textContent = item.title;
      for (const option of buttons) {
        option.setAttribute("aria-pressed", String(option === button));
      }
    });
  }
}
