# Diagramas de WhatYouEat

## Arquitectura General de la Aplicación

```mermaid
flowchart TB
    Cliente["CLIENTE
    (Navegador)"] ---|HTTP Requests| Express["EXPRESS APP"]
    Servidor["SERVIDOR
    (Node.js)"] ---|API Requests| Express
    Express --> Rutas["RUTAS"]
    Rutas --> Controladores["CONTROLADORES"]
    Controladores --> Modelos["MODELOS"]
    Controladores --> Vistas["VISTAS"]
    Modelos ---|Consultas| BaseDatos["BASE DATOS
    (Supabase)"]
```

## Diagrama de Flujo de Datos

```mermaid
flowchart TD
    Cliente["Navegador
    Cliente"] -->|HTTP| Express["Express
    Server"]
    Express -->|Rutas| Middleware["Middleware"]
    Middleware -->|Autorización| Solicitud["Solicitud
    Validada"]
    Solicitud --> Controlador["Controlador"]
    Controlador -->|Render| Vista["Vista
    (HTML+EJS)"]
    Controlador -->|Manipulación de datos| Modelo["Modelo"]
    Modelo -->|CRUD| Supabase["Supabase
    Database & Storage"]
    Vista -->|HTML, CSS, JS| Interface["Interfaz
    Usuario"]
```

*Nota: Este diagrama representa la arquitectura conceptual. Los nombres específicos de archivos y clases pueden variar ligeramente en la implementación.*

## Diagrama de Clases (POO)

*Nota: Este diagrama es una representación conceptual de alto nivel. Los nombres de las clases pueden no coincidir exactamente con los nombres de los archivos o módulos en el código fuente. Por ejemplo, `AuthRouter` representa la lógica de rutas en `routes/authRoutes.js` y los controladores asociados en `controllers/auth/`.*

```mermaid
classDiagram
        Server o-- Router : contains
        Server o-- Controller : uses
        Controller o-- Model : uses
        Router <|-- AuthRouter : extends
        Router <|-- MainRouter : extends
        Controller <|-- AuthCtrl : extends
        Controller <|-- PatientCtrl : extends
        Controller <|-- ContactCtrl : extends
        Controller <|-- DoctorCtrl : extends
        Model <|-- FoodEntryModel : extends
        class Server {
                -app: Express
                -port: number
                -middlewares: Array
                +start()
                +stop()
        }
        class Router {
                -routes: Array
                +registerRoute()
                +getRoutes()
        }
        class AuthRouter {
                +login()
                +logout()
        }
        class MainRouter {
                +home()
                +about()
        }
        class Controller {
                -model: Model
                +handleRequest()
        }
        class AuthCtrl {
                +login()
                +register()
                +logout()
        }
        class PatientCtrl {
                +dashboard()
                +upload()
                +history()
        }
        class ContactCtrl {
                +getContactForm()
                +submitContact()
        }
        class DoctorCtrl {
                +getDashboard()
                +getPatient()
                +getHistory()
        }
        class Model {
                -db: SupabaseClient
                +create()
                +read()
                +update()
                +delete()
        }
        class FoodEntryModel {
                +create()
                +getHistoryById()
                +update()
                +delete()
        }
```

## Diagrama Entidad-Relación (Base de Datos)

```mermaid
erDiagram
    auth_users {
        uuid id PK
        varchar email
        timestamp created_at
    }
    profiles {
        uuid id PK,FK
        varchar name
        user_role role
        timestamp created_at
        timestamp updated_at
    }
    food_entries {
        uuid id PK
        uuid user_id FK
        varchar name
        text description
        varchar meal_type
        timestamp meal_date
        text image_data
        text image_storage_path
        timestamp created_at
        timestamp updated_at
    }
    doctor_patient_relationships {
        uuid id PK
        uuid doctor_id FK
        uuid patient_id FK
        relationship_status status
        timestamp created_at
        timestamp updated_at
    }
    auth_users ||--|| profiles : "ID referencia"
    profiles ||--o{ food_entries : "Un usuario puede tener muchas entradas"
    profiles ||--o{ doctor_patient_relationships : "Un médico puede tener muchos pacientes"
    profiles ||--o{ doctor_patient_relationships : "Un paciente puede tener muchos médicos"
```

## Flujo de Usuario - Subida de Imagen de Comida

```mermaid
flowchart LR
    Dashboard["Paciente
    Dashboard"] --> FormSubida["Formulario
    de Subida"]
    FormSubida --> PatientCtrl["Controlador
    patientCtrl"]
    PatientCtrl --> Multer["Multer
    (procesamiento)"]
    Multer --> Modelo["Modelo
    FoodEntry"]
    Modelo --> Storage["Supabase
    Storage"]
    Storage --> URLImagen["URL imagen
    almacenada"]
    URLImagen --> BaseDatos["Base de
    datos"]
    BaseDatos --> Historial["Historial de
    comidas"]
```

## Flujo de Autenticación y Sesiones

```mermaid
flowchart LR
    FormLogin["Formulario
    Login"] --> AuthCtrl["authController"]
    AuthCtrl --> UserAuth["UserAuth
    Model"]
    AuthCtrl --> Session["express-session"]
    UserAuth --> SupabaseAuth["Supabase
    Auth API"]
```