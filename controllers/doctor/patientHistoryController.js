const Profile = require("../../models/Profile");
const FoodEntry = require("../../models/FoodEntry");
const DoctorPatient = require("../../models/DoctorPatient");
const { checkSupabaseConnection } = require("../../config/supabase");
const moment = require("moment");

// Ver historial de un paciente
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.session.user.id;
    const { date_from, date_to, page: pageParam } = req.query;
    const page = parseInt(pageParam) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log(
      `[DEBUG] Doctor ${doctorId} está intentando ver el historial del paciente ${patientId}`
    );

    // Verificar la conexión a Supabase primero
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.success) {
      console.error(
        "Error de conexión a Supabase al intentar ver historial del paciente:",
        connectionCheck.error
      );
      req.flash(
        "error_msg",
        "Error de conexión a la base de datos. Se mostrarán los datos disponibles."
      );
      // Continuamos la ejecución para mostrar al menos los datos básicos
    }

    // Crear objeto de filtros para pasar a la vista
    const filters = {
      date_from: date_from || "",
      date_to: date_to || "",
    };

    // Verificar que el paciente está asignado a este médico
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId);

    if (!assignedResult.success) {
      throw new Error(
        `Error al verificar asignación del paciente: ${assignedResult.error}`
      );
    }

    console.log(
      `[DEBUG] Pacientes asignados al doctor:`,
      assignedResult.patients.map((p) => ({ id: p.id, name: p.name }))
    );

    // Asegurar que los IDs sean strings para la comparación
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
      throw new Error(
        `Error al obtener perfil del paciente: ${profileResult.error}`
      );
    }

    // Lógica para manejar el filtro de fecha
    let dateFilter = null;

    if (date_from && date_to) {
      // Si ambas fechas están presentes, usamos el rango completo
      dateFilter = { from: new Date(date_from), to: new Date(date_to) };
    } else if (date_from) {
      // Si solo hay fecha inicial, filtramos desde esa fecha hasta hoy
      dateFilter = { from: new Date(date_from), to: new Date() };
    } else if (date_to) {
      // Si solo hay fecha final, filtramos desde el inicio del tiempo hasta esa fecha
      dateFilter = { from: new Date(0), to: new Date(date_to) };
    }

    // Obtener entradas del paciente, incluyendo las imágenes
    const entriesResult = await FoodEntry.getHistoryByUserId(
      patientId,
      dateFilter,
      page,
      limit
    );

    if (!entriesResult.success) {
      req.flash(
        "error_msg",
        `Error al cargar las entradas: ${entriesResult.error}`
      );
      // En lugar de lanzar error, seguimos mostrando la página con un arreglo vacío
      return res.render("doctor/patient-history", {
        title: `Historial de ${profileResult.profile.name}`,
        user: req.session.user,
        patient: profileResult.profile,
        entries: [],
        filters,
        currentPage: page,
        totalPages: 0,
        moment,
        currentUrl: req.originalUrl.split("?")[0],
      });
    }

    console.log(
      `[DEBUG] Se encontraron ${entriesResult.entries.length} entradas para el paciente ${patientId}`
    );

    // Para cada entrada, procesar la URL de la imagen
    if (entriesResult.entries.length > 0) {
      entriesResult.entries.forEach((entry) => {
        // Si no hay image_url o image_data, usar la imagen por defecto
        if (!entry.image_url && !entry.image_data) {
          entry.image_url = "/img/empty-plate.svg";
        } else if (entry.image_data && !entry.image_url) {
          // Si hay image_data pero no image_url, usar image_data como url
          entry.image_url = entry.image_data;
        }
      });
    }

    res.render("doctor/patient-history", {
      title: `Historial de ${profileResult.profile.name}`,
      user: req.session.user,
      patient: profileResult.profile,
      entries: entriesResult.entries,
      filters,
      currentPage: page,
      totalPages: entriesResult.pagination?.totalPages || 0,
      moment,
      currentUrl: req.originalUrl.split("?")[0],
    });
  } catch (error) {
    console.error("Error al obtener historial del paciente:", error);
    req.flash(
      "error_msg",
      "Error al cargar el historial del paciente: " + error.message
    );
    res.redirect("/doctor/dashboard");
  }
};
