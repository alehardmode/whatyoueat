const {
  optimizeImage,
  generateUniqueImageName,
} = require("../../../utils/imageProcessor");
const fs = require("fs");
const path = require("path");

// Mock de sharp
jest.mock("sharp", () => {
  // Mock para simular el comportamiento básico de sharp
  const mockSharp = jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("optimized-image-mock")),
  }));

  return mockSharp;
});

// Mock de fs
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe("Image Processor Utility (IP-UTIL-01)", () => {
  // Buffer de muestra para pruebas
  const mockImageBuffer = Buffer.from(
    Array(1024 * 1024)
      .fill("x")
      .join("")
  ); // ~1MB

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("optimizeImage", () => {
    test("debería optimizar una imagen correctamente con opciones por defecto", async () => {
      // Ejecutar la función
      const result = await optimizeImage(mockImageBuffer);

      // Verificar el resultado
      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.originalSize).toBe(mockImageBuffer.length);
      expect(result.format).toBe("webp");
    });

    test("debería aplicar configuraciones personalizadas", async () => {
      // Opciones personalizadas
      const options = {
        width: 800,
        height: 600,
        quality: 60,
        format: "jpeg",
        maxSizeKB: 200,
      };

      // Ejecutar la función
      const result = await optimizeImage(mockImageBuffer, options);

      // Verificar el resultado
      expect(result.success).toBe(true);
      expect(result.format).toBe("jpeg");
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    test("debería manejar errores durante la optimización", async () => {
      // Forzar un error en sharp
      const sharp = require("sharp");
      sharp.mockImplementationOnce(() => {
        throw new Error("Error simulado en sharp");
      });

      // Ejecutar la función
      const result = await optimizeImage(mockImageBuffer);

      // Verificar el resultado
      expect(result.success).toBe(false);
      expect(result.error).toBe("Error simulado en sharp");
      expect(result.originalSize).toBe(mockImageBuffer.length);
    });
  });

  describe("generateUniqueImageName", () => {
    test("debería generar nombre único con formato por defecto (webp)", () => {
      const originalName = "test-image.jpg";
      const result = generateUniqueImageName(originalName);

      // Verificar el formato
      expect(result).toMatch(/test-image-\d+-[a-z0-9]+\.webp$/);
    });

    test("debería respetar el formato especificado", () => {
      const originalName = "test-image.jpg";
      const format = "png";
      const result = generateUniqueImageName(originalName, format);

      // Verificar el formato
      expect(result).toMatch(/test-image-\d+-[a-z0-9]+\.png$/);
    });

    test("debería sanitizar caracteres especiales en el nombre", () => {
      const originalName = "test image@with!special#chars.jpg";
      const result = generateUniqueImageName(originalName);

      // No debe contener espacios ni caracteres especiales
      expect(result).not.toMatch(/[ @!#]/);
      // El formato debe ser correcto
      expect(result).toMatch(
        /test-image-with-special-chars-\d+-[a-z0-9]+\.webp$/
      );
    });
  });
});
