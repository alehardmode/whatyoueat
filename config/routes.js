/**
 * Configura las rutas de la aplicación
 * @param {Express} app - Instancia de Express
 */
function setupRoutes(app) {
  // Importar rutas
  const mainRoutes = require("../routes/mainRoutes");
  const authRoutes = require("../routes/authRoutes");
  const patientRoutes = require("../routes/patientRoutes");
  const doctorRoutes = require("../routes/doctorRoutes");
  const apiRoutes = require("../routes/apiRoutes");

  // Configurar rutas
  app.use("/", mainRoutes);
  app.use("/auth", authRoutes);
  app.use("/patient", patientRoutes);
  app.use("/doctor", doctorRoutes);
  app.use("/api", apiRoutes);

  // Manejo de errores 404
  app.use((req, res) => {
    res.status(404).render("errors/404", {
      title: "Página no encontrada",
      layout: "layouts/error",
    });
  });

  // Middleware de manejo de errores global
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("errors/500", {
      title: "Error del servidor",
      layout: "layouts/error",
      error: process.env.NODE_ENV === "production" ? null : err,
    });
  });
}

module.exports = setupRoutes;
