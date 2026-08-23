/**
 *  PROMESAS JS — LÓGICA DE LA SPA
 *  Sistema de diseño "Indigo Académico" (tema claro, color de marca #4F46E5)
 *  SPA con navegación por hash (#pagina) que demuestra 7 patrones de Promesas.
 *  API: JSONPlaceholder (https://jsonplaceholder.typicode.com/)
 *
 *  Índice:
 *    1.  Configuración global
 *    2.  Utilidades (sanitización, carga, errores, router visual)
 *    3.  Rutas SPA
 *    4.  Promise básica
 *    5.  Promise + array (tarjetas con avatar de iniciales)
 *    6.  Promise.all
 *    7.  Promise.allSettled
 *    8.  Promise.race
 *    9.  Promise.any
 *    10. Máquina de estados
 *    11. Contacto
 *    12. Usuario + tareas (combinado all + race con timeout)
 *    13. Videos (getUserMedia)
 *    14. Reportes
 *    15. Geolocalización
 *    16. Dashboard
 *    17. Sidebar responsivo
 *    18. Arranque de la aplicación
 *
 *  Nota de diseño: este archivo también genera HTML, así que Tailwind lo
 *  escanea para compilar sus clases (ver "content" en tailwind.config.js).
 */

// 1. CONFIGURACIÓN GLOBAL

const API = 'https://jsonplaceholder.typicode.com'; // URL base de la API (no see toca)

// Mapa de páginas: identificador técnico → título legible para el header
const PAGES = {
  home: 'Inicio',
  'promise-basica': 'Promise básica',
  'promise-array': 'Promise + array',
  'promise-all': 'Promise.all',
  'promise-allsettled': 'Promise.allSettled',
  'promise-race': 'Promise.race',
  'promise-any': 'Promise.any',
  'maquina-estados': 'Máquina de estados',
  videos: 'Videos',
  reportes: 'Reportes',
  geolocalizacion: 'Geolocalización',
  contacto: 'Contacto', //nuevo
  dashboard: 'Dashboard' //nuevo
};

// Este objeto mapea cada identificador de página con su título legible
function getPageFromHash() {
  return window.location.hash.replace('#', '') || 'home';
}

// EXPLICACIÓN: Esta función lee el hash de la URL (ej: #promise-basica),
// elimina el símbolo '#' y devuelve el nombre de la página.
// Si no hay hash, devuelve 'home' por defecto.

// Estados posibles de la máquina de estados de la UI
const UI_STATE = Object.freeze({
  IDLE: 'IDLE',             // Inactivo (antes de la primera búsqueda)
  PENDING: 'PENDING',       // Cargando: la promesa aún no termina
  FULFILLED: 'FULFILLED',   // Éxito: la promesa se cumplió
  REJECTED: 'REJECTED'      // Error: la promesa fue rechazada
});

/* Paleta de avatares: se asigna por índice para que la lista de usuarios
   tenga variedad de colores sin repetir dos iguales seguidos. */
const AVATAR_TONES = [
  'bg-primary-100 text-primary-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700'
];

/* Estilos del badge de ranking en el dashboard: oro, plata, bronce. */
const RANK_STYLES = [
  'bg-amber-100 text-amber-700',
  'bg-slate-200 text-slate-600',
  'bg-orange-100 text-orange-700'
];

// 2. UTILIDADES

// Escapa caracteres especiales para prevenir ataques XSS cuando el texto
// proveniente de la API se inserta dentro del HTML.7
function sanitizeHTML(raw) {
  if (typeof raw !== 'string') return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return raw.replace(/[&<>"']/g, match => map[match]);
}

// Spinner + mensaje de carga reutilizables (se insertan en un contenedor). 
function showLoading(containerId, message = 'Cargando datos…') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="flex items-center gap-3 py-2 text-sm text-slate-400">
      <svg class="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      ${sanitizeHTML(message)}
    </div>
  `;
}

// Caja de error con estilo de alerta suave (rojo sobre rojo muy claro). 
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
      <svg class="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span><strong class="font-bold">Error:</strong> ${sanitizeHTML(message)}</span>
    </div>
  `;
}

// Lee el nombre de la página desde el hash (#pagina). Por defecto: home. 
function getPageFromHash() {
  return window.location.hash.replace('#', '') || 'home';
}

// Cambia el hash; el evento hashchange dispara el router. 
function navigateTo(page) {
  window.location.hash = page; // Cambia el hash y dispara hashchange
}

// Resalta el enlace activo del menú usando la clase .nav-item-active,
// que dibuja la barrita índigo a la izquierda (definida en input.css).
function updateNavActive() {
  const currentPage = getPageFromHash();
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('nav-item-active', link.getAttribute('data-page') === currentPage);
  });
}

// Actualiza el título del header Y el título de la pestaña del navegador. 
function updatePageTitle() {
  const title = PAGES[getPageFromHash()] || 'Inicio';
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = title; // Actualiza el título en el header
  document.title = `${title} · Promesas JS`; // Actualiza la pestaña del navegador
}

// Muestra la sección pedida, oculta las demás y reinicia la animación
function showPage(pageName) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById(`page-${pageName}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.remove('animate-slide-up');
    void target.offsetWidth;
    target.classList.add('animate-slide-up');
  }
  updateNavActive();
  updatePageTitle();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 3. RUTAS SPA

// Router principal: se ejecuta al cargar la página y con cada hashchange. 
function handleRoute() {
  const page = getPageFromHash();
  if (!PAGES[page]) {           // Página inexistente → volver al inicio
    navigateTo('home');
    return;
  }
  showPage(page);
  loadPageData(page);
}

// Carga: solo se piden datos al visitar cada sección. 
function loadPageData(page) {
  switch (page) {
    case 'promise-basica':      loadSinglePost();     break;
    case 'promise-array':       loadUsersList();      break;
    case 'promise-all':         loadCombinedData();   break;
    case 'promise-allsettled':  loadSettledPosts();   break;
    case 'promise-race':        loadRaceResult();     break;
    case 'promise-any':         loadAnyResult();      break;
    case 'maquina-estados':     initSearchIfNeeded(); break;
    case 'contacto':            loadContactData();    break;  // NUEVO CASO
    case 'dashboard':           loadDashboardData();  break;
    default: break;
  }
}

// 4. PASO 01 — PROMISE BÁSICA: fetch + then + catch + finally

//  SOLUCIÓN COMPLETA: Cargar 3 posts (IDs 1, 3 y 5)
function loadSinglePost() {
  showLoading('single-post');
  
  //  Array con los IDs de los posts a cargar
  const postIds = [1, 3, 5];
  
  //  Crear un array de promesas
  const promises = postIds.map(id => 
    fetch(`${API}/posts/${id}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status} - Post ${id}`);
        return response.json();
      })
  );
  
  //  Usamos Promise.allSettled para manejar éxitos y fallos individualmente
  Promise.allSettled(promises)
    .then(results => {
      const container = document.getElementById('single-post');
      if (!container) return;
      
      //  Contar cuántos posts se cargaron correctamente
      const successfulPosts = results.filter(r => r.status === 'fulfilled');
      const failedPosts = results.filter(r => r.status === 'rejected');
      
      //  Si todos fallaron
      if (successfulPosts.length === 0) {
        container.innerHTML = `
          <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <strong>⚠️ No se pudieron cargar los posts</strong>
            <p class="mt-1">Todos los intentos de carga fallaron.</p>
          </div>
        `;
        return;
      }
    
      //  Renderizar los posts exitosos
      let html = `
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="chip-brand">${successfulPosts.length} de ${results.length} posts cargados</span>
            ${failedPosts.length > 0 ? `<span class="chip-danger">${failedPosts.length} fallaron</span>` : ''}
          </div>
      `;
      
      //  Mostrar cada post
      successfulPosts.forEach((result, index) => {
        const post = result.value;
        html += `
          <article class="card card-hover p-5 animate-fade-in">
            <div class="flex items-center justify-between gap-3 mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Post #${post.id}</span>
              <span class="chip-success">✅ Cargado</span>
            </div>
            <h3 class="font-bold text-slate-900 text-sm leading-snug">
              ${sanitizeHTML(post.title)}
            </h3>
            <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
              ${sanitizeHTML(post.body.substring(0, 120))}${post.body.length > 120 ? '...' : ''}
            </p>
          </article>
        `;
      });
      
      //  Mostrar errores específicos
      if (failedPosts.length > 0) {
        html += `
          <div class="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <strong>⚠️ Errores:</strong>
            <ul class="mt-1 list-disc list-inside">
              ${failedPosts.map((result, i) => `
                <li>Post ID ${postIds[i]}: ${sanitizeHTML(String(result.reason || 'Error desconocido'))}</li>
              `).join('')}
            </ul>
          </div>
        `;
      }
      
      html += `</div>`;
      container.innerHTML = html;
    })
    .catch(error => {
      //  Error general (poco probable con allSettled)
      showError('single-post', `Error inesperado: ${error.message}`);
    })
    .finally(() => console.log('[Paso 1 Modificado] 3 posts cargados con allSettled.'));
}

// 5. PASO 02 — PROMISE + ARRAY: renderizar tarjetas con avatar

// Extrae las iniciales de un nombre completo ("Ana Gomez" → "AG").
function getInitials(fullName) {
  return fullName
    .split(' ')           // Divide el nombre en palabras
    .filter(Boolean)      // Elimina elementos vacíos
    .slice(0, 2)          // Toma máximo 2 palabras
    .map(word => word[0].toUpperCase()) // Primera letra mayúscula
    .join('');            // Une las iniciales
}

// Función principal: carga y renderiza lista de usuarios
function loadUsersList() {
  // 1. Mostrar indicador de carga
  showLoading('users-list', 'Cargando lista de usuarios…');
  
  // 2. Petición a la API (limita a 6 usuarios)
  fetch(`${API}/users?_limit=6`)
    .then(r => r.json())  // Convertir respuesta a JSON
    .then(users => {      // Procesar array de usuarios
      const container = document.getElementById('users-list');
      if (!container) return;
      
      // 3. Renderizar cada usuario como tarjeta
      container.innerHTML = users.map((user, i) => `
        <article class="card card-hover p-5 animate-fade-in">
          <div class="flex items-center gap-3">
            <!-- 🎨 Avatar con iniciales y color dinámico -->
            <span class="w-11 h-11 rounded-full ${AVATAR_TONES[i % AVATAR_TONES.length]} flex items-center justify-center font-extrabold text-sm shrink-0">
              ${getInitials(user.name)}
            </span>
            <div class="min-w-0">
              <h4 class="font-bold text-slate-900 truncate">${sanitizeHTML(user.name)}</h4>
              <p class="text-xs font-semibold text-primary-600">@${sanitizeHTML(user.username)}</p>
            </div>
          </div>
          <!-- 📋 Información adicional -->
          <dl class="mt-4 space-y-1.5 text-xs">
            <div class="flex justify-between gap-3">
              <dt class="text-slate-400 font-medium">Correo</dt>
              <dd class="text-slate-600 truncate">${sanitizeHTML(user.email)}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-400 font-medium">Empresa</dt>
              <dd class="text-slate-600 truncate">${sanitizeHTML(user.company.name)}</dd>
            </div>
          </dl>
        </article>
      `).join(''); // Unir todas las tarjetas en un solo string
    })
    // 4. Manejar errores
    .catch(err => showError('users-list', err.message))
    // 5. Siempre se ejecuta
    .finally(() => console.log('[Paso 2] Promesa con array completada.'));
}

// 6. PASO 03 — PROMISE.ALL: 3 peticiones atómicas en paralelo

function loadCombinedData() {
  // 1. Mostrar indicador de carga
  showLoading('combined-data');

  // 2. Promise.all con 3 peticiones en paralelo
  Promise.all([
    fetch(`${API}/posts/1`),          // Petición 1: Post ID 1
    fetch(`${API}/users/1`),          // Petición 2: Usuario ID 1
    fetch(`${API}/posts/1/comments`)  // Petición 3: Comentarios del post 1
  ])
    // 3. Procesar las respuestas
    .then(async ([postRes, userRes, commentsRes]) => {
      // ✅ Verificar que todas las respuestas sean exitosas
      if (!postRes.ok || !userRes.ok || !commentsRes.ok) 
        throw new Error('Error al obtener los datos');
      
      // Convertir todas las respuestas a JSON en paralelo
      const [post, user, comments] = await Promise.all([
        postRes.json(), 
        userRes.json(), 
        commentsRes.json()
      ]);
      
      // Devolver objeto combinado
      return { post, user, comments };
    })
    
    // 4. Renderizar en la interfaz
    .then(({ post, user, comments }) => {
      const container = document.getElementById('combined-data');
      if (!container) return;
      
      // Construir HTML con grid de 5 columnas
      container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- Columna izquierda: post + autor (2/5) -->
          <div class="lg:col-span-2 space-y-5">
            <!-- 📝 Post -->
            <div>
              <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-700">
                <span class="w-2 h-2 rounded-full bg-primary-500"></span> Post
              </h3>
              <p class="mt-2 font-bold text-slate-900 leading-snug">${sanitizeHTML(post.title)}</p>
              <p class="text-sm text-slate-600 mt-1 leading-relaxed">${sanitizeHTML(post.body)}</p>
            </div>
            
            <!-- 👤 Autor -->
            <div class="rounded-xl bg-primary-50 ring-1 ring-inset ring-primary-100 p-4">
              <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-700">
                <span class="w-2 h-2 rounded-full bg-primary-500"></span> Autor
              </h3>
              <p class="mt-2 font-bold text-slate-900">${sanitizeHTML(user.name)}</p>
              <p class="text-sm text-primary-700 font-medium">@${sanitizeHTML(user.username)}</p>
              <p class="text-xs text-slate-500 mt-1">${sanitizeHTML(user.email)}</p>
            </div>
          </div>
          
          <!-- Columna derecha: comentarios (3/5) -->
          <div class="lg:col-span-3">
            <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700">
              <span class="w-2 h-2 rounded-full bg-violet-500"></span> Comentarios (${comments.length})
            </h3>
            <div class="mt-3 space-y-2.5">
              ${comments.slice(0, 4).map(comment => `
                <div class="rounded-xl bg-white ring-1 ring-slate-200 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-bold text-slate-800">${sanitizeHTML(comment.name)}</p>
                    <span class="text-[11px] text-slate-400 truncate">${sanitizeHTML(comment.email)}</span>
                  </div>
                  <p class="text-sm text-slate-600 mt-1.5 leading-relaxed">${sanitizeHTML(comment.body)}</p>
                </div>
              `).join('')}
              ${comments.length > 4 ? `<p class="text-xs text-slate-400 pl-1">… y ${comments.length - 4} comentarios más.</p>` : ''}
            </div>
          </div>
        </div>
      `;
    })
    
    // 5. Manejar errores
    .catch(error => showError('combined-data', error.message))
    
    // 6.Siempre se ejecuta
    .finally(() => console.log('[Paso 3] Promise.all completada.'));
}
// REPORTES

let currentReportData = null;

function initReports() {
  const genUsersBtn = document.getElementById('gen-report-users');
  const genPostsBtn = document.getElementById('gen-report-posts');
  const genCombinedBtn = document.getElementById('gen-report-combined');
  const downloadBtn = document.getElementById('download-report');
  const printBtn = document.getElementById('print-report');
  const previewEl = document.getElementById('report-preview');

  if (!genUsersBtn) return;

  function renderReport(title, lines) {
    const timestamp = new Date().toISOString();
    const report = [
      `========================================`,
      `  REPORTE: ${title}`,
      `  Generado: ${timestamp}`,
      `========================================`,
      ``,
      ...lines,
      ``,
      `========================================`,
      `  Fin del reporte`,
      `========================================`
    ].join('\n');

    currentReportData = report;
    previewEl.textContent = report;
    downloadBtn.classList.remove('hidden');
    printBtn.classList.remove('hidden');
  }

  genUsersBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API}/users?_limit=5`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const users = await response.json();

      const lines = users.map((u, i) => [
        `Usuario #${i + 1}:`,
        `  Nombre:     ${u.name}`,
        `  Username:   ${u.username}`,
        `  Email:      ${u.email}`,
        `  Telefono:   ${u.phone}`,
        `  Empresa:    ${u.company.name}`,
        `  Ciudad:     ${u.address.city}`,
        `  Website:    ${u.website}`,
        ``
      ].join('\n')).join('');

      renderReport('Reporte de Usuarios', lines.split('\n'));
    } catch (error) {
      previewEl.innerHTML = `<p class="text-red-400">Error al generar reporte: ${sanitizeHTML(error.message)}</p>`;
    }
  });

  genPostsBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API}/posts?_limit=10`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const posts = await response.json();

      const lines = posts.map(p => [
        `Post #${p.id}:`,
        `  Titulo: ${p.title}`,
        `  Body: ${p.body.substring(0, 80)}...`,
        `  Autor ID: ${p.userId}`,
        ``
      ].join('\n')).join('');

      renderReport('Reporte de Posts', lines.split('\n'));
    } catch (error) {
      previewEl.innerHTML = `<p class="text-red-400">Error al generar reporte: ${sanitizeHTML(error.message)}</p>`;
    }
  });

  genCombinedBtn.addEventListener('click', async () => {
    try {
      const [usersRes, postsRes] = await Promise.all([
        fetch(`${API}/users?_limit=5`),
        fetch(`${API}/posts?_limit=5`)
      ]);
      if (!usersRes.ok || !postsRes.ok) throw new Error('Error al obtener datos');

      const users = await usersRes.json();
      const posts = await postsRes.json();

      const lines = [
        `=== COMBINADO ===`,
        ``,
        `--- Usuarios (${users.length}) ---`,
        ...users.map(u => `  ${u.name} (${u.username}) - ${u.email}`),
        ``,
        `--- Posts (${posts.length}) ---`,
        ...posts.map(p => `  Post #${p.id}: "${p.title.substring(0, 50)}..." (Usuario ${p.userId})`),
        ``,
        `--- Resumen ---`,
        `  Total usuarios: ${users.length}`,
        `  Total posts: ${posts.length}`,
        `  Posts por usuario (promedio): ${(posts.length / users.length).toFixed(1)}`
      ];

      renderReport('Reporte Combinado', lines);
    } catch (error) {
      previewEl.innerHTML = `<p class="text-red-400">Error al generar reporte: ${sanitizeHTML(error.message)}</p>`;
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!currentReportData) return;
    const blob = new Blob([currentReportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  printBtn.addEventListener('click', () => {
    window.print();
  });
}

// ================================================================
// GEOLOCALIZACION
// ================================================================

function initGeolocation() {
  const getLocationBtn = document.getElementById('get-location');
  const geoInfo = document.getElementById('geo-info');
  const geoError = document.getElementById('geo-error');
  const mapFrame = document.getElementById('map-frame');

  if (!getLocationBtn) return;

  getLocationBtn.addEventListener('click', async () => {
    geoError.classList.add('hidden');
    geoInfo.innerHTML = `<p class="text-yellow-400">Obteniendo ubicación...</p>`;

    if (!navigator.geolocation) {
      geoError.classList.remove('hidden');
      geoError.textContent = '❌ Tu navegador no soporta geolocalización.';
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          geoError.classList.remove('hidden');
          geoError.textContent = '❌ Permiso de ubicación denegado. Haz clic en el ícono de candado 🔒 en la barra de direcciones, selecciona "Sitio no seguro" o "Información del sitio", luego activa "Ubicación" y recarga la página.';
          return;
        }
      } catch (e) {
        // Si el navegador no soporta permissions.query, continuamos de todos modos
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const { timestamp } = position;

        geoInfo.innerHTML = `
          <div class="space-y-1">
            <p><strong>Latitud:</strong> <span class="text-emerald-400">${latitude.toFixed(6)}</span></p>
            <p><strong>Longitud:</strong> <span class="text-emerald-400">${longitude.toFixed(6)}</span></p>
            <p><strong>Precisión:</strong> ±${accuracy.toFixed(1)} metros</p>
            <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
          </div>
        `;

        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
        mapFrame.src = mapUrl;
      },
      (error) => {
        geoInfo.innerHTML = '';
        geoError.classList.remove('hidden');

        switch (error.code) {
          case error.PERMISSION_DENIED:
            geoError.textContent = '❌ Permiso de ubicación denegado. Haz clic en el ícono de candado 🔒 en la barra de direcciones, selecciona "Sitio no seguro" o "Información del sitio", luego activa "Ubicación" y recarga la página.';
            break;
          case error.POSITION_UNAVAILABLE:
            geoError.textContent = '❌ Ubicación no disponible. Verifica que tu dispositivo tenga GPS o conexión a red.';
            break;
          case error.TIMEOUT:
            geoError.textContent = '❌ La solicitud de ubicación expiró. Inténtalo de nuevo.';
            break;
          default:
            geoError.textContent = `❌ Error desconocido: ${error.message}`;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// ================================================================
// SIDEBAR Y NAVEGACION
// ================================================================

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');

  function isMobile() {
    return window.matchMedia('(max-width: 1023px)').matches;
  }

  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    if (isMobile()) {
      overlay.classList.add('hidden');
    }
    if (!isMobile() && mainContent) {
      mainContent.classList.remove('ml-64');
    }
  }

  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    if (isMobile()) {
      overlay.classList.remove('hidden');
    }
    if (!isMobile() && mainContent) {
      mainContent.classList.add('ml-64');
    }
  }

  function handleBreakpointChange() {
    if (isMobile()) {
      closeSidebar();
    } else {
      sidebar.classList.remove('-translate-x-full');
      overlay.classList.add('hidden');
      if (mainContent) {
        mainContent.classList.add('ml-64');
      }
    }
  }

  const mql = window.matchMedia('(max-width: 1023px)');

  function handleBreakpointChangeDebounced() {
    clearTimeout(handleBreakpointChange.timer);
    handleBreakpointChange.timer = setTimeout(handleBreakpointChange, 50);
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = !sidebar.classList.contains('-translate-x-full');
      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', closeSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateTo(page);
      if (isMobile()) {
        closeSidebar();
      }
    });
  });

  window.addEventListener('hashchange', handleRoute);
  mql.addEventListener('change', handleBreakpointChangeDebounced);
  handleBreakpointChange();
}

// ================================================================
// INICIALIZACION
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] DOM listo. Iniciando SPA...');

  initSidebar();
  initVideos();
  initReports();
  initGeolocation();
  initSearchIfNeeded();

  handleRoute();
});