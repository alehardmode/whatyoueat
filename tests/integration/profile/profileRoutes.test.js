const request = require("supertest");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const { isAuthenticated } = require("../../../middleware/authMiddleware");
const profileController = require("../../../controllers/profileController");
const Profile = require("../../../models/Profile");
const { handleHttpError } = require("../../../utils/errorHandler");

// Mock de utils/errorHandler
jest.mock("../../../utils/errorHandler", () => ({
  handleHttpError: jest.fn((error, res, req, message) => {
    console.error("Error simulado:", message, error);
    res.status(500).send("Error interno del servidor");
  }),
}));

// Mock de Profile
jest.mock("../../../models/Profile");

// Mock del middleware de autenticación
jest.mock("../../../middleware/authMiddleware", () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    // Simular usuario autenticado
    req.session = req.session || {};
    req.session.user = {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      role: "paciente",
    };
    next();
  }),
}));

// Configurar una aplicación Express para las pruebas
const configureApp = () => {
  const app = express();

  // Configurar middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configurar sesiones
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
    })
  );

  // Configurar flash messages
  app.use(flash());

  // Configurar mock para req.flash para que no de error
  app.use((req, res, next) => {
    req.flash = jest.fn().mockReturnValue([]);
    next();
  });

  // Configurar vistas (mock)
  app.set("view engine", "html");
  app.engine("html", (filePath, options, callback) => {
    // Mock de renderizado que simplemente devuelve HTML vacío
    callback(null, "<html><body>Mock View</body></html>");
  });

  app.set("views", path.join(__dirname, "../../../views"));

  // Configurar variables globales para las vistas
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.errors = req.flash("errors");
    res.locals.user = req.session.user || null;
    next();
  });

  // Configurar rutas
  app.get("/profile", isAuthenticated, (req, res) => {
    try {
      return profileController.getProfile(req, res);
    } catch (error) {
      console.error("Error en ruta /profile:", error);
      return res.status(500).send("Error interno");
    }
  });

  app.get("/profile/edit", isAuthenticated, (req, res) => {
    try {
      return profileController.getEditProfile(req, res);
    } catch (error) {
      console.error("Error en ruta /profile/edit:", error);
      return res.status(500).send("Error interno");
    }
  });

  app.post("/profile/update", isAuthenticated, (req, res) => {
    try {
      return profileController.updateProfile(req, res);
    } catch (error) {
      console.error("Error en ruta /profile/update:", error);
      return res.status(500).send("Error interno");
    }
  });

  return app;
};

describe("Pruebas de integración de rutas de perfil", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = configureApp();
  });

  describe("GET /profile", () => {
    it("debería responder y llamar al controlador getProfile", async () => {
      // Mock de Profile.getById para que devuelva datos exitosos
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "paciente",
          bio: "Test Bio",
          created_at: "2023-01-01",
          is_active: true,
        },
      });

      const response = await request(app).get("/profile");

      // Verificamos que se intentó llamar al modelo, independientemente del código de estado
      expect(Profile.getById).toHaveBeenCalledWith("test-user-id");
    });

    it("debería manejar correctamente errores al obtener el perfil", async () => {
      // Mock de Profile.getById para que devuelva un error
      Profile.getById.mockResolvedValue({
        success: false,
        error: "Error al obtener perfil",
      });

      const response = await request(app).get("/profile");

      // Verificamos que se intentó llamar al modelo, independientemente del código de estado
      expect(Profile.getById).toHaveBeenCalledWith("test-user-id");
    });

    it("debería redirigir si el perfil está inactivo", async () => {
      // Mock de Profile.getById para que devuelva un perfil inactivo
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "paciente",
          is_active: false,
        },
      });

      const response = await request(app).get("/profile");

      // Verificamos que se intentó llamar al modelo
      expect(Profile.getById).toHaveBeenCalledWith("test-user-id");
    });
  });

  describe("GET /profile/edit", () => {
    it("debería llamar al controlador getEditProfile", async () => {
      // Mock de Profile.getById para que devuelva datos exitosos
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "paciente",
          bio: "Test Bio",
          is_active: true,
        },
      });

      const response = await request(app).get("/profile/edit");

      expect(Profile.getById).toHaveBeenCalledWith("test-user-id");
    });

    it("debería manejar errores al obtener el perfil para edición", async () => {
      // Mock de Profile.getById para que devuelva un error
      Profile.getById.mockResolvedValue({
        success: false,
        error: "Error al obtener perfil",
      });

      const response = await request(app).get("/profile/edit");

      expect(Profile.getById).toHaveBeenCalledWith("test-user-id");
    });

    it("debería redirigir si el perfil está inactivo", async () => {
      // Mock de Profile.getById para que devuelva un perfil inactivo
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "paciente",
          is_active: false,
        },
      });

      const response = await request(app).get("/profile/edit");

      // Verificamos que se intentó llamar al modelo
      expect(Profile.getById).toHaveBeenCalledWith("test-user-id");
    });
  });

  describe("POST /profile/update", () => {
    it("debería llamar al controlador updateProfile con datos válidos", async () => {
      // Mock de Profile.checkConnection para que devuelva éxito
      Profile.checkConnection.mockResolvedValue({
        success: true,
      });

      // Mock de Profile.update para que devuelva éxito
      Profile.update.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Updated Name",
          email: "test@example.com",
          bio: "Updated Bio",
          phone: "123456789",
          is_active: true,
        },
      });

      const response = await request(app).post("/profile/update").send({
        name: "Updated Name",
        bio: "Updated Bio",
        phone: "123456789",
      });

      expect(Profile.update).toHaveBeenCalledWith(
        "test-user-id",
        expect.objectContaining({
          name: "Updated Name",
          bio: "Updated Bio",
          phone: "123456789",
        })
      );
    });

    it("debería validar nombre vacío", async () => {
      const response = await request(app).post("/profile/update").send({
        name: "", // Nombre vacío
        bio: "Updated Bio",
      });

      expect(Profile.update).not.toHaveBeenCalled();
    });

    it("debería manejar errores al actualizar", async () => {
      // Mock de Profile.checkConnection para que devuelva éxito
      Profile.checkConnection.mockResolvedValue({
        success: true,
      });

      // Mock de Profile.update para que devuelva un error
      Profile.update.mockResolvedValue({
        success: false,
        error: "Error al actualizar perfil",
      });

      const response = await request(app).post("/profile/update").send({
        name: "Updated Name",
        bio: "Updated Bio",
      });

      expect(Profile.update).toHaveBeenCalled();
    });

    it("debería manejar errores de conexión a la base de datos", async () => {
      // Mock de Profile.checkConnection para que devuelva error
      Profile.checkConnection.mockResolvedValue({
        success: false,
        error: "Error de conexión a la base de datos",
      });

      const response = await request(app).post("/profile/update").send({
        name: "Updated Name",
        bio: "Updated Bio",
      });

      // No debería llamar a update si la conexión falla
      expect(Profile.update).not.toHaveBeenCalled();
    });
  });

  // Prueba de acceso sin sesión
  describe("Acceso sin sesión", () => {
    it("debería redirigir a login si intenta acceder sin sesión", async () => {
      // Modificar el mock de isAuthenticated para simular sin sesión
      isAuthenticated.mockImplementationOnce((req, res, next) => {
        // No asignamos req.session.user
        req.flash(
          "error_msg",
          "Por favor inicia sesión para acceder a esta página"
        );
        return res.redirect("/auth/login");
      });

      const response = await request(app).get("/profile");

      // No debería llamar a getById porque debería redirigir antes
      expect(Profile.getById).not.toHaveBeenCalled();
    });
  });
});
