const fallbackFace =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180' fill='none'%3E%3Crect width='320' height='180' rx='16' fill='%23E2E8F0'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial, sans-serif' font-size='48'%3E?%3C/text%3E%3C/svg%3E";

function shuffleInPlace<T>(array: T[]): T[] {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(array.length);
    crypto.getRandomValues(buf);
    for (let i = array.length - 1; i > 0; i--) {
      const j = buf[i] % (i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

type HomeEntity = {
  id: string;
  slug: string;
  title: string;
  role?: string;
  faceSrc?: string;
};

function renderRandomHomeEntities() {
  const container = document.querySelector<HTMLElement>('[data-home-entities-grid]');
  if (!container) return;

  const dataEl = document.getElementById('home-entities-data');
  const raw = dataEl?.textContent;
  if (!raw) return;

  let entities: HomeEntity[] | undefined;
  try {
    entities = JSON.parse(raw);
  } catch (err) {
    console.error('[home-entities] JSON parse error:', err);
    return;
  }
  if (!entities || !Array.isArray(entities) || entities.length === 0) return;

  console.log('[home-entities] entities.length =', entities.length);
  console.log('[home-entities] entities titles =', entities.map((e: any) => e.title));
  console.log('[home-entities] before shuffle first 6 =', entities.slice(0, 6).map((e: any) => e.title));

  const pool = [...entities];
  shuffleInPlace(pool);

  console.log('[home-entities] after shuffle first 6 =', pool.slice(0, 6).map((e: any) => e.title));

  const selected = pool.slice(0, 6);

  container.innerHTML = selected
    .map((ent) => {
      const face = ent.faceSrc || fallbackFace;
      const rolePart = ent.role
        ? `<p class="home-entity-sub text-xs text-gray-500">${ent.role}</p>`
        : `<p class="home-entity-sub text-xs text-gray-500">Fiche détaillée</p>`;
      return `
        <a
          class="home-entity-card group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
          href="/entites/${ent.id}/"
        >
          <img
            src="${face}"
            alt="Portrait de ${ent.title}"
            class="h-40 w-full object-cover bg-gray-100"
            loading="lazy"
            draggable="false"
            onerror="this.onerror=null;this.src='${fallbackFace}';"
          />
          <div class="p-4 flex items-center justify-between">
            <div>
              <p class="home-entity-title text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                ${ent.title}
              </p>
              ${rolePart}
            </div>
            <span class="text-indigo-600 font-semibold group-hover:translate-x-1 transition">→</span>
          </div>
        </a>
      `;
    })
    .join('');
}

function initCarousel() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderRandomHomeEntities, { once: true });
  } else {
    renderRandomHomeEntities();
  }

  document.addEventListener('astro:after-swap', () => {
    if (location.pathname === '/' || location.pathname === '/index.html') {
      renderRandomHomeEntities();
    }
  });
}

initCarousel();
