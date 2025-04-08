const {
  getProfile,
  getEditProfile,
  updateProfile,
} = require("../../../controllers/profileController");
const Profile = require("../../../models/Profile");

// Mock del modelo Profile
jest.mock("../../../models/Profile");

// Mock de utils/errorHandler
jest.mock("../../../utils/errorHandler", () => ({
  handleHttpError: jest.fn(),
}));

describe("Profile Controller", () => {
  // Configuración para cada prueba
  let req, res, Profile, getProfile, getEditProfile, updateProfile;

  beforeEach(() => {
    // Limpiar todos los mocks entre pruebas
    jest.clearAllMocks();

    // Configurar mocks
    req = {
      session: {
        user: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "paciente",
        },
      },
      flash: jest.fn(),
      body: {},
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Importar módulos frescos para cada prueba
    jest.isolateModules(() => {
      // Mock del modelo Profile
      jest.mock("../../../models/Profile", () => ({
        getById: jest.fn(),
        update: jest.fn(),
        checkConnection: jest.fn().mockResolvedValue({ success: true }),
      }));

      // Mock del errorHandler
      jest.mock("../../../utils/errorHandler", () => ({
        handleHttpError: jest.fn((error, res, req, message) => {
          req.flash("error_msg", message);
          res.redirect("/");
        }),
      }));

      // Importar el controlador real pero con las dependencias mockeadas
      const profileController = require("../../../controllers/profileController");
      Profile = require("../../../models/Profile");
      getProfile = profileController.getProfile;
      getEditProfile = profileController.getEditProfile;
      updateProfile = profileController.updateProfile;
    });
  });

  describe("getProfile", () => {
    it("debería renderizar el perfil con datos correctos", async () => {
      // Mock de Profile.getById para devolver éxito
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          bio: "Test Bio",
          is_active: true,
        },
      });

      // Llamar al controlador
      await getProfile(req, res);

      // Verificar que se llama al modelo con el ID correcto
      expect(Profile.getById).toHaveBeenCalledWith("test-user-id");

      // Verificar que se renderiza la vista con datos correctos
      expect(res.render).toHaveBeenCalledWith("profile", {
        title: "Mi Perfil",
        user: req.session.user,
        profile: expect.objectContaining({
          name: "Test User",
          email: "test@example.com",
        }),
      });
    });

    it("debería manejar el caso de error al obtener perfil", async () => {
      // Mock de Profile.getById para devolver error
      Profile.getById.mockResolvedValue({
        success: false,
        error: "Error al obtener perfil",
      });

      // Llamar al controlador
      await getProfile(req, res);

      // Verificar que se muestra mensaje de error
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "No se pudo cargar la información completa del perfil."
      );

      // Verificar que se renderiza la vista con perfil null
      expect(res.render).toHaveBeenCalledWith("profile", {
        title: "Mi Perfil",
        user: req.session.user,
        profile: null,
      });
    });

    it("debería redirigir a login si no hay sesión de usuario", async () => {
      // Simular que no hay sesión
      req.session = {};

      // Llamar al controlador
      await getProfile(req, res);

      // Verificar redirección a login
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "Sesión no válida. Por favor inicia sesión nuevamente."
      );
      expect(res.redirect).toHaveBeenCalledWith("/auth/login");
    });

    it("debería redirigir al inicio si el perfil está inactivo", async () => {
      // Mock de Profile.getById para devolver un perfil inactivo
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          is_active: false,
        },
      });

      // Llamar al controlador
      await getProfile(req, res);

      // Verificar redirección al inicio con mensaje
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "Este perfil ha sido desactivado."
      );
      expect(res.redirect).toHaveBeenCalledWith("/");
    });
  });

  describe("getEditProfile", () => {
    it("debería renderizar el formulario de edición con datos correctos", async () => {
      // Mock de Profile.getById para devolver éxito
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          bio: "Test Bio",
          is_active: true,
        },
      });

      // Llamar al controlador
      await getEditProfile(req, res);

      // Verificar que se renderizó la vista correcta
      expect(res.render).toHaveBeenCalledWith("edit-profile", {
        title: "Editar Perfil",
        user: req.session.user,
        profile: expect.objectContaining({
          name: "Test User",
          email: "test@example.com",
        }),
      });
    });

    it("debería redireccionar en caso de error al obtener perfil", async () => {
      // Mock de Profile.getById para devolver error
      Profile.getById.mockResolvedValue({
        success: false,
        error: "Error al obtener perfil",
      });

      // Llamar al controlador
      await getEditProfile(req, res);

      // Verificar que se muestra mensaje de error
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "No se pudo cargar la información del perfil."
      );

      // Verificar que redirecciona a la página de perfil
      expect(res.redirect).toHaveBeenCalledWith("/profile");
    });

    it("debería redirigir a login si no hay sesión de usuario", async () => {
      // Simular que no hay sesión
      req.session = {};

      // Llamar al controlador
      await getEditProfile(req, res);

      // Verificar redirección a login
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "Sesión no válida. Por favor inicia sesión nuevamente."
      );
      expect(res.redirect).toHaveBeenCalledWith("/auth/login");
    });

    it("debería redirigir al inicio si el perfil está inactivo", async () => {
      // Mock de Profile.getById para devolver un perfil inactivo
      Profile.getById.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          is_active: false,
        },
      });

      // Llamar al controlador
      await getEditProfile(req, res);

      // Verificar redirección al inicio con mensaje
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "Este perfil ha sido desactivado."
      );
      expect(res.redirect).toHaveBeenCalledWith("/");
    });
  });

  describe("updateProfile", () => {
    it("debería actualizar el perfil correctamente", async () => {
      // Configurar datos del formulario
      req.body = {
        name: "New Name",
        bio: "New Bio",
        phone: "123456789",
      };

      // Mock de Profile.update para devolver éxito
      Profile.update.mockResolvedValue({
        success: true,
        profile: {
          id: "test-user-id",
          name: "New Name",
          email: "test@example.com",
          bio: "New Bio",
          phone: "123456789",
          is_active: true,
        },
      });

      // Llamar al controlador
      await updateProfile(req, res);

      // Verificar que se llama a Profile.update con los datos correctos
      expect(Profile.update).toHaveBeenCalledWith(
        "test-user-id",
        expect.objectContaining({
          name: "New Name",
          bio: "New Bio",
          phone: "123456789",
        })
      );

      // Verificar actualización de la sesión
      expect(req.session.user.name).toBe("New Name");

      // Verificar mensaje de éxito
      expect(req.flash).toHaveBeenCalledWith(
        "success_msg",
        "Perfil actualizado correctamente"
      );

      // Verificar redirección
      expect(res.redirect).toHaveBeenCalledWith("/profile");
    });

    it("debería validar que el nombre no esté vacío", async () => {
      // Configurar datos del formulario con nombre vacío
      req.body = {
        name: "", // Nombre vacío
        bio: "New Bio",
      };

      // Llamar al controlador
      await updateProfile(req, res);

      // Verificar que no se llama a Profile.update
      expect(Profile.update).not.toHaveBeenCalled();

      // Verificar mensaje de error
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "El nombre es obligatorio"
      );

      // Verificar redirección
      expect(res.redirect).toHaveBeenCalledWith("/profile/edit");
    });

    it("debería manejar errores al actualizar perfil", async () => {
      // Configurar datos del formulario
      req.body = {
        name: "New Name",
        bio: "New Bio",
      };

      // Mock de Profile.update para devolver error
      Profile.update.mockResolvedValue({
        success: false,
        error: "Error al actualizar perfil",
      });

      // Llamar al controlador
      await updateProfile(req, res);

      // Verificar mensaje de error
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "Error al actualizar el perfil: Error al actualizar perfil"
      );

      // Verificar redirección
      expect(res.redirect).toHaveBeenCalledWith("/profile/edit");
    });

    it("debería redirigir a login si no hay sesión de usuario", async () => {
      // Simular que no hay sesión
      req.session = {};

      // Configurar datos del formulario
      req.body = {
        name: "New Name",
        bio: "New Bio",
      };

      // Llamar al controlador
      await updateProfile(req, res);

      // Verificar redirección a login
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "Sesión no válida. Por favor inicia sesión nuevamente."
      );
      expect(res.redirect).toHaveBeenCalledWith("/auth/login");
    });
  });
});
