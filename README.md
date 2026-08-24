# Promesas API Gratuita — SPA Tutorial

SPA educativo que demuestra los 7 patrones fundamentales de Promesas en JavaScript, además de módulos de video, reportes, geolocalización, contacto y un dashboard en vivo. Construido con Tailwind CSS local y la API gratuita [JSONPlaceholder](https://jsonplaceholder.typicode.com/).

---

## Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Secciones del tutorial](#secciones-del-tutorial)
  - [Patrones de Promesas](#patrones-de-promesas)
  - [Máquina de estados](#máquina-de-estados)
  - [Videos](#videos)
  - [Reportes](#reportes)
  - [Geolocalización](#geolocalización)
  - [Contacto](#contacto)
  - [Dashboard](#dashboard)
- [API utilizada](#api-utilizada)
- [Tecnologías](#tecnologías)
- [Licencia](#licencia)

---

## Características

- **Navegación SPA** por hash (`#page`) sin frameworks
- **Sidebar responsive** con overlay en móvil y fijo en desktop
- **7 patrones de Promesas** explicados paso a paso
- **Máquina de estados visual** (PENDING / FULFILLED / REJECTED)
- **Captura de video** con `getUserMedia()`
- **Generador de reportes** descargables en TXT, exportables a CSV e imprimibles
- **Geolocalización** con mapa de OpenStreetMap
- **Sección de contacto** con canales de comunicación y horario
- **Dashboard en vivo** con métricas globales y auto-refresco cada 30 segundos
- **Sin dependencias de runtime** — solo Tailwind CSS para estilos

---

## Requisitos

- [Node.js](https://nodejs.org/) v16 o superior
- Un navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet (para la API y el mapa embebido)

---

## Instalación

1. Clona o descarga este repositorio:

    ```bash
    cd PRENDCES
    ```

2. Instala las dependencias de desarrollo:

    ```bash
    npm install
    ```

3. Compila los estilos de Tailwind CSS:

    ```bash
    npm run build
    ```

---

## Uso

### Servidor local

```bash
npm start
```

Esto inicia un servidor estático con `serve` en la raíz del proyecto. Abre tu navegador en la URL indicada (por defecto `http://localhost:3000`).

### Modo desarrollo (watch de CSS)

```bash
npm run dev
```

Observa cambios en los archivos de Tailwind y recompila automáticamente.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Observa cambios y compila Tailwind CSS en tiempo real |
| `npm run build` | Compila y minifica los estilos de Tailwind CSS |
| `npm run build:css` | Igual que `build` (alias explícito) |
| `npm run watch:css` | Igual que `dev` (alias explícito) |
| `npm run start` | Inicia servidor estático local |
| `npm run clean` | Elimina el archivo CSS generado |

---

## Estructura del proyecto

```
PRENDCES/
├── index.html              # Página principal con todas las secciones
├── package.json            # Configuración de npm y dependencias
├── tailwind.config.js      # Configuración de Tailwind CSS
├── postcss.config.js       # Configuración de PostCSS
├── src/
│   ├── app.js              # Lógica principal de la SPA
│   ├── input.css           # Archivo de entrada para Tailwind
│   └── styles.css          # Estilos compilados (generado)
└── node_modules/           # Dependencias de desarrollo
```

---

## Secciones del tutorial

### Patrones de Promesas

Cada sección demuestra un patrón distinto de Promesas en JavaScript usando la API JSONPlaceholder:

| Sección | Patrón | Descripción |
|---|---|---|
| **Promise básica** | `fetch()` + `.then()` + `.catch()` + `.finally()` | Obtener posts múltiples con manejo de errores |
| **Promise + array** | `.map()` sobre array de usuarios | Renderizar lista de usuarios desde un array |
| **Promise.all** | Peticiones en paralelo | Dispara 3 peticiones simultáneas — falla si una falla |
| **Promise.allSettled** | Aislamiento de fallos | 5 peticiones independientes — nunca rechaza |
| **Promise.race** | Carrera contra timeout | La petición vs un temporizador de 2 segundos |
| **Promise.any** | Primer éxito | Intenta 3 endpoints y se queda con el primero exitoso |
| **Usuario + tareas** | `Promise.all` dentro de `Promise.race` | Usuario y TODOs con timeout de 3 segundos |

### Máquina de estados

- Buscador con estados visuales: **PENDING**, **FULFILLED** y **REJECTED**
- Spinner de carga, banners de colores y validación de entrada
- Búsqueda automática inicial por ID de usuario

### Videos

- Accede a la cámara del dispositivo usando `getUserMedia()` (que devuelve una Promise)
- Captura frames y los muestra en un canvas
- Información del stream de video en tiempo real

### Reportes

- Genera reportes desde datos de la API JSONPlaceholder
- Tres tipos: Usuarios, Posts, y Combinado (usa `Promise.all`)
- Opciones para descargar como `.txt`, exportar a `.csv` o imprimir

### Geolocalización

- Obtiene la ubicación del usuario con la API de geolocalización del navegador
- Muestra latitud, longitud, precisión y timestamp
- Renderiza la ubicación en un mapa embebido de OpenStreetMap
- Verificación de permisos antes de solicitar ubicación
- Manejo completo de errores y permisos

### Contacto

- Canales de comunicación oficiales (teléfono, correo, dirección)
- Horario de atención detallado

### Dashboard

- Cuatro peticiones en paralelo con `Promise.all` (usuarios, posts, comentarios, álbumes)
- Tarjetas de métricas globales
- Ranking de top 3 autores con más posts
- Post destacado aleatorio
- Actualización automática cada 30 segundos
- Botón de refresco manual y manejo de errores con reintento

---

## API utilizada

Este proyecto consume la API gratuita **[JSONPlaceholder](https://jsonplaceholder.typicode.com/)** — un servicio REST falso para pruebas y prototipos.

Endpoints utilizados:

```
GET  /posts/{id}      → Obtener un post
GET  /posts           → Listar posts
GET  /users           → Listar usuarios
GET  /users/{id}      → Obtener un usuario
GET  /comments        → Listar comentarios
GET  /posts?userId=1  → Posts por usuario
GET  /users/{id}/todos → Tareas de un usuario
GET  /albums          → Listar álbumes
```

---

## Tecnologías

- **HTML5** semántico y accesible
- **Tailwind CSS v3.4** — framework utility-first (compilado localmente)
- **JavaScript vanilla (ES2020+)** — sin frameworks ni bundlers
- **Web APIs**: `fetch()`, `getUserMedia()`, `Geolocation API`, `Canvas API`, `Permissions API`
- **Build tools**: PostCSS, Autoprefixer

---

## Licencia

ISC — Libre para uso educativo y personal.
