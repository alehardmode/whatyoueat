const { supabase } = require("../config/supabase");

class DoctorPatient {
  // Asignar un paciente a un médico
  static async assign(doctorId, patientId) {
    try {
      // Verificar que el doctor es realmente un médico
      const { data: doctorProfile, error: doctorError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", doctorId)
        .single();

      if (doctorError) throw doctorError;

      if (doctorProfile.role !== "medico") {
        return {
          success: false,
          error: "Solo los médicos pueden tener pacientes asignados",
        };
      }

      // Verificar que el paciente es realmente un paciente
      const { data: patientProfile, error: patientError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", patientId)
        .single();

      if (patientError) throw patientError;

      if (patientProfile.role !== "paciente") {
        return {
          success: false,
          error: "Solo los pacientes pueden ser asignados a médicos",
        };
      }

      // Verificar si ya existe la relación
      const { data: existingRelation, error: checkError } = await supabase
        .from("doctor_patient_relationships")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("patient_id", patientId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      // Si ya existe, actualizar el estado a active si no lo está
      if (existingRelation) {
        if (existingRelation.status === "active") {
          return { success: true, relation: existingRelation };
        }

        const { data, error } = await supabase
          .from("doctor_patient_relationships")
          .update({ status: "active", updated_at: new Date() })
          .eq("id", existingRelation.id)
          .select();

        if (error) throw error;

        return { success: true, relation: data[0] };
      }

      // Si no existe, crear nueva relación
      const { data, error } = await supabase
        .from("doctor_patient_relationships")
        .insert([
          {
            doctor_id: doctorId,
            patient_id: patientId,
            status: "active",
            created_at: new Date(),
          },
        ])
        .select();

      if (error) throw error;

      return { success: true, relation: data[0] };
    } catch (error) {
      console.error("Error al asignar paciente:", error);
      return { success: false, error: error.message };
    }
  }

  // Obtener todos los pacientes de un médico
  static async getPatientsByDoctor(doctorId, options = {}) {
    const client = supabase; // Use the standard client by default
    const adminClient = options.adminClient; // Use admin client if provided

    if (!adminClient) {
      console.error("Error: adminClient option is required for getPatientsByDoctor to fetch emails.");
      return { success: false, error: "Configuration error: adminClient is missing." };
    }

    try {
      console.log(`[DEBUG] Consultando relaciones y perfiles para médico ${doctorId}`);

      // Query 1: Get relationships and patient profile data (name, id)
      const { data: relations, error: relationError } = await client // Use standard client
        .from("doctor_patient_relationships")
        .select(
          `
          id,
          status,
          patient:patient_id (
            id, 
            name,
            created_at
          )
        `
        )
        .eq("doctor_id", doctorId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (relationError) {
           console.error("[DEBUG] Supabase query 1 (relations/profiles) error in getPatientsByDoctor:", relationError);
           throw relationError;
       }
       console.log("[DEBUG] Supabase query 1 (relations/profiles) data in getPatientsByDoctor:", JSON.stringify(relations, null, 2));
       
       if (!relations || relations.length === 0) {
          return { success: true, patients: [] }; // No patients found
       }

       // Extract patient IDs for email lookup
       const patientIds = relations.map(r => r.patient?.id).filter(id => id); 
       if (patientIds.length === 0) {
          console.warn("[DEBUG] No valid patient IDs found after fetching relations.");
          return { success: true, patients: [] }; // Should not happen if relations were found, but safeguard
       }
       console.log(`[DEBUG] Extracted patient IDs for email lookup: ${patientIds.join(', ')}`);

       // Query 2: Get emails from auth.users using Admin Client
       console.log(`[DEBUG] Querying auth.users for emails: ${patientIds.join(', ')} using ADMIN client.`);
       const { data: users, error: userError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000, // Adjust if expecting more patients per doctor; consider pagination
       });
        
       // Filter users to only those in patientIds
       const relevantUsers = users?.users?.filter(u => patientIds.includes(u.id)) || [];

       if (userError) { // Check for errors *after* listUsers call
           console.error("[DEBUG] Supabase query 2 (auth.users) error in getPatientsByDoctor:", userError);
           // Decide how to handle: fail, or return partial data? Throwing is safer.
           throw userError; 
       }
       console.log("[DEBUG] Supabase query 2 (auth.users) data:", JSON.stringify(relevantUsers, null, 2));

        // Create maps for easy lookup
        const profileMap = relations.reduce((map, r) => {
            if (r.patient) map[r.patient.id] = { profile: r.patient, relation: r };
            return map;
        }, {});
        const emailMap = relevantUsers.reduce((map, user) => {
            map[user.id] = user.email;
            return map;
        }, {});

       // Map results merging profile and email data
       const patients = patientIds.map((patientId) => {
         const profileData = profileMap[patientId];
         const email = emailMap[patientId];

         if (!profileData) {
             console.warn(`[DEBUG] Profile data missing for patient ID ${patientId}. Skipping.`);
             return null;
         }

         return {
           relationId: profileData.relation.id,
           status: profileData.relation.status,
           id: String(profileData.profile.id),
           name: profileData.profile.name || 'Nombre no encontrado',
           email: email || 'Email no disponible', // Get email from auth.users lookup
           created_at: profileData.profile.created_at,
         };
       }).filter(p => p !== null); // Remove any null entries

      console.log(
        `[DEBUG] Se encontraron ${patients.length} pacientes para el médico ${doctorId}`
      );

      return { success: true, patients };
    } catch (error) {
      console.error("Error al obtener pacientes del médico:", error);
      return { success: false, error: error.message };
    }
  }

  // Obtener todos los médicos de un paciente
  static async getDoctorsByPatient(patientId, options = {}) {
    const client = supabase; // Use the standard client by default
    const adminClient = options.adminClient; // Use admin client if provided

    if (!adminClient) {
      console.error("Error: adminClient option is required for getDoctorsByPatient to fetch emails.");
      return { success: false, error: "Configuration error: adminClient is missing." };
    }
    
    try {
       console.log(`[DEBUG] Consultando relaciones para paciente ${patientId}`);
       
       // Query 1: Get relationships (only doctor_id needed here)
       const { data: relations, error: relationError } = await client // Use standard client respecting RLS
        .from("doctor_patient_relationships")
        .select(
          `
          id,
          status,
          doctor_id 
        `
        )
        .eq("patient_id", patientId)
        .eq("status", "active");

       if (relationError) {
           console.error("[DEBUG] Supabase query 1 error in getDoctorsByPatient:", relationError);
           throw relationError;
       }
       console.log("[DEBUG] Supabase query 1 (relations) data in getDoctorsByPatient:", JSON.stringify(relations, null, 2));

       if (!relations || relations.length === 0) {
          return { success: true, doctors: [] }; // No doctors found
       }

       // Extract doctor IDs
        const doctorIds = relations.map(r => r.doctor_id).filter(id => id);

        if (doctorIds.length === 0) {
            console.warn("[DEBUG] No valid doctor IDs found in relations for getDoctorsByPatient");
            // If relations were found but IDs are missing, return empty
            return { success: true, doctors: [] };
        }
        console.log(`[DEBUG] Extracted doctor IDs for profile lookup: ${doctorIds.join(', ')}`);

       // Query 2: Get doctor profiles (using admin client to bypass RLS if necessary)
        console.log(`[DEBUG] Querying profiles for doctors: ${doctorIds.join(', ')} using ADMIN client.`);
        const { data: doctorProfiles, error: profileError } = await adminClient
           .from('profiles') 
           .select('id, name, created_at') // Select fields EXCEPT email
           .in('id', doctorIds);

       if (profileError) {
             console.error("[DEBUG] Supabase query 2 (profiles) error in getDoctorsByPatient:", profileError);
             // Decide how to handle: fail, or return partial data?
             // Returning partial data might be confusing. Let's throw.
             throw profileError; 
        }
        console.log("[DEBUG] Supabase query 2 (profiles) data:", JSON.stringify(doctorProfiles, null, 2));

       // Query 3: Get emails from auth.users using Admin Client
       console.log(`[DEBUG] Querying auth.users for emails: ${doctorIds.join(', ')} using ADMIN client.`);
       // Use listUsers and filter, as there isn't a direct `in()` filter for listUsers
       const { data: usersData, error: userError } = await adminClient.auth.admin.listUsers({
            page: 1, 
            perPage: 1000 // Adjust if necessary
       });
        
       // Filter the results to only include the relevant doctor IDs
       const relevantUsers = usersData?.users?.filter(u => doctorIds.includes(u.id)) || [];

       if (userError) { 
           console.error("[DEBUG] Supabase query 3 (auth.users) error in getDoctorsByPatient:", userError);
           throw userError; 
       }
       console.log("[DEBUG] Supabase query 3 (auth.users) data:", JSON.stringify(relevantUsers, null, 2));

       // Create maps for easy lookup
       const relationMap = relations.reduce((map, rel) => {
            if(rel.doctor_id) map[rel.doctor_id] = rel;
            return map;
       }, {});
       const profileMap = doctorProfiles.reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
       }, {});
       const emailMap = relevantUsers.reduce((map, user) => {
            map[user.id] = user.email;
            return map;
       }, {});

      // Map results and merge profile data
      const doctors = doctorIds.map((doctorId) => {
        const relation = relationMap[doctorId];
        const profile = profileMap[doctorId];
        const email = emailMap[doctorId];

        // Need at least relation and profile to proceed
        if (!relation || !profile) {
            console.warn(`[DEBUG] Relation or Profile data missing for doctor ID ${doctorId}. Skipping.`);
            return null; // Skip if essential data lookup failed
        }
        
        return {
          relationId: relation.id,
          status: relation.status,
          id: String(profile.id),
          name: profile.name || 'Nombre no encontrado',
          email: email || 'Email no disponible', // Get email from auth.users lookup
          created_at: profile.created_at, // Or maybe relation.created_at? Decide based on meaning
        };
      }).filter(d => d !== null); // Remove nulls

      console.log(
        `[DEBUG] Se encontraron ${doctors.length} médicos para el paciente ${patientId}`
      );

      return { success: true, doctors };
    } catch (error) {
      console.error("Error al obtener médicos del paciente:", error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar relación médico-paciente
  static async remove(relationId, userId) {
    try {
      // Verificar que la relación exista y el usuario tenga permiso
      const { data: relation, error: checkError } = await supabase
        .from("doctor_patient_relationships")
        .select("*")
        .eq("id", relationId)
        .single();

      if (checkError) throw checkError;

      // Comprobar que el usuario que realiza la acción es el médico
      if (relation.doctor_id !== userId) {
        return {
          success: false,
          error: "No tienes permiso para eliminar esta relación",
        };
      }

      // Actualizar el estado a 'terminated'
      const { data, error } = await supabase
        .from("doctor_patient_relationships")
        .update({ status: "terminated", updated_at: new Date() })
        .eq("id", relationId)
        .select();

      if (error) throw error;

      return { success: true, relation: data[0] };
    } catch (error) {
      console.error("Error al eliminar relación médico-paciente:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DoctorPatient;
