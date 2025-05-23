const DoctorPatient = require('../../../models/DoctorPatient');
const { supabase } = require('../../../config/supabase');

// --- START NEW MOCK SETUP ---
// Mock the supabase client
// Define a reusable mock client object that allows chaining and promise resolution
const mockSupabaseClient = {
  // Chainable methods - they return the client itself
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),

  // Terminal methods - they return Promises, mock them per test
  single: jest.fn(),
  maybeSingle: jest.fn(),

  // Promise resolution for await chains - mock this per test
  then: jest.fn(),
};

// Mock the module exporting the supabase client
jest.mock('../../../config/supabase', () => ({
  supabase: {
    // supabase.from() should return the mock client to start the chain
    from: jest.fn(() => mockSupabaseClient),
    // Add mocks for other supabase top-level methods if used (e.g., auth, rpc)
    auth: {
      getSession: jest.fn(), // Mock if Profile.getProfileWithEmail is tested here indirectly
    },
    // rpc: jest.fn(),
  },
}));

// Helper to reset mocks before each test
const resetMocks = () => {
  // Reset call counts and mock implementations for all functions on the client
  Object.values(mockSupabaseClient).forEach(mockFn => {
    if (typeof mockFn.mockClear === 'function') {
      mockFn.mockClear();
    }
  });
  // Reset the 'from' mock on the main supabase object
  if (typeof supabase.from.mockClear === 'function') {
      supabase.from.mockClear();
  }
   // Reset getSession if mocked
   if (supabase.auth && typeof supabase.auth.getSession.mockClear === 'function') {
       supabase.auth.getSession.mockClear();
   }


  // *** Crucially, reset implementations to allow chaining and default resolutions ***
  mockSupabaseClient.select.mockReturnThis();
  mockSupabaseClient.insert.mockReturnThis();
  mockSupabaseClient.update.mockReturnThis();
  mockSupabaseClient.delete.mockReturnThis();
  mockSupabaseClient.eq.mockReturnThis();
  mockSupabaseClient.in.mockReturnThis();
  mockSupabaseClient.gt.mockReturnThis();
  mockSupabaseClient.lt.mockReturnThis();
  mockSupabaseClient.gte.mockReturnThis();
  mockSupabaseClient.lte.mockReturnThis();
  mockSupabaseClient.like.mockReturnThis();
  mockSupabaseClient.ilike.mockReturnThis();
  mockSupabaseClient.neq.mockReturnThis();
  mockSupabaseClient.order.mockReturnThis();
  mockSupabaseClient.limit.mockReturnThis();
  mockSupabaseClient.range.mockReturnThis();

  // Default resolution for terminal methods (can be overridden in tests)
  mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
  mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null, error: null });

  // Default resolution for `await` using .then
  mockSupabaseClient.then.mockImplementation(callback => Promise.resolve(callback({ data: null, error: null })));

};
// --- END NEW MOCK SETUP ---


describe('DoctorPatient Model', () => {
  const mockDoctorId = 'doc-123';
  const mockPatientId = 'pat-456';
  const mockRelationId = 'rel-789';

  beforeEach(() => {
    // Use the helper function to reset mocks
    resetMocks();
  });

  // --- assign ---
  describe('assign', () => {
    const mockDoctorProfile = { id: mockDoctorId, role: 'medico' }; // Include ID for clarity
    const mockPatientProfile = { id: mockPatientId, role: 'paciente' }; // Include ID for clarity
    const mockInactiveRelation = { id: mockRelationId, doctor_id: mockDoctorId, patient_id: mockPatientId, status: 'inactive' };
    const mockActiveRelation = { id: mockRelationId, doctor_id: mockDoctorId, patient_id: mockPatientId, status: 'active', updated_at: expect.any(String) };
    // Use realistic structure for inserted data return
    const mockInsertedRelation = {
        id: 'new-rel-id', // Assume DB generates ID
        doctor_id: mockDoctorId,
        patient_id: mockPatientId,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
    };
     const mockUpdatedRelation = {
        ...mockInactiveRelation,
        status: 'active',
        updated_at: '2023-01-01T01:00:00Z' // Assume DB generates timestamp
    };


    it('should assign a patient to a doctor successfully (new relation)', async () => {
      // Mock profile checks (using single)
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockDoctorProfile, error: null }) // Doctor check
        .mockResolvedValueOnce({ data: mockPatientProfile, error: null }); // Patient check

      // Mock check for existing relation (using single) - Not Found (PGRST116 error)
       const notFoundError = { code: 'PGRST116', message: 'Row not found' };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: notFoundError });


      // Mock insert (using then for resolution)
       mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: [mockInsertedRelation], error: null })));


      const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

      expect(result.success).toBe(true);
      // The assign function returns the *first* element from the data array
      expect(result.relation).toEqual(mockInsertedRelation);

      // Verify calls
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from).toHaveBeenCalledWith('doctor_patient_relationships');

      // Profile checks chain: from -> select('role') -> eq('id', ...) -> single()
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('role');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockDoctorId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockPatientId);
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(3); // 2 profile checks + 1 relation check

      // Relation check chain: from -> select('*') -> eq('doctor_id', ...) -> eq('patient_id', ...) -> single()
       expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
       expect(mockSupabaseClient.eq).toHaveBeenCalledWith('doctor_id', mockDoctorId);
       expect(mockSupabaseClient.eq).toHaveBeenCalledWith('patient_id', mockPatientId);


      // Insert chain: from -> insert(...) -> select() -> then()
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([expect.objectContaining({
        doctor_id: mockDoctorId,
        patient_id: mockPatientId,
        status: 'active',
        // Timestamps are generated, so we check for existence/type if needed, but exact match isn't reliable here.
        // We mainly care that the correct IDs and status are sent.
      })]);
       expect(mockSupabaseClient.select).toHaveBeenCalledWith('*'); // After insert
       expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // For insert resolution
    });


     it('should reactivate an existing inactive relationship', async () => {
         // Mock profile checks (success)
         mockSupabaseClient.single
             .mockResolvedValueOnce({ data: mockDoctorProfile, error: null })
             .mockResolvedValueOnce({ data: mockPatientProfile, error: null });

         // Mock finding the existing inactive relation
         mockSupabaseClient.single.mockResolvedValueOnce({ data: mockInactiveRelation, error: null });

         // Mock the update call (update -> eq -> select -> then)
         mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: [mockUpdatedRelation], error: null })));


        const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

        expect(result.success).toBe(true);
        expect(result.relation).toEqual(mockUpdatedRelation); // Expect the updated relation

        // Verify calls
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(supabase.from).toHaveBeenCalledWith('doctor_patient_relationships');
        expect(mockSupabaseClient.single).toHaveBeenCalledTimes(3); // 2 profile, 1 relation check

        // Verify update call
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
        expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'active'
            // updated_at is generated, checking status is sufficient here
        }));
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockInactiveRelation.id); // Update uses relation ID
         expect(mockSupabaseClient.select).toHaveBeenCalledWith('*'); // After update
         expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // For update resolution
    });


    it('should return success if relationship already active', async () => {
        const alreadyActiveRelation = { ...mockInactiveRelation, status: 'active' };
        // Mock profile checks (success)
         mockSupabaseClient.single
            .mockResolvedValueOnce({ data: mockDoctorProfile, error: null })
            .mockResolvedValueOnce({ data: mockPatientProfile, error: null });
        // Mock finding the active existing relation
        mockSupabaseClient.single.mockResolvedValueOnce({ data: alreadyActiveRelation, error: null });

        const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

        expect(result.success).toBe(true);
        expect(result.relation).toEqual(alreadyActiveRelation); // Returns the existing active relation
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
        expect(mockSupabaseClient.update).not.toHaveBeenCalled();
         expect(mockSupabaseClient.single).toHaveBeenCalledTimes(3); // Still performs all checks
    });


    it('should return error if doctorId is not a medico', async () => {
         // Mock first profile check to return wrong role
         mockSupabaseClient.single.mockResolvedValueOnce({ data: { role: 'paciente' }, error: null });

        const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Solo los médicos pueden tener pacientes');
        expect(supabase.from).toHaveBeenCalledWith('profiles');
         // Verify only the first profile check was attempted
         expect(mockSupabaseClient.select).toHaveBeenCalledWith('role');
         expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockDoctorId);
         expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
         expect(mockSupabaseClient.eq).not.toHaveBeenCalledWith('id', mockPatientId); // Did not check patient
    });


     it('should return error if patientId is not a paciente', async () => {
          // Mock doctor profile check (success)
          mockSupabaseClient.single.mockResolvedValueOnce({ data: mockDoctorProfile, error: null });
          // Mock patient profile check (wrong role)
          mockSupabaseClient.single.mockResolvedValueOnce({ data: { role: 'medico' }, error: null });


        const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Solo los pacientes pueden ser asignados');
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        // Verify both profile checks were made
         expect(mockSupabaseClient.single).toHaveBeenCalledTimes(2);
         expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockDoctorId);
         expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockPatientId);
          // Verify relationship check was not made
         expect(supabase.from).not.toHaveBeenCalledWith('doctor_patient_relationships');
    });


    it('should return error if checking profile fails', async () => {
        const dbError = new Error('DB Profile Check Error');
         // Mock the first profile check to reject
         mockSupabaseClient.single.mockRejectedValueOnce(dbError);

        const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

        expect(result.success).toBe(false);
        expect(result.error).toBe(dbError.message);
         expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
    });


    it('should return error if checking existing relationship fails (not PGRST116)', async () => {
        const dbError = new Error('DB Relation Check Error'); // Different from 'Not Found'
        // Mock profile checks (success)
         mockSupabaseClient.single
            .mockResolvedValueOnce({ data: mockDoctorProfile, error: null })
            .mockResolvedValueOnce({ data: mockPatientProfile, error: null });
         // Mock relationship check to fail with a different error
        mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: dbError });


        const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

        expect(result.success).toBe(false);
        expect(result.error).toBe(dbError.message);
         expect(mockSupabaseClient.single).toHaveBeenCalledTimes(3); // All checks attempted
         expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
         expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });


    it('should return error if insert fails', async () => {
      const dbError = new Error('DB Insert Error');
       // Mock profile checks (success)
       mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockDoctorProfile, error: null })
        .mockResolvedValueOnce({ data: mockPatientProfile, error: null });

      // Mock check for existing relation (Not Found)
       const notFoundError = { code: 'PGRST116', message: 'Row not found' };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: notFoundError });

      // Mock insert to fail (using then)
       mockSupabaseClient.then.mockImplementationOnce((_, reject) => Promise.resolve(reject ? reject(dbError) : Promise.reject(dbError)));


      const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

      expect(result.success).toBe(false);
       // Check the specific error message returned by the model's catch block
       expect(result.error).toBe(dbError.message);
       expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(1); // Attempted insert
       expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // For insert resolution attempt
        expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });

     it('should return error if update fails', async () => {
        const dbError = new Error('DB Update Error');
        // Mock profile checks (success)
         mockSupabaseClient.single
            .mockResolvedValueOnce({ data: mockDoctorProfile, error: null })
            .mockResolvedValueOnce({ data: mockPatientProfile, error: null });
        // Mock finding the existing inactive relation
        mockSupabaseClient.single.mockResolvedValueOnce({ data: mockInactiveRelation, error: null });
        // Mock the update call to fail (using then)
         mockSupabaseClient.then.mockImplementationOnce((_, reject) => Promise.resolve(reject ? reject(dbError) : Promise.reject(dbError)));

        const result = await DoctorPatient.assign(mockDoctorId, mockPatientId);

        expect(result.success).toBe(false);
        expect(result.error).toBe(dbError.message);
        expect(mockSupabaseClient.update).toHaveBeenCalledTimes(1); // Attempted update
         expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // For update resolution attempt
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
  });

  // --- getPatientsByDoctor ---
  describe('getPatientsByDoctor', () => {
    // Updated mock raw data to include nested user email
    const mockRawRelationData = [
      {
        id: 'rel-1', status: 'active',
        patient: { 
          id: 'pat-1', name: 'Patient One', created_at: 'date1', 
          user: { email: 'pat1@test.com' } // Email nested under user
        } 
      },
      {
        id: 'rel-2', status: 'active',
        patient: { 
          id: 'pat-2', name: 'Patient Two', created_at: 'date2', 
          user: { email: null } // Simulate null email from auth.users
        } 
      },
       {
        id: 'rel-3', status: 'active',
        patient: { 
          id: 'pat-3', name: 'Patient Three', created_at: 'date3', 
          user: null // Simulate missing user relation (should default)
        } 
      },
       {
        id: 'rel-4', status: 'active',
        patient: { 
          id: 'pat-4', name: 'Patient Four', created_at: 'date4'
          // Simulate missing user field entirely (should default)
        } 
      },
    ];
     // Expected formatted data now includes directly fetched email
     const expectedFormattedPatients = [
      {
        relationId: 'rel-1', status: 'active',
        id: 'pat-1', name: 'Patient One', email: 'pat1@test.com', created_at: 'date1'
      },
      {
        relationId: 'rel-2', status: 'active',
        id: 'pat-2', name: 'Patient Two', email: 'Email no disponible', created_at: 'date2' // Default for null email
      },
       {
        relationId: 'rel-3', status: 'active',
        id: 'pat-3', name: 'Patient Three', email: 'Email no disponible', created_at: 'date3' // Default for missing user
      },
       {
        relationId: 'rel-4', status: 'active',
        id: 'pat-4', name: 'Patient Four', email: 'Email no disponible', created_at: 'date4' // Default for missing user field
      },
    ];

    // Mock email data specifically for this test suite
    const mockUserEmails = [
        { id: 'pat-1', email: 'pat1@test.com' },
        { id: 'pat-2', email: null }, // Simulate null email
        // pat-3 and pat-4 missing to test default behavior
    ];

    // Mock the admin client for email lookup in THIS test suite
    const mockAdminClient = { 
        auth: { 
            admin: { 
                 // Mock listUsers to resolve successfully for the test
                listUsers: jest.fn().mockResolvedValue({
                    data: { users: mockUserEmails }, // Use the mock email data
                    error: null
                })
            } 
        }, 
        // Keep other mocks if the tested function *itself* uses adminClient.from etc.
        from: jest.fn().mockReturnThis(), 
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn() 
    }; 

    it('should retrieve and format patients for a doctor including email', async () => {
       // Mock the successful resolution of the *main* query using .then
      mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: mockRawRelationData, error: null })));
     
      // Call the method with the options object containing the correctly mocked adminClient
      const result = await DoctorPatient.getPatientsByDoctor(mockDoctorId, { adminClient: mockAdminClient });

      expect(result.success).toBe(true);
      expect(result.patients).toEqual(expectedFormattedPatients);

      // Verify the *main* supabase call chain
      expect(supabase.from).toHaveBeenCalledWith('doctor_patient_relationships');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.stringContaining('patient:patient_id'));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('doctor_id', mockDoctorId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); 

       // Verify the call to listUsers on the *mockAdminClient*
      expect(mockAdminClient.auth.admin.listUsers).toHaveBeenCalledTimes(1);
      // Optionally, add more specific checks on the listUsers call if needed
      // expect(mockAdminClient.auth.admin.listUsers).toHaveBeenCalledWith(expect.objectContaining({ perPage: 1000 }));

    });

    it('should return empty array if no patients found', async () => {
        // Mock the query resolution with empty data
       mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: [], error: null })));

        // Call with options object
        const result = await DoctorPatient.getPatientsByDoctor(mockDoctorId, { adminClient: mockAdminClient });

        expect(result.success).toBe(true);
        expect(result.patients).toEqual([]);
        expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1);
    });

    it('should return error if database query fails', async () => {
      const dbError = new Error('DB Get Patients Error');
       // Mock the query resolution to reject
      mockSupabaseClient.then.mockImplementationOnce((_, reject) => Promise.resolve(reject ? reject(dbError) : Promise.reject(dbError)));

      // Call with options object
      const result = await DoctorPatient.getPatientsByDoctor(mockDoctorId, { adminClient: mockAdminClient });

      expect(result.success).toBe(false);
      expect(result.error).toBe(dbError.message);
       expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1);
    });

    it('should return error if adminClient is not provided', async () => {
        // Simulate calling the function without the adminClient option
        const result = await DoctorPatient.getPatientsByDoctor(mockDoctorId, {}); // Pass empty options

        expect(result.success).toBe(false);
         // Update the expected error message for exact match
        expect(result.error).toBe('Configuration error: adminClient is missing.');
        // Verify no DB call was made in this case
        expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  // --- getDoctorsByPatient ---
  describe('getDoctorsByPatient', () => {
     // THIS IS THE CORRECTED MOCK
     const mockRawRelationData = [
      {
        id: 'rel-3',
        status: 'active',
        doctor_id: 'doc-1' // Use doctor_id directly
      },
      {
        id: 'rel-4',
        status: 'active',
        doctor_id: 'doc-2' // Use doctor_id directly
      },
      {
        id: 'rel-5',
        status: 'active',
        doctor_id: 'doc-3' // Use doctor_id directly
      }
    ];

    // Mock data for doctor profiles fetched in the second step
    const mockDoctorProfiles = [
        { id: 'doc-1', name: 'Doctor One', created_at: 'date3' },
        { id: 'doc-2', name: 'Doctor Two', created_at: 'date4' },
        { id: 'doc-3', name: 'Doctor Three', created_at: 'date5' }
    ];

    // Mock data for emails fetched in the third step
    const mockUserEmails = [
        { id: 'doc-1', email: 'doc1@test.com' },
        { id: 'doc-2', email: null }, // Simulate email not found or restricted
        // doc-3 missing from email results intentionally or due to error
    ];

    // Expected formatted data based on the corrected flow
    const expectedFormattedDoctors = [
      {
        relationId: 'rel-3', status: 'active',
        id: 'doc-1', name: 'Doctor One', email: 'doc1@test.com', created_at: 'date3'
      },
      {
        relationId: 'rel-4', status: 'active',
        id: 'doc-2', name: 'Doctor Two', email: 'Email no disponible', created_at: 'date4' // Default for null email
      },
      {
        relationId: 'rel-5', status: 'active',
        id: 'doc-3', name: 'Doctor Three', email: 'Email no disponible', created_at: 'date5' // Default for missing email
      },
    ];

    // Mock the admin client
    const mockAdminClient = {
        auth: {
            admin: {
                listUsers: jest.fn().mockResolvedValue({
                    data: { users: mockUserEmails }, // Use mockUserEmails here
                    error: null
                })
            }
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockDoctorProfiles, error: null }), // Mock profile fetch
        then: jest.fn() // General fallback
    };

    it('should retrieve and format doctors for a patient including email', async () => {
        // Mock Query 1: Get relationships (using corrected mockRawRelationData)
       mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: mockRawRelationData, error: null })));

       // Mock Query 2: Get profiles (already mocked in adminClient.in)
       // Mock Query 3: Get emails (already mocked in adminClient.auth.admin.listUsers)

      const result = await DoctorPatient.getDoctorsByPatient(mockPatientId, { adminClient: mockAdminClient });

      expect(result.success).toBe(true);
      expect(result.doctors).toEqual(expectedFormattedDoctors);

      // Verify call chains
      // Query 1: Relationships
      expect(supabase.from).toHaveBeenCalledWith('doctor_patient_relationships');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.stringContaining('doctor_id')); // Check doctor_id is selected
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('patient_id', mockPatientId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // For Query 1 resolution

      // Query 2: Profiles
      expect(mockAdminClient.from).toHaveBeenCalledWith('profiles');
      expect(mockAdminClient.select).toHaveBeenCalledWith('id, name, created_at');
      expect(mockAdminClient.in).toHaveBeenCalledWith('id', ['doc-1', 'doc-2', 'doc-3']); // Verify correct IDs passed

      // Query 3: Emails
      expect(mockAdminClient.auth.admin.listUsers).toHaveBeenCalledTimes(1); // Verify email lookup happened

    });

     it('should return empty array if no doctors found', async () => {
         // Mock query resolution with empty data
        mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: [], error: null })));

        // Call with options object
        const result = await DoctorPatient.getDoctorsByPatient(mockPatientId, { adminClient: mockAdminClient });

        expect(result.success).toBe(true);
        expect(result.doctors).toEqual([]);
        expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1);
    });

    it('should return error if database query fails', async () => {
       const dbError = new Error('DB Get Doctors Error');
        // Mock query resolution to reject
        mockSupabaseClient.then.mockImplementationOnce((_, reject) => Promise.resolve(reject ? reject(dbError) : Promise.reject(dbError)));
       
        // Call with options object
        const result = await DoctorPatient.getDoctorsByPatient(mockPatientId, { adminClient: mockAdminClient });

        expect(result.success).toBe(false);
        expect(result.error).toBe(dbError.message);
         expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1);
    });

    it('should return error if adminClient is not provided', async () => {
        // Simulate calling the function without the adminClient option
        const result = await DoctorPatient.getDoctorsByPatient(mockPatientId, {}); // Pass empty options

        expect(result.success).toBe(false);
         // Update the expected error message for exact match
        expect(result.error).toBe('Configuration error: adminClient is missing.');
        // Verify no DB call was made
        expect(supabase.from).not.toHaveBeenCalled();
    });

  });

  // --- remove ---
  describe('remove', () => {
    const mockRelation = { id: mockRelationId, doctor_id: mockDoctorId, patient_id: mockPatientId, status: 'active' };
    // Use a realistic structure for the updated/terminated relation
    const mockTerminatedRelationData = {
        ...mockRelation,
        status: 'terminated',
        updated_at: '2023-01-01T02:00:00Z' // Realistic timestamp
    };

    it('should terminate a relationship successfully by the doctor', async () => {
      // Mock finding the relation using single()
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockRelation, error: null });
      // Mock the update call (update -> eq -> select -> then)
       mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: [mockTerminatedRelationData], error: null })));

      const result = await DoctorPatient.remove(mockRelationId, mockDoctorId); // Correct doctor removes

      expect(result.success).toBe(true);
      // The model returns the first element from the data array
      expect(result.relation).toEqual(mockTerminatedRelationData);

       // Verify call chain
       expect(supabase.from).toHaveBeenCalledWith('doctor_patient_relationships');
       // Check find call
       expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
       expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockRelationId);
       expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
       // Check update call
       expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'terminated' }));
       expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockRelationId);
       expect(mockSupabaseClient.select).toHaveBeenCalledWith('*'); // After update
        expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // For update resolution
    });

    it('should return error if relation not found', async () => {
      const checkError = new Error('Not Found');
       // Mock finding the relation to reject (or resolve with error)
       // Using reject is cleaner for simulating a direct error from single()
      mockSupabaseClient.single.mockRejectedValueOnce(checkError);

       const result = await DoctorPatient.remove(mockRelationId, mockDoctorId);

       expect(result.success).toBe(false);
       // The model catches the error and returns its message
       expect(result.error).toBe(checkError.message);
       expect(mockSupabaseClient.update).not.toHaveBeenCalled();
        expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
    });

    it('should return error if user is not the doctor in the relationship', async () => {
       const wrongUserId = 'other-doc-id';
        // Mock finding the relation (success)
       mockSupabaseClient.single.mockResolvedValueOnce({ data: mockRelation, error: null });

       const result = await DoctorPatient.remove(mockRelationId, wrongUserId); // Wrong user tries to remove

       expect(result.success).toBe(false);
       expect(result.error).toContain('No tienes permiso');
       expect(mockSupabaseClient.update).not.toHaveBeenCalled(); // Update should not be called
        expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1); // Check was still made
    });

    it('should return error if update fails', async () => {
       const updateError = new Error('DB Update Error');
        // Mock finding the relation (success)
       mockSupabaseClient.single.mockResolvedValueOnce({ data: mockRelation, error: null });
       // Mock the update call to fail (using then)
        mockSupabaseClient.then.mockImplementationOnce((_, reject) => Promise.resolve(reject ? reject(updateError) : Promise.reject(updateError)));

       const result = await DoctorPatient.remove(mockRelationId, mockDoctorId);

       expect(result.success).toBe(false);
       expect(result.error).toBe(updateError.message);
        expect(mockSupabaseClient.update).toHaveBeenCalledTimes(1); // Update was attempted
        expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // Update resolution was attempted
    });
  });
}); 