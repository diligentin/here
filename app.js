function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ---------------- HISTORIA ROZDZIAŁÓW ---------------- */

function markVisited(comic, chapter) {
  localStorage.setItem(`visited_${comic}_${chapter}`, "1");
}

function isVisited(comic, chapter) {
  return localStorage.getItem(`visited_${comic}_${chapter}`) === "1";
}

/* ---------------- REAKCJE – NA RAZIE LOKALNE ---------------- */

function loadLocalReactions(comic, chapter) {
  const key = `reactions_${comic}_${chapter}`;
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  return {
    r1: saved.r1 || 0,
    r2: saved.r2 || 0,
    r3: saved.r3 || 0,
    r4: saved.r4 || 0,
    r5: saved.r5 || 0
  };
}

function saveLocalReaction(comic, chapter, type) {
  const key = `reactions_${comic}_${chapter}`;
  const counts = loadLocalReactions(comic, chapter);
  counts[type]++;
  localStorage.setItem(key, JSON.stringify(counts));
  return counts;
}

/* ---------------- STRONA TYTUŁU ---------------- */

async function initTitle() {
  const comic = getParam("comic");
  if (!comic) return;

  const data = await fetch(`data/${comic}.json`).then(r => r.json());

  document.getElementById("title-heading").textContent = data.title;
  document.getElementById("cover-image").src = data.cover;
  document.getElementById("description-main").textContent = data.description;
  document.getElementById("description-small").textContent = data.descriptionNote || "";

  const list = document.getElementById("chapters-list");
  list.innerHTML = "";

  data.chapters.forEach(ch => {
    const a = document.createElement("a");
    a.href = `reader.html?comic=${comic}&chapter=${ch.number}`;

    const btn = document.createElement("button");
    btn.className = "chapter-button";
    btn.textContent = ch.label || `Rozdział ${ch.number}`;

    if (isVisited(comic, ch.number)) btn.classList.add("visited");

    a.appendChild(btn);
    list.appendChild(a);
  });
}

/* ---------------- READER ---------------- */

async function initReader() {
  const comic = getParam("comic");
  const chapter = getParam("chapter");
  if (!comic || !chapter) return;

  const data = await fetch(`data/${comic}.json`).then(r => r.json());
  const ch = data.chapters.find(c => String(c.number) === String(chapter));
  if (!ch) return;

  document.getElementById("reader-title").textContent =
    `${data.title} — ${ch.label || "Rozdział " + chapter}`;

  const pages = document.getElementById("reader-pages");
  pages.innerHTML = "";
  ch.pages.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    pages.appendChild(img);
  });

  markVisited(comic, chapter);

  /* NAV: HOME + NEXT */
  const home = document.getElementById("btn-home");
  if (home) home.href = "index.html";

  const next = document.getElementById("btn-next");
  if (next) {
    const currentIndex = data.chapters.findIndex(c => String(c.number) === String(chapter));
    const nextChapter = data.chapters[currentIndex + 1];
    if (nextChapter) {
      next.href = `reader.html?comic=${comic}&chapter=${nextChapter.number}`;
    } else {
      next.style.display = "none"; // brak następnego rozdziału
    }
  }

  /* REAKCJE – lokalne (później podmienimy na Firebase) */
  const counts = loadLocalReactions(comic, chapter);

  const updateCounts = () => {
    document.getElementById("count-r1").textContent = counts.r1;
    document.getElementById("count-r2").textContent = counts.r2;
    document.getElementById("count-r3").textContent = counts.r3;
    document.getElementById("count-r4").textContent = counts.r4;
    document.getElementById("count-r5").textContent = counts.r5;
  };

  updateCounts();

  document.querySelectorAll("[data-react]").forEach(img => {
    img.onclick = () => {
      const type = img.dataset.react;
      const newCounts = saveLocalReaction(comic, chapter, type);
      counts[type] = newCounts[type];
      updateCounts();
    };
  });
}

/* ---------------- AUTO INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "title") initTitle();
  if (document.body.dataset.page === "reader") initReader();
});
