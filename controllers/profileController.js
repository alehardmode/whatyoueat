const Profile = require("../models/Profile");
const { handleHttpError } = require("../utils/errorHandler");

// Mostrar perfil de usuario
exports.getProfile = async (req, res) => {
  try {
    // Verificar si existe la sesión de usuario
    if (!req.session || !req.session.user || !req.session.user.id) {
      req.flash(
        "error_msg",
        "Sesión no válida. Por favor inicia sesión nuevamente."
      );
      return res.redirect("/auth/login");
    }

    const userId = req.session.user.id;
    const result = await Profile.getById(userId);

    if (!result.success) {
      req.flash(
        "error_msg",
        "No se pudo cargar la información completa del perfil."
      );
      return res.render("profile", {
        title: "Mi Perfil",
        user: req.session.user,
        profile: null,
        stats: {},
      });
    }

    // Verificar si el perfil está activo
    if (result.profile && result.profile.is_active === false) {
      req.flash("error_msg", "Este perfil ha sido desactivado.");
      return res.redirect("/");
    }

    // Obtener estadísticas del usuario
    const statsResult = await Profile.getUserStats(userId);
    const userStats = statsResult.success ? statsResult.stats : {};

    res.render("profile", {
      title: "Mi Perfil",
      user: req.session.user,
      profile: result.profile,
      stats: userStats,
    });
  } catch (error) {
    console.error("Error en getProfile:", error);

    try {
      // Si handleHttpError falla, aseguramos que el usuario vea algo
      handleHttpError(error, res, req, "Ocurrió un error al cargar tu perfil");
      // No hacemos redirect aquí, ya que handleHttpError lo hará
    } catch (handlerError) {
      console.error("Error adicional en handleHttpError:", handlerError);

      // Último recurso: intentar renderizar algo básico
      if (!res.headersSent) {
        req.flash("error_msg", "Ocurrió un error al cargar tu perfil");
        return res.render("profile", {
          title: "Mi Perfil",
          user: req.session.user,
          profile: null,
          error: "No se pudieron cargar los datos del perfil",
          stats: {},
        });
      }
    }
  }
};

// Mostrar formulario de edición de perfil
exports.getEditProfile = async (req, res) => {
  try {
    // Verificar si existe la sesión de usuario
    if (!req.session || !req.session.user || !req.session.user.id) {
      req.flash(
        "error_msg",
        "Sesión no válida. Por favor inicia sesión nuevamente."
      );
      return res.redirect("/auth/login");
    }

    const userId = req.session.user.id;
    const result = await Profile.getById(userId);

    if (!result.success) {
      req.flash("error_msg", "No se pudo cargar la información del perfil.");
      return res.redirect("/profile");
    }

    // Verificar si el perfil está activo
    if (result.profile && result.profile.is_active === false) {
      req.flash("error_msg", "Este perfil ha sido desactivado.");
      return res.redirect("/");
    }

    res.render("edit-profile", {
      title: "Editar Perfil",
      user: req.session.user,
      profile: result.profile,
    });
  } catch (error) {
    console.error("Error en getEditProfile:", error);

    try {
      handleHttpError(
        error,
        res,
        req,
        "Ocurrió un error al cargar el formulario de edición"
      );
      // No hacemos redirect aquí, ya que handleHttpError lo hará
    } catch (handlerError) {
      console.error("Error adicional en handleHttpError:", handlerError);

      // Si todo falla, redirigir a la página de perfil
      if (!res.headersSent) {
        req.flash("error_msg", "No se pudo cargar el formulario de edición");
        return res.redirect("/profile");
      }
    }
  }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    // Verificar si existe la sesión de usuario
    if (!req.session || !req.session.user || !req.session.user.id) {
      req.flash(
        "error_msg",
        "Sesión no válida. Por favor inicia sesión nuevamente."
      );
      return res.redirect("/auth/login");
    }

    const userId = req.session.user.id;
    const { name, bio, phone } = req.body;

    // Validación básica
    if (!name || name.trim() === "") {
      req.flash("error_msg", "El nombre es obligatorio");
      return res.redirect("/profile/edit");
    }

    // Preparar objeto de actualización
    const updates = {
      name: name.trim(),
      bio: bio ? bio.trim() : null,
      phone: phone ? phone.trim() : null,
      updated_at: new Date(),
    };

    // Actualizar en base de datos
    const result = await Profile.update(userId, updates);

    if (!result.success) {
      req.flash("error_msg", "Error al actualizar el perfil: " + result.error);
      return res.redirect("/profile/edit");
    }

    // Actualizar la información en la sesión
    req.session.user.name = updates.name;

    req.flash("success_msg", "Perfil actualizado correctamente");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error en updateProfile:", error);

    try {
      handleHttpError(error, res, req, "Error al actualizar el perfil");
      // No hacemos redirect aquí, ya que handleHttpError lo hará
    } catch (handlerError) {
      console.error("Error adicional en handleHttpError:", handlerError);

      // Si todo falla, redirigir a la página de edición
      if (!res.headersSent) {
        req.flash("error_msg", "Error al actualizar el perfil");
        return res.redirect("/profile/edit");
      }
    }
  }
};
