/**
 * Pruebas unitarias para funcionalidades de Supabase Storage
 * Tests correspondientes a SB-STOR-01 y SB-STOR-03 en la matriz de pruebas
 */

// Mock del módulo de Supabase
jest.mock("../../../config/supabase", () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

// Importar después del mock
const { supabase } = require("../../../config/supabase");
const StorageService = require("../../../models/StorageService");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Mock de stream de archivo en buffer
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  createReadStream: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

describe("StorageService - Supabase Storage (SB-STOR-01, SB-STOR-03)", () => {
  // Datos de prueba
  const testUserId = uuidv4();
  const testBucket = "food_images";
  const testFileName = "test-image.jpg";
  const testFilePath = path.join("uploads", "temp", testFileName);
  const mockFileBuffer = Buffer.from("mock image content");
  const mockFileStream = { pipe: jest.fn() };

  // Respuestas simuladas de Storage
  const mockFileUrl = `https://mocksupabase.co/storage/v1/object/public/${testBucket}/${testUserId}/${testFileName}`;

  // Mocks para los métodos de Storage
  const mockStorageBuilder = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
    list: jest.fn(),
    createSignedUrl: jest.fn(),
    download: jest.fn(),
  };

  // Reiniciar mocks antes de cada test
  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar el mock de fs
    fs.readFileSync.mockReturnValue(mockFileBuffer);
    fs.createReadStream.mockReturnValue(mockFileStream);
    fs.promises.readFile.mockResolvedValue(mockFileBuffer);

    // Configurar respuestas por defecto para los mocks de Storage
    supabase.storage.from.mockReturnValue(mockStorageBuilder);

    // Upload exitoso
    mockStorageBuilder.upload.mockResolvedValue({
      data: { path: `${testUserId}/${testFileName}` },
      error: null,
    });

    // GetPublicUrl exitoso
    mockStorageBuilder.getPublicUrl.mockReturnValue({
      data: { publicUrl: mockFileUrl },
    });

    // Remove exitoso
    mockStorageBuilder.remove.mockResolvedValue({
      data: { message: "Files deleted successfully" },
      error: null,
    });

    // List exitoso
    mockStorageBuilder.list.mockResolvedValue({
      data: [
        { name: "test-image1.jpg", id: "1" },
        { name: "test-image2.jpg", id: "2" },
      ],
      error: null,
    });
  });

  // Test para SB-STOR-01: Subir imágenes de alimentos
  describe("uploadFoodImage", () => {
    test("debería subir una imagen correctamente", async () => {
      // Llamar a la función a probar
      const result = await StorageService.uploadFoodImage(
        testUserId,
        testFilePath
      );

      // Verificar que se llama al bucket correcto
      expect(supabase.storage.from).toHaveBeenCalledWith(testBucket);

      // Verificar que se llama a upload con los parámetros correctos
      expect(mockStorageBuilder.upload).toHaveBeenCalledWith(
        expect.stringContaining(testUserId),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: "image/jpeg",
          upsert: true,
        })
      );

      // Verificar el resultado exitoso
      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
    });

    test("debería manejar errores en la subida", async () => {
      // Simular error en la subida
      mockStorageBuilder.upload.mockResolvedValueOnce({
        data: null,
        error: { message: "Error al subir archivo", code: "storage_error" },
      });

      // Llamar a la función a probar
      const result = await StorageService.uploadFoodImage(
        testUserId,
        testFilePath
      );

      // Verificar que detecta el error
      expect(result.success).toBe(false);
      expect(result.error).toContain("Error al subir archivo");
    });

    test("debería manejar excepciones durante el proceso", async () => {
      // Forzar error en la lectura del archivo
      fs.readFileSync.mockImplementationOnce(() => {
        throw new Error("Error al leer archivo");
      });

      // Llamar a la función a probar
      const result = await StorageService.uploadFoodImage(
        testUserId,
        testFilePath
      );

      // Verificar que maneja la excepción
      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al leer archivo");
    });
  });

  // Test para SB-STOR-03: Obtener URL de imagen
  describe("getFoodImageUrl", () => {
    test("debería obtener la URL pública de una imagen", async () => {
      // Path en formato userId/fileName
      const imagePath = `${testUserId}/${testFileName}`;

      // Llamar a la función a probar
      const result = await StorageService.getFoodImageUrl(imagePath);

      // Verificar que se llama al bucket correcto
      expect(supabase.storage.from).toHaveBeenCalledWith(testBucket);

      // Verificar que se llama a getPublicUrl con el path correcto
      expect(mockStorageBuilder.getPublicUrl).toHaveBeenCalledWith(imagePath);

      // Verificar el resultado exitoso
      expect(result.success).toBe(true);
      expect(result.url).toBe(mockFileUrl);
    });

    test("debería manejar errores al obtener URL", async () => {
      // Simular error al obtener URL
      mockStorageBuilder.getPublicUrl.mockReturnValueOnce({
        data: null,
        error: { message: "Error al obtener URL", code: "url_error" },
      });

      // Llamar a la función a probar
      const result = await StorageService.getFoodImageUrl("invalid-path");

      // Verificar que detecta el error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // Test adicional para eliminar imágenes
  describe("deleteFoodImage", () => {
    test("debería eliminar una imagen correctamente", async () => {
      // Path en formato userId/fileName
      const imagePath = `${testUserId}/${testFileName}`;

      // Llamar a la función a probar
      const result = await StorageService.deleteFoodImage(imagePath);

      // Verificar que se llama al bucket correcto
      expect(supabase.storage.from).toHaveBeenCalledWith(testBucket);

      // Verificar que se llama a remove con el path correcto
      expect(mockStorageBuilder.remove).toHaveBeenCalledWith([imagePath]);

      // Verificar el resultado exitoso
      expect(result.success).toBe(true);
    });

    test("debería manejar errores al eliminar", async () => {
      // Simular error al eliminar
      mockStorageBuilder.remove.mockResolvedValueOnce({
        data: null,
        error: { message: "Error al eliminar archivo", code: "remove_error" },
      });

      // Llamar a la función a probar
      const result = await StorageService.deleteFoodImage("invalid-path");

      // Verificar que detecta el error
      expect(result.success).toBe(false);
      expect(result.error).toContain("Error al eliminar archivo");
    });
  });

  // Test para listar imágenes
  describe("listFoodImages", () => {
    test("debería listar imágenes de un usuario", async () => {
      // Llamar a la función a probar
      const result = await StorageService.listFoodImages(testUserId);

      // Verificar que se llama al bucket correcto
      expect(supabase.storage.from).toHaveBeenCalledWith(testBucket);

      // Verificar que se llama a list con el path de usuario
      expect(mockStorageBuilder.list).toHaveBeenCalledWith(
        expect.stringContaining(testUserId),
        expect.any(Object)
      );

      // Verificar el resultado exitoso
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(2);
    });

    test("debería manejar errores al listar", async () => {
      // Simular error al listar
      mockStorageBuilder.list.mockResolvedValueOnce({
        data: null,
        error: { message: "Error al listar archivos", code: "list_error" },
      });

      // Llamar a la función a probar
      const result = await StorageService.listFoodImages(testUserId);

      // Verificar que detecta el error
      expect(result.success).toBe(false);
      expect(result.error).toContain("Error al listar archivos");
    });
  });
});
