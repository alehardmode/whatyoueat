/**
 * Servicio para gestión y verificación de tokens de Supabase Auth
 */

const { supabase } = require("../config/supabase");

class TokenService {
  /**
   * Verifica la validez de un token JWT
   * @param {string} token - Token JWT a verificar
   * @returns {Object} Resultado de la verificación
   */
  static async verifyToken(token) {
    try {
      // Verificar token con Supabase Auth
      const { data, error } = await supabase.auth.getUser(token);

      // Si hay error, el token no es válido
      if (error) {
        return {
          valid: false,
          error: error.message,
          errorCode: error.code || "invalid_token",
        };
      }

      // Si no hay usuario en la respuesta, el token no es válido
      if (!data || !data.user) {
        return {
          valid: false,
          error: "Token inválido o usuario no encontrado",
          errorCode: "invalid_token",
        };
      }

      // Token válido, devolver información del usuario
      return {
        valid: true,
        user: data.user,
      };
    } catch (error) {
      console.error("Error al verificar token:", error);
      return {
        valid: false,
        error:
          error.message || "Error inesperado durante verificación de token",
        errorCode: "verification_error",
      };
    }
  }

  /**
   * Obtiene la sesión actual del usuario
   * @returns {Object} Resultado con la sesión actual
   */
  static async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code || "session_error",
        };
      }

      // Si no hay sesión activa
      if (!data || !data.session) {
        return {
          success: false,
          session: null,
          message: "No hay sesión activa",
        };
      }

      return {
        success: true,
        session: data.session,
      };
    } catch (error) {
      console.error("Error al obtener sesión:", error);
      return {
        success: false,
        error: error.message || "Error inesperado al obtener sesión",
        errorCode: "session_error",
      };
    }
  }

  /**
   * Refresca una sesión expirada
   * @returns {Object} Resultado con la nueva sesión o error
   */
  static async refreshExpiredSession() {
    try {
      // Primero obtener la sesión actual
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        return {
          success: false,
          error: sessionError.message,
          errorCode: sessionError.code || "session_error",
        };
      }

      // Si no hay sesión para refrescar
      if (!sessionData || !sessionData.session) {
        return {
          success: false,
          error: "No hay sesión activa para refrescar",
          errorCode: "no_session",
        };
      }

      // Refrescar sesión usando el refresh token
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: sessionData.session.refresh_token,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code || "refresh_error",
        };
      }

      if (!data || !data.session) {
        return {
          success: false,
          error: "No se pudo refrescar la sesión",
          errorCode: "refresh_failed",
        };
      }

      return {
        success: true,
        session: data.session,
      };
    } catch (error) {
      console.error("Error al refrescar sesión:", error);
      return {
        success: false,
        error: error.message || "Error inesperado al refrescar sesión",
        errorCode: "refresh_error",
      };
    }
  }

  /**
   * Verifica si una sesión está expirada o próxima a expirar
   * @param {Object} session - Objeto de sesión a verificar
   * @param {number} bufferSeconds - Segundos de margen antes de expiración (por defecto 300 = 5 min)
   * @returns {boolean} true si la sesión está expirada o próxima a expirar
   */
  static isSessionExpired(session, bufferSeconds = 300) {
    if (!session || !session.expires_at) {
      return true;
    }

    // Verificar si la sesión está expirada o próxima a expirar
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);

    // Considerar expirada si faltan menos de bufferSeconds para expirar
    return expiresAt - now < bufferSeconds;
  }
}

module.exports = TokenService;
