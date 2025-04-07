# Guía de Pruebas - WhatYouEat

## Introducción

Este documento explica el sistema de pruebas implementado para la aplicación WhatYouEat, destinado a desarrolladores que necesiten entender, ejecutar o ampliar las pruebas existentes.

## Estructura de Pruebas

Las pruebas siguen una organización por categorías:

```
/tests
  /unit          # Pruebas unitarias para componentes individuales
    /auth        # Pruebas para autenticación
    /nutrition   # Pruebas para funcionalidades nutricionales
  /integration   # Pruebas de integración entre múltiples componentes
    /doctor-patient # Pruebas de relación médico-paciente
  /e2e           # Pruebas end-to-end con Puppeteer (navegador simulado)
  /api           # Pruebas de API REST
  /fixtures      # Datos de prueba compartidos
  /mocks         # Mocks y simulaciones para tests
  setup.js       # Configuración para pruebas unitarias/integración
  setup-supabase.js # Configuración específica para Supabase
  setup.e2e.js   # Configuración para pruebas e2e
  plan.md        # Plan detallado de pruebas
```

## Convenciones de Nomenclatura

- Archivos de prueba unitaria: `[nombre-del-archivo].test.js`
- Archivos de prueba de integración: `[funcionalidad].integration.test.js`
- Archivos de prueba e2e: `[flujo-de-usuario].e2e.test.js`
- Archivos de prueba de API: `[endpoint].api.test.js`

## Configuración del Entorno

### Prerequisitos

- Node.js 18 o superior
- npm 8 o superior
- Un proyecto de Supabase dedicado para pruebas (nunca usar producción)

### Variables de Entorno

Crear un archivo `.env.test` en la raíz del proyecto con:

```
SUPABASE_TEST_URL=https://tu-proyecto-test.supabase.co
SUPABASE_TEST_KEY=tu-api-key-de-prueba
SUPABASE_TEST_SERVICE_ROLE_KEY=tu-service-role-key-de-prueba
```

## Ejecución de Pruebas

### Comandos Principales

```bash
# Pruebas unitarias
npm test

# Modo vigilante (para desarrollo)
npm run test:watch

# Pruebas de integración
npm run test:integration

# Pruebas de API
npm run test:api

# Pruebas end-to-end
npm run test:e2e

# Todas las pruebas
npm run test:all

# Pruebas específicas de Supabase
npm run test:supabase
```

### Ejecutar Pruebas Específicas

Para ejecutar un archivo de prueba específico:

```bash
npm test -- path/to/file.test.js
```

Para ejecutar una prueba específica:

```bash
npm test -- -t "nombre de la prueba"
```

## Estado Actual de las Pruebas

Actualmente, se han implementado las siguientes categorías de pruebas:

### Pruebas Completadas

- ✅ Autenticación de usuario (registro, login, logout)
- ✅ Gestión de entradas de comida (CRUD)
- ✅ Relación médico-paciente (asignación, consulta)
- ✅ Endpoints de autenticación API REST
- ✅ Flujo básico de autenticación E2E

### Pruebas Pendientes Prioritarias

- ❌ Funciones de utilidad
- ❌ Flujos de autenticación completos (integración)
- ❌ Endpoints de nutrición
- ❌ Funcionalidades de pacientes y médicos (E2E)

Consulta el archivo `tests/plan.md` para ver el estado completo y detallado de todas las pruebas planificadas.

## Estrategia de Mocks

Las pruebas utilizan diferentes estrategias para no depender de servicios externos:

1. **API Rest**: Se utilizan mocks para simular las respuestas HTTP
2. **Supabase**: Se usa un proyecto de prueba dedicado o mocks según configuración
3. **E2E**: Se utilizan mocks de Puppeteer para simular navegador y UI

### Ejemplo de Mock de API

```javascript
// tests/api/example.test.js
const createMockApi = () => {
  return {
    get: jest.fn().mockImplementation((path) => {
      if (path === "/") {
        return Promise.resolve({
          status: 200,
          data: { message: "API funcionando correctamente" },
        });
      }
      // ...otras respuestas simuladas
    }),
    // ...otros métodos HTTP
  };
};

global.api = createMockApi();
```

### Ejemplo de Mock de Puppeteer

```javascript
// tests/e2e/auth-flow.e2e.test.js
const createMockPage = () => {
  return {
    goto: jest.fn().mockResolvedValue(undefined),
    $: jest.fn().mockImplementation((selector) => {
      // Simular elementos de la página
      if (selector.includes("form")) {
        return Promise.resolve({});
      }
      return Promise.resolve(null);
    }),
    // ...otros métodos de página
  };
};

global.browser = {
  newPage: jest.fn().mockResolvedValue(createMockPage()),
};
```

## Datos de Prueba

Los datos para pruebas se encuentran en `tests/fixtures/`:

- `users.js`: Datos de usuarios (pacientes, médicos, credenciales)
- `food-entries.js`: Datos de entradas de comida
- `nutrition-data.js`: Datos nutricionales

Utiliza estos datos en tus pruebas para mantener consistencia.

## Prácticas Recomendadas

1. **Aislar las pruebas**: Cada prueba debe ejecutarse de forma independiente
2. **Datos efímeros**: Usa IDs únicos (con timestamps) para evitar conflictos
3. **Limpiar después de probar**: Usa `afterEach`/`afterAll` para eliminar datos de prueba
4. **No conectar a producción**: Nunca conectes pruebas a entornos de producción
5. **Pruebas deterministas**: Evita resultados aleatorios o dependientes del entorno

## Escribir Nuevas Pruebas

### Estructura Básica

```javascript
describe("Componente o funcionalidad", () => {
  // Configuración inicial
  beforeAll(() => {
    // Preparar el entorno antes de todas las pruebas
  });

  // Limpieza al finalizar
  afterAll(() => {
    // Limpiar datos o estado
  });

  // Casos de prueba
  test("debería hacer X cuando Y", async () => {
    // Arrange (preparar)
    const input = "valor";

    // Act (actuar)
    const result = await functionToTest(input);

    // Assert (verificar)
    expect(result).toBe(expectedValue);
  });
});
```

### Recomendaciones para Implementar Nuevas Pruebas

1. Consulta `tests/plan.md` para ver qué pruebas están pendientes
2. Sigue las convenciones de nombres y estructura existentes
3. Reutiliza fixtures y mocks cuando sea posible
4. Implementa primero las pruebas unitarias, luego integración y finalmente E2E
5. Actualiza el archivo plan.md con tu progreso

## Resolución de Problemas

### Problemas Comunes

1. **Error de conexión a Supabase**: Verifica credenciales en `.env.test`
2. **Pruebas lentas**: Usa mocks en lugar de servicios reales cuando sea posible
3. **Conflictos de datos**: Usa IDs dinámicos con timestamps
4. **Pruebas no deterministas**: Asegúrate que los mocks devuelvan resultados consistentes

### Depuración

Para depurar pruebas:

```bash
# Modo depuración con Node
node --inspect-brk node_modules/.bin/jest --runInBand ruta/a/archivo.test.js
```

## Recursos Adicionales

- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Documentación de Puppeteer](https://pptr.dev/)
- [Documentación de Supabase](https://supabase.io/docs)
- [Plan de pruebas completo](../tests/plan.md)

## Contacto

Si tienes preguntas sobre el sistema de pruebas, contacta al equipo de desarrollo en whatyoueat.project@gmail.com.
