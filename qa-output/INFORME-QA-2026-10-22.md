# Informe QA ClubOS — 22/10/2026

Auditoría no destructiva, con cobertura parcial. No constituye certificación funcional ni de seguridad completa.

## Arquitectura e inventario
Frontend real: Expo 57, React Native 0.86.3, React 19.2.3, TypeScript, Expo Router, Context y SecureStore (localStorage en web). README describe Expo 54 y está desactualizado.
Backend: Express, mysql2, MySQL, Zod, bcrypt, JWT HS256; access 15 minutos y refresh 14 días con rotación transaccional. Helmet, CORS y limitador en autenticación.
Roles detectados: administrador, manager, entrenador, socio. Middleware consulta usuario activo y roles actuales; acceso por club y asignación de división.
Pantallas: login, register, inicio, admin, divisiones/listado y detalle, jugadores/detalle, entrenamientos/asistencia, viajes/detalle y por división, temporadas, finanzas, facturacion, familias, cuenta-familiar, pago-familiar, comprobante-familiar, morosidad.
API montada: auth, socios, divisiones, entrenamientos, jugadores/historial, viajes, temporadas, finanzas, facturacion, reportes, familias y pagos-familiares. Base configurada por DB_HOST/PORT/USER/PASSWORD/NAME; pool 10 conexiones. No se abrió conexión a datos reales.

## Hallazgos confirmados

### QA-01 — Alta: health no responde ante caída de base
Archivo: backend/src/server.js, catch del GET /api/health.
Pasos: iniciar proceso aislado con secretos efímeros, sustituir pool.query en memoria por función que rechaza, solicitar GET /api/health con timeout de 1500 ms.
Esperado: respuesta JSON 500/503 controlada.
Obtenido: rechazo no manejado `t is not defined`; cliente termina con TimeoutError. En configuraciones de Node sin manejador de rechazos puede finalizar el proceso.
Evidencia ejecutada: `UNHANDLED: t is not defined` y `/health TimeoutError`.
Recomendación: reemplazar t(error) por next(error), agregar regresión de indisponibilidad de DB.

### QA-02 — Baja: declaraciones inválidas de navegación
Archivo: frontend/app/_layout.tsx.
Pasos: iniciar Expo web, abrir /login, inspeccionar consola.
Esperado: registro de pantallas en el Stack correspondiente sin advertencias.
Obtenido: `No route named "pago-familiar" exists in nested children` y equivalente para comprobante-familiar.
Evidencia: consola del navegador; archivos están dentro del grupo (app), no en la raíz.
Recomendación: declarar opciones dentro del layout del grupo correspondiente. No se confirmó bloqueo de navegación autenticada.

### QA-03 — Baja: documentación de stack desactualizada
Archivo: README.md frente a frontend/package.json.
Pasos: comparar arquitectura documentada con dependencias actuales.
Esperado: versión y alcance documentados consistentes.
Obtenido: README indica Expo 54 y cuotas/viajes pendientes; package indica Expo 57 y existen rutas de finanzas/viajes.
Recomendación: actualizar documentación después de validar el alcance real.

## Riesgos detectados por lectura, pendientes de reproducción
- AuthContext renew elimina sesión ante cualquier error, incluida una interrupción transitoria de red. Simular desconexión al restaurar sesión y comprobar conservación de credenciales.
- Fecha de entrenamiento valida formato mediante regex, no existencia de fecha calendario. Probar 2026-02-31 y respuesta de MySQL en base desechable.
- Token refresh web se guarda en localStorage sin condición de desarrollo, pese al comentario del archivo. Evaluar modelo de amenazas XSS y almacenamiento para publicación web; no se demostró explotación.
- requestJson no define timeout y devuelve objeto vacío si una respuesta exitosa no contiene JSON válido. Probar servidor lento y respuesta HTML 200 con API simulada.
No se afirma una vulnerabilidad OWASP explotable con estas observaciones. Revisión parcial: controles de autenticación presentes, consultas parametrizadas en rutas inspeccionadas y filtrado por club; falta evaluación completa de autorización por entidad, carreras, dependencias y despliegue.

## Pruebas ejecutadas
- Backend npm.cmd test: 11 aprobadas, 0 fallidas. Categorías, inscripción con conexión simulada, IDs, normalización de email y errores de validación. No son pruebas de integración MySQL.
- Frontend npm.cmd run typecheck: aprobado.
- API real en proceso aislado, DB simulada sin conexión: socios sin token 401; token inválido 401; login vacío 400 con campos faltantes; endpoint inexistente 404; health con fallo DB reproduce QA-01.
- Expo web iniciado offline en localhost:18081; navegador llega a /login y muestra marca, presentación y campo email; consola reproduce QA-02. Sin certificación de responsive, teclado o lector de pantalla.
- Git inicial y posterior: mismo cambio preexistente frontend/app/(app)/index.tsx y elementos no rastreados .agents/ y skills-lock.json. No se modificó código fuente ni se descartaron cambios.
- Primer intento npm fue bloqueado por política de scripts PowerShell; se usó npm.cmd sin cambiar políticas del sistema.

## Pendientes y no verificables
Login válido, registro, refresh con DB, logout remoto, matriz de roles y acceso entre clubes; CRUD de socios/jugadores/divisiones; cuotas/facturación/pagos; asistencia; viajes; temporadas; familias; comprobantes/exportaciones; persistencia, rollback, concurrencia, fallos de red completos, accesibilidad integral, rendimiento bajo carga y Android/iOS.
Motivo: no se identificó ni provisionó una base desechable con usuarios y datos QA; no se autorizaron cambios a entorno real. No se ejecutaron migraciones, seeds, instalaciones, actualizaciones ni escrituras de negocio.
Para completar: proporcionar un entorno de pruebas identificado y autorizar allí la carga de datos ficticios y operaciones de alta/edición necesarias. La inspección realizada no permite afirmar que todos los módulos funcionan.

## Ampliación con entorno QA autorizado
Se creó una instancia MariaDB independiente en qa-output/mysql-isolated, puerto 13316 y bind 127.0.0.1, sin reutilizar el directorio de datos de XAMPP. Versión instalada 10.4.32 (inferior a la recomendada por el README; resultados limitados a esta versión). Se importaron correctamente esquema inicial y scripts 02, 04, 07, 10 y 12 exclusivamente en esa instancia. Backend puerto 14091 con secretos ficticios y sin cargar .env original; frontend localhost:18081 apuntando a esa API. CORS configurado en el proceso QA para ese origen.

Evidencias reproducibles: setup.mjs, integration.mjs, extended.mjs, integration-results.json y extended-results.json, en esta misma carpeta. Los scripts de integración registran respuestas; no contienen aserciones automáticas de todos los resultados y no deben contarse como una suite completa aprobada. No reejecutar setup sobre la base ya inicializada.

Se ejercitaron registro y login de administrador, manager, entrenador y socio; los primeros tres conservan también rol socio asignado por registro. Alta de división y socio, inscripción, asignaciones de staff, entrenamiento, carga y lectura posterior de asistencia (presente), consulta por los cuatro usuarios, vistas previas de temporada y facturación, aranceles, creación de cuota por 1000, creación y vinculación familiar, viaje y participante, pago simulado por 1000 y rechazo 409 de pago adicional sobre cuota saldada. Refresh: primera rotación 200 y reutilización del anterior 401. Socio inválido devuelve 400. Roles sin administrador reciben 403 al consultar socios y familias; socio sin staff recibe 403 en viajes. Los 404 de GET /temporadas, /facturacion y /jugadores/5 corresponden a rutas no implementadas en esa forma, no prueban fallas del módulo; las rutas específicas de vista previa sí respondieron 200. La ficha deportiva se abrió correctamente desde la UI.

Navegador: login administrador ficticio exitoso, navegación Inicio → Mis divisiones → M15 → ficha deportiva. La pantalla muestra un jugador, un entrenamiento y participación 100%, coherentes con la asistencia persistida, y la ficha muestra inscripción activa y proyección 2027. Primer intento de login fue bloqueado por origen CORS del puerto QA; se ajustó solo configuración de proceso y el reintento funcionó. No se considera defecto del producto.

### QA-04 — Media: fecha imposible produce 500
Archivo: backend/src/routes/entrenamientos.js, sessionSchema y POST /.
Reproducción: administrador autenticado envía divisionId válido, fecha 2026-02-31 y hora 18:00 a POST /api/entrenamientos.
Esperado: rechazo 400/422 con mensaje de fecha inexistente, sin intento de persistencia.
Obtenido: 500 Error interno del servidor; MariaDB rechaza INSERT con ER_TRUNCATED_WRONG_VALUE. La regex acepta fechas imposibles.
Evidencia: integration-results.json y salida backend con Incorrect date value.
Recomendación: validación calendario previa al INSERT, incluyendo años bisiestos y regresión con fechas límite. No se corrigió código.

La autorización elimina el bloqueo de base de pruebas descrito en la primera sección. Siguen sin ejecutarse cobertura exhaustiva de todos los botones/formularios, emisión y cambio de temporada confirmados, cobro familiar con idempotencia, carreras concurrentes, aislamiento entre dos clubes, fallos de conexión durante transacciones, carga, auditoría OWASP completa, exportaciones, pruebas de accesibilidad completas y dispositivos Android/iOS. No declarar auditoría integral finalizada sobre la base de estas pruebas.
