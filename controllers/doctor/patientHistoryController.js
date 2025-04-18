const Profile = require("../../models/Profile");
const FoodEntry = require("../../models/FoodEntry");
const DoctorPatient = require("../../models/DoctorPatient");
const { checkSupabaseConnection } = require("../../config/supabase");
const { createClient } = require("@supabase/supabase-js");
const dayjs = require("dayjs");

// Required plugins for template usage
require('dayjs/locale/es');
dayjs.locale('es');
const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);

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

    // Create admin client inside the function
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      // Log the error clearly, but might still allow fallback behavior depending on needs
      console.error("[ERROR] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Cannot create admin client for email lookup.");
      // Depending on strictness, you might throw or just flash a more specific error
      req.flash("error_msg", "Error de configuración del servidor. No se pueden verificar todos los datos del paciente.");
      // Potentially redirect earlier if admin client is absolutely essential
      // return res.redirect("/doctor/dashboard"); 
      // For now, let it continue, but the check might fail if it relies on emails
    }

    // Initialize admin client only if keys are present
    let supabaseAdmin = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
        // Handle the case where the admin client couldn't be created.
        // The model function MUST handle the case where adminClient is null or undefined.
        // Throwing an error here might be better if the functionality is critical.
         console.warn("[WARN] Admin client could not be created. Proceeding without it, email lookups might fail or be skipped.")
         // For now, we proceed, assuming the model function has fallbacks or the check doesn't strictly need emails.
         // If the check *requires* emails, throw here:
         // throw new Error("Configuration error: Missing Supabase admin credentials.");
    }

    // Crear objeto de filtros para pasar a la vista
    const filters = {
      date_from: date_from || "",
      date_to: date_to || "",
    };

    // Verificar que el paciente está asignado a este médico
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId, { adminClient: supabaseAdmin });

    if (!assignedResult.success) {
      // Ensure the error message reflects the potential adminClient issue if applicable
      const baseError = assignedResult.error || 'Unknown error during assignment check.';
      const errorDetails = supabaseAdmin ? baseError : `${baseError} (Admin client unavailable for email lookup)`;
      throw new Error(
        `Error al verificar asignación del paciente: ${errorDetails}`
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
        dayjs,
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
      dayjs,
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
