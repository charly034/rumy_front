# Rummys — Frontend

Interfaz web para el registro y seguimiento de partidas de Rummy, construida con **React + TypeScript + Vite**.

## Tecnologías

- React 19
- TypeScript 6
- Vite 8
- CSS puro (sin librerías de UI)

## Instalación y desarrollo

```bash
npm install
npm run dev
```

La app abre en `http://localhost:5173`.

> Requiere que la API esté corriendo en `http://localhost:3000`. El proxy de Vite redirige `/api/*` automáticamente.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (genera `dist/`) |
| `npm run preview` | Preview local del build de producción |

## Build de producción

```bash
npm run build
```

Los archivos estáticos quedan en `dist/`. Servir esa carpeta con Nginx, Apache, o cualquier CDN.

## Estructura

```
src/
├── api.ts              # Cliente HTTP tipado para todos los endpoints
├── App.tsx             # Layout y navegación por pestañas
├── style.css           # Estilos globales (tema oscuro)
├── main.tsx            # Entry point
└── pages/
    ├── TablaGeneralPage.tsx   # Ranking con puntos generales
    ├── JugadoresPage.tsx      # CRUD de jugadores + historial
    └── PartidasPage.tsx       # CRUD de partidas
```

## Funcionalidades

- **Tabla General**: ranking ordenado por puntos generales (+4/+2/−1), con total de puntos de partida y promedio por juego
- **Jugadores**: alta, edición, baja y búsqueda; historial individual con estadísticas
- **Partidas**: registro con N jugadores, edición, eliminación y detalle con posiciones
