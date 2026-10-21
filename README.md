# Reloj Checador — Frontend

Interfaz de administración de relojes ZKTeco, usuarios y asistencias. Está construida con React, TypeScript, Vite, MUI y React Router.

## Inicio local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Vite inicia por defecto en `http://localhost:5173`. El proxy envía `/api/*` al backend `http://127.0.0.1:3005` y elimina el prefijo `/api`. Puedes cambiar el destino con `VITE_API_PROXY_TARGET`.

## Arquitectura

```text
src/
├── app/          # router, providers, tema y layout general
├── features/     # dispositivos, asistencias, usuarios y sincronización
├── pages/        # composición de páginas por ruta
└── shared/       # cliente HTTP y componentes reutilizables
```

Cada feature contiene sus tipos, funciones API y hooks de consulta. Axios está fijado a `1.20.0`; TanStack Query gestiona el estado remoto e invalida los listados tras sincronizar. Las fotos de usuario se sirven desde el backend después de sincronizarlas con el puente SDK de Windows. El router carga las páginas de forma diferida.

## Verificaciones

```bash
npm run lint
npm run build
npm audit
```
