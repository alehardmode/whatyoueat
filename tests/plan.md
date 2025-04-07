# Plan de Pruebas - WhatYouEat

## Propósito

Este documento define el plan de pruebas para la aplicación WhatYouEat, incluyendo pruebas unitarias, de integración y end-to-end (e2e) con especial atención a la integración con Supabase.

## Organización de pruebas

Las pruebas están organizadas en las siguientes categorías:

```
/tests
  /unit          # Pruebas unitarias
    /auth        # Pruebas para autenticación
    /nutrition   # Pruebas para funcionalidades nutricionales
  /integration   # Pruebas de integración
    /doctor-patient # Pruebas de relación médico-paciente
  /e2e           # Pruebas end-to-end con Puppeteer
  /api           # Pruebas de API REST
  /fixtures      # Datos de prueba compartidos
  setup.js       # Configuración para pruebas unitarias/integración
  setup-supabase.js # Configuración específica para Supabase
  setup.e2e.js   # Configuración para pruebas e2e
  plan.md        # Este documento
```

## Matriz de Pruebas

La siguiente tabla resume todas las pruebas planificadas y su estado actual:

| ID Prueba   | Tipo        | Nombre                               | Descripción                                                        | Estado |
| ----------- | ----------- | ------------------------------------ | ------------------------------------------------------------------ | ------ |
| UT-AUTH-01  | Unitaria    | Registro de usuarios                 | Verifica la creación de nuevas cuentas de usuario                  | ✅     |
| UT-AUTH-02  | Unitaria    | Inicio de sesión                     | Verifica la autenticación con credenciales correctas e incorrectas | ✅     |
| UT-AUTH-03  | Unitaria    | Cierre de sesión                     | Verifica el proceso de cierre de sesión de usuario                 | ✅     |
| UT-AUTH-04  | Unitaria    | Verificación de correo               | Verifica si un correo electrónico ya está registrado               | ✅     |
| UT-AUTH-05  | Unitaria    | Restablecimiento de contraseña       | Verifica el proceso de recuperación de contraseña                  | ✅     |
| UT-AUTH-06  | Unitaria    | Actualización de datos de usuario    | Verifica la actualización de información de perfil                 | ❌     |
| UT-AUTH-07  | Unitaria    | Reenvío de email de confirmación     | Verifica el reenvío de correos de verificación                     | ❌     |
| UT-FOOD-01  | Unitaria    | Crear entrada de comida              | Verifica la creación de registros de alimentos                     | ✅     |
| UT-FOOD-02  | Unitaria    | Obtener historial de usuario         | Verifica la recuperación del historial de comidas                  | ✅     |
| UT-FOOD-03  | Unitaria    | Obtener entrada por ID               | Verifica la recuperación de una entrada específica                 | ✅     |
| UT-FOOD-04  | Unitaria    | Actualizar entrada                   | Verifica la modificación de entradas existentes                    | ✅     |
| UT-FOOD-05  | Unitaria    | Eliminar entrada                     | Verifica la eliminación de entradas de comida                      | ✅     |
| UT-FOOD-06  | Unitaria    | Estadísticas de usuario              | Verifica el cálculo de estadísticas nutricionales                  | ✅     |
| UT-UTIL-01  | Unitaria    | Validación de correo electrónico     | Verifica la validación de formato de email                         | ❌     |
| UT-UTIL-02  | Unitaria    | Formateo de fechas                   | Verifica el formateo correcto de fechas                            | ❌     |
| INT-AUTH-01 | Integración | Registro de paciente                 | Prueba el flujo completo de registro de paciente                   | ❌     |
| INT-AUTH-02 | Integración | Registro de médico                   | Prueba el flujo completo de registro de médico                     | ❌     |
| INT-AUTH-03 | Integración | Inicio de sesión                     | Prueba el flujo completo de inicio de sesión                       | ❌     |
| INT-AUTH-04 | Integración | Recuperación de contraseña           | Prueba el flujo de recuperación de contraseña                      | ❌     |
| INT-DOC-01  | Integración | Asignar paciente a médico            | Verifica la vinculación médico-paciente                            | ✅     |
| INT-DOC-02  | Integración | Obtener pacientes de médico          | Verifica la recuperación de pacientes asignados                    | ✅     |
| INT-DOC-03  | Integración | Obtener médicos de paciente          | Verifica la recuperación de médicos asignados                      | ✅     |
| INT-DOC-04  | Integración | Eliminar asignación                  | Verifica la eliminación de la relación médico-paciente             | ✅     |
| INT-DATA-01 | Integración | Creación de registros nutricionales  | Verifica la creación integrada de datos nutricionales              | ❌     |
| INT-DATA-02 | Integración | Actualización de registros           | Verifica la actualización integrada de datos                       | ❌     |
| INT-DATA-03 | Integración | Eliminación de registros             | Verifica la eliminación integrada de datos                         | ❌     |
| E2E-AUTH-01 | E2E         | Carga de página de inicio            | Verifica la correcta carga de la página inicial                    | ✅     |
| E2E-AUTH-02 | E2E         | Registro de nuevo usuario            | Verifica el flujo completo de registro en la UI                    | ✅     |
| E2E-AUTH-03 | E2E         | Login con credenciales correctas     | Verifica el inicio de sesión exitoso                               | ✅     |
| E2E-AUTH-04 | E2E         | Rechazo con credenciales incorrectas | Verifica el manejo de credenciales inválidas                       | ✅     |
| E2E-AUTH-05 | E2E         | Cierre de sesión                     | Verifica el proceso de logout en la UI                             | ✅     |
| E2E-AUTH-06 | E2E         | Restablecimiento de contraseña       | Verifica el flujo de recuperación de contraseña                    | ❌     |
| E2E-PAT-01  | E2E         | Añadir comida al registro            | Verifica la funcionalidad de añadir comidas                        | ❌     |
| E2E-PAT-02  | E2E         | Ver historial nutricional            | Verifica la visualización del historial                            | ❌     |
| E2E-PAT-03  | E2E         | Generar informes                     | Verifica la generación de informes nutricionales                   | ❌     |
| E2E-PAT-04  | E2E         | Actualizar perfil                    | Verifica la edición del perfil de usuario                          | ❌     |
| E2E-DOC-01  | E2E         | Ver listado de pacientes             | Verifica la visualización de pacientes asignados                   | ❌     |
| E2E-DOC-02  | E2E         | Acceder a detalles de paciente       | Verifica la visualización de información detallada                 | ❌     |
| E2E-DOC-03  | E2E         | Añadir recomendaciones               | Verifica la funcionalidad de recomendaciones                       | ❌     |
| E2E-DOC-04  | E2E         | Generar plan nutricional             | Verifica la creación de planes alimenticios                        | ❌     |
| E2E-UI-01   | E2E         | Navegación responsive                | Verifica la adaptabilidad en diferentes dispositivos               | ❌     |
| E2E-UI-02   | E2E         | Accesibilidad básica                 | Verifica elementos básicos de accesibilidad                        | ❌     |
| API-AUTH-01 | API         | POST /api/auth/register              | Verifica el endpoint de registro                                   | ✅     |
| API-AUTH-02 | API         | POST /api/auth/login                 | Verifica el endpoint de inicio de sesión                           | ✅     |
| API-AUTH-03 | API         | POST /api/auth/forgot-password       | Verifica el endpoint de recuperación                               | ✅     |
| API-AUTH-04 | API         | GET /api/auth/verify-token           | Verifica la validación de JWT                                      | ✅     |
| API-NUT-01  | API         | GET /api/nutrition/records           | Verifica la recuperación de registros nutricionales                | ❌     |
| API-NUT-02  | API         | POST /api/nutrition/records          | Verifica la creación de registros nutricionales                    | ❌     |
| API-NUT-03  | API         | PUT /api/nutrition/records/:id       | Verifica la actualización de registros                             | ❌     |
| API-NUT-04  | API         | DELETE /api/nutrition/records/:id    | Verifica la eliminación de registros                               | ❌     |
| SB-AUTH-01  | Supabase    | Registro de usuario                  | Verifica la integración con Supabase Auth                          | ✅     |
| SB-AUTH-02  | Supabase    | Inicio de sesión                     | Verifica la autenticación con Supabase                             | ✅     |
| SB-AUTH-03  | Supabase    | Cierre de sesión                     | Verifica el proceso de logout en Supabase                          | ✅     |
| SB-AUTH-04  | Supabase    | Recuperación de contraseña           | Verifica el proceso de reseteo en Supabase                         | ✅     |
| SB-AUTH-05  | Supabase    | Verificación de tokens               | Verifica la validación de tokens de sesión                         | ❌     |
| SB-AUTH-06  | Supabase    | Manejo de errores                    | Verifica el manejo correcto de errores de auth                     | ✅     |
| SB-DB-01    | Supabase    | Crear perfil de usuario              | Verifica la creación de perfiles en Supabase                       | ✅     |
| SB-DB-02    | Supabase    | Leer perfil de usuario               | Verifica la lectura de perfiles en Supabase                        | ✅     |
| SB-DB-03    | Supabase    | Actualizar perfil                    | Verifica la actualización de perfiles                              | ✅     |
| SB-DB-04    | Supabase    | Eliminar perfil                      | Verifica el borrado lógico de perfiles                             | ❌     |
| SB-DB-05    | Supabase    | Insertar registros de comidas        | Verifica la inserción de datos nutricionales                       | ✅     |
| SB-DB-06    | Supabase    | Consultar registros por usuario      | Verifica la recuperación de registros filtrados                    | ✅     |
| SB-DB-07    | Supabase    | Consultar registros por fecha        | Verifica la recuperación con filtros de fecha                      | ✅     |
| SB-DB-08    | Supabase    | Actualizar registros existentes      | Verifica la actualización de datos nutricionales                   | ✅     |
| SB-DB-09    | Supabase    | Eliminar registros                   | Verifica la eliminación de datos nutricionales                     | ✅     |
| SB-DB-10    | Supabase    | Crear asignación médico-paciente     | Verifica la creación de relaciones                                 | ✅     |
| SB-DB-11    | Supabase    | Consultar pacientes de médico        | Verifica la obtención de pacientes asignados                       | ✅     |
| SB-DB-12    | Supabase    | Consultar médicos de paciente        | Verifica la obtención de médicos asignados                         | ✅     |
| SB-DB-13    | Supabase    | Eliminar asignación                  | Verifica la eliminación de relaciones                              | ✅     |
| SB-RLS-01   | Supabase    | Acceso a datos propios               | Verifica que usuarios solo vean sus datos                          | ✅     |
| SB-RLS-02   | Supabase    | Acceso médico a pacientes            | Verifica permisos médico-paciente                                  | ✅     |
| SB-RLS-03   | Supabase    | Aplicación de políticas              | Verifica políticas en todos los endpoints                          | ✅     |
| SB-STOR-01  | Supabase    | Subir imágenes de alimentos          | Verifica la carga de imágenes                                      | ❌     |
| SB-STOR-02  | Supabase    | Subir planes nutricionales           | Verifica la carga de documentos                                    | ❌     |
| SB-STOR-03  | Supabase    | Obtener URL de imagen                | Verifica la generación de URLs públicas                            | ❌     |
| SB-STOR-04  | Supabase    | Descargar archivos privados          | Verifica la descarga autenticada                                   | ❌     |
| SB-STOR-05  | Supabase    | Restricción a archivos privados      | Verifica permisos de acceso a archivos                             | ❌     |
| SB-EDGE-01  | Supabase    | Procesamiento de datos               | Verifica el cálculo de información acumulada                       | ❌     |
| SB-EDGE-02  | Supabase    | Generación de reportes               | Verifica la creación de reportes                                   | ❌     |
| SB-EDGE-03  | Supabase    | Envío de recordatorios               | Verifica notificaciones por correo                                 | ❌     |
| SB-EDGE-04  | Supabase    | Alertas de objetivos                 | Verifica alertas nutricionales                                     | ❌     |
| SB-PERF-01  | Supabase    | Tiempos de respuesta                 | Verifica rendimiento de consultas complejas                        | ❌     |
| SB-PERF-02  | Supabase    | Conexiones simultáneas               | Verifica límites de conexión                                       | ❌     |
| SB-PERF-03  | Supabase    | Comportamiento bajo carga            | Verifica rendimiento con alta demanda                              | ❌     |

## Detalle de las pruebas por categoría

### Pruebas Unitarias

#### Modelos

- ✅ Usuario (UserAuth)
  - ✅ Registro de usuarios
  - ✅ Inicio de sesión
  - ✅ Cierre de sesión
  - ✅ Verificación de correo existente
  - ✅ Restablecimiento de contraseña
  - ❌ Actualización de datos de usuario
  - ❌ Reenvío de email de confirmación

#### Modelo de Entradas de Comida (FoodEntry)

- ✅ Crear entrada de comida
  - ✅ Validación de datos obligatorios
  - ✅ Rechazo para usuario inexistente
- ✅ Obtener historial de usuario
  - ✅ Paginación correcta
  - ✅ Filtrado por fecha
  - ✅ Manejo de usuarios sin entradas
- ✅ Obtener entrada por ID
  - ✅ Con imagen
  - ✅ Sin imagen
  - ✅ ID inexistente
- ✅ Actualizar entrada
  - ✅ Usuario propietario
  - ✅ Usuario no propietario
- ✅ Eliminar entrada
  - ✅ Usuario propietario
  - ✅ Usuario no propietario
- ✅ Estadísticas de usuario

#### Utilidades

- ❌ Funciones de ayuda
  - ❌ Validación de correo electrónico
  - ❌ Formateo de fechas

### Pruebas de Integración

#### Flujos de Autenticación

- ❌ Registro de paciente
- ❌ Registro de médico
- ❌ Inicio de sesión
- ❌ Recuperación de contraseña

#### Relación Médico-Paciente

- ✅ Asignar paciente a médico
  - ✅ Vinculación correcta
  - ✅ Rechazo con IDs inválidos
  - ✅ Rechazo de vinculación duplicada
- ✅ Obtener pacientes de un médico
  - ✅ Médico con pacientes
  - ✅ Médico sin pacientes
- ✅ Obtener médicos de un paciente
- ✅ Eliminar asignación
  - ✅ Relación existente
  - ✅ Relación inexistente

#### Gestión de Datos

- ❌ Creación de registros nutricionales
- ❌ Actualización de registros
- ❌ Eliminación de registros

### Pruebas End-to-End (E2E)

#### Autenticación

- ✅ Carga de página de inicio
- ✅ Registro de nuevo usuario
- ✅ Inicio de sesión con credenciales correctas
- ✅ Rechazo con credenciales incorrectas
- ✅ Cierre de sesión
- ❌ Proceso de restablecimiento de contraseña

#### Funcionalidad de Paciente

- ❌ Añadir comida al registro diario
- ❌ Ver historial nutricional
- ❌ Generar informes nutricionales
- ❌ Actualizar perfil

#### Funcionalidad de Médico

- ❌ Ver listado de pacientes
- ❌ Acceder a detalles de paciente
- ❌ Añadir recomendaciones a paciente
- ❌ Generar plan nutricional

#### Navegación y Experiencia de Usuario

- ❌ Navegación responsive (móvil, tablet, escritorio)
- ❌ Accesibilidad básica

### Pruebas de API

#### Endpoints de Autenticación

- ✅ POST /api/auth/register
  - ✅ Registro exitoso
  - ✅ Rechazo por datos incompletos
  - ✅ Rechazo por correo duplicado
- ✅ POST /api/auth/login
  - ✅ Login exitoso
  - ✅ Rechazo con credenciales incorrectas
  - ✅ Rechazo con datos incompletos
- ✅ POST /api/auth/forgot-password
  - ✅ Usuario existente
  - ✅ Usuario inexistente
- ✅ GET /api/auth/verify-token
  - ✅ Token válido
  - ✅ Token inválido
  - ✅ Sin token

#### Endpoints de Nutrición

- ❌ GET /api/nutrition/records
- ❌ POST /api/nutrition/records
- ❌ PUT /api/nutrition/records/:id
- ❌ DELETE /api/nutrition/records/:id

### Pruebas con Supabase

#### Autenticación de Supabase

- ✅ Registro de usuario (signUp)
- ✅ Inicio de sesión (signInWithPassword)
- ✅ Cierre de sesión (signOut)
- ✅ Recuperación de contraseña (resetPasswordForEmail)
- ❌ Verificación de tokens de sesión
- ✅ Manejo de errores de autenticación

#### Base de Datos de Supabase

- ✅ Operaciones CRUD para perfiles de usuario
  - ✅ Crear perfil de usuario después del registro
  - ✅ Leer perfil de usuario
  - ✅ Actualizar información de perfil
  - ❌ Eliminar perfil (borrado lógico)
- ✅ Operaciones CRUD para registros nutricionales
  - ✅ Insertar nuevos registros de comidas
  - ✅ Consultar registros nutricionales por usuario
  - ✅ Consultar registros nutricionales por fecha
  - ✅ Actualizar registros existentes
  - ✅ Eliminar registros
- ✅ Operaciones CRUD para relación médico-paciente
  - ✅ Crear asignación médico-paciente
  - ✅ Consultar pacientes de un médico
  - ✅ Consultar médicos de un paciente
  - ✅ Eliminar asignación
- ✅ Políticas de seguridad RLS (Row Level Security)
  - ✅ Verificar que los usuarios solo pueden ver sus propios datos
  - ✅ Verificar que los médicos solo pueden acceder a datos de sus pacientes
  - ✅ Comprobar que las políticas aplican correctamente en todos los endpoints

#### Almacenamiento de Supabase (por implementar)

- ❌ Carga de archivos
  - ❌ Subir imágenes de alimentos
  - ❌ Subir documentos de planes nutricionales
- ❌ Descarga de archivos
  - ❌ Obtener URL pública de imagen
  - ❌ Descargar archivos privados con autenticación
- ❌ Gestión de permisos
  - ❌ Verificar restricciones de acceso a archivos privados

#### Edge Functions de Supabase (por implementar)

- ❌ Funciones de procesamiento de datos
  - ❌ Cálculo de información nutricional acumulada
  - ❌ Generación de reportes
- ❌ Funciones de notificación
  - ❌ Envío de correos para recordatorios
  - ❌ Alertas de objetivos nutricionales

#### Pruebas de Rendimiento con Supabase (futuro)

- ❌ Tiempos de respuesta para consultas complejas
- ❌ Límites de conexiones simultáneas
- ❌ Comportamiento bajo carga

## Progreso y Prioridades

### Pruebas Completadas (✅)

- Pruebas unitarias de autenticación
- Pruebas unitarias de entradas de comida
- Pruebas de integración para relación médico-paciente
- Pruebas E2E básicas de autenticación
- Pruebas de API para endpoints de autenticación
- Pruebas de integración con Supabase para autenticación y operaciones CRUD

### Pruebas Pendientes Prioritarias (❌)

1. Pruebas unitarias de funciones de utilidad
2. Pruebas de integración para flujos de autenticación completos
3. Pruebas de API para endpoints de nutrición
4. Pruebas E2E para funcionalidades de pacientes y médicos

### Próximos Pasos

1. Implementar pruebas para el almacenamiento de Supabase
2. Desarrollar pruebas para Edge Functions cuando se implementen
3. Completar pruebas de perfiles de usuario
4. Preparar pruebas de rendimiento para evaluación de carga

## Estrategia de Ejecución

1. Ejecutar pruebas unitarias en cada commit
2. Ejecutar pruebas de integración antes de cada merge a la rama principal
3. Ejecutar pruebas e2e en despliegues a entornos de staging
4. Verificar que todas las pruebas de Supabase se ejecuten con un proyecto de Supabase dedicado para pruebas

## Instrucciones de Ejecución

```bash
# Pruebas unitarias
npm test

# Pruebas unitarias en modo watch
npm run test:watch

# Pruebas de integración
npm run test:integration

# Pruebas de API
npm run test:api

# Pruebas e2e
npm run test:e2e

# Todas las pruebas
npm run test:all

# Pruebas específicas de Supabase
npm run test:supabase
```

## Configuración de Entorno de Pruebas

Para ejecutar las pruebas con Supabase, es necesario crear un archivo `.env.test` con las siguientes variables:

```
SUPABASE_TEST_URL=https://tu-proyecto-test.supabase.co
SUPABASE_TEST_KEY=tu-api-key-de-prueba
SUPABASE_TEST_SERVICE_ROLE_KEY=tu-service-role-key-de-prueba
```

**IMPORTANTE**: Utilizar un proyecto Supabase dedicado para pruebas, NUNCA el proyecto de producción.
