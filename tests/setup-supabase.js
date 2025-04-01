/**
 * Configuración de cliente Supabase para pruebas
 * Este archivo configura una instancia de cliente Supabase dedicada para pruebas
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno específicas para pruebas
const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envPath });

// Verificar si existe el archivo .env.test
if (!fs.existsSync(path.join(process.cwd(), '.env.test'))) {
  console.warn('⚠️ Archivo .env.test no encontrado. Usando configuración de .env');
}

// Obtener credenciales de entorno para pruebas
const supabaseUrl = process.env.SUPABASE_TEST_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_TEST_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno para pruebas con Supabase');
  console.error('   Debe proporcionar SUPABASE_TEST_URL y SUPABASE_TEST_KEY en .env.test');
  process.exit(1);
}

// Opciones del cliente
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-application-name': 'WhatYouEatTest'
    }
  }
};

// Cliente para pruebas (con clave anónima)
const supabaseTestClient = createClient(
  supabaseUrl,
  supabaseKey,
  supabaseOptions
);

// Cliente admin para pruebas (con clave de servicio)
const supabaseAdminClient = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseKey,
  {
    ...supabaseOptions,
    auth: {
      ...supabaseOptions.auth,
      persistSession: false
    }
  }
);

/**
 * Limpia los datos de prueba creados
 * @param {string} userId - ID de usuario a limpiar
 */
async function cleanupTestData(userId) {
  if (!userId) return;

  try {
    // Limpiar registros de comidas
    await supabaseAdminClient
      .from('food_entries')
      .delete()
      .eq('user_id', userId);

    // Limpiar perfiles
    await supabaseAdminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Eliminar relaciones médico-paciente
    await supabaseAdminClient
      .from('doctor_patient')
      .delete()
      .or(`doctor_id.eq.${userId},patient_id.eq.${userId}`);
      
    console.log(`✓ Datos de prueba para usuario ${userId} eliminados correctamente`);
  } catch (error) {
    console.error('Error al limpiar datos de prueba:', error);
  }
}

/**
 * Crea un usuario de prueba
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} - Usuario creado
 */
async function createTestUser(userData) {
  try {
    // Crear usuario en autenticación
    const { data: authData, error: authError } = await supabaseAdminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.nombre,
        role: userData.tipo
      }
    });

    if (authError) throw authError;
    
    // Crear perfil
    const profileData = {
      id: authData.user.id,
      user_id: authData.user.id,
      name: userData.nombre,
      role: userData.tipo,
      updated_at: new Date().toISOString()
    };
    
    // Añadir datos específicos según el tipo de usuario
    if (userData.tipo === 'paciente') {
      profileData.age = userData.edad;
      profileData.gender = userData.sexo;
      profileData.height = userData.altura;
      profileData.weight = userData.peso;
    } else if (userData.tipo === 'medico') {
      profileData.specialty = userData.especialidad;
      profileData.license = userData.licencia;
    }
    
    // Insertar perfil
    const { error: profileError } = await supabaseAdminClient
      .from('profiles')
      .upsert([profileData]);
    
    if (profileError) throw profileError;
    
    return {
      ...authData.user,
      ...profileData
    };
  } catch (error) {
    console.error('Error al crear usuario de prueba:', error);
    throw error;
  }
}

/**
 * Elimina un usuario de prueba y sus datos asociados
 * @param {string} userId - ID del usuario a eliminar
 */
async function deleteTestUser(userId) {
  try {
    // Primero limpiar datos asociados
    await cleanupTestData(userId);
    
    // Eliminar usuario de auth
    const { error } = await supabaseAdminClient.auth.admin.deleteUser(userId);
    
    if (error) throw error;
    
    console.log(`✓ Usuario de prueba ${userId} eliminado correctamente`);
  } catch (error) {
    console.error('Error al eliminar usuario de prueba:', error);
  }
}

/**
 * Crea datos de prueba para comidas
 * @param {string} userId - ID del usuario
 * @param {Object} mealData - Datos de la comida
 * @returns {Promise<Object>} - Entrada creada
 */
async function createTestMeal(userId, mealData) {
  try {
    const entryData = {
      user_id: userId,
      name: mealData.nombre || 'Comida de prueba',
      description: mealData.descripcion || '',
      meal_date: mealData.fecha || new Date().toISOString(),
      meal_type: mealData.tipo || 'other',
      // Simulación de imagen codificada en base64
      image_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      test_data: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabaseAdminClient
      .from('food_entries')
      .insert([entryData])
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error al crear comida de prueba:', error);
    throw error;
  }
}

// Exportar cliente y funciones auxiliares
module.exports = {
  supabaseTestClient,
  supabaseAdminClient,
  cleanupTestData,
  createTestUser,
  deleteTestUser,
  createTestMeal
}; 