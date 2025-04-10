const Profile = require("../../models/Profile");
const DoctorPatient = require("../../models/DoctorPatient");
const dayjs = require("dayjs");

// Required plugins for template usage
require('dayjs/locale/es');
dayjs.locale('es');
const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);

// Filtrar pacientes por nombre
exports.searchPatients = async (req, res) => {
  try {
    const { search } = req.query;
    const doctorId = req.session.user.id;

    let patients = [];
    let error = null;

    if (search) {
      // Buscar pacientes por nombre
      const result = await Profile.searchPatientsByName(search);

      if (!result.success) {
        throw new Error(result.error);
      }

      patients = result.patients;
    }

    // Obtener pacientes ya asignados a este médico
    const assignedResult = await DoctorPatient.getPatientsByDoctor(doctorId);
    const assignedIds = assignedResult.success
      ? assignedResult.patients.map((p) => p.id)
      : [];

    // Marcar en la lista de búsqueda cuáles ya están asignados
    patients = patients.map((patient) => ({
      ...patient,
      isAssigned: assignedIds.includes(patient.id),
    }));

    res.render("doctor/search-patients", {
      title: "Buscar Pacientes",
      user: req.session.user,
      patients,
      searchTerm: search || "",
      dayjs,
    });
  } catch (error) {
    console.error("Error al buscar pacientes:", error);
    res.render("doctor/search-patients", {
      title: "Buscar Pacientes",
      user: req.session.user,
      patients: [],
      searchTerm: req.query.search || "",
      error: "Error al buscar pacientes",
    });
  }
};

// Asignar un paciente a este médico
exports.assignPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.session.user.id;

    // Asignar paciente
    const result = await DoctorPatient.assign(doctorId, patientId);

    if (!result.success) {
      throw new Error(result.error);
    }

    req.flash("success_msg", "Paciente asignado correctamente");

    // Guardar la sesión antes de redireccionar para asegurar que todos los datos se persistan
    req.session.save((err) => {
      if (err) {
        console.error(
          "Error al guardar la sesión después de asignar paciente:",
          err
        );
      }
      res.redirect("/doctor/dashboard");
    });
  } catch (error) {
    console.error("Error al asignar paciente:", error);
    req.flash("error_msg", "Error al asignar paciente: " + error.message);

    // También guardar la sesión en caso de error
    req.session.save((err) => {
      if (err) {
        console.error(
          "Error al guardar la sesión después de un error de asignación:",
          err
        );
      }
      res.redirect("/doctor/dashboard");
    });
  }
};

// Eliminar la relación con un paciente
exports.removePatient = async (req, res) => {
  try {
    const { relationId } = req.params;
    const doctorId = req.session.user.id;

    // Eliminar relación
    const result = await DoctorPatient.remove(relationId, doctorId);

    if (!result.success) {
      throw new Error(result.error);
    }

    req.flash("success_msg", "Paciente removido correctamente");
    res.redirect("/doctor/dashboard");
  } catch (error) {
    console.error("Error al remover paciente:", error);
    req.flash("error_msg", "Error al remover paciente: " + error.message);
    res.redirect("/doctor/dashboard");
  }
};
