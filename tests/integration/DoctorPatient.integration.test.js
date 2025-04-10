require('dotenv').config({ path: '.env.test' }); // Load .env.test variables

const { createClient } = require('@supabase/supabase-js');
const DoctorPatient = require('../../models/DoctorPatient');
// Default client (uses anon key from config/supabase.js -> .env.test)
const { supabase } = require('../../config/supabase'); 

// --- Admin Client for Setup/Teardown (uses service_role key) ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment for integration tests');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
// ------------------------------------------------------------------

// Helper function to generate unique emails for test runs
const generateTestEmail = (prefix) => `${prefix}-${Date.now()}@integration-test.com`;

describe('DoctorPatient Model - Integration Tests', () => {
  let testDoctor = null;
  let testPatient = null;
  let testRelationship = null;

  const doctorEmail = generateTestEmail('doctor');
  const patientEmail = generateTestEmail('patient');
  const testPassword = 'password123'; // Simple password for test users

  beforeAll(async () => {
    // --- Create Test Users and Profiles ---
    try {
      // 1. Create Doctor User (auth.users) - Use Admin client
      const { data: doctorAuthUser, error: doctorAuthErr } = await supabaseAdmin.auth.admin.createUser({ // <-- Use admin client's createUser
        email: doctorEmail,
        password: testPassword,
        email_confirm: true, // Automatically confirm email for tests
        // You can add other user metadata here if needed
        user_metadata: { name: 'Integration Test Doctor' } // <-- Set name here
      });
      if (doctorAuthErr) throw new Error(`Error creating doctor auth user: ${doctorAuthErr.message}`);
      // createUser returns the user object directly in data, not nested under data.user like signUp
      if (!doctorAuthUser || !doctorAuthUser.user) throw new Error('Doctor auth user creation failed.'); 
      const doctorUserId = doctorAuthUser.user.id;
      console.log(`[Test Setup] Created doctor auth user: ${doctorUserId} (${doctorEmail})`);


      // 2. Fetch Doctor Profile (created by trigger?) - Use *Admin* client
      console.log(`[Test Setup] Fetching profile for doctor user: ${doctorUserId}`);
      // Add a small delay in case the trigger needs a moment
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const { data: doctorProfileData, error: doctorProfileErr } = await supabaseAdmin // <-- Use admin client
        .from('profiles')
        .select('*')
        .eq('id', doctorUserId)
        .maybeSingle(); // Use maybeSingle in case trigger didn't run or profile doesn't exist yet
      
      if (doctorProfileErr) throw new Error(`Error fetching doctor profile: ${doctorProfileErr.message}`);
      if (!doctorProfileData) {
        // This suggests the trigger might not exist or failed
        console.error(`[Test Setup] Failed to fetch profile for doctor ${doctorUserId}. Does the handle_new_user trigger exist and work?`);
        throw new Error(`Profile for doctor ${doctorUserId} not found after signup. Check DB trigger.`);
      }
      testDoctor = doctorProfileData;
      console.log(`[Test Setup] Found/Fetched doctor profile: ${testDoctor.id} (Role: ${testDoctor.role})`); // Log role too
      // Optional: Update profile if trigger defaults aren't what test needs (e.g., role)
      if (testDoctor.role !== 'medico') {
         console.warn(`[Test Setup] Doctor profile role is ${testDoctor.role}, updating to 'medico' for test.`);
         const { error: updateErr } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'medico' })
            .eq('id', testDoctor.id);
          if (updateErr) throw new Error(`Failed to update doctor profile role: ${updateErr.message}`);
          testDoctor.role = 'medico'; // Update local copy
      }


      // 3. Create Patient User (auth.users) - Use Admin client
       const { data: patientAuthUser, error: patientAuthErr } = await supabaseAdmin.auth.admin.createUser({ // <-- Use admin client's createUser
           email: patientEmail,
           password: testPassword,
           email_confirm: true, // Automatically confirm email for tests
           user_metadata: { name: 'Integration Test Patient' } // <-- Set name here
       });
       if (patientAuthErr) throw new Error(`Error creating patient auth user: ${patientAuthErr.message}`);
       // createUser returns the user object directly in data, not nested under data.user like signUp
       if (!patientAuthUser || !patientAuthUser.user) throw new Error('Patient auth user creation failed.'); 
       const patientUserId = patientAuthUser.user.id;
       console.log(`[Test Setup] Created patient auth user: ${patientUserId} (${patientEmail})`);

       // 4. Fetch Patient Profile (created by trigger?) - Use *Admin* client
        console.log(`[Test Setup] Fetching profile for patient user: ${patientUserId}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay
        const { data: patientProfileData, error: patientProfileErr } = await supabaseAdmin // <-- Use admin client
           .from('profiles')
           .select('*')
           .eq('id', patientUserId)
           .maybeSingle();
           
       if (patientProfileErr) throw new Error(`Error fetching patient profile: ${patientProfileErr.message}`);
        if (!patientProfileData) {
           console.error(`[Test Setup] Failed to fetch profile for patient ${patientUserId}. Does the handle_new_user trigger exist and work?`);
           throw new Error(`Profile for patient ${patientUserId} not found after signup. Check DB trigger.`);
        }
       testPatient = patientProfileData;
       console.log(`[Test Setup] Found/Fetched patient profile: ${testPatient.id} (Role: ${testPatient.role})`);
       // Optional: Update profile if trigger defaults aren't what test needs (e.g., patient role)
        if (testPatient.role !== 'paciente') {
         console.warn(`[Test Setup] Patient profile role is ${testPatient.role}, updating to 'paciente' for test.`);
         const { error: updateErr } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'paciente' })
            .eq('id', testPatient.id);
          if (updateErr) throw new Error(`Failed to update patient profile role: ${updateErr.message}`);
          testPatient.role = 'paciente'; // Update local copy
      }


      // 5. Create Relationship (doctor_patient_relationships) - Use *Admin* client
      const { data: relationshipData, error: relationshipErr } = await supabaseAdmin 
        .from('doctor_patient_relationships')
        .insert({
          doctor_id: testDoctor.id,
          patient_id: testPatient.id,
          status: 'active',
        })
        .select()
        .single();
      if (relationshipErr) throw new Error(`Error creating relationship: ${relationshipErr.message}`);
      testRelationship = relationshipData;
      console.log(`[Test Setup] Created relationship: ${testRelationship.id}`);

    } catch (error) {
       console.error("!!! Test Setup Failed !!!", error);
      // If setup fails, try to clean up any partially created resources
      await cleanupTestData();
      throw error; // Re-throw the error to fail the test suite
    }
  }, 30000); // Increase timeout for setup involving network calls

  afterAll(async () => {
     console.log("[Test Teardown] Starting cleanup...");
     await cleanupTestData();
     console.log("[Test Teardown] Cleanup finished.");
  }, 30000); // Increase timeout for cleanup

  // --- Helper function for cleanup --- (Use supabaseAdmin here too) ---
   const cleanupTestData = async () => {
       // Use Supabase Admin client if needed for user deletion, otherwise try standard client
       // Note: Deleting auth users directly might require elevated privileges or specific Supabase settings.
       // We will attempt deletion but prioritize cleaning up relationships and profiles.

       if (testRelationship) {
           console.log(`[Test Teardown] Deleting relationship: ${testRelationship.id}`);
           const { error: relErr } = await supabaseAdmin // <-- Use admin client
               .from('doctor_patient_relationships')
               .delete()
               .eq('id', testRelationship.id);
           if (relErr) console.error(`[Test Teardown] Error deleting relationship ${testRelationship.id}:`, relErr.message);
           else console.log(`[Test Teardown] Deleted relationship: ${testRelationship.id}`);
       }

       if (testPatient) {
           console.log(`[Test Teardown] Deleting patient profile: ${testPatient.id}`);
           const { error: patProfErr } = await supabaseAdmin // <-- Use admin client
               .from('profiles')
               .delete()
               .eq('id', testPatient.id);
           if (patProfErr) console.error(`[Test Teardown] Error deleting patient profile ${testPatient.id}:`, patProfErr.message);
           else console.log(`[Test Teardown] Deleted patient profile: ${testPatient.id}`);
           
           // Attempt to delete patient auth user - Use *Admin* client if possible
           try {
               console.log(`[Test Teardown] Attempting to delete patient auth user: ${testPatient.id}`);
               // Use the admin client's auth admin capabilities
               const { data: deleteData, error: patAuthErr } = await supabaseAdmin.auth.admin.deleteUser(testPatient.id);
               if (patAuthErr) {
                   // Handle specific errors, e.g., user not found if already deleted
                   if (patAuthErr.message.includes('User not found')) {
                      console.warn(`[Test Teardown] Patient auth user ${testPatient.id} not found (possibly already deleted).`);
                   } else {
                      console.error(`[Test Teardown] Error deleting patient auth user ${testPatient.id}:`, patAuthErr.message);
                   }
               } else {
                   console.log(`[Test Teardown] Deleted patient auth user: ${testPatient.id}`);
               }
           } catch (adminError) {
               console.error(`[Test Teardown] Error executing auth user deletion for ${testPatient.id}:`, adminError.message);
           }
       }

       if (testDoctor) {
           console.log(`[Test Teardown] Deleting doctor profile: ${testDoctor.id}`);
           const { error: docProfErr } = await supabaseAdmin // <-- Use admin client
               .from('profiles')
               .delete()
               .eq('id', testDoctor.id);
           if (docProfErr) console.error(`[Test Teardown] Error deleting doctor profile ${testDoctor.id}:`, docProfErr.message);
            else console.log(`[Test Teardown] Deleted doctor profile: ${testDoctor.id}`);
           
           // Attempt to delete doctor auth user - Use *Admin* client
            try {
               console.log(`[Test Teardown] Attempting to delete doctor auth user: ${testDoctor.id}`);
               const { data: deleteData, error: docAuthErr } = await supabaseAdmin.auth.admin.deleteUser(testDoctor.id);
                if (docAuthErr) {
                   if (docAuthErr.message.includes('User not found')) {
                       console.warn(`[Test Teardown] Doctor auth user ${testDoctor.id} not found (possibly already deleted).`);
                   } else {
                       console.error(`[Test Teardown] Error deleting doctor auth user ${testDoctor.id}:`, docAuthErr.message);
                   }
               } else {
                   console.log(`[Test Teardown] Deleted doctor auth user: ${testDoctor.id}`);
               }
            } catch (adminError) {
                console.error(`[Test Teardown] Error executing auth user deletion for ${testDoctor.id}:`, adminError.message);
            }
       }
       // Reset test variables
       testDoctor = null;
       testPatient = null;
       testRelationship = null;
   };


  // --- Tests --- (These should still use the *default* supabase client via the model)

  it('getPatientsByDoctor should retrieve patient with correct email from auth.users', async () => {
    if (!testDoctor || !testPatient) {
        throw new Error("Test setup failed, cannot run test.");
    }

    // Log in as the doctor for this test
    console.log(`[Test Run] Logging in as doctor: ${doctorEmail}`);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: doctorEmail,
      password: testPassword,
    });
    if (signInError) {
      throw new Error(`Doctor login failed: ${signInError.message}`);
    }
    console.log(`[Test Run] Doctor logged in successfully.`);

    console.log(`[Test Run] Calling getPatientsByDoctor for doctor: ${testDoctor.id}`);
    // Pass admin client to fetch emails from auth.users
    const result = await DoctorPatient.getPatientsByDoctor(testDoctor.id, { adminClient: supabaseAdmin });
    console.log("[Test Run] Result from getPatientsByDoctor:", JSON.stringify(result, null, 2));

    // Log out after the test
    await supabase.auth.signOut();
    console.log(`[Test Run] Doctor logged out.`);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.patients).toBeInstanceOf(Array);
    expect(result.patients.length).toBeGreaterThanOrEqual(1); // Should find at least our test patient

    const foundPatient = result.patients.find(p => p.id === testPatient.id);
    expect(foundPatient).toBeDefined();
    expect(foundPatient.name).toBe('Integration Test Patient');
    // ** The crucial check **
    expect(foundPatient.email).toBe(patientEmail);
    expect(foundPatient.relationId).toBe(testRelationship.id);
    expect(foundPatient.status).toBe('active');

  });

  it('getDoctorsByPatient should retrieve doctor with correct email from auth.users', async () => {
     if (!testDoctor || !testPatient) {
        throw new Error("Test setup failed, cannot run test.");
    }

    // Log in as the patient for this test
    console.log(`[Test Run] Logging in as patient: ${patientEmail}`);
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: patientEmail,
        password: testPassword,
    });
    if (signInError) {
        throw new Error(`Patient login failed: ${signInError.message}`);
    }
    console.log(`[Test Run] Patient logged in successfully.`);

    console.log(`[Test Run] Calling getDoctorsByPatient for patient: ${testPatient.id}`);
    // Pass admin client to handle profile fetching despite RLS
    const result = await DoctorPatient.getDoctorsByPatient(testPatient.id, { adminClient: supabaseAdmin }); 
    console.log("[Test Run] Result from getDoctorsByPatient:", JSON.stringify(result, null, 2));

    // Log out after the test
    await supabase.auth.signOut();
    console.log(`[Test Run] Patient logged out.`);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.doctors).toBeInstanceOf(Array);
    expect(result.doctors.length).toBeGreaterThanOrEqual(1); // Should find at least our test doctor

    const foundDoctor = result.doctors.find(d => d.id === testDoctor.id);
    expect(foundDoctor).toBeDefined();
    expect(foundDoctor.name).toBe('Integration Test Doctor');
     // ** The crucial check **
    expect(foundDoctor.email).toBe(doctorEmail);
    expect(foundDoctor.relationId).toBe(testRelationship.id);
    expect(foundDoctor.status).toBe('active');
  });

   // Add more integration tests as needed (e.g., assign, remove)
   // but focus on the problem reported (get methods) for now.

}); 