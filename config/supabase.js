const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Asegurarnos de cargar las variables de entorno
dotenv.config();

// Imprimir información sobre la configuración (sin exponer la clave completa)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verificar si las variables existen y tienen el formato correcto
if (supabaseUrl && supabaseKey) {
  console.log('Configuración de Supabase:', { 
    url: supabaseUrl, 
    tieneKey: true,
    keyPreview: `${supabaseKey.substring(0, 10)}...`
  });
  
  // Verificar si la URL tiene el formato correcto
  if (!supabaseUrl.startsWith('https://')) {
    console.warn('⚠️ Advertencia: La URL de Supabase no comienza con https://');
  }
  
  // Verificar si la clave tiene un formato que parece un JWT
  if (!supabaseKey.includes('.')) {
    console.warn('⚠️ Advertencia: La clave de Supabase no parece tener formato JWT (debe contener puntos)');
  }
} else {
  console.error('Error: Faltan variables de entorno para Supabase');
  console.error('Por favor, crea un archivo .env con SUPABASE_URL y SUPABASE_KEY');
  
  // En producción, se podría querer terminar la aplicación
  if (process.env.NODE_ENV === 'production') {
    console.error('Terminando aplicación debido a la falta de configuración crítica');
    process.exit(1);
  } else {
    console.warn('Continuando en modo desarrollo, pero las funciones de Supabase NO funcionarán');
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
    
    // Intentar listar buckets para verificar acceso a storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('Error de acceso a Storage:', storageError);
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
 * Verifica la conexión a Supabase y los permisos específicos para las funcionalidades de paciente
 * @returns {Promise<{success: boolean, error?: string}>} Resultado de la verificación
 */
async function checkSupabaseConnection() {
  try {
    // Verificar acceso a storage
    const { data: storageData, error: storageError } = await supabase.storage.getBucket('food-photos');
    
    if (storageError) {
      console.error('Error al conectar con Supabase Storage:', storageError);
      return { success: false, error: 'No se pudo conectar con el servicio de almacenamiento.' };
    }
    
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

/**
 * Genera una URL firmada para acceder a un archivo en Supabase Storage
 * @param {string} url - URL original o ruta del archivo
 * @returns {Promise<string>} URL firmada o URL original si hay error
 */
async function generateSignedUrl(url) {
  try {
    if (!url) {
      console.error('URL vacía proporcionada a generateSignedUrl');
      return '/img/empty-plate.svg';
    }

    // Si la URL ya parece firmada, regresarla tal cual
    if (url.includes('token=')) {
      console.log('URL ya firmada, retornando sin modificar:', url);
      return url;
    }

    // Si es una URL local, no necesita firmarse
    if (url.startsWith('/') || url.startsWith('./')) {
      console.log('URL local detectada, retornando sin modificar:', url);
      return url;
    }

    let fileName = '';

    // Extraer el nombre del archivo de varios formatos de URL posibles
    if (url.includes('food-photos/')) {
      // Método 1: Extraer usando split por el bucket
      const parts = url.split('food-photos/');
      fileName = parts[parts.length - 1];
    } else if (url.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)) {
      // Método 2: Extraer UUID directamente usando regex
      const match = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}[^\/\s]*)/);
      fileName = match ? match[0] : '';
    } else {
      // Método 3: Extraer la última parte de la URL después del último slash
      const urlObj = new URL(url.startsWith('http') ? url : `http://placeholder.com/${url}`);
      fileName = urlObj.pathname.split('/').pop();
    }

    if (!fileName) {
      console.error('No se pudo extraer nombre de archivo de:', url);
      return url; // Retorna la URL original si no se puede extraer el nombre
    }

    console.log('Nombre de archivo extraído:', fileName);

    // Intento principal: usar la ruta completa con el bucket
    try {
      const { data, error } = await supabase.storage
        .from('food-photos')
        .createSignedUrl(fileName, 60 * 60 * 24); // 24 horas

      if (error) throw error;
      
      console.log('URL firmada generada correctamente:', data.signedUrl);
      return data.signedUrl;
    } catch (primaryError) {
      console.warn('Error en primer intento de generar URL firmada:', primaryError);
      
      // Intento alternativo: probar con rutas alternativas
      try {
        // Intentar sin el nombre del bucket en la ruta
        const cleanFileName = fileName.replace(/^food-photos\//, '');
        const { data, error } = await supabase.storage
          .from('food-photos')
          .createSignedUrl(cleanFileName, 60 * 60 * 24);

        if (error) throw error;
        
        console.log('URL firmada generada en segundo intento:', data.signedUrl);
        return data.signedUrl;
      } catch (secondaryError) {
        console.error('Error en segundo intento de generar URL firmada:', secondaryError);
        
        // Intento final: usar getPublicUrl como opción de respaldo
        try {
          const { data } = supabase.storage
            .from('food-photos')
            .getPublicUrl(fileName);
            
          console.log('URL pública generada como respaldo:', data.publicUrl);
          return data.publicUrl;
        } catch (fallbackError) {
          console.error('Error en URL pública de respaldo:', fallbackError);
          return url; // Devolver la URL original como último recurso
        }
      }
    }
  } catch (error) {
    console.error('Error general en generateSignedUrl:', error);
    return url || '/img/empty-plate.svg';
  }
}

// Opciones mejoradas para el cliente de Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    timeout: 60000 // 60 segundos
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
  checkSupabaseConnection,
  generateSignedUrl
}; 