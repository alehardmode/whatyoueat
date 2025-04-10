const DoctorPatient = require("../../models/DoctorPatient");
const { supabaseAdmin } = require("../../config/supabase");
const dayjs = require("dayjs");

// Required plugins for template usage
require('dayjs/locale/es');
dayjs.locale('es');
const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);

// Mostrar dashboard del médico
exports.getDashboard = async (req, res) => {
  try {
    const doctorId = req.session.userId;

    if (!doctorId) {
      console.error("Error: Doctor ID no encontrado en la sesión");
      return res.status(403).render("error", {
        message: "Acceso denegado. No estás autenticado.",
        user: req.session.user,
      });
    }

    // Pasar supabaseAdmin como opción
    const result = await DoctorPatient.getPatientsByDoctor(doctorId, { adminClient: supabaseAdmin });

    if (!result.success) {
      console.error("Error al obtener pacientes para el dashboard:", result.error);
      throw new Error(result.error || "Error al obtener pacientes."); 
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
      doctorName: req.session.user?.name || "Médico",
    });
  } catch (error) {
    console.error("Error al cargar dashboard:", error);
    res.status(500).render("error", {
      message: error.message || "Error al cargar el dashboard del médico.",
      user: req.session.user,
    });
  }
};
