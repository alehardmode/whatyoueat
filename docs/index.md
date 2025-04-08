# Documentación WhatYouEat

Bienvenido a la documentación de WhatYouEat, una aplicación de seguimiento nutricional para pacientes y médicos.

## Índice de Documentación

### Guías Técnicas

- [Testing](./testing.md) - Guía de pruebas unitarias, integración y E2E
- [Patrones de Diseño](./patterns.md) - Patrones implementados en el proyecto
- [Validación](./validation.md) - Reglas y patrones de validación de datos
- [Diagramas](./diagrams.md) - Diagramas y esquemas de la aplicación

## Estructura del Proyecto

```
/
├── config/              # Configuraciones
│   ├── jest.config.js   # Configuración principal de Jest
│   ├── supabase.js      # Configuración de Supabase
│   └── ...
├── controllers/         # Controladores de la aplicación
│   ├── auth/            # Controladores de autenticación
│   ├── patient/         # Controladores para pacientes
│   └── doctor/          # Controladores para médicos
├── models/              # Modelos de datos
├── views/               # Vistas de la aplicación
├── middleware/          # Middleware de Express
├── public/             # Archivos estáticos
├── routes/             # Rutas de Express
├── tests/              # Pruebas automatizadas
│   ├── unit/           # Pruebas unitarias
│   ├── integration/    # Pruebas de integración
│   └── e2e/            # Pruebas end-to-end
└── utils/              # Utilidades generales
```

## Ejecutando el Proyecto

Para iniciar el servidor en modo desarrollo:

```bash
npm run dev
```

Para ejecutar pruebas:

```bash
# Pruebas unitarias
npm test

# Pruebas de integración
npm run test:integration

# Pruebas end-to-end
npm run test:e2e

# Todas las pruebas
npm run test:all
```

## Tecnologías Principales

- **Backend**: Node.js con Express
- **Base de Datos**: Supabase
- **Autenticación**: Supabase Auth
- **Testing**: Jest, Puppeteer, Supertest
- **Frontend**: EJS, Bootstrap, JavaScript

## Contribución

Para contribuir al proyecto:

1. Asegúrate de seguir los estándares de código establecidos
2. Escribe pruebas para las nuevas funcionalidades
3. Documenta los cambios realizados
4. Realiza pruebas locales antes de enviar un PR

## Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Express](https://expressjs.com/)
- [Documentación de Jest](https://jestjs.io/docs/getting-started)
