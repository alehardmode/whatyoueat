describe('Ejemplo de prueba de inicio de sesión', () => {
  let page;

  beforeEach(async () => {
    page = await global.browser.newPage();
    await page.goto('http://localhost:3000/login');
  });

  afterEach(async () => {
    await page.close();
  });

  it('debería mostrar el formulario de inicio de sesión', async () => {
    // Verificar que existe el formulario
    const formExists = await page.$('form');
    expect(formExists).not.toBeNull();

    // Verificar que existen los campos de correo y contraseña
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
  });
}); 