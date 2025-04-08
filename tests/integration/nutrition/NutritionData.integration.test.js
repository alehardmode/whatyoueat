/**
 * Pruebas de integración para gestión de datos nutricionales
 */

const { createMockSupabase } = require("../../mocks/supabase-mock");
const { testPatients } = require("../../fixtures/users");
const { testMeals } = require("../../fixtures/nutrition-records");

// Determinar si usar mocks o BD real
const USE_MOCKS = true;

// Si se usan mocks, configurarlos
let mockSupabase;
if (USE_MOCKS) {
  mockSupabase = createMockSupabase();

  // Mock del módulo de Supabase
  jest.mock("../../../config/supabase", () => ({
    supabase: mockSupabase.client,
  }));
} else {
  // Usar doMock en lugar de mock para poder acceder a variables de ámbito
  jest.doMock("../../../config/supabase", () => ({
    supabase: {
      from: jest.fn().mockReturnThis(),
      storage: {
        from: jest.fn().mockReturnThis(),
      },
      auth: {
        getUser: jest.fn(),
      },
    },
  }));
}

// Importar los módulos después del mock
const FoodEntry = require("../../../models/FoodEntry");
const UserAuth = require("../../../models/UserAuth");
const Profile = require("../../../models/Profile");

describe("Integración de Gestión de Datos Nutricionales", () => {
  let testUserId;
  let testEntryId;

  // Antes de cada prueba, configurar datos
  beforeEach(() => {
    if (USE_MOCKS) {
      mockSupabase.resetDatabase();

      // Crear usuario de prueba
      const testUser = mockSupabase.addTestUser(testPatients[0]);
      testUserId = testUser.id;

      // Crear entrada de prueba
      const testEntry = {
        id: `test-entry-${Date.now()}`,
        user_id: testUserId,
        name: "Comida de integración",
        description: "Descripción para prueba de integración",
        meal_date: new Date().toISOString(),
        meal_type: "almuerzo",
        image_url: "https://example.com/image.jpg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.mockDatabase.food_entries = [testEntry];
      testEntryId = testEntry.id;
    }
  });

  // INT-DATA-01: Creación de registros nutricionales
  describe("Creación de registros nutricionales", () => {
    test("debería crear un registro nutricional completo", async () => {
      // Datos para la nueva entrada
      const newEntryData = {
        name: "Ensalada Mediterránea",
        description: "Ensalada con aceitunas, tomate, pepino y queso feta",
        date: new Date().toISOString(),
        mealType: "cena",
        imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...", // Datos de imagen truncados para brevedad
      };

      // Crear la entrada usando el modelo FoodEntry
      const result = await FoodEntry.create(testUserId, newEntryData);

      // Verificar que la creación fue exitosa
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry.name).toBe(newEntryData.name);
      expect(result.entry.description).toBe(newEntryData.description);
      expect(result.entry.meal_type).toBe(newEntryData.mealType);

      // Verificar que la entrada se agregó a la base de datos
      if (USE_MOCKS) {
        const createdEntry = mockSupabase.mockDatabase.food_entries.find(
          (entry) => entry.name === newEntryData.name
        );
        expect(createdEntry).toBeDefined();
        expect(createdEntry.user_id).toBe(testUserId);
      }
    });

    test("debería integrarse con el perfil de usuario", async () => {
      // 1. Crear un usuario
      const userData = {
        name: "Usuario Integración",
        email: `integracion.${Date.now()}@example.com`,
        password: "Password123!",
        role: "paciente",
      };

      const registerResult = await UserAuth.register(
        userData.email,
        userData.password,
        userData.name,
        userData.role
      );

      expect(registerResult.success).toBe(true);
      const userId = registerResult.user.id;

      // 2. Verificar que el usuario existe
      if (USE_MOCKS) {
        const profile = mockSupabase.mockDatabase.profiles.find(
          (p) => p.id === userId
        );
        expect(profile).toBeDefined();
      }

      // 3. Verificar que podemos obtener el perfil de usuario recién creado
      const profileResult = await Profile.getById(userId);
      expect(profileResult.success).toBe(true);
      expect(profileResult.profile).toBeDefined();
      expect(profileResult.profile.name).toBe(userData.name);
      expect(profileResult.profile.role).toBe(userData.role);
    });

    test("debería rechazar creación con datos inválidos", async () => {
      // Datos incompletos
      const invalidData = {
        name: "Entrada inválida",
        // Sin descripción ni tipo de comida
      };

      const result = await FoodEntry.create(testUserId, invalidData);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // INT-DATA-02: Actualización de registros
  describe("Actualización de registros nutricionales", () => {
    test("debería actualizar un registro existente", async () => {
      // Datos para actualizar
      const updateData = {
        name: "Nombre actualizado",
        description: "Descripción actualizada para prueba de integración",
      };

      // Actualizar la entrada
      const result = await FoodEntry.update(
        testUserId,
        testEntryId,
        updateData
      );

      // Verificar que la actualización fue exitosa
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry.id).toBe(testEntryId);
      expect(result.entry.name).toBe(updateData.name);
      expect(result.entry.description).toBe(updateData.description);

      // Verificar que se actualizó en la base de datos
      if (USE_MOCKS) {
        const updatedEntry = mockSupabase.mockDatabase.food_entries.find(
          (entry) => entry.id === testEntryId
        );
        expect(updatedEntry.name).toBe(updateData.name);
        expect(updatedEntry.description).toBe(updateData.description);
      }
    });

    test("debería rechazar actualización de usuario no propietario", async () => {
      // Crear otro usuario
      const otherUser = mockSupabase.addTestUser({
        ...testPatients[1],
        email: `otro.${Date.now()}@example.com`,
      });

      // Intentar actualizar con el otro usuario
      const updateData = {
        name: "Intento de actualización no autorizada",
      };

      const result = await FoodEntry.update(
        otherUser.id,
        testEntryId,
        updateData
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("debería rechazar actualización de entrada inexistente", async () => {
      const updateData = {
        name: "Actualización de entrada inexistente",
      };

      const result = await FoodEntry.update(
        testUserId,
        "id-inexistente",
        updateData
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // INT-DATA-03: Eliminación de registros
  describe("Eliminación de registros nutricionales", () => {
    test("debería eliminar un registro existente", async () => {
      // Intentar eliminar la entrada de prueba
      const result = await FoodEntry.delete(testUserId, testEntryId);

      // Verificar que la eliminación fue exitosa
      expect(result.success).toBe(true);

      // Verificar que se eliminó de la base de datos
      if (USE_MOCKS) {
        const deletedEntry = mockSupabase.mockDatabase.food_entries.find(
          (entry) => entry.id === testEntryId
        );
        expect(deletedEntry).toBeUndefined();
      }

      // Verificar que ya no podemos obtener la entrada
      const getResult = await FoodEntry.getById(testEntryId);
      expect(getResult.success).toBe(false);
      expect(getResult.error).toBeDefined();
    });

    test("debería rechazar eliminación de usuario no propietario", async () => {
      // Crear otro usuario
      const otherUser = mockSupabase.addTestUser({
        ...testPatients[1],
        email: `otro.eliminar.${Date.now()}@example.com`,
      });

      // Intentar eliminar con el otro usuario
      const result = await FoodEntry.delete(otherUser.id, testEntryId);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("debería rechazar eliminación de entrada inexistente", async () => {
      const result = await FoodEntry.delete(testUserId, "id-inexistente");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
