/**
 * Pruebas unitarias para la verificación de tokens de autenticación de Supabase
 * Test ID: SB-AUTH-05
 */

// Mock del módulo de Supabase
jest.mock("../../../config/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      setSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

// Importar después del mock
const { supabase } = require("../../../config/supabase");
const TokenService = require("../../../models/TokenService");
const { v4: uuidv4 } = require("uuid");

// Pruebas para verificación de tokens
describe("TokenService - Verificación de tokens (SB-AUTH-05)", () => {
  // Configurar datos de prueba
  const mockUserId = uuidv4();
  const mockValidToken = "valid-jwt-token-string";
  const mockExpiredToken = "expired-jwt-token-string";
  const mockInvalidToken = "invalid-token-format";

  // Datos simulados de sesión
  const mockValidSession = {
    access_token: mockValidToken,
    refresh_token: "valid-refresh-token",
    expires_at: Date.now() + 3600000, // 1 hora en el futuro
    user: {
      id: mockUserId,
      email: "test@example.com",
      user_metadata: {
        name: "Usuario Test",
        role: "paciente",
      },
    },
  };

  const mockExpiredSession = {
    access_token: mockExpiredToken,
    refresh_token: "expired-refresh-token",
    expires_at: Date.now() - 3600000, // 1 hora en el pasado
    user: {
      id: mockUserId,
      email: "test@example.com",
      user_metadata: {
        name: "Usuario Test",
        role: "paciente",
      },
    },
  };

  // Reiniciar mocks antes de cada test
  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar respuestas por defecto para los mocks
    supabase.auth.getUser.mockImplementation(async (token) => {
      if (token === mockValidToken) {
        return {
          data: {
            user: {
              id: mockUserId,
              email: "test@example.com",
              user_metadata: {
                name: "Usuario Test",
                role: "paciente",
              },
            },
          },
          error: null,
        };
      } else if (token === mockExpiredToken) {
        return {
          data: { user: null },
          error: { message: "JWT expired", code: "token_expired" },
        };
      } else {
        return {
          data: { user: null },
          error: { message: "Invalid JWT", code: "invalid_token" },
        };
      }
    });

    supabase.auth.getSession.mockImplementation(async () => {
      // Simular sesión válida por defecto
      return {
        data: { session: mockValidSession },
        error: null,
      };
    });

    supabase.auth.refreshSession.mockImplementation(
      async ({ refresh_token }) => {
        if (refresh_token === "valid-refresh-token") {
          return {
            data: {
              session: {
                ...mockValidSession,
                access_token: "new-valid-token",
                refresh_token: "new-refresh-token",
              },
            },
            error: null,
          };
        } else {
          return {
            data: { session: null },
            error: {
              message: "Invalid refresh token",
              code: "invalid_refresh_token",
            },
          };
        }
      }
    );
  });

  test("debería validar correctamente un token válido", async () => {
    const result = await TokenService.verifyToken(mockValidToken);

    expect(result.valid).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.id).toBe(mockUserId);
    expect(supabase.auth.getUser).toHaveBeenCalledWith(mockValidToken);
  });

  test("debería rechazar un token expirado", async () => {
    const result = await TokenService.verifyToken(mockExpiredToken);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.errorCode).toBe("token_expired");
  });

  test("debería rechazar un token inválido", async () => {
    const result = await TokenService.verifyToken(mockInvalidToken);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.errorCode).toBe("invalid_token");
  });

  test("debería devolver error con formato correcto si ocurre una excepción", async () => {
    // Forzar error durante la verificación
    supabase.auth.getUser.mockImplementationOnce(() => {
      throw new Error("Error inesperado durante verificación");
    });

    const result = await TokenService.verifyToken(mockValidToken);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Error inesperado durante verificación");
    expect(result.errorCode).toBe("verification_error");
  });

  test("debería obtener la sesión actual correctamente", async () => {
    const result = await TokenService.getCurrentSession();

    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session.user).toBeDefined();
    expect(result.session.access_token).toBe(mockValidToken);
    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  test("debería manejar correctamente el caso sin sesión activa", async () => {
    // Modificar el mock para simular que no hay sesión
    supabase.auth.getSession.mockImplementationOnce(async () => {
      return {
        data: { session: null },
        error: null,
      };
    });

    const result = await TokenService.getCurrentSession();

    expect(result.success).toBe(false);
    expect(result.session).toBeNull();
    expect(result.message).toBe("No hay sesión activa");
  });

  test("debería manejar error al obtener la sesión", async () => {
    // Modificar el mock para simular un error
    supabase.auth.getSession.mockImplementationOnce(async () => {
      return {
        data: { session: null },
        error: { message: "Error al obtener sesión", code: "session_error" },
      };
    });

    const result = await TokenService.getCurrentSession();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al obtener sesión");
    expect(result.errorCode).toBe("session_error");
  });

  test("debería refrescar correctamente una sesión expirada", async () => {
    // Modificar el mock para devolver una sesión expirada
    supabase.auth.getSession.mockImplementationOnce(async () => {
      return {
        data: { session: mockExpiredSession },
        error: null,
      };
    });

    const result = await TokenService.refreshExpiredSession();

    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session.access_token).toBe("new-valid-token");
    expect(supabase.auth.refreshSession).toHaveBeenCalled();
  });

  test("debería manejar error al refrescar sesión", async () => {
    // Modificar el mock para simular sesión expirada
    supabase.auth.getSession.mockImplementationOnce(async () => {
      return {
        data: { session: mockExpiredSession },
        error: null,
      };
    });

    // Y un error al refrescar
    supabase.auth.refreshSession.mockImplementationOnce(async () => {
      return {
        data: { session: null },
        error: { message: "Error al refrescar sesión", code: "refresh_error" },
      };
    });

    const result = await TokenService.refreshExpiredSession();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al refrescar sesión");
    expect(result.errorCode).toBe("refresh_error");
  });
});
