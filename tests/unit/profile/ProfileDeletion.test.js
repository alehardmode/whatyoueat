/**
 * Pruebas unitarias para la eliminación lógica de perfiles de usuario
 * Test ID: SB-DB-04
 */

// Variables para mockear
let mockSupabase;
let mockUpdateBuilder;
let mockProfile;

// Mock del módulo de Supabase
jest.mock("../../../config/supabase", () => {
  // Crear el mock dinámicamente para que sea accesible en cada test
  mockUpdateBuilder = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  mockSupabase = {
    from: jest.fn().mockReturnValue(mockUpdateBuilder),
  };

  return {
    supabase: mockSupabase,
  };
});

// Importar después del mock
const { supabase } = require("../../../config/supabase");
const Profile = require("../../../models/Profile");
const { v4: uuidv4 } = require("uuid");

describe("Profile - Eliminación de perfiles (SB-DB-04)", () => {
  // Configuración de datos de prueba
  const testUserId = uuidv4();

  // Reiniciar mocks antes de cada test
  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();

    // Mockear la verificación de conexión para que siempre devuelva éxito
    Profile.checkConnection = jest.fn().mockResolvedValue({
      success: true,
    });

    // Configurar mockProfile para pruebas
    mockProfile = {
      id: testUserId,
      name: "Usuario Test",
      email: "test@example.com",
      role: "paciente",
      created_at: new Date().toISOString(),
      is_active: true,
    };

    // Configurar respuesta exitosa por defecto para single()
    mockUpdateBuilder.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    });

    // Por defecto, simular actualización exitosa
    mockUpdateBuilder.select.mockResolvedValue({
      data: [{ ...mockProfile, is_active: false }],
      error: null,
    });
  });

  test("debería marcar un perfil como eliminado (borrado lógico)", async () => {
    // Ejecutar la función a probar
    const result = await Profile.deleteProfile(testUserId);

    // Verificar que la función llama a los métodos correctos
    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(mockUpdateBuilder.eq).toHaveBeenCalledWith("id", testUserId);

    // Verificar el resultado
    expect(result.success).toBe(true);
    expect(result.profile.is_active).toBe(false);
  });

  test("debería devolver error si el perfil no existe", async () => {
    // Simular que el perfil no existe
    mockUpdateBuilder.single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Ejecutar la función a probar
    const result = await Profile.deleteProfile(testUserId);

    // Verificar el resultado
    expect(result.success).toBe(false);
    expect(result.error).toContain("no encontrado");
  });

  test("debería manejar error en la consulta del perfil", async () => {
    // Simular error al consultar el perfil
    mockUpdateBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Error al obtener perfil", code: "db_error" },
    });

    // Ejecutar la función a probar
    const result = await Profile.deleteProfile(testUserId);

    // Verificar el resultado
    expect(result.success).toBe(false);
    expect(result.error).toContain("Error al obtener perfil");
  });

  test("debería manejar error en la actualización del perfil", async () => {
    // Simular error al actualizar el perfil
    mockUpdateBuilder.select.mockResolvedValueOnce({
      data: null,
      error: { message: "Error al actualizar perfil", code: "db_error" },
    });

    // Ejecutar la función a probar
    const result = await Profile.deleteProfile(testUserId);

    // Verificar el resultado
    expect(result.success).toBe(false);
    expect(result.error).toContain("Error al actualizar perfil");
  });

  test("debería manejar excepciones inesperadas", async () => {
    // Forzar una excepción
    mockUpdateBuilder.single.mockImplementationOnce(() => {
      throw new Error("Error inesperado");
    });

    // Ejecutar la función a probar
    const result = await Profile.deleteProfile(testUserId);

    // Verificar el resultado
    expect(result.success).toBe(false);
    expect(result.error).toBe("Error inesperado");
  });

  test("debería permitir recuperar perfiles eliminados lógicamente", async () => {
    // Perfil previamente marcado como eliminado
    const deletedProfile = {
      ...mockProfile,
      is_active: false,
    };

    // Simular que se encuentra el perfil eliminado
    mockUpdateBuilder.single.mockResolvedValueOnce({
      data: deletedProfile,
      error: null,
    });

    // Configurar respuesta para la reactivación
    mockUpdateBuilder.select.mockResolvedValueOnce({
      data: [{ ...deletedProfile, is_active: true }],
      error: null,
    });

    // Ejecutar la función a probar (reactivar perfil)
    const result = await Profile.reactivateProfile(testUserId);

    // Verificar el resultado
    expect(result.success).toBe(true);
    expect(result.profile.is_active).toBe(true);
  });

  test("debería devolver error al reactivar un perfil que no existe", async () => {
    // Simular que el perfil no existe
    mockUpdateBuilder.single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Ejecutar la función a probar
    const result = await Profile.reactivateProfile(testUserId);

    // Verificar el resultado
    expect(result.success).toBe(false);
    expect(result.error).toContain("no encontrado");
  });
});
