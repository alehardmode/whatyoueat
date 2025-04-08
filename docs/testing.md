# Documentación de Pruebas

## Introducción

Esta documentación proporciona información general sobre la estrategia de pruebas, configuración y buenas prácticas para el proyecto WhatYouEat. Para información detallada sobre la matriz de pruebas específicas y su estado de implementación, consulte el archivo `tests/test-matrix.md`.

## Framework y Tecnologías

El proyecto utiliza las siguientes tecnologías para pruebas:

- **Jest**: Framework principal para todas las pruebas
- **Puppeteer**: Para pruebas end-to-end (e2e) que simulan interacciones de usuario
- **Supertest**: Para pruebas de API REST
- **Entorno de prueba Supabase**: Proyecto dedicado para testing

## Configuración de Jest

El proyecto utiliza varios archivos de configuración para diferentes tipos de pruebas:

- `/config/jest/jest.config.js` - Configuración principal
- `/config/jest/jest.integration.config.js` - Configuración para pruebas de integración
- `/config/jest/jest.api.config.js` - Configuración para pruebas de API REST
- `/config/jest/jest.e2e.config.js` - Configuración para pruebas end-to-end

## Cobertura de Pruebas

La cobertura de pruebas se genera utilizando Jest y puede ser visualizada ejecutando:

```bash
npm run test:coverage
```

El informe generado incluye:

- Cobertura de declaraciones (statements)
- Cobertura de ramas (branches)
- Cobertura de funciones (functions)
- Cobertura de líneas (lines)

El objetivo es mantener al menos un 80% de cobertura en el código principal.

## Principios de Pruebas

### Enfoque de Desarrollo Guiado por Pruebas (TDD)

1. **Escribir primero las pruebas**: Antes de implementar una nueva funcionalidad, se debe escribir la prueba que verifique su comportamiento.
2. **Ciclo rojo-verde-refactor**: Ejecutar la prueba para confirmar que falla, implementar código mínimo para que pase, y luego refactorizar.
3. **Implementación incremental**: Ir agregando funcionalidad de manera progresiva, validada por pruebas.

### Buenas Prácticas

1. **Aislamiento**: Cada prueba debe ser independiente y no depender del estado de otras pruebas.
2. **Determinismo**: Las pruebas deben producir el mismo resultado en cada ejecución.
3. **Datos de prueba**: Utilizar los fixtures en `/tests/fixtures` para compartir datos entre pruebas.
4. **Mocks**: Utilizar los mocks en `/tests/mocks` para simular servicios externos.
5. **Limpieza**: Realizar una limpieza adecuada después de las pruebas utilizando `afterEach` o `afterAll`.
6. **Descriptivas**: Utilizar nombres descriptivos para las pruebas indicando qué se está probando.
7. **Seguridad**: Incluir pruebas específicas para validación de entradas, autenticación y autorización.

## Consideraciones para Pruebas con Supabase

1. **Entorno aislado**: Todas las pruebas de Supabase deben ejecutarse contra una instancia dedicada para pruebas.
2. **Limpieza de datos**: Ejecutar scripts de limpieza después de pruebas que modifiquen datos.
3. **Mocks para pruebas unitarias**: Utilizar mocks para evitar dependencias directas en pruebas unitarias.
4. **Políticas RLS**: Verificar el funcionamiento correcto de las políticas de seguridad Row Level Security.

## Recursos Adicionales

- Para la matriz completa de pruebas y su estado, consulte `tests/test-matrix.md`
- Para configurar el entorno de pruebas con Supabase, siga las instrucciones en `tests/test-matrix.md`
