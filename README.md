# WhatYouEat - Seguimiento Nutricional

Aplicación web que permite a pacientes registrar su alimentación mediante fotos y a médicos hacer un seguimiento de los hábitos alimenticios de sus pacientes.

## Características

### Pacientes
- Registro de comidas mediante fotografías
- Visualización del historial con filtrado por fechas
- Gestión completa (crear, ver, editar, eliminar) de entradas

### Médicos
- Búsqueda y asignación de pacientes
- Visualización del historial alimenticio de pacientes asignados
- Acceso a detalles de cada entrada alimenticia

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, EJS
- **Backend**: Node.js, Express.js, Supabase (PostgreSQL)
- **Seguridad**: bcrypt, express-session, middleware por roles

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
   - Crear bucket de almacenamiento `food-photos`

6. Iniciar la aplicación
```bash
npm start
```

## Uso

1. **Registro/Acceso**: Regístrate como paciente o médico
2. **Pacientes**: Sube fotos de comidas con detalles e ingredientes
3. **Médicos**: Asigna pacientes y visualiza su historial alimenticio

## Estructura del Proyecto

```
/whatyoueat
  ├── /config           # Configuración (Supabase)
  ├── /controllers      # Lógica de negocio
  ├── /database         # Scripts SQL
  ├── /docs             # Documentación
  ├── /middleware       # Middleware (autenticación, etc.)
  ├── /models           # Modelos de datos
  ├── /public           # Archivos estáticos
  ├── /routes           # Definición de rutas
  ├── /utils            # Utilidades
  ├── /views            # Plantillas HTML/EJS
  ├── server.js         # Punto de entrada
  └── README.md         # Documentación
```

## Seguridad

- Cookies httpOnly y seguras en producción
- Sesiones con regeneración de ID
- Almacenamiento seguro de contraseñas con bcrypt
- Autorización basada en roles

## Contribución

1. Haz un fork del repositorio
2. Crea una nueva rama para tu característica
3. Envía un Pull Request

## Licencia

MIT - Ver archivo LICENSE para más detalles

## Contacto

whatyoueat.project@gmail.com
