# Documentación de Testing

El proyecto utiliza Jest y Puppeteer para pruebas automatizadas. Esta guía detalla la estructura, configuración y comandos para ejecutar las pruebas.

## Estructura

La estructura de pruebas está organizada de la siguiente manera:

```
/tests
  /unit          # Pruebas unitarias aisladas
  /integration   # Pruebas que verifican la interacción entre componentes
  /e2e           # Pruebas end-to-end con Puppeteer
  /api           # Pruebas específicas para la API REST
  /fixtures      # Datos de prueba compartidos
  setup.js       # Configuración para pruebas unitarias/integración
  setup.e2e.js   # Configuración para pruebas e2e
  setup.api.js   # Configuración para pruebas de API
  plan.md        # Plan de pruebas detallado
```

## Configuración

Los archivos de configuración de Jest se encuentran en la carpeta `/config`:

```
/config
  jest.config.js             # Configuración para pruebas unitarias
  jest.integration.config.js # Configuración para pruebas de integración
  jest.api.config.js         # Configuración para pruebas de API
  jest.e2e.config.js         # Configuración para pruebas e2e
```

### Convenciones de Nombrado

Para mantener la consistencia, sigue estas convenciones para nombrar los archivos de prueba:

- Pruebas unitarias: `[nombre-del-archivo-a-probar].test.js`
- Pruebas de integración: `[funcionalidad].integration.test.js` 
- Pruebas e2e: `[flujo-de-usuario].e2e.test.js`
- Pruebas de API: `[endpoint].api.test.js`

## Comandos de Prueba

Ejecuta las pruebas con los siguientes comandos:

```bash
# Pruebas unitarias
npm test
npm run test:unit

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

# Informe de cobertura
npm run test:coverage
```

Para ejecutar las pruebas e2e, asegúrate de tener el servidor en ejecución en otro terminal con `npm run dev`.

## Plan de Pruebas

Consulta el [plan de pruebas completo](../tests/plan.md) para obtener más detalles sobre las pruebas planificadas e implementadas.

## Buenas Prácticas

1. Escribe primero la prueba, luego implementa la funcionalidad (TDD).
2. Utiliza los datos de prueba en `/tests/fixtures` para mantener consistencia.
3. Aísla las pruebas unitarias de dependencias externas.
4. Verifica aspectos positivos y negativos de cada funcionalidad.
5. Minimiza el uso de mocks a lo esencial.
6. Cuando cambies código existente, asegúrate de que las pruebas sigan pasando.

## Datos de Prueba

Utiliza los archivos en `/tests/fixtures` para los datos de prueba:

- `users.js`: Datos de usuarios de prueba para pacientes y médicos
- `nutrition-records.js`: Datos de registros nutricionales de prueba

## Mantenimiento

- Actualiza el plan de pruebas cuando implementes nuevas funcionalidades
- Marca las pruebas como completadas [x] en el plan cuando las implementes
- Mantén la cobertura de código por encima del umbral mínimo establecido 