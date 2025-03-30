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
