const Profile = require("../../models/Profile");
const FoodEntry = require("../../models/FoodEntry");
const DoctorPatient = require("../../models/DoctorPatient");
const { checkSupabaseConnection } = require("../../config/supabase");
const moment = require("moment");

// Ver detalle de una entrada de un paciente
exports.getEntryDetail = async (req, res) => {
  try {
    const { patientId, entryId } = req.params;
    const doctorId = req.session.user.id;

    console.log(
      `[DEBUG] Doctor ${doctorId} está intentando ver el detalle de la entrada ${entryId} del paciente ${patientId}`
    );

    // Verificar la conexión a Supabase primero
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.success) {
      console.error(
        "Error de conexión a Supabase al intentar ver detalle de entrada:",
        connectionCheck.error
      );
      // Notificar pero continuar
      req.flash(
        "error_msg",
        "Error de conexión a la base de datos. Se mostrará la información disponible."
      );
    }

    // Verificar que el paciente está asignado a este médico
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId);

    if (!assignedResult.success) {
      throw new Error(`Error al verificar permisos: ${assignedResult.error}`);
    }

    // Convertir IDs a string para comparación
    const patientIdStr = String(patientId);
    const isAssigned = assignedResult.patients.some(
      (p) => String(p.id) === patientIdStr
    );

    console.log(
      `[DEBUG] ¿El paciente ${patientIdStr} está asignado al doctor?: ${isAssigned}`
    );

    if (!isAssigned) {
      req.flash("error_msg", "No tienes permiso para ver este paciente");
      return res.redirect("/doctor/dashboard");
    }

    // Obtener perfil del paciente
    const profileResult = await Profile.getById(patientId);

    if (!profileResult.success) {
      throw new Error(`Error al obtener perfil: ${profileResult.error}`);
    }

    // Obtener entrada específica con imagen incluida
    const entryResult = await FoodEntry.getById(entryId);

    if (!entryResult.success) {
      req.flash(
        "error_msg",
        `Error al cargar la entrada: ${entryResult.error}`
      );
      return res.redirect(`/doctor/patient/${patientId}/history`);
    }

    // Verificar que la entrada pertenece al paciente
    if (String(entryResult.entry.user_id) !== patientIdStr) {
      req.flash(
        "error_msg",
        "La entrada solicitada no pertenece a este paciente"
      );
      return res.redirect(`/doctor/patient/${patientId}/history`);
    }

    // Si no hay datos de imagen, usar imagen por defecto
    const entry = entryResult.entry;
    if (!entry.image_data && !entry.image_url) {
      entry.image_url = "/img/empty-plate.svg"; // URL por defecto
    } else if (entry.image_data && !entry.image_url) {
      // Si hay image_data pero no image_url
      entry.image_url = entry.image_data;
    }

    res.render("doctor/entry-detail", {
      title: "Detalle de Comida",
      user: req.session.user,
      patient: profileResult.profile,
      entry: entry,
      moment,
    });
  } catch (error) {
    console.error("Error al obtener detalle de entrada:", error);
    req.flash(
      "error_msg",
      "Error al cargar los detalles de la entrada: " + error.message
    );
    res.redirect("/doctor/dashboard");
  }
};
