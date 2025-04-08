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

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
