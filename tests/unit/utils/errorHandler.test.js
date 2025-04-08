/**
 * Pruebas unitarias para el módulo errorHandler
 */

const errorHandler = require("../../../utils/errorHandler");

describe("errorHandler", () => {
  // Pruebas para getDatabaseErrorMessage
  describe("getDatabaseErrorMessage", () => {
    test("debería devolver mensaje específico para códigos conocidos", () => {
      expect(errorHandler.getDatabaseErrorMessage("23502")).toBe(
        "Faltan campos obligatorios"
      );
      expect(errorHandler.getDatabaseErrorMessage("23503")).toBe(
        "El registro referenciado no existe en la base de datos"
      );
      expect(errorHandler.getDatabaseErrorMessage("23505")).toBe(
        "Ya existe un registro idéntico"
      );
      expect(errorHandler.getDatabaseErrorMessage("42501")).toBe(
        "No tienes permisos para esta operación"
      );
      expect(errorHandler.getDatabaseErrorMessage("42P01")).toBe(
        "La tabla no existe. Contacta al administrador."
      );
      expect(errorHandler.getDatabaseErrorMessage("PGRST301")).toBe(
        "El recurso solicitado no existe"
      );
    });

    test("debería analizar mensajes de error cuando no hay código específico", () => {
      expect(
        errorHandler.getDatabaseErrorMessage(null, "error with foreign key")
      ).toBe("Error de referencia a otro registro");
      expect(
        errorHandler.getDatabaseErrorMessage(null, "error with not-null")
      ).toBe("Faltan campos obligatorios");
      expect(errorHandler.getDatabaseErrorMessage(null, "auth error")).toBe(
        "Error de autenticación"
      );
      expect(errorHandler.getDatabaseErrorMessage(null, "duplicate key")).toBe(
        "Registro duplicado"
      );
      expect(
        errorHandler.getDatabaseErrorMessage(null, "permission denied")
      ).toBe("No tienes permisos suficientes");
    });

    test("debería devolver mensaje genérico si no hay código ni mensaje reconocible", () => {
      expect(errorHandler.getDatabaseErrorMessage()).toBe(
        "Error en la operación con la base de datos"
      );
      expect(errorHandler.getDatabaseErrorMessage("99999")).toBe(
        "Error en la operación con la base de datos"
      );
      expect(
        errorHandler.getDatabaseErrorMessage(null, "mensaje desconocido")
      ).toBe("Error en la operación con la base de datos");
    });
  });

  // Pruebas para getAuthErrorMessage
  describe("getAuthErrorMessage", () => {
    test("debería devolver mensaje específico para códigos conocidos", () => {
      expect(errorHandler.getAuthErrorMessage("email_taken")).toBe(
        "Ya existe una cuenta con este correo electrónico"
      );
      expect(errorHandler.getAuthErrorMessage("user_not_found")).toBe(
        "No existe ninguna cuenta con ese correo electrónico"
      );
      expect(errorHandler.getAuthErrorMessage("invalid_credentials")).toBe(
        "Credenciales incorrectas"
      );
      expect(errorHandler.getAuthErrorMessage("invalid_password")).toBe(
        "La contraseña es incorrecta"
      );
      expect(errorHandler.getAuthErrorMessage("expired_token")).toBe(
        "El enlace no es válido o ha expirado"
      );
      expect(errorHandler.getAuthErrorMessage("email_not_confirmed")).toBe(
        "El correo electrónico no ha sido confirmado"
      );
    });

    test("debería analizar contenido del mensaje cuando no hay código específico", () => {
      expect(
        errorHandler.getAuthErrorMessage(null, "error with password")
      ).toBe("La contraseña es incorrecta");
      expect(
        errorHandler.getAuthErrorMessage(null, "invalid login credentials")
      ).toBe("Credenciales incorrectas");
      expect(errorHandler.getAuthErrorMessage(null, "user not found")).toBe(
        "No existe ninguna cuenta con ese correo electrónico"
      );
      expect(errorHandler.getAuthErrorMessage(null, "already registered")).toBe(
        "Ya existe una cuenta con este correo electrónico"
      );
      expect(errorHandler.getAuthErrorMessage(null, "email problem")).toBe(
        "Error en el email"
      );
      expect(errorHandler.getAuthErrorMessage(null, "token expired")).toBe(
        "El enlace no es válido o ha expirado"
      );
      expect(
        errorHandler.getAuthErrorMessage(null, "rate limit exceeded")
      ).toBe(
        "Demasiados intentos. Por favor, espera un momento antes de volver a intentarlo."
      );
      expect(errorHandler.getAuthErrorMessage(null, "signup not allowed")).toBe(
        "El registro está deshabilitado actualmente"
      );
    });

    test("debería devolver mensaje genérico si no hay código ni mensaje reconocible", () => {
      expect(errorHandler.getAuthErrorMessage()).toBe("Error de autenticación");
      expect(errorHandler.getAuthErrorMessage("unknown_code")).toBe(
        "Error de autenticación"
      );
      expect(
        errorHandler.getAuthErrorMessage(null, "mensaje desconocido")
      ).toBe("Error de autenticación");
    });
  });

  // Pruebas para handleHttpError
  describe("handleHttpError", () => {
    test("debería establecer código 401 para errores de credenciales", () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const req = {
        xhr: true,
      };
      const error = { code: "auth/invalid-credentials" };

      errorHandler.handleHttpError(error, res, req);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Credenciales no válidas",
      });
    });

    test("debería establecer código 403 para errores de permiso", () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const req = {
        xhr: true,
      };
      const error = { code: "auth/insufficient-permissions" };

      errorHandler.handleHttpError(error, res, req);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "No tienes permisos para esta acción",
      });
    });

    test("debería establecer código 404 para recursos no encontrados", () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const req = {
        xhr: true,
      };
      const error = { code: "resource_not_found" };

      errorHandler.handleHttpError(error, res, req);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "El recurso solicitado no existe",
      });
    });

    test("debería establecer código 400 para errores de validación", () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const req = {
        xhr: true,
      };
      const error = {
        code: "validation_error",
        message: "Campo requerido",
      };

      errorHandler.handleHttpError(error, res, req);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Campo requerido",
      });
    });

    test("debería establecer código 429 para errores de límite de tasa", () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const req = {
        xhr: true,
      };
      const error = { code: "rate_limit_exceeded" };

      errorHandler.handleHttpError(error, res, req);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Demasiadas solicitudes. Intenta más tarde.",
      });
    });

    test("debería establecer código 500 para errores desconocidos", () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const req = {
        xhr: true,
      };
      const error = { code: "unknown_error" };
      const defaultMessage = "Error del servidor personalizado";

      errorHandler.handleHttpError(error, res, req, defaultMessage);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: defaultMessage,
      });
    });

    test("debería usar flash y redirección para solicitudes no AJAX", () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        redirect: jest.fn(),
      };
      const req = {
        xhr: false,
        flash: jest.fn(),
      };
      const error = { code: "auth/invalid-credentials" };

      errorHandler.handleHttpError(error, res, req);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(req.flash).toHaveBeenCalledWith(
        "error_msg",
        "Credenciales no válidas"
      );
      expect(res.redirect).toHaveBeenCalledWith("back");
    });

    test("debería manejar el caso donde headers ya fueron enviados", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const res = {
        headersSent: true,
      };
      const req = {};
      const error = { message: "Error test" };

      errorHandler.handleHttpError(error, res, req);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "No se puede enviar respuesta, headers ya enviados"
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // Pruebas para formatErrorForLog
  describe("formatErrorForLog", () => {
    test("debería formatear el error con todos los campos disponibles", () => {
      const error = {
        code: "TEST_ERROR",
        message: "Mensaje de error test",
        stack: "Error: Mensaje de error test\n    at Test.js:10:20",
      };
      const context = "TestContext";

      const formattedError = errorHandler.formatErrorForLog(error, context);

      expect(formattedError).toContain("[TestContext]");
      expect(formattedError).toContain("(TEST_ERROR)");
      expect(formattedError).toContain("Mensaje de error test");
      expect(formattedError).toContain("Stack: Error: Mensaje");
    });

    test("debería manejar errores sin stack", () => {
      const error = {
        code: "TEST_ERROR",
        message: "Mensaje de error test",
      };

      const formattedError = errorHandler.formatErrorForLog(error);

      expect(formattedError).toContain("(TEST_ERROR)");
      expect(formattedError).toContain("Mensaje de error test");
      expect(formattedError).not.toContain("Stack:");
    });

    test("debería manejar errores sin código", () => {
      const error = {
        message: "Mensaje de error test",
      };

      const formattedError = errorHandler.formatErrorForLog(error);

      expect(formattedError).toContain("Mensaje de error test");
      expect(formattedError).not.toContain("()");
    });

    test("debería manejar errores sin mensaje", () => {
      const error = {
        code: "TEST_ERROR",
      };

      const formattedError = errorHandler.formatErrorForLog(error);

      expect(formattedError).toContain("(TEST_ERROR)");
      expect(formattedError).toContain("Error sin mensaje");
    });
  });

  // Pruebas para getSafeErrorMessage
  describe("getSafeErrorMessage", () => {
    test("debería devolver mensaje detallado para usuarios autenticados", () => {
      const error = {
        code: "invalid_credentials",
        message: "Credenciales incorrectas",
      };

      const message = errorHandler.getSafeErrorMessage(error, true);

      expect(message).toBe("Credenciales incorrectas");
    });

    test("debería devolver mensaje genérico para usuarios no autenticados", () => {
      const error = {
        code: "user_not_found",
        message: "Usuario no encontrado en la base de datos",
      };

      const message = errorHandler.getSafeErrorMessage(error, false);

      expect(message).toBe("Credenciales incorrectas");
    });

    test("debería usar mensaje por defecto si no hay error", () => {
      const defaultMessage = "Mensaje por defecto personalizado";

      const message = errorHandler.getSafeErrorMessage(
        null,
        true,
        defaultMessage
      );

      expect(message).toBe(defaultMessage);
    });

    test("debería usar mensaje por defecto para usuarios no autenticados con errores desconocidos", () => {
      const error = {
        code: "unknown_error",
        message: "Error detallado que no debería exponerse",
      };
      const defaultMessage = "Error genérico";

      const message = errorHandler.getSafeErrorMessage(
        error,
        false,
        defaultMessage
      );

      expect(message).toBe(defaultMessage);
    });
  });
});
