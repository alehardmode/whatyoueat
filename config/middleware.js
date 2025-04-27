const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const fileUpload = require("express-fileupload");
const express = require("express");

/**
 * Configura todos los middlewares de la aplicación
 * @param {Express} app - Instancia de Express
 */
function setupMiddleware(app) {
  // Configuración de seguridad mejorada con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net",
            "blob:",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://cdnjs.cloudflare.com",
            "https://cdn.jsdelivr.net",
          ],
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          frameSrc: ["'self'", "https://www.google.com"],
          workerSrc: ["'self'", "blob:"],
          connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
        },
      },
      // Política de Referrer explícita (nuevo default de Helmet v8)
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      // Configuración explícita de HSTS
      strictTransportSecurity: {
        maxAge: 63072000, // 2 años (nuevo default de Helmet v8)
        includeSubDomains: false, // Mantener el comportamiento anterior (false) por seguridad
        preload: false
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Middlewares para parseo de datos
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configuración mejorada de method-override
  app.use(methodOverride("_method"));
  app.use(
    methodOverride(function (req, res) {
      if (req.body && typeof req.body === "object" && "_method" in req.body) {
        const method = req.body._method;
        delete req.body._method;
        return method;
      }
      if (req.query && "_method" in req.query) {
        return req.query._method;
      }
    })
  );

  // Middleware para CORS
  app.use(
    cors({
      origin: process.env.APP_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // Logging
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  // Middleware de depuración para method-override
  if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
      console.log(`[DEBUG] Método HTTP: ${req.method}, Ruta: ${req.path}`);
      next();
    });
  }

  // Middleware para subida de archivos
  app.use(
    fileUpload({
      limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
      useTempFiles: false,
      abortOnLimit: true,
      createParentPath: true,
      debug: false,
      safeFileNames: true,
      preserveExtension: true,
    })
  );

  // Verificación de SESSION_SECRET
  if (
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET === "tu_secreto_para_sesiones"
  ) {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      "ADVERTENCIA: La variable SESSION_SECRET no está configurada correctamente."
    );
    console.warn(
      "\x1b[33m%s\x1b[0m",
      'Ejecuta "node utils/generateSecret.js" y actualiza tu archivo .env'
    );
  }

  // Indicar a Express que confíe en el primer proxy (Render)
  // Esto es crucial para que `cookie.secure` funcione correctamente en producción
  if (process.env.NODE_ENV === "production") {
    app.set('trust proxy', 1); // Confía en el primer proxy
  }

  // Configuración de sesiones
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secreto-temporal",
      resave: false,
      saveUninitialized: true,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
      },
    })
  );

  // Flash messages - debe ir después de session
  app.use(flash());

  // Middleware para interceptar posibles redirecciones de Supabase
  app.use((req, res, next) => {
    console.log("URL solicitada:", req.originalUrl);

    if (
      req.path === "/auth/login" &&
      req.headers.referer &&
      req.headers.referer.includes("supabase.co/auth/v1/verify")
    ) {
      console.log("Detectada redirección desde Supabase a login");
      return res.redirect("/auth/email-confirmed");
    }

    if (req.query.access_token || req.query.type === "signup") {
      console.log("Token o parámetro de confirmación detectado en la URL");
      return res.redirect("/auth/email-confirmed");
    }

    if (req.path === "/auth/callback" && !req.query.token_hash) {
      console.log(
        "Detectada ruta callback sin token, posible redirección incorrecta"
      );
      return res.redirect("/auth/email-confirmed");
    }

    next();
  });

  // Variables globales y datos para las vistas
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.errors = req.flash("errors");
    res.locals.user = req.session.user || null;
    res.locals.appName = "WhatYouEat";
    res.locals.currentYear = new Date().getFullYear();
    next();
  });
}

module.exports = setupMiddleware;
