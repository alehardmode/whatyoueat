const path = require("path");
const expressLayouts = require("express-ejs-layouts");

/**
 * Configura el motor de plantillas y las vistas
 * @param {Express} app - Instancia de Express
 */
function setupViews(app) {
  app.use(expressLayouts);
  app.set("view engine", "html");
  app.engine("html", require("ejs").renderFile);
  app.set("views", path.join(__dirname, "../views"));
  app.set("layout", "layouts/main");
}

module.exports = setupViews;
