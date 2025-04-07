// Configuración global para pruebas e2e con Puppeteer
process.env.NODE_ENV = "test";
jest.setTimeout(30000);

// Crear mock de puppeteer para usar en las pruebas
const createMockPuppeteer = () => {
  return {
    launch: jest.fn().mockImplementation(() => {
      return {
        newPage: jest.fn().mockImplementation(() => {
          return {
            goto: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
            title: jest.fn().mockResolvedValue("WhatYouEat - Mock Title"),
            waitForSelector: jest.fn().mockResolvedValue({}),
            $: jest.fn().mockResolvedValue({}),
            $$: jest.fn().mockResolvedValue([{}, {}]),
            type: jest.fn().mockResolvedValue(undefined),
            click: jest.fn().mockResolvedValue(undefined),
            waitForNavigation: jest.fn().mockResolvedValue(undefined),
            url: jest.fn().mockReturnValue("http://localhost:3001/mockpath"),
            content: jest
              .fn()
              .mockResolvedValue("<html><body>Mock content</body></html>"),
            evaluate: jest.fn().mockResolvedValue(true),
          };
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
};

// Usar mock en lugar de puppeteer real
const mockPuppeteer = createMockPuppeteer();
global.puppeteer = mockPuppeteer;

// Configuración global para antes de todas las pruebas
beforeAll(async () => {
  // Iniciar el navegador mock
  global.browser = await mockPuppeteer.launch();
});

// Configuración global para después de todas las pruebas
afterAll(async () => {
  // Cerrar el navegador mock
  if (global.browser) {
    await global.browser.close();
  }
});
