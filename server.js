// Archivo principal del servidor (refactorizado)
const { app, PORT } = require("./config/app");

// Importar configuraciones
const setupMiddleware = require("./config/middleware");
const setupViews = require("./config/views");
const setupStaticFiles = require("./config/static");
const setupRoutes = require("./config/routes");

// Aplicar configuraciones en orden
setupMiddleware(app);
setupViews(app);
setupStaticFiles(app);
setupRoutes(app);

// Crear una función para iniciar el servidor (mejor para testing)
function startServer() {
  return app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

// Iniciar el servidor solo si no estamos en un entorno de prueba
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Exportar app y startServer para pruebas
module.exports = { app, startServer };
