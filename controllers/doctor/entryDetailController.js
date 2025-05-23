const Profile = require("../../models/Profile");
const FoodEntry = require("../../models/FoodEntry");
const DoctorPatient = require("../../models/DoctorPatient");
const { checkSupabaseConnection } = require("../../config/supabase");
const { createClient } = require("@supabase/supabase-js");
const dayjs = require("dayjs");

// Required for plugins used in the template (e.g., fromNow)
require('dayjs/locale/es');
dayjs.locale('es');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);
const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);

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

    // ---> Start: Added admin client creation logic
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERROR] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Cannot create admin client for email lookup.");
      req.flash("error_msg", "Error de configuración del servidor. No se pueden verificar todos los datos.");
      // Consider redirecting if admin client is crucial for permission check
      // return res.redirect("/doctor/dashboard"); 
    }

    let supabaseAdmin = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
         console.warn("[WARN] Admin client could not be created for entry detail view. Proceeding without it, permission checks might be incomplete.")
         // If permission check absolutely requires admin client, throw error here.
         // throw new Error("Configuration error: Missing Supabase admin credentials for permission check.");
    }
    // ---> End: Added admin client creation logic

    // Verificar que el paciente está asignado a este médico
    // Pass adminClient to the model function
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId, { adminClient: supabaseAdmin }); 

    if (!assignedResult.success) {
      // Update error handling to reflect potential adminClient issue
      const baseError = assignedResult.error || 'Unknown error during permission check.';
      const errorDetails = supabaseAdmin ? baseError : `${baseError} (Admin client unavailable)`;
      throw new Error(`Error al verificar permisos: ${errorDetails}`);
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
      dayjs,
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
