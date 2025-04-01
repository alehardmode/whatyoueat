/**
 * Pruebas unitarias para el módulo FoodEntry
 */

const { 
  supabaseTestClient, 
  supabaseAdminClient, 
  createTestUser, 
  deleteTestUser,
  createTestMeal
} = require('../../setup-supabase');
const { testPatients } = require('../../fixtures/users');
const { testMeals } = require('../../fixtures/nutrition-records');

// Mock del módulo de Supabase
jest.mock('../../../config/supabase', () => ({
  supabase: supabaseTestClient
}));

// Importar el módulo después del mock
const FoodEntry = require('../../../models/FoodEntry');

describe('FoodEntry', () => {
  let testUserId;
  let testEntryIds = [];
  
  // Antes de todas las pruebas, crear usuario y entradas de comida de prueba
  beforeAll(async () => {
    try {
      // Crear un usuario de prueba
      const userData = await createTestUser(testPatients[0]);
      testUserId = userData.id;
      console.log('Usuario de prueba creado:', testUserId);
      
      // Crear 2 entradas de comida de prueba
      for (let i = 0; i < 2; i++) {
        const mealData = await createTestMeal(testUserId, {
          nombre: `Comida de prueba ${i+1}`,
          descripcion: `Descripción de prueba ${i+1}`,
          fecha: new Date().toISOString(),
          tipo: i === 0 ? 'desayuno' : 'almuerzo'
        });
        testEntryIds.push(mealData.id);
      }
      console.log('Entradas de comida creadas:', testEntryIds);
    } catch (error) {
      console.error('Error en la configuración de pruebas:', error);
    }
  });
  
  // Después de todas las pruebas, eliminar datos de prueba
  afterAll(async () => {
    try {
      await deleteTestUser(testUserId);
      console.log('Datos de prueba eliminados');
    } catch (error) {
      console.error('Error al limpiar datos de prueba:', error);
    }
  });
  
  // Prueba de creación de entrada
  describe('create', () => {
    let newEntryId;
    
    afterEach(async () => {
      // Limpiar entrada creada en la prueba
      if (newEntryId) {
        await supabaseAdminClient
          .from('food_entries')
          .delete()
          .eq('id', newEntryId);
        newEntryId = null;
      }
    });
    
    test('debería crear una nueva entrada de comida', async () => {
      const entryData = {
        name: 'Comida nueva de prueba',
        description: 'Descripción de prueba',
        date: new Date().toISOString(),
        mealType: 'cena',
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      };
      
      const result = await FoodEntry.create(testUserId, entryData);
      
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry.id).toBeDefined();
      expect(result.entry.name).toBe(entryData.name);
      expect(result.entry.meal_type).toBe(entryData.mealType);
      
      // Guardar ID para limpieza
      newEntryId = result.entry.id;
    });
    
    test('debería rechazar creación sin datos obligatorios', async () => {
      // Intentar crear sin imagen
      const incompleteData = {
        name: 'Comida sin imagen',
        mealType: 'desayuno'
      };
      
      const result = await FoodEntry.create(testUserId, incompleteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('debería rechazar creación para usuario inexistente', async () => {
      const entryData = {
        name: 'Comida usuario inexistente',
        description: 'Prueba',
        mealType: 'desayuno',
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      };
      
      const result = await FoodEntry.create('usuario-inexistente', entryData);
      
      // La API debe rechazar esta operación por la política RLS
      expect(result.success).toBe(false);
    });
  });
  
  // Prueba de obtención de historial
  describe('getHistoryByUserId', () => {
    test('debería obtener el historial de comidas de un usuario', async () => {
      const result = await FoodEntry.getHistoryByUserId(testUserId);
      
      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBeGreaterThan(0);
      
      // Verificar paginación
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBeDefined();
      expect(result.pagination.total).toBeGreaterThan(0);
    });
    
    test('debería filtrar por fecha correctamente', async () => {
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      
      const dateFilter = {
        from: ayer.toISOString().split('T')[0],
        to: hoy.toISOString().split('T')[0]
      };
      
      const result = await FoodEntry.getHistoryByUserId(testUserId, dateFilter);
      
      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
    });
    
    test('debería manejar usuario sin entradas', async () => {
      // Crear usuario temporal sin entradas
      const tempUserData = await createTestUser({
        ...testPatients[1],
        email: `temp.${Date.now()}@example.com`
      });
      
      const result = await FoodEntry.getHistoryByUserId(tempUserData.id);
      
      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
      expect(result.entries.length).toBe(0);
      
      // Eliminar usuario temporal
      await deleteTestUser(tempUserData.id);
    });
  });
  
  // Prueba de obtención por ID
  describe('getById', () => {
    test('debería obtener una entrada de comida por ID', async () => {
      const entryId = testEntryIds[0];
      
      const result = await FoodEntry.getById(entryId);
      
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry.id).toBe(entryId);
      expect(result.entry.user_id).toBe(testUserId);
    });
    
    test('debería incluir datos de imagen cuando se solicita', async () => {
      const entryId = testEntryIds[0];
      
      const result = await FoodEntry.getById(entryId, true);
      
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry.image_data).toBeDefined();
      expect(result.entry.image_data).toContain('data:image/png;base64');
    });
    
    test('debería excluir datos de imagen cuando no se solicita', async () => {
      const entryId = testEntryIds[0];
      
      const result = await FoodEntry.getById(entryId, false);
      
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry.image_data).toBeUndefined();
    });
    
    test('debería manejar ID inexistente', async () => {
      const result = await FoodEntry.getById('id-inexistente');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  // Prueba de actualización
  describe('update', () => {
    test('debería actualizar una entrada existente', async () => {
      const entryId = testEntryIds[0];
      const updates = {
        name: 'Nombre actualizado',
        description: 'Descripción actualizada'
      };
      
      const result = await FoodEntry.update(entryId, testUserId, updates);
      
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry.id).toBe(entryId);
      expect(result.entry.name).toBe(updates.name);
      expect(result.entry.description).toBe(updates.description);
    });
    
    test('debería rechazar actualización para usuario no propietario', async () => {
      const entryId = testEntryIds[0];
      const updates = {
        name: 'Intento de actualización no autorizada'
      };
      
      const result = await FoodEntry.update(entryId, 'otro-usuario-id', updates);
      
      // La política RLS debe impedir esta operación
      expect(result.success).toBe(false);
    });
  });
  
  // Prueba de eliminación
  describe('delete', () => {
    test('debería eliminar una entrada existente', async () => {
      // Crear entrada temporal para eliminar
      const tempMeal = await createTestMeal(testUserId, {
        nombre: 'Comida para eliminar',
        tipo: 'merienda'
      });
      
      const result = await FoodEntry.delete(tempMeal.id, testUserId);
      
      expect(result.success).toBe(true);
    });
    
    test('debería rechazar eliminación para usuario no propietario', async () => {
      const entryId = testEntryIds[0];
      
      const result = await FoodEntry.delete(entryId, 'otro-usuario-id');
      
      // La política RLS debe impedir esta operación
      expect(result.success).toBe(false);
    });
  });
  
  // Prueba de estadísticas
  describe('getStats', () => {
    test('debería obtener estadísticas de un usuario', async () => {
      const result = await FoodEntry.getStats(testUserId);
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalEntries).toBeGreaterThan(0);
    });
  });
}); 