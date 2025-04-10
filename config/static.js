const express = require("express");
const path = require("path");

/**
 * Configura los archivos estáticos de la aplicación
 * @param {Express} app - Instancia de Express
 */
function setupStaticFiles(app) {
  const cacheTime = process.env.NODE_ENV === "production" ? 86400000 : 0; // 1 día en producción

  // CSS
  app.use(
    "/css",
    express.static(path.join(__dirname, "../public/css"), {
      maxAge: cacheTime,
      setHeaders: function (res, path) {
        if (process.env.NODE_ENV === "production") {
          res.setHeader("Cache-Control", "public, max-age=86400");
        } else {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    })
  );

  // JavaScript
  app.use(
    "/js",
    express.static(path.join(__dirname, "../public/js"), {
      maxAge: cacheTime,
      setHeaders: function (res, path) {
        if (process.env.NODE_ENV === "production") {
          res.setHeader("Cache-Control", "public, max-age=86400");
        } else {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    })
  );

  // Imágenes
  app.use(
    "/img",
    express.static(path.join(__dirname, "../public/img"), {
      maxAge: process.env.NODE_ENV === "production" ? 604800000 : cacheTime, // 7 días para imágenes en producción
      setHeaders: function (res, path) {
        if (process.env.NODE_ENV === "production") {
          res.setHeader("Cache-Control", "public, max-age=604800");
        }
      },
    })
  );
}

module.exports = setupStaticFiles;
