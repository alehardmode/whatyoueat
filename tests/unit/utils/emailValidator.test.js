/**
 * Pruebas unitarias para el módulo emailValidator
 */

const emailValidator = require("../../../utils/validators/emailValidator");

describe("Email Validator", () => {
  // Pruebas para isValidEmail
  describe("isValidEmail", () => {
    test("debería validar correos con formato correcto", () => {
      expect(emailValidator.isValidEmail("usuario@ejemplo.com")).toBe(true);
      expect(emailValidator.isValidEmail("usuario.nombre@ejemplo.com")).toBe(
        true
      );
      expect(emailValidator.isValidEmail("usuario+filtro@ejemplo.com")).toBe(
        true
      );
      expect(
        emailValidator.isValidEmail("usuario@subdominio.ejemplo.com")
      ).toBe(true);
      expect(emailValidator.isValidEmail("123456@ejemplo.com")).toBe(true);
      expect(emailValidator.isValidEmail("usuario@ejemplo.co.uk")).toBe(true);
    });

    test("debería rechazar correos con formato incorrecto", () => {
      expect(emailValidator.isValidEmail("")).toBe(false);
      expect(emailValidator.isValidEmail(null)).toBe(false);
      expect(emailValidator.isValidEmail(undefined)).toBe(false);
      expect(emailValidator.isValidEmail("usuarioejemplo.com")).toBe(false);
      expect(emailValidator.isValidEmail("usuario@")).toBe(false);
      expect(emailValidator.isValidEmail("@ejemplo.com")).toBe(false);
      expect(emailValidator.isValidEmail("usuario@ejemplo")).toBe(false);
      expect(emailValidator.isValidEmail("usuario@.com")).toBe(false);
      expect(emailValidator.isValidEmail("usuario@ejemplo..com")).toBe(false);
      expect(emailValidator.isValidEmail("usuario@ejemplo.com.")).toBe(false);
      expect(emailValidator.isValidEmail("usuario@@ejemplo.com")).toBe(false);
    });
  });

  // Pruebas para isFromDomain
  describe("isFromDomain", () => {
    test("debería validar correos de dominios específicos", () => {
      expect(
        emailValidator.isFromDomain("usuario@ejemplo.com", "ejemplo.com")
      ).toBe(true);
      expect(
        emailValidator.isFromDomain("usuario@EJEMPLO.COM", "ejemplo.com")
      ).toBe(true);
      expect(
        emailValidator.isFromDomain("usuario@ejemplo.com", [
          "ejemplo.com",
          "otro.com",
        ])
      ).toBe(true);
      expect(
        emailValidator.isFromDomain("usuario@otro.com", [
          "ejemplo.com",
          "otro.com",
        ])
      ).toBe(true);
    });

    test("debería rechazar correos de dominios no permitidos", () => {
      expect(
        emailValidator.isFromDomain("usuario@diferente.com", "ejemplo.com")
      ).toBe(false);
      expect(
        emailValidator.isFromDomain(
          "usuario@subdominio.ejemplo.com",
          "ejemplo.com"
        )
      ).toBe(false);
      expect(
        emailValidator.isFromDomain("usuario@otro.org", [
          "ejemplo.com",
          "otro.com",
        ])
      ).toBe(false);
    });

    test("debería manejar casos especiales correctamente", () => {
      expect(emailValidator.isFromDomain("", "ejemplo.com")).toBe(false);
      expect(emailValidator.isFromDomain(null, "ejemplo.com")).toBe(false);
      expect(emailValidator.isFromDomain(undefined, "ejemplo.com")).toBe(false);
      expect(emailValidator.isFromDomain("usuario@ejemplo.com", "")).toBe(
        false
      );
      expect(emailValidator.isFromDomain("usuario@ejemplo.com", null)).toBe(
        false
      );
      expect(
        emailValidator.isFromDomain("usuario@ejemplo.com", undefined)
      ).toBe(false);
      expect(emailValidator.isFromDomain("usuario@ejemplo.com", [])).toBe(
        false
      );
      expect(
        emailValidator.isFromDomain("correo-sin-dominio", "ejemplo.com")
      ).toBe(false);
    });
  });

  // Pruebas para normalizeEmail
  describe("normalizeEmail", () => {
    test("debería normalizar correos a minúsculas y sin espacios", () => {
      expect(emailValidator.normalizeEmail("Usuario@Ejemplo.Com")).toBe(
        "usuario@ejemplo.com"
      );
      expect(emailValidator.normalizeEmail(" usuario@ejemplo.com ")).toBe(
        "usuario@ejemplo.com"
      );
      expect(emailValidator.normalizeEmail("USUARIO@EJEMPLO.COM")).toBe(
        "usuario@ejemplo.com"
      );
    });

    test("debería manejar casos especiales correctamente", () => {
      expect(emailValidator.normalizeEmail("")).toBe("");
      expect(emailValidator.normalizeEmail(null)).toBe("");
      expect(emailValidator.normalizeEmail(undefined)).toBe("");
    });
  });
});
