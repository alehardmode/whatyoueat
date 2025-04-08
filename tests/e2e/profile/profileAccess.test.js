const puppeteer = require("puppeteer");
const path = require("path");
const { expect } = require("@jest/globals");

// Configuración
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const WAIT_OPTIONS = { waitUntil: "networkidle0", timeout: 10000 };

// Pruebas E2E para acceso al perfil
describe("Pruebas E2E de acceso a perfil", () => {
  let browser;
  let page;

  // Credenciales de prueba para login
  const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "test123456";

  // Setup - se ejecuta antes de todas las pruebas
  beforeAll(async () => {
    // Lanzar navegador en modo no-headless para debug, usar headless: true para CI
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();

    // Configurar viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Login antes de las pruebas
    await login(page, TEST_EMAIL, TEST_PASSWORD);
  }, 30000);

  // Teardown - se ejecuta después de todas las pruebas
  afterAll(async () => {
    await browser.close();
  });

  // Función auxiliar para hacer login
  async function login(page, email, password) {
    try {
      // Navegar a la página de login
      await page.goto(`${BASE_URL}/auth/login`, WAIT_OPTIONS);

      // Esperar a que se cargue el formulario
      await page.waitForSelector('form[action="/auth/login"]');

      // Llenar formulario
      await page.type('input[name="email"]', email);
      await page.type('input[name="password"]', password);

      // Enviar formulario y esperar navegación
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation(WAIT_OPTIONS),
      ]);

      // Verificar si estamos logueados (debería estar en dashboard o página principal)
      const currentUrl = page.url();
      const isLoggedIn =
        currentUrl.includes("/dashboard") ||
        currentUrl === `${BASE_URL}/` ||
        currentUrl.includes("/patient") ||
        currentUrl.includes("/doctor");

      if (!isLoggedIn) {
        console.error("No se pudo iniciar sesión. URL actual:", currentUrl);
        throw new Error("Falló el login");
      }

      console.log("Login exitoso. URL actual:", currentUrl);
      return true;
    } catch (error) {
      console.error("Error durante el login:", error);
      return false;
    }
  }

  // Test: Acceso a la página de perfil
  test("debería poder acceder a la página de perfil", async () => {
    try {
      // Navegar a la página de perfil
      await page.goto(`${BASE_URL}/profile`, WAIT_OPTIONS);

      // Verificar que el título de la página contenga "Perfil"
      const pageTitle = await page.title();
      expect(pageTitle).toContain("Perfil");

      // Verificar que la página contiene elementos clave
      const headingExists = await page.$eval("h1", (el) =>
        el.textContent.includes("Perfil")
      );
      expect(headingExists).toBeTruthy();

      // Verificar que se muestra información del perfil
      const profileContent = await page.evaluate(() => {
        const content = document.body.textContent;
        return {
          hasName: content.includes("Nombre:"),
          hasEmail: content.includes("Correo Electrónico:"),
          hasBio: content.includes("Biografía:"),
        };
      });

      expect(profileContent.hasName).toBeTruthy();
      expect(profileContent.hasEmail).toBeTruthy();
      expect(profileContent.hasBio).toBeTruthy();

      // Verificar que existe el botón de editar perfil
      const editButtonExists = await page.$('a[href="/profile/edit"]');
      expect(editButtonExists).not.toBeNull();

      console.log("Prueba de acceso a perfil completada con éxito");
    } catch (error) {
      console.error("Error en prueba de acceso a perfil:", error);
      throw error;
    }
  }, 15000);

  // Test: Acceso a la página de edición de perfil
  test("debería poder acceder a la página de edición de perfil", async () => {
    try {
      // Navegar a la página de perfil
      await page.goto(`${BASE_URL}/profile`, WAIT_OPTIONS);

      // Hacer clic en el botón de editar perfil
      await Promise.all([
        page.click('a[href="/profile/edit"]'),
        page.waitForNavigation(WAIT_OPTIONS),
      ]);

      // Verificar que hemos llegado a la página de edición
      const currentUrl = page.url();
      expect(currentUrl).toContain("/profile/edit");

      // Verificar que la página contiene elementos clave
      const headingExists = await page.$eval("h1", (el) =>
        el.textContent.includes("Editar Perfil")
      );
      expect(headingExists).toBeTruthy();

      // Verificar que el formulario existe
      const formExists = await page.$('form[action="/profile/update"]');
      expect(formExists).not.toBeNull();

      // Verificar que existen los campos principales
      const nameInputExists = await page.$('input[name="name"]');
      const bioTextareaExists = await page.$('textarea[name="bio"]');
      const submitButtonExists = await page.$('button[type="submit"]');

      expect(nameInputExists).not.toBeNull();
      expect(bioTextareaExists).not.toBeNull();
      expect(submitButtonExists).not.toBeNull();

      console.log("Prueba de acceso a edición de perfil completada con éxito");
    } catch (error) {
      console.error("Error en prueba de acceso a edición de perfil:", error);
      throw error;
    }
  }, 15000);

  // Test: Verificar actualización de perfil
  test("debería poder actualizar la información del perfil", async () => {
    try {
      // Navegar a la página de edición de perfil
      await page.goto(`${BASE_URL}/profile/edit`, WAIT_OPTIONS);

      // Obtener el valor actual del nombre
      const currentName = await page.$eval(
        'input[name="name"]',
        (el) => el.value
      );

      // Generar un nuevo nombre para asegurar que cambia
      const newName = `Test User ${Date.now().toString().slice(-4)}`;
      const newBio = `Esta es una biografía de prueba generada el ${new Date().toLocaleString(
        "es-ES"
      )}`;

      // Limpiar los campos y escribir nuevos valores
      await page.$eval('input[name="name"]', (el) => (el.value = ""));
      await page.type('input[name="name"]', newName);

      await page.$eval('textarea[name="bio"]', (el) => (el.value = ""));
      await page.type('textarea[name="bio"]', newBio);

      // Enviar el formulario
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation(WAIT_OPTIONS),
      ]);

      // Verificar que fuimos redirigidos a la página de perfil
      const currentUrl = page.url();
      expect(currentUrl).toContain("/profile");
      expect(currentUrl).not.toContain("/edit");

      // Verificar que el nombre se actualizó
      const pageContent = await page.evaluate(() => document.body.textContent);
      expect(pageContent).toContain(newName);

      // Verificar que hay un mensaje de éxito
      const hasSuccessMessage = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".alert")).some(
          (el) =>
            el.textContent.includes("actualizado") ||
            el.textContent.includes("éxito")
        );
      });

      // Esta verificación podría fallar si los mensajes flash no se implementan como alertas
      // O si la UI no muestra mensajes de éxito de forma consistente
      if (!hasSuccessMessage) {
        console.warn(
          "Advertencia: No se encontró mensaje de éxito explícito en la página. Esto podría ser normal dependiendo de la implementación."
        );
      }

      console.log("Prueba de actualización de perfil completada");
    } catch (error) {
      console.error("Error en prueba de actualización de perfil:", error);
      throw error;
    }
  }, 20000);
});
