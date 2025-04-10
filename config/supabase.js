const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // Asegúrate que carga el .env principal

// Imprimir información sobre la configuración (sin exponer la clave completa)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Añade esta variable a tu .env

// Verificar si las variables existen y tienen el formato correcto
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: SUPABASE_URL y SUPABASE_ANON_KEY deben estar definidos en las variables de entorno.");
  // Considera lanzar un error o salir si la configuración es esencial
  // process.exit(1);
}

if (!supabaseServiceRoleKey) {
    console.warn(
      "Advertencia: SUPABASE_SERVICE_ROLE_KEY no está definida. Funciones que requieran acceso de admin (ej: buscar emails de usuarios) fallarán."
    );
}

console.log("Configuración de Supabase:", {
  url: supabaseUrl,
  tieneKey: !!supabaseAnonKey,
  keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 5)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}` : "No disponible",
  tieneAdminKey: !!supabaseServiceRoleKey // Log si tenemos la admin key
});

// Verificar si la URL tiene el formato correcto
if (!supabaseUrl.startsWith("https://")) {
  console.warn("⚠️ Advertencia: La URL de Supabase no comienza con https://");
}

// Verificar si la clave tiene un formato que parece un JWT
if (!supabaseAnonKey.includes(".")) {
  console.warn(
    "⚠️ Advertencia: La clave de Supabase no parece tener formato JWT (debe contener puntos)"
  );
}

// Función para verificar la conexión básica
async function testSupabaseConnection() {
  try {
    console.log("Verificando conexión a Supabase...");

    // Verificar conexión a la API
    const { data: authResponse, error: authError } =
      await supabase.auth.getSession();

    if (authError) {
      console.error("Error en API de autenticación:", authError);
      return { success: false, error: authError };
    }

    // Verificar acceso a DB haciendo una consulta sencilla
    const { error: dbError } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true });

    if (dbError) {
      console.error("Error de acceso a Base de Datos:", dbError);
      return { success: false, error: dbError };
    }

    console.log("Conexión a Supabase verificada correctamente");
    return { success: true };
  } catch (error) {
    console.error("Error al verificar conexión Supabase:", error);
    return { success: false, error };
  }
}

/**
 * Verifica la conexión a Supabase y los permisos específicos para las funcionalidades
 * @returns {Promise<{success: boolean, error?: string, errorObj?: object}>} Resultado de la verificación
 */
async function checkSupabaseConnection() {
  try {
    console.log("Verificando conexión a Supabase para operaciones...");

    // Primero, verificamos si podemos hacer una operación de autenticación
    const { error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error("Error al conectar con Supabase Auth:", authError);
      return {
        success: false,
        error: "Error de autenticación Supabase.",
        errorObj: authError,
      };
    }

    // Verificar acceso a la base de datos
    const { error: dbError } = await supabase
      .from("food_entries")
      .select("count")
      .limit(1);

    if (dbError) {
      console.error("Error al conectar con Supabase Database:", dbError);
      return {
        success: false,
        error: "No se pudo conectar con la base de datos.",
        errorObj: dbError,
      };
    }

    console.log("Conexión a Supabase establecida correctamente");
    return { success: true };
  } catch (error) {
    console.error(
      "Error inesperado al verificar conexión con Supabase:",
      error
    );
    return {
      success: false,
      error: "Error inesperado al conectar con Supabase.",
      errorObj: error,
    };
  }
}

// Opciones mejoradas para el cliente de Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "x-application-name": "WhatYouEat",
    },
  },
};

// Cliente estándar (para operaciones normales)
const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key",
  supabaseOptions
);

// Cliente para operaciones públicas (como registro de usuarios)
// Usa el mismo key, pero con configuración para operaciones anónimas
const supabasePublic = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    ...supabaseOptions,
    auth: {
      ...supabaseOptions.auth,
      autoRefreshToken: false,
    },
  }
);

// Cliente de Administración (Service Role Key)
// Solo se crea si la clave de servicio está disponible
const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null; 

// Verificar conexión al iniciar la aplicación (sin bloquear)
testSupabaseConnection().then((isConnected) => {
  if (!isConnected) {
    console.warn(
      "⚠️ Advertencia: La aplicación ha iniciado sin una conexión válida a Supabase"
    );
  }
});

module.exports = {
  supabase,
  supabasePublic,
  supabaseAdmin,
  testSupabaseConnection,
  checkSupabaseConnection,
};
