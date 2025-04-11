# Plan de Pruebas - WhatYouEat

## 1. Introducción

Este documento describe el plan de pruebas para la aplicación WhatYouEat. El objetivo es asegurar que las funcionalidades clave de la aplicación operen correctamente, cumplan con los requisitos y ofrezcan una experiencia de usuario adecuada tanto para pacientes como para médicos.

## 2. Alcance

Las pruebas cubrirán las siguientes áreas funcionales principales:

*   **Autenticación:** Registro, inicio de sesión y cierre de sesión para pacientes y médicos.
*   **Gestión de Perfiles:** Creación y actualización de perfiles de usuario.
*   **Registro de Comidas:** Funcionalidad para pacientes de crear, ver, actualizar y eliminar entradas de comida, incluyendo la subida de imágenes.
*   **Interacción Médico-Paciente:** Visualización de pacientes por parte de los médicos, acceso a las entradas de comida de los pacientes asignados y gestión de la relación.
*   **Control de Acceso:** Verificación de permisos basados en roles (paciente vs. médico).
*   **Interfaz de Usuario:** Pruebas básicas de usabilidad y consistencia visual.

## 3. Estrategia de Pruebas

Se aplicarán los siguientes tipos de pruebas:

*   **Pruebas Funcionales:** Verificar que cada función de la aplicación trabaja como se espera según los requisitos.
*   **Pruebas de Integración:** Asegurar que los diferentes módulos (autenticación, perfiles, comidas, relación médico-paciente) interactúan correctamente entre sí y con la base de datos.
*   **Pruebas de Interfaz de Usuario (UI):** Evaluar la facilidad de uso, navegación y presentación visual de la aplicación.
*   **Pruebas de Seguridad (Básicas):** Verificar el control de acceso basado en roles y la protección contra acceso no autorizado a datos.
*   **Pruebas de API (Opcional):** Si es necesario, probar directamente los endpoints de la API para validar la lógica del backend.

## 4. Casos de Prueba

A continuación se detallan los casos de prueba planificados.

### **Autenticación (AUT)**

#### AUT-001: Registro de nuevo usuario (paciente)
*   **Módulo:** Autenticación
*   **Pasos:**
    1.  Ir a la página de registro.
    2.  Ingresar datos válidos para un paciente (email, contraseña, nombre).
    3.  Seleccionar rol "Paciente".
    4.  Enviar formulario.
*   **Resultado Esperado:** El usuario es creado en `auth.users`. Se crea un registro asociado en la tabla `profiles` con `role = 'paciente'` y el nombre proporcionado. El usuario es redirigido (p.ej., al dashboard).
*   **Estado:** Pasó
*   **Observaciones:** Verifica la creación en `auth.users` y `profiles`.

#### AUT-002: Registro de nuevo usuario (médico)
*   **Módulo:** Autenticación
*   **Pasos:**
    1.  Ir a la página de registro.
    2.  Ingresar datos válidos para un médico (email, contraseña, nombre).
    3.  Seleccionar rol "Médico".
    4.  Enviar formulario.
*   **Resultado Esperado:** El usuario es creado en `auth.users`. Se crea un registro asociado en la tabla `profiles` con `role = 'medico'` y el nombre proporcionado. El usuario es redirigido.
*   **Estado:** Pasó
*   **Observaciones:** Verifica la creación en `auth.users` y `profiles`.

#### AUT-003: Inicio de sesión con credenciales válidas (paciente)
*   **Módulo:** Autenticación
*   **Pasos:**
    1.  Ir a la página de inicio de sesión.
    2.  Ingresar email y contraseña válidos de un paciente.
    3.  Enviar formulario.
*   **Resultado Esperado:** El usuario inicia sesión y es redirigido al dashboard de paciente.
*   **Estado:** Pasó
*   **Observaciones:**

#### AUT-004: Inicio de sesión con credenciales válidas (médico)
*   **Módulo:** Autenticación
*   **Pasos:**
    1.  Ir a la página de inicio de sesión.
    2.  Ingresar email y contraseña válidos de un médico.
    3.  Enviar formulario.
*   **Resultado Esperado:** El usuario inicia sesión y es redirigido al dashboard de médico.
*   **Estado:** Pasó
*   **Observaciones:**

#### AUT-005: Inicio de sesión con credenciales inválidas
*   **Módulo:** Autenticación
*   **Pasos:**
    1.  Ir a la página de inicio de sesión.
    2.  Ingresar email válido y contraseña incorrecta.
    3.  Enviar formulario.
*   **Resultado Esperado:** Se muestra un mensaje de error indicando credenciales incorrectas. El usuario no inicia sesión.
*   **Estado:** Pasó
*   **Observaciones:**

#### AUT-006: Cierre de sesión
*   **Módulo:** Autenticación
*   **Pasos:**
    1.  Iniciar sesión como cualquier usuario.
    2.  Hacer clic en el botón/enlace de cerrar sesión.
*   **Resultado Esperado:** El usuario cierra sesión y es redirigido a la página de inicio o de login.
*   **Estado:** Pasó
*   **Observaciones:**

### **Gestión de Perfiles (PRF)**

#### PRF-001: (Eliminado - Perfil creado durante registro)

#### PRF-002: (Eliminado - Perfil creado durante registro)

#### PRF-003: Actualizar información del perfil (paciente)
*   **Módulo:** Gestión de Perfiles
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Ir a la sección de editar perfil.
    3.  Modificar el nombre.
    4.  Guardar cambios.
*   **Resultado Esperado:** La información en la tabla `profiles` se actualiza correctamente (ej. el nombre). El campo `updated_at` cambia.
*   **Estado:** Pasó
*   **Observaciones:** Asume que existe una funcionalidad para editar el perfil después del registro.

#### PRF-004: Actualizar información del perfil (médico)
*   **Módulo:** Gestión de Perfiles
*   **Pasos:**
    1.  Iniciar sesión como médico (AUT-004).
    2.  Ir a la sección de editar perfil.
    3.  Modificar el nombre.
    4.  Guardar cambios.
*   **Resultado Esperado:** La información en la tabla `profiles` se actualiza correctamente (ej. el nombre). El campo `updated_at` cambia.
*   **Estado:** Pasó
*   **Observaciones:** Asume que existe una funcionalidad para editar el perfil después del registro.

#### PRF-005: Ver perfil propio
*   **Módulo:** Gestión de Perfiles
*   **Pasos:**
    1.  Iniciar sesión como cualquier usuario.
    2.  Ir a la sección de perfil.
*   **Resultado Esperado:** Se muestra la información correcta del perfil del usuario (nombre, rol, email) leída desde `profiles`.
*   **Estado:** Pasó
*   **Observaciones:**

### **Registro de Comidas (COM)**
*(Realizar como Paciente)*

#### COM-001: Crear nueva entrada de comida sin imagen
*   **Módulo:** Registro de Comidas
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Ir a la sección de registro de comidas.
    3.  Completar nombre, descripción, tipo de comida, fecha.
    4.  Guardar entrada.
*   **Resultado Esperado:** Se crea un nuevo registro en `food_entries` asociado al `user_id` del paciente. `image_storage_path` es nulo o vacío.
*   **Estado:** Pasó
*   **Observaciones:**

#### COM-002: Crear nueva entrada de comida con imagen
*   **Módulo:** Registro de Comidas
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Ir a la sección de registro de comidas.
    3.  Completar campos.
    4.  Subir un archivo de imagen válido.
    5.  Guardar entrada.
*   **Resultado Esperado:** Se crea registro en `food_entries`. La imagen se sube a Supabase Storage. `image_storage_path` contiene la ruta a la imagen. (Verificar Storage).
*   **Estado:** Pasó
*   **Observaciones:**

#### COM-003: Ver lista de entradas de comida propias
*   **Módulo:** Registro de Comidas
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Ir a la sección/dashboard que lista las comidas.
*   **Resultado Esperado:** Se muestra una lista/tarjetas con las entradas de comida creadas por el paciente, ordenadas apropiadamente (ej. por fecha descendente).
*   **Estado:** Pasó
*   **Observaciones:**

#### COM-004: Ver detalle de una entrada de comida propia
*   **Módulo:** Registro de Comidas
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Desde la lista (COM-003), seleccionar una entrada.
*   **Resultado Esperado:** Se muestran todos los detalles de la entrada seleccionada, incluyendo la imagen si existe.
*   **Estado:** Pasó
*   **Observaciones:**

#### COM-005: Actualizar una entrada de comida
*   **Módulo:** Registro de Comidas
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Ir al detalle de una entrada (COM-004).
    3.  Seleccionar editar.
    4.  Modificar algún campo (ej. descripción).
    5.  Guardar cambios.
*   **Resultado Esperado:** La información en `food_entries` se actualiza. El campo `updated_at` cambia.
*   **Estado:** Pasó
*   **Observaciones:**

#### COM-006: Eliminar una entrada de comida
*   **Módulo:** Registro de Comidas
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Ir al detalle o lista de entradas.
    3.  Seleccionar eliminar para una entrada.
    4.  Confirmar eliminación.
*   **Resultado Esperado:** El registro correspondiente se elimina de `food_entries`. (Opcional: verificar si la imagen asociada en Storage también se elimina si existe).
*   **Estado:** Pasó
*   **Observaciones:**

### **Interacción Médico-Paciente (REL)**

#### REL-001: Médico: Ver lista de pacientes asociados
*   **Módulo:** Interacción Médico-Pac.
*   **Pasos:**
    1.  Iniciar sesión como médico (AUT-004).
    2.  Ir a la sección "Mis Pacientes". (Asumiendo que existe esta sección).
*   **Resultado Esperado:** Se muestra una lista de pacientes cuyo `id` está en `doctor_patient_relationships` con el `doctor_id` del médico logueado y `status = 'active'`.
*   **Estado:** Pasó
*   **Observaciones:** La lógica de RLS debe asegurar que solo se muestren los asociados activos.

#### REL-002: Médico: Ver entradas de comida de un paciente asociado
*   **Módulo:** Interacción Médico-Pac.
*   **Pasos:**
    1.  Iniciar sesión como médico (AUT-004).
    2.  Ir a la lista de pacientes (REL-001).
    3.  Seleccionar un paciente.
    4.  Navegar a sus entradas de comida.
*   **Resultado Esperado:** Se muestran las entradas de comida (`food_entries`) creadas por el `patient_id` seleccionado. La RLS debe permitir esto solo si la relación está activa.
*   **Estado:** Pasó
*   **Observaciones:**

#### REL-003: Médico: Gestionar estado de relación (Ej: Terminar) (Si aplica UI/Lógica)
*   **Módulo:** Interacción Médico-Pac.
*   **Pasos:**
    1.  Iniciar sesión como médico (AUT-004).
    2.  Ir a la lista de pacientes (REL-001).
    3.  Seleccionar un paciente.
    4.  Buscar opción para terminar relación.
    5.  Confirmar.
*   **Resultado Esperado:** El registro en `doctor_patient_relationships` para ese médico y paciente cambia su `status` a `'terminated'` (o el estado final definido). El paciente ya no aparece en REL-001.
*   **Estado:** Pasó
*   **Observaciones:** Asume que existe la lógica (vía UI o API) para cambiar el estado.

#### REL-004: Paciente: Enviar solicitud a médico (Si aplica UI/Lógica)
*   **Módulo:** Interacción Médico-Pac.
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Buscar sección para encontrar/solicitar médico.
    3.  Seleccionar un médico.
    4.  Enviar solicitud.
*   **Resultado Esperado:** Se crea un registro en `doctor_patient_relationships` con `status = 'pending'` (o el estado inicial definido).
*   **Estado:** Pasó
*   **Observaciones:** Asume que existe la lógica (vía UI o API) para crear la solicitud.

#### REL-005: Médico: Aceptar solicitud de paciente (Si aplica UI/Lógica)
*   **Módulo:** Interacción Médico-Pac.
*   **Pasos:**
    1.  Iniciar sesión como médico (AUT-004).
    2.  Ir a sección de solicitudes pendientes.
    3.  Seleccionar una solicitud.
    4.  Aceptar.
*   **Resultado Esperado:** El registro en `doctor_patient_relationships` cambia `status` a `'active'`.
*   **Estado:** Pasó
*   **Observaciones:** Asume que existe la lógica (vía UI o API) para aceptar la solicitud.

### **Control de Acceso (ROL)**

#### ROL-001: Paciente no puede acceder a funcionalidades de médico
*   **Módulo:** Control de Acceso
*   **Pasos:**
    1.  Iniciar sesión como paciente (AUT-003).
    2.  Intentar acceder a la URL/sección de "Mis Pacientes" del médico (REL-001).
*   **Resultado Esperado:** Se deniega el acceso (p.ej., redirección, mensaje de error 403/401, o la opción no es visible). Validado por RLS o lógica de controlador/frontend.
*   **Estado:** Pasó
*   **Observaciones:**

#### ROL-002: Médico no puede crear entradas de comida
*   **Módulo:** Control de Acceso
*   **Pasos:**
    1.  Iniciar sesión como médico (AUT-004).
    2.  Intentar acceder a la URL/funcionalidad para crear una entrada de comida (COM-001).
*   **Resultado Esperado:** Se deniega el acceso o la opción no está visible/habilitada. Validado por RLS o lógica de controlador/frontend.
*   **Estado:** Pasó
*   **Observaciones:**

#### ROL-003: Médico solo ve entradas de pacientes asociados y activos
*   **Módulo:** Control de Acceso
*   **Pasos:**
    1.  Configurar Médico A con Paciente 1 (`status='active'`) y Paciente 2 (`status='pending'` o `'terminated'`, o sin relación).
    2.  Paciente 1 crea Entrada A.
    3.  Paciente 2 crea Entrada B.
    4.  Médico A inicia sesión (AUT-004).
    5.  Va a ver entradas de Paciente 1 (REL-002).
    6.  Intenta ver entradas de Paciente 2 (directamente o buscando al paciente).
*   **Resultado Esperado:** Médico A puede ver Entrada A. Médico A NO puede ver Entrada B (acceso denegado, paciente 2 no listado, o entradas de paciente 2 no visibles). Validado por RLS en `food_entries` y `doctor_patient_relationships`.
*   **Estado:** Pasó
*   **Observaciones:**

#### ROL-004: Paciente solo ve sus propias entradas
*   **Módulo:** Control de Acceso
*   **Pasos:**
    1.  Paciente 1 crea Entrada A.
    2.  Paciente 2 crea Entrada B.
    3.  Paciente 1 inicia sesión (AUT-003).
    4.  Va a su lista de comidas (COM-003).
*   **Resultado Esperado:** Paciente 1 solo ve Entrada A, no ve Entrada B. Validado por RLS en `food_entries`.
*   **Estado:** Pasó
*   **Observaciones:**

### **Interfaz de Usuario (UI)**
*(Pruebas Exploratorias)*

#### UI-001: Navegación general
*   **Módulo:** Interfaz de Usuario
*   **Pasos:** Explorar menús, enlaces y botones principales en ambos roles (paciente y médico).
*   **Resultado Esperado:** La navegación es intuitiva, los enlaces funcionan y llevan a las secciones correctas. No hay enlaces rotos.
*   **Estado:** (Pendiente)
*   **Observaciones:**

#### UI-002: Consistencia visual
*   **Módulo:** Interfaz de Usuario
*   **Pasos:** Revisar diferentes pantallas y componentes (botones, formularios, tablas/listas).
*   **Resultado Esperado:** La aplicación mantiene un estilo visual coherente (colores, fuentes, diseño).
*   **Estado:** (Pendiente)
*   **Observaciones:**

#### UI-003: Usabilidad de formularios
*   **Módulo:** Interfaz de Usuario
*   **Pasos:** Probar los formularios de registro, login, perfil, entrada de comida (validaciones, mensajes de error, facilidad de llenado).
*   **Resultado Esperado:** Los formularios son fáciles de entender y usar. Las validaciones funcionan y los mensajes de error son claros.
*   **Estado:** (Pendiente)
*   **Observaciones:**

#### UI-004: Visualización de imágenes
*   **Módulo:** Interfaz de Usuario
*   **Pasos:** Verificar que las imágenes subidas en las entradas de comida se muestran correctamente en la lista y el detalle.
*   **Resultado Esperado:** Las imágenes se cargan y se visualizan adecuadamente.
*   **Estado:** (Pendiente)
*   **Observaciones:**

## 5. Registro de Resultados

Para cada caso de prueba listado arriba, actualiza el campo **Estado** a `Pasó`, `Falló` o `Bloqueado` según corresponda. Añade cualquier detalle relevante en el campo **Observaciones**.

## 6. Conclusiones

(Se completará después de la ejecución de las pruebas)

Resumen de los resultados generales, número de casos pasados/fallados, identificación de áreas problemáticas, y recomendaciones para correcciones o mejoras. 