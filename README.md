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

## Configurar una sucursal

En **Horarios y reglas** cada sucursal tiene **Configurar** e **Historial**. Configurar reúne días laborables, entrada/salida, comida automática/con horario/sin movimientos, duración, margen de reconocimiento, entradas repetidas, tolerancias y reglas de retardos/descuentos. **Guardar configuración** guarda todo junto con **Aplicar desde** y recalcula la asistencia. El botón de primera checada permite corregir desde el inicio de los registros de esa sucursal.

**Historial → Eliminar** retira una versión y recalcula con las restantes. Si no queda jornada, las marcas se conservan sin configuración. **Mostrar eliminadas** permite consultar la evidencia anterior; no se borran checadas, fotos, empleados ni asignaciones. Las versiones anteriores independientes también se muestran aquí. La sección separada de roles deja de utilizarse para configurar la sucursal.

## Excepciones de jornada y comida

En **Empleados → Opciones → Editar → Horario y comida**:

- La jornada se hereda del horario base de la sucursal. Activa **Usar horario especial** para configurar entrada, salida y días de ese empleado.
- **Usar comida de la sucursal** hereda su configuración. También puede elegirse **Detección automática (sin horario fijo)** como excepción: cuatro checadas efectivas se interpretan como entrada, salida a comer, regreso y salida laboral, sin sanciones de comida. Las configuraciones anteriores conservan su selección automática o individual.
- Para aplicar reglas personales, configura la comida individual con hora/rango de salida y **duración en minutos**, inicialmente 60. Para una salida fija usa la misma hora en Desde/Hasta. La opción **Sin movimientos de comida** es explícita e identifica únicamente entrada y salida.
- El **margen de reconocimiento** puede heredarse de la sucursal o fijarse individualmente (inicialmente 30 minutos). Las horas reales de entrada y salida no se limitan por ese margen; la tolerancia para retardos se calcula aparte.
- **Aplicar desde** permite corregir desde la primera checada o programar una fecha posterior. Las versiones se conservan en Historial.

La comida se conserva al volver a la jornada de la sucursal. Los datos personales, estado y configuración se guardan juntos; si la configuración es inválida o otro usuario actualizó la versión, se muestra el error y se revierte la edición completa.

**Checadas**, **Asistencia diaria** y los resúmenes usan la misma clasificación. El modo Entrada/Salida del reloj se conserva como evidencia original. Asistencia diaria distingue **Comida automática** de una comida individual configurada. Con menos o más de cuatro checadas efectivas se señalan faltantes o dudas sin forzar una comida completa. Una configuración personal incompatible con la jornada queda para revisión.

**Margen de entradas repetidas** inicia en 20 minutos y se edita en **Configurar sucursal**, con fecha de vigencia. Compara el bloque inicial con la primera entrada, conserva sus marcas y no se aplica a pares de comida. Es independiente de las tolerancias; con 0 solo se detectan repeticiones de menos de un minuto. **Asignaciones** permite cambiar sucursal o restaurar la jornada heredada sin sobrescribir la comida individual; las excepciones de horario se editan en la ficha personal.

Las columnas Entrada y Salida muestran las horas reales identificadas, incluso si se llega una o dos horas antes o se sale antes o después de la jornada configurada. Al cerrarse el día, la última checada efectiva es salida laboral si hay al menos dos. Con tres marcas en automático, la intermedia es salida a comer y se señala **Regreso de comida no registrado**, sin calcular una duración desconocida. Una sola marca no llena entrada y salida a la vez; las marcas intermedias de una jornada todavía abierta permanecen provisionales.

## Tarjeta de asistencia por empleado

En **Empleados → Opciones** se agrupan **Asistencia**, Editar, Reloj, Asignar e Historial. Los pendientes muestran Identificar en lugar de Reloj. El mismo menú se utiliza en escritorio y móvil.

**Asistencia** abre `/employees/:id/attendance`. Selecciona **Desde / Hasta** y pulsa **Consultar** para revisar un periodo de hasta 366 días; por defecto muestra el mes actual hasta hoy. El rango queda en la URL y se conserva al recargar o navegar atrás/adelante.

La tarjeta muestra los datos del empleado y todos los días del rango con jornada histórica, entrada, salida a comer, regreso, salida laboral, horas y observaciones. Distingue descansos, días sin registros y fechas pendientes. **Ver marcas** conserva cada lectura original, incluidas las repetidas. El resumen separa retardos de llegada y comida, salidas anticipadas y jornadas por revisar. Los totales incluyen únicamente días cuyo tiempo trabajado puede calcularse; un día sin registros no se convierte automáticamente en falta ni descuento.

## Tarjetas de asistencia por sucursal

En **Asistencia → Tarjetas de asistencia** (`/attendance-cards`) se consulta el reporte conjunto. Sucursal, Estado del empleado (Activos/Inactivos), Desde y Hasta comienzan vacíos. **Consultar** permanece deshabilitado hasta completar los filtros con un periodo válido de hasta 366 días. El reporte se carga únicamente al pulsar Consultar; cambiar un filtro limpia el resultado y cancela la consulta pendiente. Volver a consultar actualiza el reporte, incluso con la misma selección.

La selección utiliza la sucursal y el estado actuales de la ficha. Cada tarjeta conserva el historial de jornadas de sus fechas y utiliza el mismo formato y cálculo individual. Se incluyen empleados sin registros. El resultado muestra cinco tarjetas por página y permite recorrer todos los empleados coincidentes; cada cambio de página solicita un nuevo lote. Si no hay empleados, se muestra **No hay empleados para los filtros seleccionados**. Al recargar la página vuelve al estado inicial vacío.

## Exportar tarjetas a PDF

La tarjeta individual y el reporte por sucursal incluyen **Exportar PDF** cuando hay datos consultados. El PDF utiliza **Carta vertical**, con una tarjeta nueva por empleado, tabla, observaciones, totales y resumen. Las continuaciones repiten el encabezado del empleado y las columnas de la tabla; las páginas se numeran en el documento completo. Los tiempos desconocidos permanecen como guion y los totales incluyen solo jornadas calculables.

Al terminar aparece **PDF generado**, con nombre/tamaño y enlaces **Descargar PDF** y **Ver PDF**. El archivo permanece disponible aunque el navegador rechace la descarga automática; los enlaces usan una acción directa del usuario. Consultar de nuevo, cambiar filtros o salir de la página libera el archivo anterior. Los errores se muestran junto al botón de exportación.

La exportación de sucursal obtiene todas las tarjetas de los filtros aplicados desde `/attendance/cards/export`, en una sola instantánea, incluyendo empleados de las demás páginas. Se genera un único archivo. **Cancelar exportación**, modificar filtros, consultar otro periodo o salir de la página cancela la operación pendiente y evita descargar un archivo parcial o de una selección anterior.

Se utilizan `jspdf` 4.2.1 y `jspdf-autotable` 5.0.7, cargados bajo demanda. Los archivos TTF de Public Sans regular/negrita provienen de `@expo-google-fonts/public-sans` 0.4.2 (solo recursos tipográficos, sin dependencias de Expo), se sirven con la aplicación y se incrustan para conservar acentos y ñ. Las licencias de los paquetes son MIT y OFL-1.1 para la tipografía.

## Verificaciones

```bash
npm run lint
npm run build
npm audit
```
