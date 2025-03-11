# WhatYouEat - Aplicación de Seguimiento Nutricional

Una aplicación web para que los pacientes registren su alimentación diaria mediante fotos, comentarios e ingredientes, permitiendo a los médicos hacer un seguimiento detallado de los hábitos alimenticios de sus pacientes.

## Características Principales

### Para Pacientes
- Registro de comidas mediante fotografías
- Inclusión de comentarios y detalles de ingredientes
- Visualización de historial de comidas con filtrado por fechas

### Para Médicos
- Vista de lista de pacientes con búsqueda por nombre
- Acceso al historial de comidas de cada paciente
- Visualización detallada de cada entrada

## Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5
- EJS como motor de plantillas (archivos con extensión .html procesados por EJS)

### Backend
- Node.js
- Express.js
- Supabase (PostgreSQL en la nube)

### Seguridad
- bcrypt (encriptación de contraseñas)
- express-session (manejo seguro de sesiones)
- Middleware de protección de rutas por rol
- Cookies httpOnly y seguras
- Regeneración de ID de sesión

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tu-usuario/whatyoueat.git
cd whatyoueat
```

2. Instala las dependencias:
```bash
npm install
```

3. Genera un SESSION_SECRET seguro utilizando la utilidad proporcionada:
```bash
node utils/generateSecret.js
```

4. Crea un archivo `.env` en la raíz del proyecto basado en `.env.example` y configura tus credenciales:
```
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
SESSION_SECRET=tu_valor_generado_por_utils_generateSecret

# Credenciales de Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_api_key_de_supabase

5. Configura la base de datos Supabase:
   - Crea un proyecto en [Supabase](https://supabase.com/)
   - Ejecuta el script SQL en `database/init.sql` para crear las tablas y políticas necesarias
   - Crea un bucket de almacenamiento llamado `food-photos` para las imágenes

6. Inicia la aplicación:
```bash
npm start
```

## Estructura del Proyecto

```
/whatyoueat
  ├── /config              # Configuración de servicios (Supabase, etc.)
  ├── /controllers         # Controladores para la lógica de negocio
  ├── /database            # Scripts SQL y migraciones
  ├── /docs                # Documentación del proyecto
  │     ├── patterns.md    # Documentación de patrones de diseño
  │     ├── diagrams.md    # Diagramas de interrelación de ficheros
  │     └── validation.md  # Validación de estándares web
  ├── /middleware          # Middleware personalizado (autenticación, etc.)
  ├── /models              # Modelos de datos
  ├── /public              # Archivos estáticos (CSS, JS, imágenes)
  ├── /routes              # Rutas de la aplicación
  ├── /utils               # Utilidades (generador de secretos, etc.)
  ├── /views               # Vistas HTML (procesadas con EJS)
  ├── .env.example         # Ejemplo de variables de entorno
  ├── package.json         # Dependencias y scripts
  ├── server.js            # Punto de entrada de la aplicación
  └── README.md            # Documentación
```

## Gestión Segura de Sesiones

Este proyecto implementa una gestión de sesiones segura utilizando `express-session`. Las principales características de seguridad incluyen:

### Generación de SESSION_SECRET Seguro

Para garantizar la seguridad de las sesiones, usamos un SESSION_SECRET criptográficamente fuerte. Pasos para generarlo:

1. Ejecuta la utilidad de generación de secretos:
```bash
node utils/generateSecret.js
```

2. Copia el valor generado y añádelo a tu archivo `.env`

### Protección de las Sesiones

La implementación incluye múltiples capas de seguridad:

- **Cookies httpOnly**: Previene acceso a cookies desde JavaScript
- **Secure en producción**: Cookies solo enviadas por HTTPS en producción
- **SameSite strict**: Evita ataques CSRF
- **Regeneración de ID de sesión**: Previene ataques de session fixation

## Uso

### Registro y Acceso
1. Accede a la página de inicio
2. Regístrate como paciente o médico
3. Inicia sesión con tus credenciales

### Para Pacientes
1. Desde el dashboard, haz clic en "Subir Foto"
2. Selecciona una imagen de tu comida
3. Añade comentarios e ingredientes
4. Visualiza tu historial de comidas usando el filtro de fechas

### Para Médicos
1. Desde el dashboard, visualiza la lista de pacientes
2. Utiliza el buscador para filtrar por nombre
3. Accede al historial del paciente haciendo clic en "Ver Diario"
4. Revisa las entradas de comida del paciente

## Contribución

1. Haz un fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/nueva-caracteristica`)
3. Realiza tus cambios y haz commit (`git commit -m 'Añade nueva característica'`)
4. Sube los cambios a tu rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo LICENSE para más detalles.

## Contacto

Para preguntas, sugerencias o soporte, contáctanos en whatyoueat.project@gmail.com

## Documentación

El proyecto incluye documentación detallada en la carpeta `/docs`:

- **Patrones de diseño**: Explicación del patrón MVC y otros patrones utilizados (/docs/patterns.md)
- **Diagramas**: Diagramas de arquitectura, interrelación de ficheros y clases (/docs/diagrams.md)
- **Validación**: Resultados de validación de estándares web y accesibilidad (/docs/validation.md)