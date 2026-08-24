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

//  MÁQUINA DE ESTADOS
// 1. ¿Por qué se usa Object.freeze()?

// R: Object.freeze() evita que el objeto sea modificado.
const UI_STATE = Object.freeze({
//    Esto es importante porque UI_STATE debe ser constante e inmutable.
//    Si alguien intenta cambiar un valor, el navegador lanzará un error en modo estricto.
//    Ejemplo: UI_STATE.PENDING = 'CARGANDO' → ❌ Error en modo estricto
  IDLE: 'IDLE',           // 🔵 Inactivo - antes de la primera búsqueda
  PENDING: 'PENDING',     // 🟡 Cargando - la promesa aún no termina
  FULFILLED: 'FULFILLED', // 🟢 Éxito - la promesa se cumplió
  REJECTED: 'REJECTED'    // 🔴 Error - la promesa fue rechazada
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

// 7. PASO 04 — PROMISE.ALLSETTLED: resultados individuales

function loadSettledPosts() {
  // 1. Mostrar indicador de carga
  showLoading('settled-posts');

  // 2. Definir IDs de los posts a cargar
  const postIds = [1, 2, 3, 4, 5];
  
  // 3. Crear un array de promesas (una por cada ID)
  const promises = postIds.map(id => fetch(`${API}/posts/${id}`));

  // 4. Promise.allSettled - espera TODAS las promesas (éxito o error)
  Promise.allSettled(promises)
    // 5. Procesar cada resultado individualmente
    .then(async results => {
      const container = document.getElementById('settled-posts');
      if (!container) return;

      // 6. Array para almacenar los posts procesados
      const posts = [];
      
      // 7. Iterar sobre cada resultado
      for (const result of results) {
        // 8. Verificar si la promesa se cumplió
        if (result.status === 'fulfilled') {
          try {
            // Convertir respuesta a JSON
            const data = await result.value.json();
            posts.push({ status: 'fulfilled', data });
          } catch (e) {
            // ❌ Error al convertir a JSON
            posts.push({ status: 'rejected', reason: e.message });
          }
        } else {
          // ❌ La promesa fue rechazada
          posts.push({ status: 'rejected', reason: result.reason });
        }
      }

      // 9. Renderizar cada post (éxito o error)
      container.innerHTML = posts.map((post, index) => {
        // ✅ Post exitoso
        if (post.status === 'fulfilled') {
          return `
            <article class="card card-hover p-5 animate-fade-in">
              <div class="flex items-center justify-between gap-3 mb-2.5">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Post #${post.data.id}</span>
                <span class="chip-success">✅ Éxito</span>
              </div>
              <h4 class="font-bold text-slate-900 text-sm leading-snug">${sanitizeHTML(post.data.title)}</h4>
              <p class="text-xs text-slate-500 mt-1.5">👤 Autor: usuario ${post.data.userId}</p>
            </article>
          `;
        }
        // ❌ Post fallido
        return `
          <article class="card card-hover p-5 animate-fade-in !border-red-200">
            <div class="flex items-center justify-between gap-3 mb-2.5">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Petición #${index + 1}</span>
              <span class="chip-danger">❌ Fallo</span>
            </div>
            <p class="text-sm text-red-600 font-medium">${sanitizeHTML(String(post.reason))}</p>
          </article>
        `;
      }).join(''); // 3Unir todas las tarjetas
    })
    // 10. Siempre se ejecuta (allSettled NUNCA rechaza)
    .finally(() => console.log('[Paso 4] Promise.allSettled completada.'));
}

// 8. PASO 05 — PROMISE.RACE: API contra temporizador de 2 segundos

function loadRaceResult() {
  // 1. Mostrar indicador de carga con mensaje personalizado
  showLoading('race-result', 'Iniciando la carrera…');

  // 2. Competidor 1: la petición real a la API
  const apiPromise = fetch(`${API}/posts/1`).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json(); // 📦 Convertir a JSON
  });

  // 3. Competidor 2: un temporizador que rechaza a los 2 segundos
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('⏰ Tiempo de espera agotado (2s)')), 2000);
  });

  // 4. Promise.race - el primero en terminar gana
  Promise.race([apiPromise, timeoutPromise])
    // 5. Caso 1: Ganó la API (resuelve primero)
    .then(result => {
      const container = document.getElementById('race-result');
      if (!container) return;
      
      // Mostrar mensaje de victoria de la API
      container.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <div>
            <p class="font-extrabold text-slate-900">🏆 Ganó la API</p>
            <p class="text-sm text-slate-600 mt-1">${sanitizeHTML(result.title)}</p>
            <p class="text-xs text-slate-400 mt-1.5">✅ La respuesta llegó antes que el temporizador de 2 segundos.</p>
          </div>
        </div>
      `;
    })
    // 6. Caso 2: Ganó el temporizador (rechaza primero)
    .catch(error => {
      const container = document.getElementById('race-result');
      if (!container) return;
      
      // Verificar si el error es por timeout
      const isTimeout = error.message.includes('Tiempo de espera');
      
      if (isTimeout) {
        // Mostrar mensaje de victoria del temporizador
        container.innerHTML = `
          <div class="flex items-start gap-4">
            <span class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <div>
              <p class="font-extrabold text-slate-900">⏰ Ganó el temporizador</p>
              <p class="text-sm text-slate-600 mt-1">La API tardó más de 2 segundos en responder.</p>
            </div>
          </div>
        `;
      } else {
        // Otro tipo de error (mostrar error genérico)
        showError('race-result', error.message);
      }
    })
    // 7. Siempre se ejecuta
    .finally(() => console.log('[Paso 5] Promise.race completada.'));
}

// 9. PASO 06 — PROMISE.ANY: primer éxito entre 3 endpoints

function loadAnyResult() {
  // 1. Mostrar indicador de carga
  showLoading('any-result');

  // 2. Definir 3 endpoints para intentar
  const endpoints = [`${API}/posts/1`, `${API}/posts/2`, `${API}/posts/3`];
  
  // 3. Crear promesas para cada endpoint
  const promises = endpoints.map(url =>
    fetch(url).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json(); // Convertir a JSON
    })
  );

  // 4. Promise.any - el PRIMER ÉXITO es el que cuenta
  Promise.any(promises)
    // 5. Caso 1: Al menos un éxito
    .then(result => {
      const container = document.getElementById('any-result');
      if (!container) return;
      
      // Mostrar el primer post exitoso
      container.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="6"/>
              <polyline points="8.21 13.5 7 23 12 20 17 23 15.79 13.5"/>
            </svg>
          </span>
          <div>
            <p class="font-extrabold text-slate-900">🏆 Primer éxito encontrado</p>
            <p class="text-sm text-slate-600 mt-1">${sanitizeHTML(result.title)}</p>
            <p class="text-xs text-slate-400 mt-1.5">📝 Post ID: ${result.id} · 👤 Autor: usuario ${result.userId}</p>
          </div>
        </div>
      `;
    })
    // 6. Caso 2: Todos fallaron
    .catch(error => {
      const container = document.getElementById('any-result');
      if (!container) return;
      
      // Mostrar mensaje de error general
      container.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </span>
          <div>
            <p class="font-extrabold text-slate-900">❌ Todos los intentos fallaron</p>
            <p class="text-sm text-slate-600 mt-1">${sanitizeHTML(error.message)}</p>
          </div>
        </div>
      `;
    })
    // 7. Siempre se ejecuta
    .finally(() => console.log('[Paso 6] Promise.any completada.'));
}

// 10. PASO 07 — MÁQUINA DE ESTADOS: UI reactiva

// Variable de control para evitar inicialización múltiple
let searchInitialized = false;

function initSearchIfNeeded() {
  // 1. Evitar inicialización duplicada
  if (searchInitialized) return;
  searchInitialized = true;

  // 2. Obtener referencias a elementos del DOM
  const input = document.getElementById('user-id-input');
  const btn = document.getElementById('search-btn');
  const statusEl = document.getElementById('search-status');
  const resultsEl = document.getElementById('search-results');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');

  // 3. Clases CSS para cada estado (banners de colores)
  const STATUS_CLASSES = {
    PENDING:   'mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    FULFILLED: 'mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
    REJECTED:  'mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
  };

  // 4. Único punto donde cambia la UI según el estado
  function setState(state, message = '') {
    // Mostrar el banner de estado
    statusEl.classList.remove('hidden');
    statusEl.className = STATUS_CLASSES[state];

    switch (state) {
      case UI_STATE.PENDING:
        // Estado de carga
        statusEl.textContent = message || 'Consultando al servidor…';
        btnText.textContent = 'Buscando…';
        btnSpinner.classList.remove('hidden'); // Mostrar spinner
        btn.disabled = true; // Deshabilitar botón
        break;
        
      case UI_STATE.FULFILLED:
        // Estado de éxito
        statusEl.textContent = message || '✅ Datos cargados correctamente.';
        btnText.textContent = 'Buscar';
        btnSpinner.classList.add('hidden'); // Ocultar spinner
        btn.disabled = false; // Habilitar botón
        break;
        
      case UI_STATE.REJECTED:
        // Estado de error
        statusEl.textContent = message || '❌ No fue posible cargar los datos.';
        btnText.textContent = 'Buscar';
        btnSpinner.classList.add('hidden'); // Ocultar spinner
        btn.disabled = false; // Habilitar botón
        break;
    }
  }

  // 5. Función principal de búsqueda
  function searchPostsByUser(userId) {
    // Cambiar a estado PENDING
    setState(UI_STATE.PENDING, `🔄 Buscando posts del usuario #${userId}…`);
    
    // Hacer la petición a la API
    fetch(`${API}/posts?userId=${userId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json(); // Convertir a JSON
      })
      .then(posts => {
        // ✅ Éxito - verificar si hay resultados
        if (posts.length === 0) {
          // 📭 Sin posts
          setState(UI_STATE.FULFILLED, `ℹ️ El usuario #${userId} existe, pero no tiene posts publicados.`);
          resultsEl.innerHTML = `<p class="text-sm text-slate-400">📭 Sin resultados para mostrar.</p>`;
          return;
        }
        
        // Mostrar posts encontrados
        setState(UI_STATE.FULFILLED, `✅ ${posts.length} posts encontrados.`);
        resultsEl.innerHTML = posts.map(post => `
          <article class="rounded-xl bg-white ring-1 ring-slate-200 p-4 hover:ring-primary-300 hover:bg-primary-50/40 transition-colors">
            <h4 class="text-sm font-bold text-slate-900">${sanitizeHTML(post.title)}</h4>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              ${sanitizeHTML(post.body.substring(0, 120))}${post.body.length > 120 ? '…' : ''}
            </p>
          </article>
        `).join('');
      })
      .catch(error => {
        // ❌ Error - cambiar a estado REJECTED
        setState(UI_STATE.REJECTED, `❌ Error: ${error.message}`);
        resultsEl.innerHTML = ''; // 🧹 Limpiar resultados
      });
  }

  // 6. Evento click del botón
  btn.addEventListener('click', () => {
    const userId = parseInt(input.value.trim());
    
    // Validar ID (1-10)
    if (isNaN(userId) || userId < 1 || userId > 10) {
      setState(UI_STATE.REJECTED, '⚠️ Ingresa un ID válido entre 1 y 10.');
      resultsEl.innerHTML = '';
      return;
    }
    
    // Ejecutar búsqueda
    searchPostsByUser(userId);
  });

  // 7. Evento Enter en el input
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click(); // Simular click en el botón
  });

  // 8. Búsqueda automática inicial (usuario ID 1)
  searchPostsByUser(1);
}

// 11. CONTACTO — tarjetas de canales + horario de atención

// Función para cargar datos de contacto
function loadContactData() {
  // 1. Obtener el contenedor
  const container = document.getElementById('contact-content');
  if (!container) return;

  // 2. Evitar recargar múltiples veces
  if (container.dataset.loaded) return;
  container.dataset.loaded = 'true';

  // 3. Datos de contacto (canales de comunicación)
  const methods = [
    {
      label: 'Teléfono',
      value: '+57 601 123 4567',
      icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'
    },
    {
      label: 'Correo',
      value: 'taller.promesas@ejemplo.com',
      icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'
    },
    {
      label: 'Dirección',
      value: 'Centro de Formación — Sede Principal, Aula 42',
      icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'
    }
  ];

  // 4. Renderizar el contenido
  container.innerHTML = `
    <div class="space-y-5">
      <!-- Tarjetas de canales de contacto -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        ${methods.map(m => `
          <div class="card card-hover p-6">
            <span class="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${m.icon}</svg>
            </span>
            <p class="mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">${m.label}</p>
            <p class="mt-1 font-semibold text-slate-800 break-words">${m.value}</p>
          </div>
        `).join('')}
      </div>
     
      <!-- Horario de atención -->
      <div class="card p-6">
        <h3 class="font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Horario de atención
        </h3>
        <dl class="mt-4 divide-y divide-slate-100 max-w-md">
          <div class="flex justify-between py-2.5 text-sm">
            <dt class="text-slate-500">Lunes a viernes</dt>
            <dd class="font-semibold text-slate-800 tabular-nums">8:00 — 18:00</dd>
          </div>
          <div class="flex justify-between py-2.5 text-sm">
            <dt class="text-slate-500">Sábados</dt>
            <dd class="font-semibold text-slate-800 tabular-nums">9:00 — 13:00</dd>
          </div>
          <div class="flex justify-between py-2.5 text-sm">
            <dt class="text-slate-500">Domingos y festivos</dt>
            <dd class="font-semibold text-slate-400">Cerrado</dd>
          </div>
        </dl>
      </div>
    </div>
  `;
}

// 12. USUARIO + TAREAS — Promise.all dentro de una carrera con timeout

// Carga usuario y TODOs con timeout de 3 segundos
function loadUserWithTodos(userId) {
  // 1. Obtener el contenedor
  const container = document.getElementById('user-todos-result');
  if (!container) return;

  // 2. Mostrar indicador de carga
  showLoading('user-todos-result', 'Consultando usuario y sus tareas…');

  // 3. Promesa para obtener el usuario
  const userPromise = fetch(`${API}/users/${userId}`).then(r => {
    if (!r.ok) throw new Error(`Usuario ${userId} no encontrado`);
    return r.json();
  });

  // 4. Promesa para obtener los TODOs del usuario
  const todosPromise = fetch(`${API}/users/${userId}/todos`).then(r => {
    if (!r.ok) throw new Error(`Tareas del usuario ${userId} no encontradas`);
    return r.json();
  });

  // 5. Timeout de 3 segundos
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Tiempo de espera agotado (3s)')), 3000);
  });

  // 6. Carrera: Promise.all (usuario + tareas) vs timeout
  Promise.race([
    Promise.all([userPromise, todosPromise]), // Combinación de promesas
    timeoutPromise                             // Temporizador
  ])
    // 7. Caso exitoso: usuario y tareas cargados
    .then(([user, todos]) => {
      const total = todos.length;
      const completed = todos.filter(t => t.completed).length;
      const pending = total - completed;
      const rate = total ? Math.round((completed / total) * 100) : 0;

      container.innerHTML = `
        <div class="card p-6 animate-fade-in">
          <!-- Información del usuario -->
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-extrabold text-slate-900 tracking-tight">
                ${sanitizeHTML(user.name)}
              </h3>
              <p class="text-sm text-primary-600 font-semibold mt-0.5">
                ${sanitizeHTML(user.email)}
              </p>
              <p class="text-xs text-slate-400 mt-1">
                @${sanitizeHTML(user.username)}
              </p>
            </div>
            <span class="chip-brand">Usuario #${user.id}</span>
          </div>

          <!-- Estadísticas de tareas -->
          <div class="grid grid-cols-2 gap-3 mt-5">
            <div class="rounded-xl bg-emerald-50 ring-1 ring-inset ring-emerald-100 p-4 text-center">
              <p class="text-2xl font-extrabold text-emerald-600 tabular-nums">${completed}</p>
              <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-700/70 mt-1">
                ✅ Completadas
              </p>
            </div>
            <div class="rounded-xl bg-amber-50 ring-1 ring-inset ring-amber-100 p-4 text-center">
              <p class="text-2xl font-extrabold text-amber-600 tabular-nums">${pending}</p>
              <p class="text-[11px] font-bold uppercase tracking-wider text-amber-700/70 mt-1">
                ⏳ Pendientes
              </p>
            </div>
          </div>

          <!-- Barra de progreso -->
          <div class="mt-5">
            <div class="flex justify-between text-xs font-semibold mb-1.5">
              <span class="text-slate-500">📊 Progreso</span>
              <span class="text-primary-700 tabular-nums">${rate}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-700" 
                   style="width:${rate}%"></div>
            </div>
          </div>

          <!-- Lista de tareas (expandible) -->
          <details class="mt-5">
            <summary class="text-xs font-semibold text-primary-600 cursor-pointer hover:text-primary-700">
              📋 Ver lista de tareas (${total})
            </summary>
            <ul class="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
              ${todos.map(todo => `
                <li class="flex items-start gap-2 text-sm ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'}">
                  <span class="mt-0.5">${todo.completed ? '✅' : '⏳'}</span>
                  ${sanitizeHTML(todo.title)}
                </li>
              `).join('')}
            </ul>
          </details>
        </div>
      `;
    })
    // 8. Caso de error: timeout u otro error
    .catch(error => {
      const isTimeout = error.message.includes('Tiempo de espera');
      container.innerHTML = `
        <div class="px-4 py-3 rounded-xl text-sm font-medium ${isTimeout 
          ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200' 
          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'}">
          ${isTimeout ? '⏰ ' : '❌ '}${sanitizeHTML(error.message)}
          ${isTimeout ? '<p class="mt-1 text-xs font-normal">La API tardó más de 3 segundos en responder.</p>' : ''}
        </div>
      `;
    });
}

// 13. VIDEOS — getUserMedia(): otra Promise del navegador

//  CÓDIGO DE LA CÁMARA
function initVideos() {
  const video = document.getElementById('video-preview');
  const canvas = document.getElementById('photo-canvas');
  const photoStatus = document.getElementById('photo-status');
  const videoInfo = document.getElementById('video-info');
  const startBtn = document.getElementById('start-camera');
  const stopBtn = document.getElementById('stop-camera');
  const captureBtn = document.getElementById('capture-photo');
  let stream = null;

  // 1. ¿Qué API se usa para acceder a la cámara?
  // R: navigator.mediaDevices.getUserMedia({ video: true })
  startBtn.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })   // Esta API devuelve una Promise que resuelve con un MediaStream.
      .then(s => {
        stream = s;
        video.srcObject = s;
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        captureBtn.classList.remove('hidden');
        videoInfo.innerHTML = `
          <p class="text-emerald-600 font-semibold">Cámara activa</p>
          <p>Resolución: ${video.videoWidth || '…'} × ${video.videoHeight || '…'} px</p>
        `;
        photoStatus.textContent = 'Listo para capturar.';
      })

      .catch(err => {
        // 2. ¿Cómo se manejan los errores de permisos?
        // R: Con .catch() que captura el error y muestra un mensaje
        videoInfo.innerHTML = `<p class="text-red-600 font-semibold">No se pudo acceder a la cámara: ${sanitizeHTML(err.message)}</p>`;
        //    informativo en la interfaz.
      });
  });

  // 4. ¿Cómo se detiene la transmisión de video?
  // R: Se detiene con stream.getTracks().forEach(track => track.stop())
  stopBtn.addEventListener('click', () => {
    if (!stream) return;
    stream.getTracks().forEach(track => track.stop());   // Esto libera los recursos de la cámara.
    stream = null;
    video.srcObject = null;
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    captureBtn.classList.add('hidden');
    videoInfo.innerHTML = `<p class="text-slate-500">Cámara detenida.</p>`;
    photoStatus.textContent = 'No hay foto capturada todavía.';
  });

    // Capturar foto
  captureBtn.addEventListener('click', () => {
    if (!stream) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.classList.remove('hidden');
    photoStatus.innerHTML = `
      <p class="text-emerald-600 font-semibold text-sm">Foto capturada</p>
      <p class="text-xs text-slate-400 mt-0.5">${canvas.width} × ${canvas.height} px</p>
    `;
  });
}

// 14. REPORTES — generación, descarga TXT, CSV e impresión

// Variables globales para el reporte
let currentReportData = null;
let reportGenerationTime = 0;

function initReports() {
  // 1. Obtener referencias a los elementos del DOM
  const genUsersBtn = document.getElementById('gen-report-users');
  const genPostsBtn = document.getElementById('gen-report-posts');
  const genCombinedBtn = document.getElementById('gen-report-combined');
  const downloadBtn = document.getElementById('download-report');
  const printBtn = document.getElementById('print-report');
  const previewEl = document.getElementById('report-preview');
  const exportCsvBtn = document.getElementById('export-csv');
  const recordCountSelect = document.getElementById('record-count');
  const timeDisplay = document.getElementById('report-time');

  // 2. Validación de existencia
  if (!genUsersBtn) return;

  // 3. Construye el texto plano del reporte y lo pinta en la terminal
  function renderReport(title, lines) {
    const timestamp = new Date().toISOString();
    const report = [
      '========================================',
      `  REPORTE: ${title}`,
      `  Generado: ${timestamp}`,
      '========================================',
      '',
      ...lines,
      '',
      '========================================',
      '  Fin del reporte',
      '========================================'
    ].join('\n');

    currentReportData = report;
    previewEl.textContent = report;
    downloadBtn.classList.remove('hidden');
    printBtn.classList.remove('hidden');
    if (exportCsvBtn) exportCsvBtn.classList.remove('hidden');

    if (timeDisplay) {
      timeDisplay.textContent = `Generación: ${reportGenerationTime} ms`;
    }
  }

  // 4. Obtener la cantidad de registros seleccionada
  function getRecordCount() {
    return recordCountSelect ? parseInt(recordCountSelect.value) : 5;
  }

  // 5. Función para descargar archivos
  function triggerDownload(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 6. Reporte de Usuarios
  genUsersBtn.addEventListener('click', async () => {
    try {
      const count = getRecordCount();
      const response = await fetch(`${API}/users?_limit=${count}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const users = await response.json();
      const lines = users.map((u, i) => [
        `Usuario #${i + 1}:`,
        `  Nombre: ${u.name}`,
        `  Username: ${u.username}`,
        `  Email: ${u.email}`,
        `  Empresa: ${u.company.name}`,
        `  Ciudad: ${u.address.city}`,
        ''
      ].join('\n')).join('');
      renderReport(`Reporte de Usuarios (${count})`, lines.split('\n'));
    } catch (error) {
      previewEl.textContent = `Error generando el reporte: ${error.message}`;
    }
  });

  // 7. Reporte de Posts
  genPostsBtn.addEventListener('click', async () => {
    try {
      const count = getRecordCount();
      const response = await fetch(`${API}/posts?_limit=${count}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const posts = await response.json();
      const lines = posts.map(p => [
        `Post #${p.id}:`,
        `  Titulo: ${p.title}`,
        `  Body: ${p.body.substring(0, 80)}...`,
        `  Autor ID: ${p.userId}`,
        ''
      ].join('\n')).join('');
      renderReport(`Reporte de Posts (${count})`, lines.split('\n'));
    } catch (error) {
      previewEl.textContent = `Error generando el reporte: ${error.message}`;
    }
  });

  // 8. Reporte Combinado (Promise.all)
  genCombinedBtn.addEventListener('click', async () => {
    try {
      const count = getRecordCount();
      const [usersRes, postsRes] = await Promise.all([
        fetch(`${API}/users?_limit=${count}`),
        fetch(`${API}/posts?_limit=${count}`)
      ]);
      if (!usersRes.ok || !postsRes.ok) throw new Error('Error al obtener los datos');
      const users = await usersRes.json();
      const posts = await postsRes.json();
      const lines = [
        '=== COMBINADO ===',
        `--- Usuarios (${users.length}) ---`,
        ...users.map(u => `  ${u.name} (${u.username})`),
        `--- Posts (${posts.length}) ---`,
        ...posts.map(p => `  Post #${p.id}: "${p.title.substring(0, 50)}..."`),
        '--- Resumen ---',
        `  Total usuarios: ${users.length}`,
        `  Total posts: ${posts.length}`
      ];
      renderReport(`Reporte Combinado (${count} usuarios)`, lines);
    } catch (error) {
      previewEl.textContent = `Error generando el reporte: ${error.message}`;
    }
  });

  // 9. Exportar a CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (!currentReportData) return;
      triggerDownload(currentReportData, `reporte-${Date.now()}.csv`, 'text/csv');
    });
  }

  // 10. Descargar como TXT
  downloadBtn.addEventListener('click', () => {
    if (!currentReportData) return;
    triggerDownload(currentReportData, `reporte-${Date.now()}.txt`, 'text/plain');
  });

  // 11. Imprimir reporte
  printBtn.addEventListener('click', () => window.print());
}

// 15. GEOLOCALIZACIÓN — coordenadas + mapa embebido

// CÓDIGO DE GEOLOCALIZACIÓN - initGeolocation()
function initGeolocation() {
  const getLocationBtn = document.getElementById('get-location');
  const geoInfo = document.getElementById('geo-info');
  const geoError = document.getElementById('geo-error');
  const mapFrame = document.getElementById('map-frame');
  if (!getLocationBtn) return;

  function showGeoError(message) {
    geoError.classList.remove('hidden');
    geoError.textContent = message;
  }

  // 1. ¿Qué método se usa para obtener la ubicación?
  getLocationBtn.addEventListener('click', async () => {   // R: navigator.geolocation.getCurrentPosition()
    geoError.classList.add('hidden');
    geoInfo.innerHTML = `
      <div class="flex items-center gap-3 text-sm text-slate-400">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Obteniendo ubicación…
      </div>
    `;

    if (!navigator.geolocation) {
      showGeoError('Tu navegador no soporta geolocalización.');
      return;
    }

    // Verificar permisos antes de solicitar ubicación
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          showGeoError('Permiso denegado. Habilítalo en la configuración del navegador.');
          return;
        }
      } catch (e) { /* El navegador no expone Permissions API: seguimos igual */ }
    }

    navigator.geolocation.getCurrentPosition(
      // ✅ Función de éxito
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        geoInfo.innerHTML = `
          <div class="flex justify-between gap-4 py-1">
            <dt class="text-slate-400 font-medium">🌐 Latitud</dt>
            <dd class="font-semibold text-slate-800 tabular-nums">${latitude.toFixed(6)}</dd>
          </div>
          <div class="flex justify-between gap-4 py-1">
            <dt class="text-slate-400 font-medium">🌐 Longitud</dt>
            <dd class="font-semibold text-slate-800 tabular-nums">${longitude.toFixed(6)}</dd>
          </div>
          <div class="flex justify-between gap-4 py-1">
            <dt class="text-slate-400 font-medium">🎯 Precisión</dt>
            <dd class="font-semibold text-slate-800 tabular-nums">±${accuracy.toFixed(1)} m</dd>
          </div>
        `;
        
        // 2. Escribe la URL correcta de la API de geolocalización
        // R: URL de OpenStreetMap con las coordenadas embebidas
        mapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
      },
      //  bbox: bounding box (cuadro delimitador) con margen de 0.01°
      //  marker: punto rojo en la ubicación exacta
      
      // ❌ Función de error
      error => {
        geoInfo.innerHTML = '<p class="text-slate-400 text-sm">No se ha obtenido ninguna ubicación.</p>';
        
        // 4. Explica cómo se manejan los códigos de error
        // R: Se evalúa error.code y se muestra un mensaje específico para cada caso
        switch (error.code) {
          case error.PERMISSION_DENIED:
            // Usuario denegó el permiso de geolocalización
            showGeoError('🚫 Permiso denegado. Habilítalo en la configuración del navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            // No se pudo obtener la ubicación (GPS sin señal, etc.)
            showGeoError('📡 Ubicación no disponible. Verifica el GPS o tu conexión.');
            break;
          case error.TIMEOUT:
            // La solicitud excedió el tiempo máximo de espera
            showGeoError('⏰ Tiempo agotado al buscar la señal. Intenta de nuevo.');
            break;
          default:
            // ❌ Error desconocido
            showGeoError(`❌ Error inesperado: ${error.message}`);
        }
      },
      
      // 3. ¿Qué opciones de configuración se pasan al método de geolocalización?
      // R: Se pasan las siguientes opciones en un objeto:
      {
        enableHighAccuracy: true,   // Usar GPS para mayor precisión (consume más batería)
        timeout: 10000,             // Tiempo máximo de espera (10 segundos)
        maximumAge: 60000           // Aceptar ubicación en caché (1 minuto)
      }
    );
  });
}

// 16. DASHBOARD — métricas globales con auto-refresco (30 s)

// Variable global para controlar el intervalo de actualización
let dashboardUpdateInterval = null;

function loadDashboardData() {
  // 1. Obtener el contenedor
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  // 2. Limpiar intervalos anteriores para evitar duplicados
  if (dashboardUpdateInterval) {
    clearInterval(dashboardUpdateInterval);
    dashboardUpdateInterval = null;
  }

  // 3. Función para conectar botones después de renderizar
  function bindDashboardButtons() {
    const refreshBtn = document.getElementById('refresh-dashboard-btn');
    const retryBtn = document.getElementById('retry-dashboard-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchDashboardMetrics);
    if (retryBtn) retryBtn.addEventListener('click', fetchDashboardMetrics);
  }

  // 4. Función principal para obtener métricas del dashboard
  function fetchDashboardMetrics() {
    // Mostrar indicador de carga
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 gap-3">
        <div class="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-100 border-t-primary-600"></div>
        <p class="text-sm text-slate-400">Consultando métricas globales…</p>
      </div>
    `;

    // 5. Promise.all con 4 peticiones en paralelo
    Promise.all([
      fetch(`${API}/users`).then(r => r.json()),
      fetch(`${API}/posts`).then(r => r.json()),
      fetch(`${API}/comments`).then(r => r.json()),
      fetch(`${API}/albums`).then(r => r.json())
    ])
    // 6. Procesar los datos recibidos
    .then(([users, posts, comments, albums]) => {
      // 7. Calcular posts por usuario
      const userPostCount = {};
      posts.forEach(post => {
        userPostCount[post.userId] = (userPostCount[post.userId] || 0) + 1;
      });

      // 8. Obtener Top 3 autores con más posts
      const topUsers = Object.entries(userPostCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([userId, count]) => {
          const user = users.find(u => u.id === parseInt(userId));
          return { name: user ? user.name : `Usuario ${userId}`, count };
        });

      // 9. Seleccionar un post aleatorio
      const randomPost = posts[Math.floor(Math.random() * posts.length)];

      // 10. Configurar métricas para las tarjetas
      const stats = [
        { label: 'Usuarios', value: users.length, tone: 'bg-primary-50 text-primary-600',
          icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
        { label: 'Posts', value: posts.length, tone: 'bg-sky-50 text-sky-600',
          icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
        { label: 'Comentarios', value: comments.length, tone: 'bg-violet-50 text-violet-600',
          icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
        { label: 'Álbumes', value: albums.length, tone: 'bg-amber-50 text-amber-600',
          icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' }
      ];

      // 11. Renderizar el dashboard
      container.innerHTML = `
        <div class="space-y-5 animate-fade-in">
          <!-- Tarjetas métricas -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            ${stats.map(s => `
              <div class="card card-hover p-6">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">${s.label}</p>
                    <p class="mt-2 text-3xl font-extrabold text-slate-900 tabular-nums">${s.value}</p>
                  </div>
                  <span class="w-11 h-11 rounded-xl ${s.tone} flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>
                  </span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Ranking y Post destacado -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <!-- Ranking Top 3 autores -->
            <div class="card p-6">
              <h3 class="font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.5 7 23 12 20 17 23 15.79 13.5"/></svg>
                Top 3 autores
              </h3>
              <ol class="mt-4 space-y-2.5">
                ${topUsers.map((user, index) => `
                  <li class="flex items-center gap-3 rounded-xl ring-1 ring-slate-200 bg-white px-4 py-3">
                    <span class="w-8 h-8 rounded-full ${RANK_STYLES[index]} flex items-center justify-center text-xs font-extrabold shrink-0 tabular-nums">${index + 1}</span>
                    <span class="flex-1 min-w-0 truncate text-sm font-semibold text-slate-800">${sanitizeHTML(user.name)}</span>
                    <span class="chip-brand shrink-0 tabular-nums">${user.count} posts</span>
                  </li>
                `).join('')}
              </ol>
            </div>

            <!-- Post destacado aleatorio -->
            <div class="card p-6">
              <h3 class="font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Post destacado
              </h3>
              <div class="mt-4 rounded-xl bg-primary-50 ring-1 ring-inset ring-primary-100 p-5">
                <h4 class="font-bold text-primary-900 leading-snug">${sanitizeHTML(randomPost.title)}</h4>
                <p class="text-sm text-primary-800/80 mt-2 leading-relaxed">${sanitizeHTML(randomPost.body)}</p>
              </div>
            </div>
          </div>

          <!-- Barra de refresco -->
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white ring-1 ring-slate-200 px-4 py-3">
            <p class="flex items-center gap-2 text-xs text-slate-500">
              <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Actualización automática cada 30 segundos
            </p>
            <button id="refresh-dashboard-btn" class="btn-secondary text-xs">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Actualizar ahora
            </button>
          </div>
        </div>
      `;

      bindDashboardButtons();
    })
    // 12. Manejo de errores
    .catch(error => {
      container.innerHTML = `
        <div class="card p-6 !border-red-200">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p class="font-extrabold text-slate-900">No se pudo cargar el dashboard</p>
              <p class="text-sm text-slate-500 mt-1">${sanitizeHTML(error.message)}</p>
              <button id="retry-dashboard-btn" class="btn-primary mt-4">Reintentar</button>
            </div>
          </div>
        </div>
      `;
      bindDashboardButtons();
    });
  }

  // 13. Cargar datos iniciales
  fetchDashboardMetrics();

  // 14. Configurar actualización automática cada 30 segundos
  dashboardUpdateInterval = setInterval(fetchDashboardMetrics, 30000);
}

// 17. SIDEBAR RESPONSIVO — abrir/cerrar según el tamaño de pantalla

function initSidebar() {
  // 1. Obtener referencias a los elementos del DOM
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');

  // 2. Detectar si estamos en móvil (ancho <= 1023px)
  function isMobile() {
    return window.matchMedia('(max-width: 1023px)').matches;
  }

  // 3. Función para cerrar el sidebar
  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');   // Desliza fuera de pantalla
    if (isMobile()) overlay.classList.add('hidden');
    if (!isMobile() && mainContent) mainContent.classList.remove('ml-64');
  }

  // 4. Función para abrir el sidebar
  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    if (isMobile()) overlay.classList.remove('hidden');
    if (!isMobile() && mainContent) mainContent.classList.add('ml-64');
  }

  // 5. Manejar cambio de breakpoint (móvil/desktop)
  function handleBreakpointChange() {
    if (isMobile()) {
      closeSidebar();
    } else {
      sidebar.classList.remove('-translate-x-full');
      overlay.classList.add('hidden');
      if (mainContent) mainContent.classList.add('ml-64');
    }
  }

  // 6. Debounce para eventos resize (evita ejecuciones excesivas)
  const mql = window.matchMedia('(max-width: 1023px)');
  function handleBreakpointChangeDebounced() {
    clearTimeout(handleBreakpointChange.timer);
    handleBreakpointChange.timer = setTimeout(handleBreakpointChange, 50);
  }

  // 7. Evento click del botón de menú móvil
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = !sidebar.classList.contains('-translate-x-full');
      isOpen ? closeSidebar() : openSidebar();
    });
  }

  // 8. Evento click del botón cerrar (dentro del sidebar)
  if (toggleBtn) toggleBtn.addEventListener('click', closeSidebar);

  // 9. Evento click del overlay (fondo oscuro)
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // 10. Evento click en enlaces de navegación
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();                       // Controlamos la navegación
      navigateTo(link.getAttribute('data-page'));
      if (isMobile()) closeSidebar();
    });
  });

  // 11. Evento hashchange para navegación SPA
  window.addEventListener('hashchange', handleRoute);

  // 12. Detectar cambios en el breakpoint
  mql.addEventListener('change', handleBreakpointChangeDebounced);

  // 13. Estado inicial correcto
  handleBreakpointChange();
}

// 18. ARRANQUE DE LA APLICACIÓN

document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] DOM listo. Iniciando SPA con el tema Indigo Academico.');
  initSidebar();        // Menú lateral y breakpoints
  initVideos();         // Cámara
  initReports();        // Generador de reportes
  initGeolocation();    // Mapa y coordenadas
  initSearchIfNeeded(); // Máquina de estados
  handleRoute();        // Router inicial (muestra la página del hash)
});