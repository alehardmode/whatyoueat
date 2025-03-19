# Diagramas de Interrelación de Ficheros

## Arquitectura General de la Aplicación

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|     CLIENTE    |     |     SERVIDOR   |     |   BASE DATOS   |
|  (Navegador)   |     |    (Node.js)   |     |   (Supabase)   |
|                |     |                |     |                |
+-------+--------+     +-------+--------+     +-------+--------+
        |                      |                      |
        | HTTP                 | API                  |
        | Requests             | Requests             |
        ↓                      ↓                      |
+-------+------------------------+                    |
|                                |                    |
|          APLICACIÓN            |                    |
|                                |                    |
+-+------------+------------+----+                    |
  |            |            |                         |
  |            |            |                         |
  ↓            ↓            ↓                         |
+-----+     +-----+     +-----+                       |
|     |     |     |     |     |                       |
|RUTAS|---->|CONTR|---->|MODEL|---------------------->+
|     |     |     |     |     |
+-----+     +--+--+     +-----+
               |
               ↓
            +-----+
            |     |
            |VISTA|
            |     |
            +-----+
```

## Diagrama de Flujo de Datos Actualizado

```
+-------------+         +------------+         +-------------+
|             |  HTTP   |            |  Rutas  |             |
|  Navegador  +-------->+  Express   +-------->+  Middleware |
|   Cliente   |         |   Server   |         |             |
+-------------+         +------------+         +------+------+
                                                     |
                                                     | Autorización
                                                     ↓
+-------------+         +------------+         +-------------+
|             |         |            |         |             |
|    Vista    <---------+ Controlador<---------+  Solicitud  |
|  (HTML+EJS) |  Render |            |  Validada    |
+------+------+         +-----+------+         +-------------+
       |                      |
       | HTML, CSS, JS        | Manipulación
       ↓                      | de datos
+-------------+         +-------------+         +-------------+
|             |         |             |         |             |
|  Interfaz   |         |   Modelo    |         |  Supabase   |
|  Usuario    |         |             +-------->+  Database   |
+-------------+         +-------------+  CRUD   +-------------+
```

## Diagrama Entidad-Relación (Base de Datos) Actualizado

```
+----------------------+       +-------------------------+
|      auth.users      |       |        profiles         |
+----------------------+       +-------------------------+
| id (PK) UUID         |<----->| id (PK, FK) UUID        |
| email VARCHAR        |       | name VARCHAR            |
| encrypted_password   |       | role VARCHAR            |
| email_confirmed_at   |       | created_at TIMESTAMP    |
| last_sign_in_at      |       | updated_at TIMESTAMP    |
| created_at TIMESTAMP |       +-------------------------+
+----------+-----------+                 |
           |                             |
           |                             |
           |                             |
           |                             |
           |                             v
           |              +--------------------------------+
           |              |          food_entries          |
           |              +--------------------------------+
           +------------->| id (PK) UUID                   |
                          | user_id (FK) UUID              |
                          | image_url VARCHAR              |
                          | comments TEXT                  |
                          | ingredients TEXT               |
                          | created_at TIMESTAMP           |
                          | updated_at TIMESTAMP           |
                          +--------------------------------+
```

## Flujo de Usuario - Subida de Imagen de Comida

```
+-------------+     +---------------+     +-----------------+
|             |     |               |     |                 |
|  Paciente   +---->+  Formulario   +---->+  Controlador    |
|  Dashboard  |     |  de Subida    |     |  patientCtrl    |
+-------------+     +---------------+     +-------+---------+
                                                 |
                                                 v
+-----------------+     +---------------+     +----------------+
|                 |     |               |     |                |
|   Supabase      <-----+   Modelo      <-----+ multer (temp   |
|   Storage       |     |  FoodEntry    |     |  storage)      |
+--------+--------+     +---------------+     +----------------+
         |
         v
+-----------------+     +---------------+     +----------------+
|                 |     |               |     |                |
|  URL imagen     +---->+  Base de      +---->+  Historial de  |
|  almacenada     |     |  datos        |     |  comidas       |
+-----------------+     +---------------+     +----------------+
```

## Estructura de Archivos Detallada

```
server.js                      # Punto de entrada de la aplicación
  ├── .env                     # Variables de entorno
  │
  ├── config/
  │     └── supabase.js        # Configuración de la conexión a Supabase
  │
  ├── routes/
  │     ├── mainRoutes.js      # Rutas públicas
  │     ├── authRoutes.js      # Rutas de autenticación
  │     ├── patientRoutes.js   # Rutas para pacientes
  │     └── doctorRoutes.js    # Rutas para médicos
  │
  ├── controllers/
  │     ├── authController.js  # Controlador de autenticación
  │     ├── patientController.js # Controlador para funciones de paciente
  │     └── doctorController.js  # Controlador para funciones de médico
  │
  ├── models/
  │     ├── UserAuth.js        # Modelo para gestión de usuarios y auth
  │     ├── Profile.js         # Modelo para gestión de perfiles
  │     └── FoodEntry.js       # Modelo para entradas de comida
  │
  ├── middleware/
  │     └── authMiddleware.js  # Middleware de autenticación y autorización
  │
  ├── views/                   # Archivos HTML procesados con EJS
  │     ├── layouts/main.html  # Layout principal
  │     │
  │     ├── index.html         # Página de inicio
  │     ├── contact.html       # Página de contacto
  │     ├── 404.html           # Página de error 404
  │     │
  │     ├── auth/              # Vistas de autenticación
  │     │     ├── login.html
  │     │     └── register.html
  │     │
  │     ├── patient/           # Vistas para pacientes
  │     │     ├── dashboard.html
  │     │     └── upload.html
  │     │
  │     └── doctor/            # Vistas para médicos
  │           └── dashboard.html
  │
  ├── public/                  # Archivos estáticos
  │     ├── css/styles.css
  │     ├── js/main.js
  │     └── img/
  │           ├── logo.png
  │           ├── demo/        # Imágenes de demostración
  │           └── temp/        # Almacenamiento temporal de archivos
  │
  ├── utils/
  │     └── generateSecret.js  # Utilidad para generar secretos seguros
  │
  └── database/
        └── init.sql           # Script SQL para inicializar la base de datos
```