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

## Diagrama de Clases (POO)

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

## Estructura de Archivos Detallada

```mermaid
graph TD
    Raiz[whatyoueat/] --> Server[server.js]
    Raiz --> Package[package.json]
    Raiz --> License[LICENSE]
    Raiz --> Readme[README.md]
    
    Raiz --> Config[config/]
    Config --> SupabaseConfig[supabase.js]
    
    Raiz --> Controllers[controllers/]
    Controllers --> AuthController[authController.js]
    Controllers --> ContactController[contactController.js]
    Controllers --> DoctorController[doctorController.js]
    Controllers --> PatientController[Patient/]
    PatientController --> Dashboard[dashboardController.js]
    PatientController --> EntryDetail[entryDetailController.js]
    PatientController --> FoodHistory[foodHistoryController.js]
    PatientController --> IndexCtrl[index.js]
    PatientController --> UploadController[uploadController.js]
    
    Raiz --> Database[database/]
    Database --> InitSQL[init.sql]
    
    Raiz --> Docs[docs/]
    Docs --> Diagrams[diagrams.md]
    Docs --> Patterns[patterns.md]
    Docs --> Validation[validation.md]
    
    Raiz --> Middleware[middleware/]
    Middleware --> AuthMiddleware[authMiddleware.js]
    Middleware --> PatientMiddleware[patient/]
    PatientMiddleware --> OwnerMiddleware[entryOwnershipMiddleware.js]
    
    Raiz --> Models[models/]
    Models --> DoctorPatient[DoctorPatient.js]
    Models --> FoodEntry[FoodEntry.js]
    Models --> Profile[Profile.js]
    Models --> UserAuth[UserAuth.js]
    
    Raiz --> Public[public/]
    Public --> CSS[css/]
    CSS --> Styles[styles.css]
    Public --> Img[img/]
    Img --> EmptyPlate[empty-plate.svg]
    Img --> HeroImage[hero-image.png]
    Img --> Logo[logo.webp]
    Public --> JS[js/]
    JS --> Auth[auth.js]
    JS --> EntryDetail[entry-detail.js]
    JS --> History[history.js]
    JS --> Main[main.js]
    JS --> Upload[upload.js]
    JS --> Validators[validators/]
    Validators --> ContactFormValidator[contactFormValidator.js]
    Validators --> RegisterFormValidator[registerFormValidator.js]
    
    Raiz --> Routes[routes/]
    Routes --> AuthRoutes[authRoutes.js]
    Routes --> DoctorRoutes[doctorRoutes.js]
    Routes --> MainRoutes[mainRoutes.js]
    Routes --> PatientRoutes[patientRoutes.js]
    
    Raiz --> Utils[utils/]
    Utils --> ErrorHandler[errorHandler.js]
    Utils --> GenerateSecret[generateSecret.js]
    Utils --> Validators[validators/]
    Validators --> FoodEntryValidator[foodEntryValidator.js]
    
    Raiz --> Views[views/]
    Views --> Contact[contact.html]
    Views --> Index[index.html]
    Views --> Profile[profile.html]
    Views --> Auth[auth/]
    Auth --> Login[login.html]
    Auth --> Register[register.html]
    Views --> Doctor[doctor/]
    Doctor --> DoctorDashboard[dashboard.html]
    Doctor --> PatientHistory[patient-history.html]
    Views --> Errors[errors/]
    Errors --> Error404[404.html]
    Errors --> Error500[500.html]
    Views --> Layouts[layouts/]
    Layouts --> ErrorLayout[error.html]
    Layouts --> MainLayout[main.html]
    Views --> Patient[patient/]
    Patient --> PatientDashboard[dashboard.html]
    Patient --> EditEntry[edit-entry.html]
    Patient --> EntryDetail[entry-detail.html]
    Patient --> History[history.html]
    Patient --> Upload[upload.html]
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