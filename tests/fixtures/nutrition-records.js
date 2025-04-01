/**
 * Datos de prueba para registros nutricionales
 * Estos datos se utilizan en pruebas unitarias, de integración y E2E
 */

// Registros de comidas para pruebas
const testMeals = [
  {
    userId: 'user123',
    fecha: '2023-04-01',
    tipo: 'desayuno',
    comidas: [
      {
        nombre: 'Huevos revueltos',
        cantidad: '2 unidades',
        calorias: 180,
        proteinas: 12,
        carbohidratos: 2,
        grasas: 14
      },
      {
        nombre: 'Pan integral',
        cantidad: '2 rebanadas',
        calorias: 120,
        proteinas: 6,
        carbohidratos: 22,
        grasas: 2
      }
    ]
  },
  {
    userId: 'user123',
    fecha: '2023-04-01',
    tipo: 'almuerzo',
    comidas: [
      {
        nombre: 'Pechuga de pollo a la plancha',
        cantidad: '150g',
        calorias: 250,
        proteinas: 40,
        carbohidratos: 0,
        grasas: 10
      },
      {
        nombre: 'Ensalada mixta',
        cantidad: '1 porción',
        calorias: 80,
        proteinas: 3,
        carbohidratos: 15,
        grasas: 1
      }
    ]
  }
];

// Registros diarios para pruebas
const testDailyRecords = [
  {
    userId: 'user123',
    fecha: '2023-04-01',
    totalCalorias: 1500,
    totalProteinas: 90,
    totalCarbohidratos: 150,
    totalGrasas: 60,
    agua: 2000,
    comidas: ['breakfast-123', 'lunch-123', 'dinner-123']
  },
  {
    userId: 'user123',
    fecha: '2023-04-02',
    totalCalorias: 1650,
    totalProteinas: 95,
    totalCarbohidratos: 170,
    totalGrasas: 55,
    agua: 2200,
    comidas: ['breakfast-124', 'lunch-124', 'dinner-124']
  }
];

module.exports = {
  testMeals,
  testDailyRecords
}; 