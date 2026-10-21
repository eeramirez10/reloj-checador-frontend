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

## Configurar jornada y comida

En **Empleados → Editar → Horario y comida**:

- La jornada se hereda del horario base de la sucursal. Activa **Usar horario especial** para configurar entrada, salida y días de ese empleado.
- Configura la comida individual con hora/rango de salida y **duración en minutos**, inicialmente 60. Para una salida fija usa la misma hora en Desde/Hasta. También puedes dejarla pendiente o indicar que no requiere movimientos de comida.
- El **margen de reconocimiento** inicia en 30 minutos para distinguir comidas y marcas intermedias. Las horas reales de entrada y salida no se limitan por ese margen; la tolerancia para retardos se calcula aparte.
- **Aplicar desde** permite corregir desde la primera checada o programar una fecha posterior. Las versiones se conservan en Historial.

La comida se conserva al volver a la jornada de la sucursal. Los datos personales, estado y configuración se guardan juntos; si la configuración es inválida o otro usuario actualizó la versión, se muestra el error y se revierte la edición completa.

**Checadas**, **Asistencia diaria** y los resúmenes usan la misma clasificación automática. El modo Entrada/Salida marcado en el reloj aparece como evidencia original. Las marcas fuera de horario, duplicados y movimientos faltantes se señalan sin inventar checadas ni tiempo trabajado. En Asistencia diaria se muestra **Comida por configurar** cuando todavía falta capturarla.

Las columnas Entrada y Salida muestran las horas reales identificadas, incluso si se llega una o dos horas antes o se sale antes o después de la jornada configurada. Una sola checada, una salida a comer sin regreso o un regreso sin marca final dejan la salida laboral pendiente; una marca intermedia no cierra por sí sola una jornada todavía abierta.

## Verificaciones

```bash
npm run lint
npm run build
npm audit
```
