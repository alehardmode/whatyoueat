const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Asegurarnos de cargar las variables de entorno
dotenv.config();

// Imprimir información sobre la configuración (sin exponer la clave completa)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verificar si las variables existen y tienen el formato correcto
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan variables de entorno para Supabase');
  console.error('Por favor, crea un archivo .env con SUPABASE_URL y SUPABASE_KEY');
  
  // En producción, se podría querer terminar la aplicación
  if (process.env.NODE_ENV === 'production') {
    console.error('Terminando aplicación debido a la falta de configuración crítica');
    process.exit(1);
  } else {
    console.warn('Continuando en modo desarrollo con valores de prueba. Las funciones de Supabase funcionarán en modo simulado.');
  }
} else {
  console.log('Configuración de Supabase:', { 
    url: supabaseUrl, 
    tieneKey: true,
    keyPreview: `${supabaseKey.substring(0, 5)}...${supabaseKey.slice(-5)}`
  });
  
  // Verificar si la URL tiene el formato correcto
  if (!supabaseUrl.startsWith('https://')) {
    console.warn('⚠️ Advertencia: La URL de Supabase no comienza con https://');
  }
  
  // Verificar si la clave tiene un formato que parece un JWT
  if (!supabaseKey.includes('.')) {
    console.warn('⚠️ Advertencia: La clave de Supabase no parece tener formato JWT (debe contener puntos)');
  }
}

// Función para verificar la conexión básica
async function testSupabaseConnection() {
  try {
    // Verificar conexión a la API
    const { data: authResponse, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error en API de autenticación:', authError);
      return false;
    }
    
    // Verificar acceso a DB haciendo una consulta sencilla
    const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (dbError) {
      console.error('Error de acceso a Base de Datos:', dbError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error al verificar conexión Supabase:', error);
    return false;
  }
}

/**
 * Verifica la conexión a Supabase y los permisos específicos para las funcionalidades
 * @returns {Promise<{success: boolean, error?: string}>} Resultado de la verificación
 */
async function checkSupabaseConnection() {
  try {
    // Verificar acceso a la base de datos
    const { data: dbData, error: dbError } = await supabase.from('food_entries').select('count').limit(1);
    
    if (dbError) {
      console.error('Error al conectar con Supabase Database:', dbError);
      return { success: false, error: 'No se pudo conectar con la base de datos.' };
    }
    
    console.log('Conexión a Supabase establecida correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error inesperado al verificar conexión con Supabase:', error);
    return { success: false, error: 'Error inesperado al conectar con Supabase.' };
  }
}

// Opciones mejoradas para el cliente de Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-application-name': 'WhatYouEat'
    }
  }
};

// Cliente estándar (para operaciones normales)
const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key',
  supabaseOptions
);

// Cliente para operaciones públicas (como registro de usuarios)
// Usa el mismo key, pero con configuración para operaciones anónimas
const supabasePublic = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    ...supabaseOptions,
    auth: {
      ...supabaseOptions.auth,
      autoRefreshToken: false
    }
  }
);

// Verificar conexión al iniciar la aplicación (sin bloquear)
testSupabaseConnection().then(isConnected => {
  if (!isConnected) {
    console.warn('⚠️ Advertencia: La aplicación ha iniciado sin una conexión válida a Supabase');
  }
});

module.exports = { 
  supabase,
  supabasePublic,
  testSupabaseConnection,
  checkSupabaseConnection
};
