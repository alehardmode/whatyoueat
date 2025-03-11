const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Verificar que las variables de entorno estén definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Error: Faltan variables de entorno para Supabase');
  console.error('Por favor, crea un archivo .env con SUPABASE_URL y SUPABASE_KEY');
  process.exit(1);
}

// Cliente estándar (para operaciones normales)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Cliente para operaciones públicas (como registro de usuarios)
// Usa el mismo key, pero con configuración para operaciones anónimas
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

module.exports = { 
  supabase,
  supabasePublic
}; 