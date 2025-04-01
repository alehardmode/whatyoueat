# Plan de Pruebas - WhatYouEat

## Propósito

Este documento define el plan de pruebas para la aplicación WhatYouEat, incluyendo pruebas unitarias, de integración y end-to-end (e2e).

## Organización de pruebas

Las pruebas están organizadas en las siguientes categorías:

```
/tests
  /unit          # Pruebas unitarias
  /integration   # Pruebas de integración
  /e2e           # Pruebas end-to-end con Puppeteer
  /api           # Pruebas de API
  /fixtures      # Datos de prueba compartidos
  setup.js       # Configuración para pruebas unitarias/integración
  setup.e2e.js   # Configuración para pruebas e2e
  plan.md        # Este documento
```

## Pruebas Unitarias

### Modelos
- [ ] Usuario
  - [ ] Validación de datos
  - [ ] Encriptación de contraseña
  - [ ] Métodos de verificación

### Controladores
- [ ] UsuarioController
  - [ ] Registro
  - [ ] Inicio de sesión
  - [ ] Actualización de perfil
  - [ ] Recuperación de contraseña

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

### Gestión de Datos
- [ ] Creación de registros nutricionales
- [ ] Actualización de registros
- [ ] Eliminación de registros

## Pruebas End-to-End (E2E)

### Autenticación
- [ ] Proceso completo de registro de paciente
- [ ] Proceso completo de registro de médico
- [ ] Inicio de sesión de paciente
- [ ] Inicio de sesión de médico
- [ ] Flujo de restablecimiento de contraseña

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

### Endpoints de Usuario
- [ ] GET /api/user/profile
- [ ] PUT /api/user/profile
- [ ] POST /api/user/register
- [ ] POST /api/user/login

### Endpoints de Registro Nutricional
- [ ] GET /api/nutrition/records
- [ ] POST /api/nutrition/records
- [ ] PUT /api/nutrition/records/:id
- [ ] DELETE /api/nutrition/records/:id

## Estrategia de Ejecución

1. Ejecutar pruebas unitarias en cada commit
2. Ejecutar pruebas de integración antes de cada merge a la rama principal
3. Ejecutar pruebas e2e en despliegues a entornos de staging

## Instrucciones de Ejecución

```bash
# Pruebas unitarias
npm test

# Pruebas unitarias en modo watch
npm run test:watch

# Pruebas e2e
npm run test:e2e
``` 