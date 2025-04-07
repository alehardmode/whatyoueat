/**
 * Script para limpiar la base de datos de prueba
 * Ejecutar con: npm run test:cleanup
 */

require("dotenv").config({ path: ".env.test" });
const { cleanupTestDatabase } = require("./setup-supabase");

console.log("🧹 Iniciando limpieza de base de datos de prueba...");

(async () => {
  try {
    await cleanupTestDatabase();
    console.log("✅ Limpieza completada con éxito");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    process.exit(1);
  }
})();
