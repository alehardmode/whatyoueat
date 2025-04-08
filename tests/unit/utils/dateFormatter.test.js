/**
 * Pruebas unitarias para el módulo dateFormatter
 */

const dateFormatter = require("../../../utils/dateFormatter");

describe("Date Formatter", () => {
  // Pruebas para formatDateToDisplay
  describe("formatDateToDisplay", () => {
    test("debería formatear fechas válidas correctamente (DD/MM/YYYY)", () => {
      const date = new Date(2023, 0, 15); // 15/01/2023
      expect(dateFormatter.formatDateToDisplay(date)).toBe("15/01/2023");

      expect(dateFormatter.formatDateToDisplay("2023-02-28")).toBe(
        "28/02/2023"
      );
      expect(dateFormatter.formatDateToDisplay("2023-12-05T10:15:30")).toBe(
        "05/12/2023"
      );
      expect(dateFormatter.formatDateToDisplay(1672531200000)).toBe(
        "01/01/2023"
      ); // Timestamp para 01/01/2023
    });

    test("debería manejar fechas en diferentes formatos", () => {
      expect(dateFormatter.formatDateToDisplay("2023/04/15")).toBe(
        "15/04/2023"
      );
      expect(dateFormatter.formatDateToDisplay("15-04-2023")).toBe(
        "15/04/2023"
      );
    });

    test("debería manejar casos especiales correctamente", () => {
      expect(dateFormatter.formatDateToDisplay("")).toBe("");
      expect(dateFormatter.formatDateToDisplay(null)).toBe("");
      expect(dateFormatter.formatDateToDisplay(undefined)).toBe("");
      expect(dateFormatter.formatDateToDisplay("texto-invalido")).toBe("");
    });
  });

  // Pruebas para formatDateForDatabase
  describe("formatDateForDatabase", () => {
    test("debería formatear fechas para base de datos (YYYY-MM-DD)", () => {
      const date = new Date(2023, 0, 15); // 15/01/2023
      expect(dateFormatter.formatDateForDatabase(date)).toBe("2023-01-15");

      expect(dateFormatter.formatDateForDatabase("15/01/2023")).toBe(
        "2023-01-15"
      );
      expect(dateFormatter.formatDateForDatabase("2023-12-05T10:15:30")).toBe(
        "2023-12-05"
      );
    });

    test("debería manejar casos especiales correctamente", () => {
      expect(dateFormatter.formatDateForDatabase("")).toBe("");
      expect(dateFormatter.formatDateForDatabase(null)).toBe("");
      expect(dateFormatter.formatDateForDatabase(undefined)).toBe("");
      expect(dateFormatter.formatDateForDatabase("texto-invalido")).toBe("");
    });
  });

  // Pruebas para formatTimeToDisplay
  describe("formatTimeToDisplay", () => {
    test("debería formatear horas correctamente (HH:MM)", () => {
      const dateTime = new Date(2023, 0, 15, 14, 30); // 14:30
      expect(dateFormatter.formatTimeToDisplay(dateTime)).toBe("14:30");

      expect(dateFormatter.formatTimeToDisplay("2023-01-15T09:05:30")).toBe(
        "09:05"
      );
      expect(dateFormatter.formatTimeToDisplay("2023-01-15T23:59:59")).toBe(
        "23:59"
      );
    });

    test("debería agregar ceros a la izquierda cuando sea necesario", () => {
      const earlyMorning = new Date(2023, 0, 15, 5, 7); // 05:07
      expect(dateFormatter.formatTimeToDisplay(earlyMorning)).toBe("05:07");
    });

    test("debería manejar casos especiales correctamente", () => {
      expect(dateFormatter.formatTimeToDisplay("")).toBe("");
      expect(dateFormatter.formatTimeToDisplay(null)).toBe("");
      expect(dateFormatter.formatTimeToDisplay(undefined)).toBe("");
      expect(dateFormatter.formatTimeToDisplay("texto-invalido")).toBe("");
    });
  });

  // Pruebas para daysBetween
  describe("daysBetween", () => {
    test("debería calcular días entre fechas correctamente", () => {
      expect(dateFormatter.daysBetween("2023-01-01", "2023-01-10")).toBe(9);
      expect(dateFormatter.daysBetween("2023-01-10", "2023-01-01")).toBe(9);
      expect(dateFormatter.daysBetween("2023-01-01", "2023-02-01")).toBe(31);
    });

    test("debería devolver 0 para la misma fecha", () => {
      expect(dateFormatter.daysBetween("2023-01-15", "2023-01-15")).toBe(0);
    });

    test("debería manejar diferentes formatos de fecha", () => {
      expect(dateFormatter.daysBetween("15/01/2023", "20/01/2023")).toBe(5);
      const date1 = new Date(2023, 0, 1);
      const date2 = new Date(2023, 0, 5);
      expect(dateFormatter.daysBetween(date1, date2)).toBe(4);
    });

    test("debería ignorar las horas al calcular días", () => {
      expect(
        dateFormatter.daysBetween("2023-01-01T10:00:00", "2023-01-02T08:00:00")
      ).toBe(1);
    });

    test("debería manejar casos especiales correctamente", () => {
      expect(dateFormatter.daysBetween("", "2023-01-15")).toBe(0);
      expect(dateFormatter.daysBetween("2023-01-15", "")).toBe(0);
      expect(dateFormatter.daysBetween(null, "2023-01-15")).toBe(0);
      expect(dateFormatter.daysBetween("2023-01-15", null)).toBe(0);
      expect(dateFormatter.daysBetween("texto-invalido", "2023-01-15")).toBe(0);
    });
  });
});
