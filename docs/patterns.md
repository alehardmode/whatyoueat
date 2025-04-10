# Patrones de Diseño en WhatYouEat

## Patrón MVC (Modelo-Vista-Controlador)

WhatYouEat implementa el patrón de arquitectura de software MVC, que separa los datos y la lógica de negocio de la interfaz de usuario y el flujo de control.

### Componentes del MVC

#### 1. Modelo

Los modelos representan la capa de datos y lógica de negocio de la aplicación:

- **Ubicación**: Directorio `/models`
- **Archivos principales**:
  - `UserAuth.js`: Gestiona la autenticación de usuarios con Supabase Auth
  - `Profile.js`: Maneja la información de perfil de los usuarios
  - `FoodEntry.js`: Gestiona las entradas de comida de los pacientes

Los modelos encapsulan la lógica para:
- Interactuar con la base de datos (Supabase)
- Validar datos
- Aplicar reglas de negocio

**Ejemplo de implementación**:

```javascript
// models/FoodEntry.js
const { supabase } = require('../config/supabase');
class FoodEntry {
  // Obtener entradas de comida por ID de usuario
  static async getHistoryByUserId(userId, date = null) {
    try {
      let query = supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Si se proporciona una fecha, filtrar por esa fecha
      if (date) {
        const startOfDay = dayjs(date).startOf('day').toISOString();
        const endOfDay = dayjs(date).endOf('day').toISOString();
        
        query = query
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { success: true, entries: data };
    } catch (error) {
      console.error('Error al obtener historial de comidas:', error);
      return { success: false, error: error.message };
    }
  }
}
module.exports = FoodEntry;
```

#### 2. Vista

Las vistas representan la interfaz de usuario de la aplicación:

- **Ubicación**: Directorio `/views`
- **Tecnología**: Archivos HTML procesados con EJS (Embedded JavaScript)
- **Configuración**: Aunque tienen extensión `.html`, se procesan con EJS mediante `app.engine('html', require('ejs').renderFile)`
- **Estructura**:
  - `/layouts`: Plantillas base reutilizables
  - `/auth`: Vistas relacionadas con autenticación (login.html, register.html)
  - `/patient`: Vistas específicas para pacientes (dashboard.html, upload.html)
  - `/doctor`: Vistas específicas para médicos (dashboard.html)

Las vistas:
- Reciben datos de los controladores
- Renderizan la interfaz de usuario
- No contienen lógica de negocio compleja

#### 3. Controlador

Los controladores manejan el flujo de la aplicación:

- **Ubicación**: Directorio `/controllers`
- **Archivos principales**:
  - `authController.js`: Maneja la autenticación
  - `patientController.js`: Controla las funcionalidades para pacientes
  - `doctorController.js`: Controla las funcionalidades para médicos
  - `contactController.js`: Gestiona el formulario de contacto

Los controladores:
- Reciben solicitudes del usuario (rutas)
- Interactúan con los modelos para obtener o modificar datos
- Seleccionan la vista adecuada para representar los datos
- Pasan los datos necesarios a las vistas

**Ejemplo de implementación**:

```javascript
// controllers/patientController.js
exports.getHistory = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    const result = await FoodEntry.getHistoryByUserId(userId, date);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    res.render('patient/history', {
      title: 'Historial de Comidas',
      user: req.session.user,
      entries: result.entries,
      date: dayjs(date).format('YYYY-MM-DD'),
      dayjs
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    req.flash('error_msg', 'Error al cargar el historial');
    res.redirect('/patient/dashboard');
  }
};
```

### Flujo de funcionamiento del MVC

1. El usuario realiza una acción en la interfaz (ejemplo: subir una foto de comida)
2. La solicitud es recibida por el enrutador (`routes/patientRoutes.js`)
3. El enrutador dirige la solicitud al controlador apropiado (`patientController.js`)
4. El controlador:
   - Procesa la solicitud y extrae los datos (archivo, formulario)
   - Interactúa con los modelos necesarios (`FoodEntry.js`)
   - Gestiona la lógica de almacenamiento en Supabase
   - Establece mensajes flash para feedback
   - Redirige o renderiza la vista apropiada
5. La vista se muestra al usuario con los datos actualizados

## Patrón Singleton

Para la conexión a la base de datos (Supabase), implementamos un patrón Singleton:

```javascript
// config/supabase.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

// Cliente estándar (para operaciones normales)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

module.exports = { supabase };
```

Esto asegura que solo exista una instancia de la conexión a la base de datos en toda la aplicación.

## Patrón Middleware

En Express, utilizamos el patrón Middleware para procesar solicitudes HTTP:

```javascript
// middleware/authMiddleware.js
exports.isAuthenticated = (req, res, next) => {
  if (req.session.isLoggedIn && req.session.user) {
    return next();
  }
  
  req.flash('error_msg', 'Por favor inicia sesión para acceder a esta página');
  res.redirect('/auth/login');
};

exports.isDoctor = (req, res, next) => {
  if (req.session.isLoggedIn && req.session.user && req.session.user.role === 'doctor') {
    return next();
  }
  
  req.flash('error_msg', 'No tienes permisos para acceder a esta página');
  res.redirect('/');
};
```

Los middleware son funciones que tienen acceso al objeto de solicitud, al objeto de respuesta y a la siguiente función middleware en el ciclo de solicitud/respuesta de la aplicación.

## Patrón Repository

Para el acceso a datos, implementamos un patrón Repository que abstrae la interacción con la base de datos:

```javascript
// models/Profile.js
static async getAllPatients() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient');
    
    if (error) throw error;
    
    return { success: true, patients: data };
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return { success: false, error: error.message };
  }
}
```

Este patrón permite centralizar la lógica de acceso a datos, facilitando el mantenimiento y la reutilización de código.

## Patrón Observer (Flash Messages)

Para la comunicación entre solicitudes HTTP, implementamos un patrón Observer utilizando flash messages:

```javascript
// En los controladores
req.flash('success_msg', '¡Registro exitoso!');
res.redirect('/auth/login');

// En las vistas (usando EJS dentro de archivos HTML)
<% if(success_msg != ''){ %>
  <div class="alert alert-success alert-dismissible fade show">
    <%= success_msg %>
    <button type="button" class="close-alert" aria-label="Cerrar">×</button>
  </div>
<% } %>
```

Este patrón permite que los mensajes de estado persistan entre redirecciones HTTP, proporcionando feedback importante al usuario.

## Patrón Strategy

Implementamos el patrón Strategy para manejar diferentes roles de usuarios (pacientes y médicos):

```javascript
// routes/mainRoutes.js
router.get('/dashboard', (req, res) => {
  // Estrategia basada en rol de usuario
  if (req.session.user.role === 'doctor') {
    return res.redirect('/doctor/dashboard');
  } else if (req.session.user.role === 'patient') {
    return res.redirect('/patient/dashboard');
  } else {
    return res.redirect('/');
  }
});
```

Este patrón permite adaptar el comportamiento de la aplicación según el contexto (en este caso, el rol del usuario), manteniendo el código limpio y modular.