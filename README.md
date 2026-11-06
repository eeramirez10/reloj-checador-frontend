# Reloj Checador — Frontend

Interfaz de administración de relojes ZKTeco, usuarios y asistencias. Está construida con React, TypeScript, Vite, MUI y React Router.

## Fecha y hora de dispositivos

En **Dispositivos → Fecha y hora**, consulta la hora local del reloj y su diferencia respecto de la hora del servidor en la zona horaria de la sucursal. **Sincronizar hora** usa la referencia del servidor. En **Ajustar manualmente**, captura una fecha (2000–2099) y hora con segundos y pulsa **Aplicar fecha y hora manual**. Se envía el valor capturado como hora local de la sucursal y se verifica contra ese valor, considerando los segundos transcurridos. El historial distingue ambos tipos de ajuste y conserva la fecha/hora solicitada, enviada y leída después. Las lecturas muestran cuándo se tomaron; **Consultar hora** las actualiza. México/Querétaro y Cancún utilizan la referencia de su propia sucursal.

Disponible con TCP/IP directo y una sucursal asignada. Durante el ajuste se bloquean el cierre del diálogo y los botones para evitar envíos repetidos. La petición de escritura no se reintenta automáticamente. Los errores de comunicación se muestran con el historial disponible para consultar nuevamente el estado. Las checadas anteriores conservan sus fechas originales.

## Inicio local

El panel inicia en **Iniciar sesión**. El administrador inicial se crea con `npm run auth:bootstrap` en el backend. Las contraseñas temporales deben cambiarse antes de entrar. El menú de la cuenta permite cambiar contraseña y cerrar sesión.

**Administración → Cuentas de acceso**, exclusivo del administrador, permite crear/editar cuentas, desactivarlas, restablecer contraseñas y asignar una o varias sucursales. Los roles son Administrador, Recursos humanos y Encargado; la sucursal laboral no determina el acceso. El encargado consulta asistencia/reportes y resuelve permisos; RH además gestiona personal, horarios y vacaciones. Las opciones del panel se adaptan al rol y la API valida el alcance. Guardar cambios de acceso cierra las sesiones de la cuenta modificada.

El campo de contraseña temporal incluye **Generar contraseña**, que crea 16 caracteres usando la aleatoriedad criptográfica del navegador, y **Copiar** para compartirla. Permite mostrar/ocultar la contraseña y escribirla manualmente con un mínimo de 8 caracteres. Al editar una cuenta, dejar el campo vacío conserva su contraseña. La contraseña generada se aplica al guardar; el usuario deberá cambiarla al iniciar sesión. Si el navegador no permite copiar automáticamente, se selecciona el texto para copiarlo manualmente.

La autenticación utiliza cookies HttpOnly y un token CSRF solo en memoria. Los datos privados se descartan al cerrar o cambiar sesión; no se almacenan credenciales ni tokens en almacenamiento web. Frontend y backend deben publicarse bajo el mismo origen con `/api`; el origen completo del panel debe estar en `AUTH_ALLOWED_ORIGINS` del backend.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Vite inicia por defecto en `http://localhost:5173`. El proxy envía `/api/*` al backend `http://127.0.0.1:3005` y elimina el prefijo `/api`. Puedes cambiar el destino con `VITE_API_PROXY_TARGET`.

En **Dispositivos → Probar conexión**, el fallo se muestra en una alerta persistente con nombre, IP, puerto y mensaje del backend. Se conserva hasta cerrar la alerta, volver a probar o editar ese reloj. La petición permite esperar el diagnóstico del proceso aislado; los timeouts del navegador y los fallos de comunicación con la API tienen mensajes específicos.

## Arquitectura

```text
src/
├── app/          # router, providers, tema y layout general
├── features/     # dispositivos, asistencias, usuarios y sincronización
├── pages/        # composición de páginas por ruta
└── shared/       # cliente HTTP y componentes reutilizables
```

Cada feature contiene sus tipos, funciones API y hooks de consulta. Axios está fijado a `1.20.0`; TanStack Query gestiona el estado remoto e invalida los listados tras sincronizar. Las fotos de usuario se sirven desde el backend después de sincronizarlas con el puente SDK de Windows. El router carga las páginas de forma diferida.

## Sincronizar fotos de empleados

En **Empleados**, selecciona una sucursal con un solo reloj o un reloj concreto y marca hasta 25 empleados vinculados a ese equipo. **Sincronizar fotos** procesa una solicitud individual por empleado, de forma secuencial, y muestra el progreso. Cada solicitud tiene su propio tiempo de espera; si una falla, continúa con las siguientes sin reintentar automáticamente ni borrar fotos anteriores.

Al terminar se actualizan los listados y aparece un resumen persistente del reloj consultado: fotos descargadas, solicitudes sin imagen devuelta y errores. **Ver pendientes** muestra el nombre, ID y motivo de cada caso; esos empleados permanecen seleccionados para reintentarlo. Un error ambiguo del SDK no se interpreta como ausencia confirmada de foto. Los filtros y la selección permanecen bloqueados durante la descarga para conservar el grupo elegido.

## Importar checadas de archivos anteriores

En **Asistencia → Checadas → Importar archivo**, selecciona sucursal, reloj y el `.txt` del programa anterior. Admite el formato Talavie de 30 caracteres por registro, UTF-8/ASCII, hasta 1 MB y 10 000 líneas. **Revisar archivo** muestra empleado, fecha, hora local y resultado: nueva, existente, repetida, inválida o por revisar; la tabla se pagina cada 50 filas. Cambiar archivo/sucursal/reloj invalida la revisión anterior.

**Importar checadas** agrega solo las nuevas y actualiza asistencia, retardos y horas extras. Las coincidencias existentes conservan sus segundos y datos originales. Si todas ya existen, **Registrar archivo sin duplicar** guarda la evidencia de la carga. La aplicación conserva el archivo y las líneas originales en el backend y muestra una referencia y el historial de las últimas cargas del reloj. Un mismo archivo no se procesa dos veces.

Las letras finales B/E se conservan sin interpretarlas como entrada/salida. La zona corresponde a la sucursal seleccionada, por ejemplo `America/Cancun`. Las filas ambiguas, inválidas o repetidas no crean checadas adicionales. Los IDs sin vínculo se asocian mediante las reglas de identidad existentes o quedan pendientes. Si los datos cambian después de revisar, se solicita otra revisión; si falla el recálculo después de guardar, se indica explícitamente y aparece **Reintentar cálculo**.

## Configurar una sucursal

En **Horarios y reglas** cada sucursal tiene **Configurar** e **Historial**. Configurar reúne días laborables, entrada/salida, comida automática/con horario/sin movimientos, duración, margen de reconocimiento, entradas repetidas, tolerancias y reglas de retardos/descuentos. **Guardar configuración** guarda todo junto con **Aplicar desde** y recalcula la asistencia. El botón de primera checada permite corregir desde el inicio de los registros de esa sucursal.

**Historial → Eliminar** retira una versión y recalcula con las restantes. Si no queda jornada, las marcas se conservan sin configuración. **Mostrar eliminadas** permite consultar la evidencia anterior; no se borran checadas, fotos, empleados ni asignaciones. Las versiones anteriores independientes también se muestran aquí. La sección separada de roles deja de utilizarse para configurar la sucursal.

## Excepciones de jornada y comida

En **Empleados → Opciones → Editar**, las pestañas **Jornada** y **Comida** agrupan estas opciones:

- La jornada se hereda del horario base de la sucursal. Activa **Usar horario especial** para configurar entrada, salida y días de ese empleado.
- **Usar comida de la sucursal** hereda su configuración. También puede elegirse **Detección automática (sin horario fijo)** como excepción: cuatro checadas efectivas se interpretan como entrada, salida a comer, regreso y salida laboral, sin sanciones de comida. Las configuraciones anteriores conservan su selección automática o individual.
- Para aplicar reglas personales, configura la comida individual con hora/rango de salida y **duración en minutos**, inicialmente 60. Para una salida fija usa la misma hora en Desde/Hasta. La opción **Sin movimientos de comida** es explícita e identifica únicamente entrada y salida.
- El **margen de reconocimiento** puede heredarse de la sucursal o fijarse individualmente (inicialmente 30 minutos). Las horas reales de entrada y salida no se limitan por ese margen; la tolerancia para retardos se calcula aparte.
- **Aplicar desde** permite corregir desde la primera checada o programar una fecha posterior. Las versiones se conservan en Historial.

La comida se conserva al volver a la jornada de la sucursal. Los datos personales, estado y configuración se guardan juntos; si la configuración es inválida o otro usuario actualizó la versión, se muestra el error y se revierte la edición completa.

**Checadas**, **Asistencia diaria** y los resúmenes usan la misma clasificación. El modo Entrada/Salida del reloj se conserva como evidencia original. Asistencia diaria distingue **Comida automática** de una comida individual configurada. Con menos o más de cuatro checadas efectivas se señalan faltantes o dudas sin forzar una comida completa. Una configuración personal incompatible con la jornada queda para revisión.

**Margen de entradas repetidas** inicia en 20 minutos y se edita en **Configurar sucursal**, con fecha de vigencia. Compara el bloque inicial con la primera entrada, conserva sus marcas y no se aplica a pares de comida. Es independiente de las tolerancias; con 0 solo se detectan repeticiones de menos de un minuto. **Asignaciones** permite cambiar sucursal o restaurar la jornada heredada sin sobrescribir la comida individual; las excepciones de horario se editan en la ficha personal.

Las columnas Entrada y Salida muestran las horas reales identificadas, incluso si se llega una o dos horas antes o se sale antes o después de la jornada configurada. Al cerrarse el día, la última checada efectiva es salida laboral si hay al menos dos. Con tres marcas en automático, la intermedia es salida a comer y se señala **Regreso de comida no registrado**, sin calcular una duración desconocida. Una sola marca no llena entrada y salida a la vez; las marcas intermedias de una jornada todavía abierta permanecen provisionales.

## Horas extras y rutas

En **Empleados → Opciones → Editar → Horas extras**, activa **Habilitar horas extras** y selecciona **Diaria** o **En ruta**. Está desactivado por defecto y usa la fecha **Aplicar desde**, con versiones en Historial. Para extras y retardos se toma la jornada de sucursal vigente en cada fecha; el horario especial guardado se conserva.

**Diaria** suma tiempo trabajado antes de entrada y después de salida, excluyendo comidas registradas, sin compensar retardos. Los días no laborables cuentan todo el tiempo como extra. Con comida incompleta, las extras quedan pendientes.

**En ruta** abre con la primera marca efectiva y cierra con el siguiente regreso efectivo, aunque pasen varios días. Incluye noches; no exige movimientos de comida. Una marca intermedia efectiva se toma como regreso. Las lecturas iniciales repetidas siguen la regla de sucursal. Solo la entrada inicial evalúa retardo; el regreso no es otra llegada. La configuración de comida personal se conserva para volver al modo diario. Las rutas abiertas quedan pendientes, sin inventar una salida. El detalle muestra fechas completas de inicio/regreso y distingue los segmentos diarios calculados de las marcas originales; también aparecen en las tarjetas, PDF y asistencia diaria.

**Descontar descansos** permite combinar un horario diario Desde/Hasta (incluye cruces de medianoche) y horas/minutos adicionales **una vez por jornada o ruta**. Solo descuentan tiempo extra disponible sin duplicar comida ni intervalos. El adicional de ruta se reparte entre los días con extras y no se repite al consultar un periodo parcial.

En **Asistencia → Horas extras** (`/overtime`), Sucursal, Activos/Inactivos, Desde y Hasta inician vacíos. Solo **Consultar** carga el reporte; cambiar un filtro limpia el resultado y cancela la petición. Admite hasta 366 días y cinco empleados por página. Incluye únicamente fechas con extras habilitadas; la selección usa sucursal/estado actuales y el cálculo respeta jornadas históricas. Muestra anticipadas, posteriores, días de descanso, extras brutas, descansos y netas, con totales individuales y del periodo para **todos** los empleados coincidentes. Los pendientes se distinguen y no se suman como cero. Los tiempos son horas:minutos; los totales suman segundos antes de formatear.

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

## Márgenes de horas extras por sucursal

En **Horarios y reglas → Configurar** de la sucursal, la sección **Márgenes de horas extras** permite capturar por separado **Margen de extras de entrada (min)** y **Margen de extras de salida (min)**, de 0 a 240 minutos. Inicialmente ambos son cero. Elige **Aplicar desde** y guarda: se versionan las reglas y se recalculan los empleados con extras habilitadas en esa sucursal. El historial y la tabla de sucursales muestran ambos valores.

Se reconoce únicamente el tiempo que supera cada margen. Ejemplo: jornada 08:30–17:30 con 30/30 minutos reconoce cero por entrada 08:00 o salida 18:00; entrada 07:00 reconoce 1 hora y salida 18:30 reconoce 30 minutos. Las columnas Antes/Después y Extras brutas ya reflejan ese descuento, y los descansos se aplican después. Las tolerancias de retardo se conservan por separado. Los márgenes no se aplican en días de descanso y no reducen el tiempo trabajado observado. Cada fecha conserva las reglas que le corresponden; las rutas resuelven cada tramo diario. Las observaciones del reporte y del PDF indican los márgenes efectivos.

## Reporte imprimible de horas extras

En **Asistencia → Horas extras**, selecciona sucursal, estado del empleado y fechas, pulsa **Consultar** y después **Exportar PDF**. Se obtiene una instantánea completa de `/attendance/overtime/export`: incluye todos los empleados que cumplen los filtros, aunque estén en otras páginas de la pantalla.

El archivo usa **Carta horizontal**, Public Sans incrustada, resumen general y un desglose nuevo por empleado. Incluye número de empleado e ID del reloj actual como referencias distintas, jornada histórica de sucursal, entrada/salida, extras antes/después y en descanso, extras brutas, descuentos de descanso, extras netas, estados y observaciones. Los tiempos se imprimen en **HH:mm:ss**, preservando segundos y duraciones mayores a 24 horas. Pendientes y días sin registros quedan identificados y no aportan horas a los totales. Los encabezados del empleado y de la tabla se repiten en continuaciones, con numeración de páginas y fecha de generación.

Al terminar, **Ver PDF** abre el documento para imprimirlo con el visor del navegador; **Descargar PDF** conserva una copia. Se reutiliza el mismo flujo de descarga persistente, cancelación y recuperación de descargas bloqueadas del reporte de asistencia. Cambiar filtros o consultar de nuevo descarta el archivo anterior. La exportación es de solo lectura.

## Permisos, jefes y vacaciones

En **Empleados → Opciones → Editar → Permisos y vacaciones**, configura el jefe directo, WhatsApp internacional del empleado y saldo manual de vacaciones. El número del jefe se captura en su propia ficha. Modificar el saldo exige un motivo y genera un movimiento con su saldo resultante. El historial incluye cargas, consumos y devoluciones. El botón **Configurar jefe y vacaciones** de una solicitud abre el mismo editor directamente en esta pestaña.

En **Asistencia → Permisos** (`/leave-requests`), **Nueva solicitud** permite elegir empleado, tipo (**Faltar / Llegar tarde / Salir temprano**), fechas Desde/Hasta, goce de sueldo y motivo. Para llegar tarde/salir temprano se requiere una hora autorizada, aplicada a los días laborables del rango en la hora local correspondiente. **Tomar días de vacaciones** solo está disponible para faltar y activa con goce de sueldo.

**Revisar solicitud** muestra el jefe, fechas laborables incluidas y días de vacaciones que se descontarían al aprobar. **Solicitar permiso** la registra como pendiente. El listado ofrece filtros por fechas, sucursal, empleado, jefe, tipo y estado, con paginación, tabla en escritorio y tarjetas en móvil. Las fechas filtran el periodo solicitado, no la fecha de captura.

**Ver solicitud** muestra motivo, fechas incluidas, jefe responsable e historial. **Aprobar / Rechazar** registra la resolución desde la página a nombre del jefe; **Cancelar permiso** permite indicar al empleado o jefe como solicitante de cancelación. Los rechazos y cancelaciones exigen motivo. El saldo se valida y descuenta al aprobar; cancelar un aprobado devuelve los días consumidos. Un conflicto de saldo, horario o versión se muestra para actualizar la revisión. Los permisos con intervalos superpuestos se rechazan.

La justificación aparece automáticamente en **Asistencia diaria**, tarjetas individuales/de sucursal y su PDF. Los días sin checadas se identifican como **Ausencia autorizada**, con goce, uso de vacaciones y motivo. Los permisos parciales justifican solo el intervalo aprobado; el exceso conserva sus incidencias. Las horas trabajadas se calculan exclusivamente a partir de registros reales y las extras conservan su jornada base.

El historial indica **WhatsApp pendiente de conectar** y conserva el destinatario previsto. La recepción de solicitudes y el envío real por Twilio se integrarán después.

## Editor de empleado por pestañas

**Empleados → Opciones → Editar** reúne seis pestañas MUI para las fichas identificadas:

- **Datos generales**: identidad, RFC/NSS, estado activo/baja y consulta de sucursal, reloj y fechas.
- **Jornada**: heredar la jornada o usar una especial, días laborables, entrada/salida y reconocimiento de movimientos.
- **Comida**: herencia, modo automático, horario individual o sin movimientos, rango y duración.
- **Horas extras**: habilitación, diaria/en ruta y descansos.
- **Permisos y vacaciones**: jefe, WhatsApp, saldo, motivo del ajuste e historial.
- **Reloj**: consulta del rol en el equipo, usuario normal/administrador e historial de cambios.

Cambiar de pestaña conserva los campos capturados. **Guardar** envía únicamente los grupos de datos modificados en un solo `PATCH /employees/:id`; datos personales, estado, jornada/comida/extras y permisos/vacaciones se guardan en una transacción. Un saldo o versión desactualizados, jefe inválido o teléfono duplicado revierte toda esa edición. **Cancelar** descarta el borrador de datos. Las pestañas con campos inválidos se abren para corregirlos antes de guardar. Los permisos del equipo usan su propia acción inmediata, descrita abajo.

**Aplicar desde** es un único campo compartido entre Jornada, Comida y Horas extras; se muestra en esas tres pestañas y conserva el historial de versiones. La configuración de permisos y los ajustes de saldo usan su propia versión de concurrencia. El editor mantiene altura estable, encabezado y botones visibles; las pestañas se desplazan horizontalmente en móvil y admiten navegación por teclado. Las altas utilizan las mismas pestañas de datos y horario; permisos/vacaciones se configuran después de crear e identificar la ficha.

## Administradores del reloj

En **Empleados → Opciones → Editar → Reloj**, revisa el equipo asignado, ID, UID interno, rol registrado y fecha de observación. **Consultar rol actual** se comunica manualmente con el reloj; no se ejecuta automáticamente al abrir el editor. Requiere ficha identificada, reloj asignado y controlador TCP/IP directo.

Después de consultar, elige **Usuario normal** o **Administrador** y pulsa **Aplicar en el reloj**. La aplicación vuelve a leer el catálogo, modifica únicamente el rol del usuario y verifica la lectura posterior antes de indicar **Verificado**. Se permiten varios administradores en la misma sucursal y equipo. Se bloquea quitar el último administrador de cada reloj; los administradores de otro equipo de la sucursal no sustituyen esa comprobación.

Esta acción es independiente de Guardar y tiene efecto inmediato en el dispositivo. El botón general Guardar se deshabilita en esta pestaña; cerrar el editor conserva los cambios ya aplicados al equipo. Durante la comunicación se bloquean el cierre y el cambio de pestaña. Una escritura incierta no se reintenta automáticamente y exige consultar de nuevo. El historial muestra los últimos veinte intentos, roles anterior/solicitado, fecha y resultado. Los estados bloqueado, fallido o no confirmado se muestran como tales, aunque la API haya registrado correctamente el intento.

## Verificaciones

```bash
npm run lint
npm run build
npm audit
```
