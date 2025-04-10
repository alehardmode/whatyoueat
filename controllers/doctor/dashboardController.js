const DoctorPatient = require("../../models/DoctorPatient");
const dayjs = require("dayjs");

// Required plugins for template usage
require('dayjs/locale/es');
dayjs.locale('es');
const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);

// Mostrar dashboard del médico
exports.getDashboard = async (req, res) => {
  try {
    const doctorId = req.session.user.id;

    // Obtener lista de pacientes asignados - Asegurar que la consulta no use caché
    const result = await DoctorPatient.getPatientsByDoctor(doctorId);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Añadir información de timestamp para debugging
    console.log(
      `Dashboard cargado a las ${new Date().toISOString()} con ${
        result.patients.length
      } pacientes`
    );

    res.render("doctor/dashboard", {
      title: "Dashboard del Médico",
      user: req.session.user,
      patients: result.patients,
      dayjs,
      emailConfirmed: req.session.emailConfirmed,
      // Añadir timestamp para evitar caché del navegador
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error al cargar dashboard:", error);
    res.render("doctor/dashboard", {
      title: "Dashboard del Médico",
      user: req.session.user,
      patients: [],
      error: "Error al cargar la información del dashboard",
      emailConfirmed: req.session.emailConfirmed,
      // Añadir timestamp para evitar caché del navegador
      timestamp: Date.now(),
    });
  }
};
