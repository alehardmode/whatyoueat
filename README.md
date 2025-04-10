# WhatYouEat - Seguimiento Nutricional

Aplicación web que permite a pacientes registrar su alimentación mediante fotos y a médicos hacer un seguimiento de los hábitos alimenticios de sus pacientes.

## Características

### Plataforma Integral
- Sistema dual para pacientes y profesionales de la salud
- Interfaz intuitiva adaptada a cada tipo de usuario
- Diseño responsivo accesible desde cualquier dispositivo

### Gestión de Datos
- Almacenamiento seguro de imágenes en formato optimizado
- Organización cronológica de registros alimenticios
- Sistema de relaciones médico-paciente con permisos específicos

### Rendimiento y Seguridad
- Optimización de imágenes mediante conversión a WebP
- Autenticación segura con verificación de correo electrónico
- Protección de rutas mediante middleware por roles

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, EJS
- **Backend**: Node.js, Express.js, Supabase (PostgreSQL)

## Instalación Rápida

1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/whatyoueat.git
cd whatyoueat
```

2. Instalar dependencias
```bash
npm install
```

3. Generar SESSION_SECRET
```bash
node utils/generateSecret.js
```

4. Configurar archivo `.env` basado en `.env.example`

5. Configurar Supabase:
   - Crear un proyecto en [Supabase](https://supabase.com/)
   - Ejecutar el script en `database/init.sql`

6. Iniciar la aplicación
```bash
npm start
```

## Uso

1. **Registro y Acceso**:
   - Regístrate como paciente o médico proporcionando datos personales
   - Confirma tu correo electrónico para acceder a todas las funcionalidades
   - Inicia sesión con tus credenciales

2. **Pacientes**:
   - **Dashboard**: Visualiza un resumen de tu actividad y estadísticas alimenticias
   - **Registro de Comidas**: Sube fotos de tus alimentos incluyendo nombre, descripción, tipo de comida y fecha
   - **Historial Alimenticio**: Visualiza y filtra tu historial completo por fechas
   - **Gestión de Entradas**: Edita o elimina tus registros alimenticios anteriores
   - **Perfil**: Actualiza tus datos personales y preferencias

3. **Médicos**:
   - **Dashboard**: Administra tu lista de pacientes asignados
   - **Búsqueda de Pacientes**: Encuentra y asigna nuevos pacientes por nombre
   - **Seguimiento Nutricional**: Accede al historial alimenticio completo de tus pacientes
   - **Análisis Detallado**: Examina cada entrada alimenticia con todos sus detalles e imágenes
   - **Gestión de Relaciones**: Añade o elimina pacientes de tu lista de seguimiento

4. **Contacto**: Utiliza el formulario de contacto para reportar problemas o solicitar asistencia

## Licencia

MIT - Ver archivo [LICENSE](LICENSE) para más detalles

## Contacto

whatyoueat.project@gmail.com

## Testing

El proyecto utiliza Jest y Puppeteer para pruebas automatizadas. Para ejecutar las pruebas:

```bash
# Pruebas unitarias
npm test

# Todas las pruebas
npm run test:all
```

Consulta la [documentación de testing](docs/testing.md) para información detallada sobre la estructura, configuración y comandos.

## Configuración de Entorno

La aplicación utiliza archivos `.env` para gestionar las variables de entorno en diferentes despliegues. La configuración se carga automáticamente según el valor de la variable de entorno `NODE_ENV`:

- **Desarrollo:** Si `NODE_ENV` es `development` o no está definida, se carga `.env.development` (con fallback a `.env`).
- **Pruebas:** Si `NODE_ENV` es `test`, se carga `.env.test`.
- **Producción:** Si `NODE_ENV` es `production`, se carga `.env.production`.

**Archivos Necesarios:**

- `.env.development`: Variables para el entorno de desarrollo local.
- `.env.test`: Variables específicas para ejecutar las pruebas automatizadas.
- `.env.production`: Variables para el entorno de producción (¡No incluir en Git!).
- `.env.example`: Un archivo de ejemplo que muestra las variables necesarias. Útil como plantilla para los otros archivos `.env`.

**Importante:** Los archivos `.env.*` (excepto `.env.example`) están incluidos en `.gitignore` y **nunca deben ser añadidos al control de versiones** para evitar exponer información sensible.

Para iniciar la aplicación en un entorno específico, establece la variable `NODE_ENV` antes de ejecutar el comando:

```bash
# Iniciar en modo desarrollo (por defecto si NODE_ENV no está definido)
npm run dev

# Iniciar explícitamente en desarrollo
NODE_ENV=development npm run dev

# Ejecutar pruebas (NODE_ENV=test se configura automáticamente)
npm test

# Iniciar en modo producción
NODE_ENV=production npm start
```
