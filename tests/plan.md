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

## Pruebas Unitarias

### Modelos
- [x] Usuario (UserAuth)
  - [x] Registro de usuarios
  - [x] Inicio de sesión
  - [x] Cierre de sesión
  - [x] Verificación de correo existente
  - [x] Restablecimiento de contraseña
  - [ ] Actualización de datos de usuario
  - [ ] Reenvío de email de confirmación

### Modelo de Entradas de Comida (FoodEntry)
- [x] Crear entrada de comida
  - [x] Validación de datos obligatorios
  - [x] Rechazo para usuario inexistente
- [x] Obtener historial de usuario
  - [x] Paginación correcta
  - [x] Filtrado por fecha
  - [x] Manejo de usuarios sin entradas
- [x] Obtener entrada por ID
  - [x] Con imagen
  - [x] Sin imagen
  - [x] ID inexistente
- [x] Actualizar entrada
  - [x] Usuario propietario
  - [x] Usuario no propietario
- [x] Eliminar entrada
  - [x] Usuario propietario
  - [x] Usuario no propietario
- [x] Estadísticas de usuario

### Utilidades
- [ ] Funciones de ayuda
  - [ ] Validación de correo electrónico
  - [ ] Formateo de fechas

## Pruebas de Integración

### Flujos de Autenticación
- [ ] Registro de paciente
- [ ] Registro de médico
- [ ] Inicio de sesión
- [ ] Recuperación de contraseña

### Relación Médico-Paciente
- [x] Asignar paciente a médico
  - [x] Vinculación correcta
  - [x] Rechazo con IDs inválidos
  - [x] Rechazo de vinculación duplicada
- [x] Obtener pacientes de un médico
  - [x] Médico con pacientes
  - [x] Médico sin pacientes
- [x] Obtener médicos de un paciente
- [x] Eliminar asignación
  - [x] Relación existente
  - [x] Relación inexistente

### Gestión de Datos
- [ ] Creación de registros nutricionales
- [ ] Actualización de registros
- [ ] Eliminación de registros

## Pruebas End-to-End (E2E)

### Autenticación
- [x] Carga de página de inicio
- [x] Registro de nuevo usuario
- [x] Inicio de sesión con credenciales correctas
- [x] Rechazo con credenciales incorrectas
- [x] Cierre de sesión
- [ ] Proceso de restablecimiento de contraseña

### Funcionalidad de Paciente
- [ ] Añadir comida al registro diario
- [ ] Ver historial nutricional
- [ ] Generar informes nutricionales
- [ ] Actualizar perfil

### Funcionalidad de Médico
- [ ] Ver listado de pacientes
- [ ] Acceder a detalles de paciente
- [ ] Añadir recomendaciones a paciente
- [ ] Generar plan nutricional

### Navegación y Experiencia de Usuario
- [ ] Navegación responsive (móvil, tablet, escritorio)
- [ ] Accesibilidad básica

## Pruebas de API

### Endpoints de Autenticación
- [x] POST /api/auth/register
  - [x] Registro exitoso
  - [x] Rechazo por datos incompletos
  - [x] Rechazo por correo duplicado
- [x] POST /api/auth/login
  - [x] Login exitoso
  - [x] Rechazo con credenciales incorrectas
  - [x] Rechazo con datos incompletos
- [x] POST /api/auth/forgot-password
  - [x] Usuario existente
  - [x] Usuario inexistente
- [x] GET /api/auth/verify-token
  - [x] Token válido
  - [x] Token inválido
  - [x] Sin token

### Endpoints de Nutrición
- [ ] GET /api/nutrition/records
- [ ] POST /api/nutrition/records
- [ ] PUT /api/nutrition/records/:id
- [ ] DELETE /api/nutrition/records/:id

## Pruebas con Supabase

### Autenticación de Supabase
- [x] Registro de usuario (signUp)
- [x] Inicio de sesión (signInWithPassword)
- [x] Cierre de sesión (signOut)
- [x] Recuperación de contraseña (resetPasswordForEmail)
- [ ] Verificación de tokens de sesión
- [x] Manejo de errores de autenticación

### Base de Datos de Supabase
- [x] Operaciones CRUD para perfiles de usuario
  - [x] Crear perfil de usuario después del registro
  - [x] Leer perfil de usuario
  - [x] Actualizar información de perfil
  - [ ] Eliminar perfil (borrado lógico)
- [x] Operaciones CRUD para registros nutricionales
  - [x] Insertar nuevos registros de comidas
  - [x] Consultar registros nutricionales por usuario
  - [x] Consultar registros nutricionales por fecha
  - [x] Actualizar registros existentes
  - [x] Eliminar registros
- [x] Operaciones CRUD para relación médico-paciente
  - [x] Crear asignación médico-paciente
  - [x] Consultar pacientes de un médico
  - [x] Consultar médicos de un paciente
  - [x] Eliminar asignación
- [x] Políticas de seguridad RLS (Row Level Security)
  - [x] Verificar que los usuarios solo pueden ver sus propios datos
  - [x] Verificar que los médicos solo pueden acceder a datos de sus pacientes
  - [x] Comprobar que las políticas aplican correctamente en todos los endpoints

### Almacenamiento de Supabase (por implementar)
- [ ] Carga de archivos
  - [ ] Subir imágenes de alimentos
  - [ ] Subir documentos de planes nutricionales
- [ ] Descarga de archivos
  - [ ] Obtener URL pública de imagen
  - [ ] Descargar archivos privados con autenticación
- [ ] Gestión de permisos
  - [ ] Verificar restricciones de acceso a archivos privados

### Edge Functions de Supabase (por implementar)
- [ ] Funciones de procesamiento de datos
  - [ ] Cálculo de información nutricional acumulada
  - [ ] Generación de reportes
- [ ] Funciones de notificación
  - [ ] Envío de correos para recordatorios
  - [ ] Alertas de objetivos nutricionales

### Pruebas de Rendimiento con Supabase (futuro)
- [ ] Tiempos de respuesta para consultas complejas
- [ ] Límites de conexiones simultáneas
- [ ] Comportamiento bajo carga

## Estrategia de Ejecución

1. Ejecutar pruebas unitarias en cada commit
2. Ejecutar pruebas de integración antes de cada merge a la rama principal
3. Ejecutar pruebas e2e en despliegues a entornos de staging
4. Verificar que todas las pruebas de Supabase se ejecuten con un proyecto de Supabase dedicado para pruebas

## Implementación de Pruebas Pendientes

1. Pruebas de almacenamiento de Supabase para imágenes de comidas
2. Pruebas para Edge Functions cuando se implementen
3. Pruebas de perfiles de usuario completas
4. Pruebas de rendimiento con datos masivos

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