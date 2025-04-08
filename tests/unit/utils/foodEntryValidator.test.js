/**
 * Pruebas unitarias para el módulo foodEntryValidator
 */

const foodEntryValidator = require("../../../utils/validators/foodEntryValidator");

describe("Food Entry Validator", () => {
  // Pruebas para validateFoodEntry
  describe("validateFoodEntry", () => {
    test("debería validar entradas correctas", () => {
      const validData = {
        foodName: "Ensalada César",
        description: "Ensalada con pollo, lechuga romana y aderezo César",
      };

      const validFile = {
        mimetype: "image/jpeg",
        size: 1024 * 1024, // 1MB
      };

      expect(
        foodEntryValidator.validateFoodEntry(validData, validFile)
      ).toBeNull();
    });

    test("debería rechazar entradas sin imagen", () => {
      const validData = {
        foodName: "Ensalada César",
        description: "Ensalada con pollo, lechuga romana y aderezo César",
      };

      expect(foodEntryValidator.validateFoodEntry(validData, null)).toBe(
        "Debes seleccionar una foto"
      );
    });

    test("debería rechazar imágenes con tipo de archivo incorrecto", () => {
      const validData = {
        foodName: "Ensalada César",
        description: "Ensalada con pollo, lechuga romana y aderezo César",
      };

      const invalidFile = {
        mimetype: "application/pdf",
        size: 1024 * 1024,
      };

      expect(foodEntryValidator.validateFoodEntry(validData, invalidFile)).toBe(
        "El archivo debe ser una imagen (jpg, png, webp, etc.)"
      );
    });

    test("debería rechazar imágenes demasiado grandes", () => {
      const validData = {
        foodName: "Ensalada César",
        description: "Ensalada con pollo, lechuga romana y aderezo César",
      };

      const oversizedFile = {
        mimetype: "image/jpeg",
        size: 15 * 1024 * 1024, // 15MB (mayor que el límite de 10MB)
      };

      expect(
        foodEntryValidator.validateFoodEntry(validData, oversizedFile)
      ).toContain("La foto excede el tamaño máximo permitido");
    });

    test("debería rechazar entradas sin nombre de comida", () => {
      const invalidData = {
        foodName: "",
        description: "Ensalada con pollo, lechuga romana y aderezo César",
      };

      const validFile = {
        mimetype: "image/jpeg",
        size: 1024 * 1024,
      };

      expect(foodEntryValidator.validateFoodEntry(invalidData, validFile)).toBe(
        "Debes proporcionar un nombre para la comida"
      );
    });

    test("debería rechazar entradas sin descripción", () => {
      const invalidData = {
        foodName: "Ensalada César",
        description: "",
      };

      const validFile = {
        mimetype: "image/jpeg",
        size: 1024 * 1024,
      };

      expect(foodEntryValidator.validateFoodEntry(invalidData, validFile)).toBe(
        "Debes proporcionar una descripción de la comida"
      );
    });

    test("debería rechazar entradas con espacios en blanco", () => {
      const invalidData = {
        foodName: "   ",
        description: "Ensalada con pollo, lechuga romana y aderezo César",
      };

      const validFile = {
        mimetype: "image/jpeg",
        size: 1024 * 1024,
      };

      expect(foodEntryValidator.validateFoodEntry(invalidData, validFile)).toBe(
        "Debes proporcionar un nombre para la comida"
      );
    });
  });

  // Pruebas para validateFoodEntryUpdate
  describe("validateFoodEntryUpdate", () => {
    test("debería validar actualizaciones correctas", () => {
      const validData = {
        name: "Ensalada César Actualizada",
        description:
          "Ensalada con pollo, lechuga romana y aderezo César casero",
      };

      expect(foodEntryValidator.validateFoodEntryUpdate(validData)).toBeNull();
    });

    test("debería rechazar actualizaciones sin nombre", () => {
      const invalidData = {
        name: "",
        description: "Ensalada con pollo, lechuga romana y aderezo César",
      };

      expect(foodEntryValidator.validateFoodEntryUpdate(invalidData)).toBe(
        "El nombre de la comida es obligatorio"
      );
    });

    test("debería rechazar actualizaciones sin descripción", () => {
      const invalidData = {
        name: "Ensalada César",
        description: "",
      };

      expect(foodEntryValidator.validateFoodEntryUpdate(invalidData)).toBe(
        "La descripción es obligatoria"
      );
    });

    test("debería rechazar actualizaciones con espacios en blanco", () => {
      const invalidData = {
        name: "Ensalada César",
        description: "   ",
      };

      expect(foodEntryValidator.validateFoodEntryUpdate(invalidData)).toBe(
        "La descripción es obligatoria"
      );
    });
  });
});
