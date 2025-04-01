/**
 * Datos de prueba para usuarios
 * Estos datos se utilizan en pruebas unitarias, de integración y E2E
 */

// Pacientes de prueba
const testPatients = [
  {
    email: 'paciente.test@example.com',
    password: '123456',
    nombre: 'Paciente de Prueba',
    tipo: 'paciente',
    edad: 30,
    sexo: 'masculino',
    altura: 175,
    peso: 75
  },
  {
    email: 'paciente2.test@example.com',
    password: '123456',
    nombre: 'Paciente de Prueba 2',
    tipo: 'paciente',
    edad: 25,
    sexo: 'femenino',
    altura: 165,
    peso: 60
  }
];

// Médicos de prueba
const testDoctors = [
  {
    email: 'medico.test@example.com',
    password: '123456',
    nombre: 'Médico de Prueba',
    tipo: 'medico',
    especialidad: 'Nutrición',
    licencia: 'MED12345'
  },
  {
    email: 'medico2.test@example.com',
    password: '123456',
    nombre: 'Médico de Prueba 2',
    tipo: 'medico',
    especialidad: 'Endocrinología',
    licencia: 'MED67890'
  }
];

// Usuarios de API para pruebas de autenticación
const apiUsers = {
  validUser: {
    email: 'api.user@example.com',
    password: '123456'
  },
  invalidUser: {
    email: 'invalid.user@example.com',
    password: 'wrong_password'
  }
};

module.exports = {
  testPatients,
  testDoctors,
  apiUsers
}; 