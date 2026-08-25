/* ============================================================
   ALANIS MORISSETTE — DOCUMENTAL DIGITAL
   Lógica en JavaScript puro (sin frameworks).
   -> Lee los datos de js/datos.js (variables globales) y pinta
      el contenido en la página. También agrega las interacciones.
   ============================================================ */

/* Pequeñas utilidades para buscar elementos en el documento */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* Escapar texto: evita que un dato con < > & " rompa el HTML.
   Buena costumbre al "pintar" contenido externo. */
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/* Buscar una foto por su id dentro de `media` */
function porId(id) {
  return media.find((m) => m.id === id);
}

/* Fotos realmente utilizables (no son solo referencia) */
function fotosUsables() {
  return media.filter((m) => !m.referencesOnly);
}

/* Fotos para los interludios de la timeline (en vivo + carrera) */
function interludios() {
  return fotosUsables().filter((m) => m.category === "live" || m.category === "career");
}

/* Color de cada tipo de hito en la timeline */
const TIPOS = {
  life: { label: "Vida", color: "var(--mist)" },
  album: { label: "Álbum", color: "var(--blood)" },
  song: { label: "Canción", color: "var(--blood)" },
  award: { label: "Premio", color: "var(--ember)" },
  tour: { label: "Gira", color: "var(--ember)" },
  hito: { label: "Hito", color: "var(--blood)" },
  quote: { label: "Cita", color: "var(--mist)" },
};

const ETIQUETA_TIPO = { studio: "Estudio", live: "En vivo", compilation: "Recopilación", soundtrack: "Banda sonora" };

/* ============================================================
   HERO — dato rápido + parallax suave de la imagen de fondo
   ============================================================ */
function iniciarHero() {
  const fact = biografia.quickFacts[0];
  if (fact) $("#heroFact").textContent = fact;

  const img = $("#heroImg");
  const onScroll = () => {
    // La imagen se mueve un poco más lento que el scroll (efecto parallax)
    img.style.transform = "translateY(" + window.scrollY * 0.18 + "px)";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ============================================================
   NAVEGACIÓN — fondo al hacer scroll, barra de progreso y menú
   ============================================================ */
function iniciarNav() {
  const nav = $("#nav");
  const progress = $("#navProgress");
  const toggle = $("#navToggle");
  const menu = $("#mobileMenu");

  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    progress.style.width = pct + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menú móvil: abrir / cerrar
  const cerrar = () => {
    toggle.classList.remove("open");
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const abierto = menu.classList.toggle("open");
    toggle.classList.toggle("open", abierto);
    toggle.setAttribute("aria-expanded", String(abierto));
  });

  // Si tocás un enlace del menú, se cierra
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", cerrar));
}

/* ============================================================
   REVEAL — aparece un elemento cuando entra en pantalla
   (IntersectionObserver, la forma simple de detectar scroll)
   ============================================================ */
function iniciarReveals() {
  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          observer.unobserve(e.target); // ya apareció, no lo seguimos mirando
        }
      });
    },
    { rootMargin: "-80px" }
  );
  $$(".reveal").forEach((el) => observer.observe(el));
}

/* ============================================================
   PARALLAX — imágenes que se mueven un poco al hacer scroll
   Los elementos marcan <img data-parallax="0.08"> (la fuerza).
   ============================================================ */
function iniciarParallax() {
  const imgs = $$("[data-parallax]");
  let ultimo = 0;

  const pintar = () => {
    const vh = window.innerHeight;
    imgs.forEach((img) => {
      const fuerza = parseFloat(img.dataset.parallax) || 0.08;
      const r = img.getBoundingClientRect();
      // Qué tan lejos está el centro de la imagen del centro de la pantalla
      const distancia = r.top + r.height / 2 - vh / 2;
      img.style.transform = "translateY(" + distancia * fuerza + "px)";
    });
  };

  const loop = (t) => {
    if (t - ultimo > 16) {
      pintar();
      ultimo = t;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ============================================================
   TIMELINE — capítulos por década + interludios fotográficos
   ============================================================ */
function renderTimeline() {
  const raiz = $("#timeline");
  const fotos = interludios();
  let idxFoto = 0;
  let html = "";

  timeline.eras.forEach((era, e) => {
    // Un interludio fotográfico entre décadas (no después de la última)
    if (e > 0) {
      const foto = fotos[idxFoto % fotos.length];
      idxFoto++;
      html += `
        <div class="interlude">
          <img src="${foto.src}" data-parallax="0.06" alt="${esc(foto.description || foto.title)}" />
          <span class="cap">Foto: ${esc(foto.credit)} · ${esc(foto.license)}</span>
        </div>`;
    }

    html += `
      <div class="container era">
        <div class="era-head reveal">
          <span class="era-number" style="color:${era.color}">${era.era.replace(/[^0-9]/g, "").slice(0, 2)}</span>
          <h3>
            <span class="overline" style="color:${era.color}">${esc(era.era)}</span>
            <br />
            ${esc(era.label)}
          </h3>
          <p>${esc(era.summary)}</p>
        </div>

        <div class="era-items">
          ${era.items
            .map((it, i) => {
              const t = TIPOS[it.type] || TIPOS.hito;
              return `
              <article class="timeline-item reveal" style="--rd:${(i * 0.02).toFixed(2)}s">
                <span class="yr" style="font-family:var(--font-mono);font-size:12px;letter-spacing:.2em">${esc(it.year)}</span>
                <span class="tag" style="color:${t.color}">${t.label}</span>
                <h4>${esc(it.title)}</h4>
                <p>${esc(it.description)}</p>
              </article>`;
            })
            .join("")}
        </div>
      </div>`;
  });

  raiz.innerHTML = html;
}

/* ============================================================
   DISCOGRAFÍA — lista de álbumes + panel de detalle
   ============================================================ */
function renderDiscografia() {
  const lista = $("#albumList");
  const detalle = $("#albumDetail");

  // Que arranque mirando a Jagged Little Pill (el más famoso)
  const inicial = discografia.findIndex((a) => a.year === 1995);

  function pintarLista() {
    lista.innerHTML = discografia
      .map(
        (a, i) => `
        <button class="album-row ${i === activo ? "active" : ""}" data-idx="${i}">
          <span class="ix">${String(i + 1).padStart(2, "0")}</span>
          <span class="yr">${a.year}</span>
          <span class="nm">${esc(a.title)}</span>
          <span class="ty">${ETIQUETA_TIPO[a.type] || a.type}</span>
        </button>`
      )
      .join("");
  }

  function pintarDetalle(album, conFade) {
    const terminar = () => {
      const sleeveNum = String(discografia.indexOf(album) + 1).padStart(2, "0");
      const awardSample = album.awards.slice(0, 4);
      const tracks = album.tracks.slice(0, 10);

      detalle.innerHTML = `
        <div class="album-card">
          <div class="sleeve">
            <div class="top"><span>${sleeveNum}</span><span>${album.year}</span></div>
            <div>
              <span class="overline" style="color:var(--mist)">${ETIQUETA_TIPO[album.type] || album.type}</span>
              <h3>${esc(album.title)}</h3>
              <div class="line"></div>
            </div>
            <div class="bottom"><span>MCA · MAVERICK</span><span>●</span></div>
          </div>

          <div class="disco-meta">
            <h3 class="mini-title">${esc(album.title)}</h3>
            <p>${esc(album.description)}</p>
            <label>Productores</label>
            <p>${esc(album.producers.join(", "))}</p>
            ${awardSample.length ? `<label>Premios e hitos</label><ul>${awardSample.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
          </div>
        </div>

        <div style="margin-top:2rem">
          <label class="overline" style="color:rgba(14,13,12,0.45)">Canciones ${album.tracksVerified ? "" : "(parcial)"}</label>
          <ul class="track-list">
            ${tracks.map((t, i) => `<li><span><span class="num">${String(i + 1).padStart(2, "0")}</span>${esc(t.title)}</span><span class="dur">${t.duration}</span></li>`).join("")}
          </ul>
        </div>

        <div class="disco-boxes">
          <div class="disco-box"><label>Recepción</label><p>${esc(album.reception)}</p></div>
          <div class="disco-box"><label>Contexto</label><p>${esc(album.context)}</p></div>
        </div>

        <p class="disco-note">
          ${album.officialLinks.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer" style="color:var(--blood);text-decoration:underline;text-underline-offset:4px;margin-right:16px">${esc(l.label)} ↗</a>`).join("")}
          ${album.coverRef && album.coverRef.note ? `<span>Portada no incluida (copyright). Escuchá en tu plataforma preferida.</span>` : ""}
        </p>`;

      if (!conFade) detalle.classList.remove("fading");
    };

    if (conFade) {
      detalle.classList.add("fading");
      setTimeout(terminar, 220);
    } else {
      terminar();
    }
  }

  let activo = inicial;
  pintarLista();
  pintarDetalle(discografia[activo], false);

  lista.addEventListener("click", (e) => {
    const btn = e.target.closest(".album-row");
    if (!btn) return;
    const i = Number(btn.dataset.idx);
    if (i === activo) return;
    activo = i;
    pintarLista();
    pintarDetalle(discografia[i], true);
  });
}

/* ============================================================
   JAGGED LITTLE PILL — la sección "capítulo aparte"
   ============================================================ */
function renderJlp() {
  const album = discografia.find((a) => a.year === 1995);

  $("#jlpIntro").textContent = biografia.jaggedLittlePill;

  const stats = [
    { v: "33M+", l: "Copias vendidas" },
    { v: "13x", l: "Platino en EE.UU." },
    { v: "1996", l: "Álbum del Año (Grammy)" },
    { v: "50", l: "Semanas en el Top 10" },
  ];
  $("#jlpStats").innerHTML = stats
    .map((s) => `<div class="stat"><b>${s.v}</b><span>${s.l}</span></div>`)
    .join("");

  $("#marquee").innerHTML = album.tracks
    .map((t) => `<span>${esc(t.title)}</span>`)
    .join("");

  $("#jlpContext").innerHTML = `
      <div>
        <p class="overline" style="color:rgba(216,210,196,0.5)">Sobre el álbum</p>
        <p style="margin-top:14px;color:var(--bone)">${esc(album.context)}</p>
        <p style="margin-top:14px;color:rgba(216,210,196,0.8)">${esc(album.reception)}</p>
      </div>`;

  $("#jlpTracks").innerHTML = `
      <div>
        <p class="overline" style="color:rgba(216,210,196,0.5)">Las canciones</p>
        <ol class="jlp-tracks">
          ${album.tracks.map((t) => `<li><span class="t">${esc(t.title)}</span><span class="d">${t.duration}</span></li>`).join("")}
        </ol>
      </div>`;

  const q = biografia.quotes[0];
  if (q) {
    $("#jlpQuote").innerHTML = `<p class="q">“${esc(q.text)}”</p><span class="a">${esc(q.attribution)}</span>`;
  }
}

/* ============================================================
   EN VIVO — imagen destacada + momentos cinematográficos
   ============================================================ */
function renderEnVivo() {
  // Imagen destacada
  const destacada = porId("alanis-2014-saban-rally");
  $("#featureImg").src = destacada.src;
  $("#featureTitle").textContent = destacada.title;
  $("#featureCredit").textContent = "Foto: " + destacada.credit + " · " + destacada.license;

  // Momentos: foto grande + texto al lado (alternando el orden)
  const momentos = [
    { id: "alanis-2003-brasilia", tag: "2003 · Brasília", note: "El ciclo de Under Rug Swept, en un gran festival sudamericano." },
    { id: "alanis-2004-locarno", tag: "2004 · Locarno", note: "Presentación bajo el cielo europeo en el festival de cine." },
    { id: "alanis-2008-koeln", tag: "2008 · Colonia", note: "Flavors of Entanglement llevado a los escenarios." },
    { id: "alanis-2013-saban-theatre", tag: "2013 · Saban Theatre", note: "Un formato íntimo y despojado, en los años del musical." },
    { id: "alanis-2022-live-raph", tag: "2022 · Tour mundial", note: "El regreso masivo a los escenarios tras la pandemia." },
  ];

  $("#liveMoments").innerHTML = momentos
    .map((m, i) => {
      const foto = porId(m.id) || destacada;
      const alt = i % 2 === 1 ? "alt" : "";
      return `
      <div class="cine ${alt}">
        <div class="cine-img">
          <img src="${foto.src}" data-parallax="0.06" alt="${esc(foto.description || foto.title)}" />
          <div class="meta">
            <span>${m.tag} · ${foto.license}</span>
            <span style="align-self:flex-end">Foto: ${esc(foto.credit)}</span>
          </div>
        </div>
        <div class="cine-note">
          <p class="overline tag" style="color:var(--blood)">${m.tag}</p>
          <p class="serif-quote">${esc(m.note)}</p>
        </div>
      </div>`;
    })
    .join("");
}

/* ============================================================
   ARGENTINA — mapa con las ciudades + timeline de visitas
   ============================================================ */
function renderArgentina() {
  const { intro, visits, map } = argentina;

  $("#argList").innerHTML = visits
    .map(
      (v) => `
      <div class="arg-row">
        <span class="y">${v.year}</span>
        <div>
          <h4>${esc(v.venue)}</h4>
          <p class="sub">${esc(v.city)} · ${esc(v.tour)}</p>
        </div>
      </div>`
    )
    .join("");

  $("#argMapNote").textContent =
    map.places.length + " puntos geográficos relevados · Mapa esquemático, no cartográfico.";

  $("#argVisits").innerHTML = visits
    .map(
      (v) => `
      <article class="visit">
        <div class="reveal">
          <span class="y">${v.year}</span>
          <p class="tour">${esc(v.tour)}</p>
        </div>

        <div class="visit-body reveal">
          <h4>${esc(v.venue)}</h4>
          <p class="where">${esc(v.city)} · ${esc(v.dates.join(" · "))}</p>
          <p class="ctx">${esc(v.context)}</p>
          <p class="rec">${esc(v.reception)}</p>

          ${v.setlistVerified && v.setlist.length ? `<p class="setlist"><b>Setlist destacado</b>${esc(v.setlist.slice(0, 9).join(" · "))}</p>` : ""}

          ${v.contradictions ? `<div class="tofix"><b>A revisar</b>${esc(v.contradictions)}</div>` : ""}

          <div class="srcs">
            ${v.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.type)} ↗</a>`).join("")}
          </div>
        </div>
      </article>`
    )
    .join("");
}

/* ============================================================
   ARCHIVO VISUAL — galería con filtros y tamaños variables
   ============================================================ */
const LISTAS_ARCHIVO = {
  Portraits: ["alanis-portrait"],
  Live: ["alanis-2013-saban-theatre-2", "alanis-2008-koeln", "alanis-2005-roseland-ballroom", "alanis-2013-saban-theatre", "alanis-2013-saban-theatre-wide", "alanis-2014-saban-rally-2"],
  Tours: ["alanis-2022-live-raph", "alanis-2022-live-raph-2", "alanis-2014-saban-rally", "alanis-2003-brasilia", "alanis-2004-locarno"],
  Awards: ["alanis-walk-of-fame-star", "alanis-rock-walk-of-fame", "alanis-signing-autographs"],
  Studio: [],
  Argentina: [],
};

// Tamaños (spans) que adoptan las piezas en la grilla de 12 columnas
const TAMANOS = ["g7 row2", "g5", "g4", "g8 row2", "g4", "g6", "g6", "g5"];

function renderArchivo(categoria) {
  const raiz = $("#archiveGrid");
  let items;

  if (categoria === "Todos") {
    items = fotosUsables();
  } else {
    const ids = LISTAS_ARCHIVO[categoria] || [];
    items = ids.map(porId).filter(Boolean).filter((m) => !m.referencesOnly);
  }

  // Si la categoría no tiene imágenes, mostramos una explicación
  if (!items.length) {
    raiz.innerHTML = `
      <div class="arch-empty">
        <p class="overline" style="color:var(--ember)">${esc(categoria)}</p>
        <p>No encontramos imágenes de esta categoría con licencia libre.</p>
        <small>Alternativa legal: licenciar foto de prensa o referenciar la fuente.</small>
      </div>`;
    return;
  }

  raiz.innerHTML = items
    .map((m, i) => {
      const clase = TAMANOS[i % TAMANOS.length];
      return `
      <figure class="arch-item ${clase}">
        <img src="${m.src}" alt="${esc(m.description || m.title)}" />
        <figcaption class="a-cap"><b>${esc(m.title)}</b><span>${esc(m.credit)} · ${esc(m.license)}</span></figcaption>
      </figure>`;
    })
    .join("");
}

function iniciarArchivo() {
  renderArchivo("Todos");
  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    $$("#filters button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderArchivo(btn.dataset.cat);
  });
}

/* ============================================================
   FUENTES Y CRÉDITOS — listas de fuentes por grupo
   ============================================================ */
function renderCredits() {
  const fuentes = biografia.sources;

  // Una entrada por cada álbum (sin duplicados)
  const albumFuentes = Array.from(new Set(discografia.map((a) => a.source).filter(Boolean)));

  const listaFuentes = (arr) =>
    `<ul>${arr.map((s) => `<li><span class="type">${esc(s.type || "src")}</span><a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.title)} ↗</a></li>`).join("")}</ul>`;

  const listaAlbumes = (arr) =>
    `<ul>${arr.map((u) => `<li><span class="type">album</span><a href="${esc(u)}" target="_blank" rel="noreferrer">${esc(u)} ↗</a></li>`).join("")}</ul>`;

  // Fotos utilizables, con su licencia y crédito
  const fotos = fotosUsables();
  const listaFotos = `<ul>${fotos.map((m) => `<li><span class="type">${esc(m.license)}</span>${esc(m.title)} <span>— © ${esc(m.credit)}</span></li>`).join("")}</ul>`;

  $("#creditsGrid").innerHTML = `
    <div class="cred-col"><p class="h">Biografía</p>${listaFuentes(fuentes)}</div>
    <div class="cred-col"><p class="h">Discografía</p>${listaAlbumes(albumFuentes)}</div>
    <div class="cred-col"><p class="h">Conciertos en Argentina</p>${listaFuentes(argentina.sources)}</div>
    <div class="cred-col"><p class="h">Fotografías y licencias</p>${listaFotos}<p class="cred-note">Las portadas de los álbumes no se incluyen por copyright.</p></div>`;
}

/* ============================================================
   INICIO — se ejecuta al cargar la página
   ============================================================ */
function iniciar() {
  iniciarHero();
  iniciarNav();
  renderTimeline();
  renderDiscografia();
  renderJlp();
  renderEnVivo();
  renderArgentina();
  iniciarArchivo();
  renderCredits();

  // Los últimos: dependen de que ya exista todo el contenido
  iniciarReveals();
  iniciarParallax();
}

document.addEventListener("DOMContentLoaded", iniciar);
