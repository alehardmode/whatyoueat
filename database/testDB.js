// database/testSupabase.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testConnection() {
  const { data, error } = await supabase
    .from('profiles') 
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error conectando con Supabase:', error);
  } else {
    console.log('✅ Conexión exitosa. Datos obtenidos:', data);
  }
}

testConnection();