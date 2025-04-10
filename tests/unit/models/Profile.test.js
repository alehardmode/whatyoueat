const Profile = require('../../../models/Profile');
const BaseModel = require('../../../models/BaseModel');
const { supabase } = require('../../../config/supabase');

// Mock BaseModel methods
jest.mock('../../../models/BaseModel'); // Keep mock of the module

// --- START NEW MOCK SETUP for Supabase ---
// Define a reusable mock client object that allows chaining and promise resolution
const mockSupabaseClient = {
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
  single: jest.fn(),
  maybeSingle: jest.fn(),
  then: jest.fn(),
};

// Mock the module exporting the supabase client
jest.mock('../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseClient),
    auth: {
      getSession: jest.fn(),
      // Add other auth methods if needed
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      reauthenticate: jest.fn(),
    },
  },
}));

// Helper to reset mocks before each test (for Supabase)
const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach(mockFn => {
    if (typeof mockFn?.mockClear === 'function') mockFn.mockClear();
  });
  if (typeof supabase.from?.mockClear === 'function') supabase.from.mockClear();

  // Reset auth mocks
   Object.values(supabase.auth).forEach(mockFn => {
        if (typeof mockFn?.mockClear === 'function') mockFn.mockClear();
    });

  // Reset implementations
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
  mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
  mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null, error: null });
  mockSupabaseClient.then.mockImplementation(callback => Promise.resolve(callback({ data: null, error: null })));

  // Default auth resolutions (can be overridden)
  supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

};
// --- END NEW MOCK SETUP ---

describe('Profile Model', () => {
  const mockUserId = 'user-profile-123';
  const mockProfileDataInput = {
    name: 'Profile User',
    role: 'paciente',
    email: 'profile@example.com',
  };
  const mockProfileRecord = {
    id: mockUserId,
    name: mockProfileDataInput.name,
    role: mockProfileDataInput.role,
    email: mockProfileDataInput.email,
    created_at: 'mock-date',
    updated_at: 'mock-date',
    is_active: true,
  };

  beforeEach(() => {
    // Clear mocks for BOTH BaseModel and Supabase
    jest.clearAllMocks();
    resetSupabaseMocks();

    // Re-assign mocks for BaseModel static methods after jest.clearAllMocks()
    BaseModel.create = jest.fn();
    BaseModel.update = jest.fn();
    BaseModel.getById = jest.fn();
    BaseModel.delete = jest.fn();
    BaseModel.findByCriteria = jest.fn();
    BaseModel.checkConnection = jest.fn();

    // Default successful connection check (delegated to BaseModel mock)
    BaseModel.checkConnection.mockResolvedValue({ success: true });
  });

  // --- tableName ---
  it('should have the correct tableName', () => {
      expect(Profile.tableName).toBe('profiles');
  });

  // --- create ---
  describe('create', () => {
    it('should call super.create with correct profile data and return success', async () => {
      BaseModel.create.mockResolvedValueOnce({ success: true, data: mockProfileRecord });

      const result = await Profile.create(mockUserId, mockProfileDataInput);

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfileRecord);
      expect(BaseModel.create).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUserId,
        name: mockProfileDataInput.name,
        role: mockProfileDataInput.role,
        email: mockProfileDataInput.email,
        is_active: true,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }));
    });

     it('should use defaults for name and role if not provided', async () => {
        const minimalInput = { email: 'minimal@example.com' };
        const expectedData = { ...mockProfileRecord, name: 'Usuario sin nombre', role: 'paciente', email: minimalInput.email };
        BaseModel.create.mockResolvedValueOnce({ success: true, data: expectedData });

        const result = await Profile.create(mockUserId, minimalInput);

        expect(result.success).toBe(true);
        expect(result.profile).toEqual(expectedData);
        expect(BaseModel.create).toHaveBeenCalledWith(expect.objectContaining({
            id: mockUserId,
            name: 'Usuario sin nombre',
            role: 'paciente',
            email: minimalInput.email,
        }));
    });

    it('should return error if userId is missing', async () => {
      const result = await Profile.create(null, mockProfileDataInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID de usuario no proporcionado');
      expect(BaseModel.create).not.toHaveBeenCalled();
    });

    it('should return error if userData is invalid', async () => {
      const result = await Profile.create(mockUserId, null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Datos de usuario no válidos');
      expect(BaseModel.create).not.toHaveBeenCalled();
    });

    it('should return error if super.create fails', async () => {
      const baseError = { success: false, error: 'Base create failed' };
      BaseModel.create.mockResolvedValueOnce(baseError);

      const result = await Profile.create(mockUserId, mockProfileDataInput);

      expect(result).toEqual(baseError);
    });
  });

  // --- update ---
  describe('update', () => {
    const updates = { name: 'Updated Profile Name' };
    const updatedProfile = { ...mockProfileRecord, ...updates };

    it('should call super.update and return success', async () => {
      BaseModel.update.mockResolvedValueOnce({ success: true, data: updatedProfile });

      const result = await Profile.update(mockUserId, updates);

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(updatedProfile);
      expect(BaseModel.update).toHaveBeenCalledWith(mockUserId, updates);
    });

    it('should return error if super.update fails', async () => {
      const baseError = { success: false, error: 'Base update failed' };
      BaseModel.update.mockResolvedValueOnce(baseError);

      const result = await Profile.update(mockUserId, updates);

      expect(result).toEqual(baseError);
    });
  });

  // --- getById ---
  describe('getById', () => {
    it('should call super.getById and return success', async () => {
      BaseModel.getById.mockResolvedValueOnce({ success: true, data: mockProfileRecord });

      const result = await Profile.getById(mockUserId);

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfileRecord);
      expect(BaseModel.getById).toHaveBeenCalledWith(mockUserId);
    });

    it('should return error if super.getById fails', async () => {
      const baseError = { success: false, error: 'Base getById failed' };
      BaseModel.getById.mockResolvedValueOnce(baseError);

      const result = await Profile.getById(mockUserId);

      expect(result).toEqual(baseError);
    });
  });

   // --- getProfileWithEmail ---
  describe('getProfileWithEmail', () => {
    const mockSessionUser = { id: mockUserId, email: 'session@example.com' };
    const mockProfileWithoutEmail = { ...mockProfileRecord, email: null };

    it('should get profile and use email from active session if IDs match', async () => {
      // Mock the direct supabase call: from -> select -> eq -> single
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockProfileRecord, error: null });
      // Mock getSession call
      supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: mockSessionUser } }, error: null });

      const result = await Profile.getProfileWithEmail(mockUserId);

      expect(result.success).toBe(true);
      expect(result.profile).toEqual({ ...mockProfileRecord, email: mockSessionUser.email });

      // Verify supabase calls
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockUserId);
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

     it('should use profile email if session user ID does not match', async () => {
        const otherSessionUser = { id: 'other-user', email: 'other@example.com' };
        mockSupabaseClient.single.mockResolvedValueOnce({ data: mockProfileRecord, error: null });
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: otherSessionUser } }, error: null });

        const result = await Profile.getProfileWithEmail(mockUserId);

        expect(result.success).toBe(true);
        expect(result.profile).toEqual({ ...mockProfileRecord, email: mockProfileRecord.email });
        expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

     it('should use profile email if getSession returns error', async () => {
        mockSupabaseClient.single.mockResolvedValueOnce({ data: mockProfileRecord, error: null });
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('Session error') });

        const result = await Profile.getProfileWithEmail(mockUserId);

        expect(result.success).toBe(true);
        expect(result.profile).toEqual({ ...mockProfileRecord, email: mockProfileRecord.email });
        expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

     it('should use profile email if session exists but user is null', async () => {
        mockSupabaseClient.single.mockResolvedValueOnce({ data: mockProfileRecord, error: null });
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: null } }, error: null });

        const result = await Profile.getProfileWithEmail(mockUserId);

        expect(result.success).toBe(true);
        expect(result.profile).toEqual({ ...mockProfileRecord, email: mockProfileRecord.email });
        expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    it('should return "Email no disponible" if session and profile emails are missing', async () => {
        mockSupabaseClient.single.mockResolvedValueOnce({ data: mockProfileWithoutEmail, error: null });
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: mockUserId, email: null } } }, error: null });

        const result = await Profile.getProfileWithEmail(mockUserId);

        expect(result.success).toBe(true);
        expect(result.profile).toEqual({ ...mockProfileWithoutEmail, email: 'Email no disponible' });
        expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    it('should return error if userId is missing', async () => {
      const result = await Profile.getProfileWithEmail(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID de usuario no proporcionado');
      expect(mockSupabaseClient.single).not.toHaveBeenCalled();
      expect(supabase.auth.getSession).not.toHaveBeenCalled();
    });

    it('should return error if fetching profile fails (direct Supabase call)', async () => {
      const profileError = new Error('Profile fetch error');
      mockSupabaseClient.single.mockRejectedValueOnce(profileError);

      const result = await Profile.getProfileWithEmail(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(profileError.message);
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
      expect(supabase.auth.getSession).not.toHaveBeenCalled();
    });

    it('should return error if profile is not found (direct Supabase call)', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await Profile.getProfileWithEmail(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Perfil no encontrado');
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);
      expect(supabase.auth.getSession).not.toHaveBeenCalled();
    });
  });

  // --- deleteProfile ---
  describe('deleteProfile', () => {
    it('should call super.delete and return the result', async () => {
      const deleteResult = { success: true, data: {}, softDelete: true };
      BaseModel.delete.mockResolvedValueOnce(deleteResult);

      const result = await Profile.deleteProfile(mockUserId);

      expect(result).toEqual(deleteResult);
      expect(BaseModel.delete).toHaveBeenCalledWith(mockUserId);
    });

    it('should return error if super.delete fails', async () => {
      const baseError = { success: false, error: 'Base delete failed' };
      BaseModel.delete.mockResolvedValueOnce(baseError);

      const result = await Profile.deleteProfile(mockUserId);

      expect(result).toEqual(baseError);
    });
  });

  // --- searchByName ---
  describe('searchByName', () => {
    const searchName = 'Test';
    const mockProfiles = [mockProfileRecord];
    const defaultOptions = { limit: 20, offset: 0, orderBy: 'name', ascending: true };

    it('should call super.findByCriteria with correct name filter and default options', async () => {
      BaseModel.findByCriteria.mockResolvedValueOnce({ success: true, data: mockProfiles, pagination: {} });

      const result = await Profile.searchByName(searchName);

      expect(result.success).toBe(true);
      expect(result.profiles).toEqual(mockProfiles);
      expect(BaseModel.findByCriteria).toHaveBeenCalledWith(
        { name: { operator: 'like', value: searchName } },
        defaultOptions
      );
    });

    it('should pass custom options to super.findByCriteria', async () => {
        const customOptions = { limit: 5, offset: 10, orderBy: 'created_at', ascending: false };
        BaseModel.findByCriteria.mockResolvedValueOnce({ success: true, data: [], pagination: {} });

        await Profile.searchByName(searchName, customOptions);

        expect(BaseModel.findByCriteria).toHaveBeenCalledWith(
            { name: { operator: 'like', value: searchName } },
            customOptions
        );
    });

    it('should return error if name is missing', async () => {
      const result = await Profile.searchByName(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nombre de búsqueda no proporcionado');
      expect(BaseModel.findByCriteria).not.toHaveBeenCalled();
    });

    it('should return error if super.findByCriteria fails', async () => {
      const baseError = { success: false, error: 'Base find failed' };
      BaseModel.findByCriteria.mockResolvedValueOnce(baseError);

      const result = await Profile.searchByName(searchName);

      expect(result).toEqual(baseError);
    });
  });

  // --- getByRole ---
  describe('getByRole', () => {
    const role = 'medico';
    const mockProfiles = [mockProfileRecord];
    const defaultOptions = { limit: 20, offset: 0, orderBy: 'name', ascending: true };

     it('should call super.findByCriteria with correct role filter and default options', async () => {
      BaseModel.findByCriteria.mockResolvedValueOnce({ success: true, data: mockProfiles, pagination: {} });

      const result = await Profile.getByRole(role);

      expect(result.success).toBe(true);
      expect(result.profiles).toEqual(mockProfiles);
      expect(BaseModel.findByCriteria).toHaveBeenCalledWith(
        { role: role, is_active: true }, // Includes is_active: true
        defaultOptions // Verify correct defaults
      );
    });

     it('should pass custom options to super.findByCriteria', async () => {
        const customOptions = { limit: 5, offset: 10, orderBy: 'name', ascending: true };
        BaseModel.findByCriteria.mockResolvedValueOnce({ success: true, data: [], pagination: {} });

        await Profile.getByRole(role, customOptions);

        expect(BaseModel.findByCriteria).toHaveBeenCalledWith(
            { role: role, is_active: true },
            customOptions
        );
    });

    it('should return error if role is missing', async () => {
      const result = await Profile.getByRole(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rol no proporcionado');
      expect(BaseModel.findByCriteria).not.toHaveBeenCalled();
    });

     it('should return error if role is invalid', async () => {
      const result = await Profile.getByRole('invalid_role');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rol no válido');
      expect(BaseModel.findByCriteria).not.toHaveBeenCalled();
    });

    it('should return error if super.findByCriteria fails', async () => {
      const baseError = { success: false, error: 'Base find failed' };
      BaseModel.findByCriteria.mockResolvedValueOnce(baseError);

      const result = await Profile.getByRole(role);

      expect(result).toEqual(baseError);
    });
  });

  // --- searchPatientsByName ---
  describe('searchPatientsByName', () => {
      const searchName = 'Patient';
      const mockPatients = [{ ...mockProfileRecord, role: 'paciente' }]; // Only one patient returned
      const defaultOptions = { limit: 20, offset: 0, orderBy: 'name', ascending: true };

      it('should call supabase with correct filters and default options', async () => {
        // Mock the direct supabase call resolution using .then
        mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: mockPatients, error: null })));

        const result = await Profile.searchPatientsByName(searchName);

        expect(result.success).toBe(true);
        expect(result.patients).toEqual(mockPatients);
        // ** ADJUSTED EXPECTATION: hasMore should be false if data.length < limit **
        expect(result.pagination).toEqual({ offset: 0, limit: 20, hasMore: false });

        // Verify the supabase call chain
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('role', 'paciente');
        expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('name', `%${searchName}%`);
        expect(mockSupabaseClient.limit).toHaveBeenCalledWith(defaultOptions.limit);
        expect(mockSupabaseClient.range).toHaveBeenCalledWith(defaultOptions.offset, defaultOptions.offset + defaultOptions.limit - 1);
        expect(mockSupabaseClient.order).toHaveBeenCalledWith(defaultOptions.orderBy, { ascending: defaultOptions.ascending });
        expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1); // For query resolution
      });

      it('should pass custom options to supabase call', async () => {
        const customOptions = { limit: 5, offset: 10, orderBy: 'created_at', ascending: false };
        mockSupabaseClient.then.mockImplementationOnce(callback => Promise.resolve(callback({ data: [], error: null }))); // Return empty array for pagination check

        const result = await Profile.searchPatientsByName(searchName, customOptions);

         expect(result.success).toBe(true);
         expect(result.patients).toEqual([]);
         expect(result.pagination).toEqual({ offset: 10, limit: 5, hasMore: false });

        // Verify the supabase call chain with custom options
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('role', 'paciente');
        expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('name', `%${searchName}%`);
        expect(mockSupabaseClient.limit).toHaveBeenCalledWith(customOptions.limit);
        expect(mockSupabaseClient.range).toHaveBeenCalledWith(customOptions.offset, customOptions.offset + customOptions.limit - 1);
        expect(mockSupabaseClient.order).toHaveBeenCalledWith(customOptions.orderBy, { ascending: customOptions.ascending });
        expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1);
      });

       it('should return error if name is missing', async () => {
          const result = await Profile.searchPatientsByName(null);
          expect(result.success).toBe(false);
          // ** CORRECTED ERROR MESSAGE **
          expect(result.error).toContain('Nombre de búsqueda no proporcionado');
          expect(supabase.from).not.toHaveBeenCalled();
      });

      it('should return error if supabase query fails', async () => {
          const dbError = new Error('Supabase query failed');
           mockSupabaseClient.then.mockImplementationOnce((_, reject) => Promise.resolve(reject ? reject(dbError) : Promise.reject(dbError)));

          const result = await Profile.searchPatientsByName(searchName);

          expect(result.success).toBe(false);
          expect(result.error).toBe(dbError.message);
          expect(mockSupabaseClient.then).toHaveBeenCalledTimes(1);
      });
  });

   // --- getAllPatients ---
   describe('getAllPatients', () => {
       const mockPatientProfiles = [{ ...mockProfileRecord, role: 'paciente' }];
       const defaultOptions = { limit: 20, offset: 0, orderBy: 'name', ascending: true };

       it(`should call getByRole with role 'paciente' and pass options`, async () => {
            const getByRoleSpy = jest.spyOn(Profile, 'getByRole')
                .mockResolvedValueOnce({ success: true, profiles: mockPatientProfiles });
            const customOptions = { limit: 10, offset: 5 };

            const result = await Profile.getAllPatients(customOptions);

            expect(result.success).toBe(true);
            expect(result.profiles).toEqual(mockPatientProfiles);
            expect(getByRoleSpy).toHaveBeenCalledWith('paciente', customOptions);
            getByRoleSpy.mockRestore();
       });

        it('should use default options if none provided', async () => {
            const getByRoleSpy = jest.spyOn(Profile, 'getByRole')
                .mockResolvedValueOnce({ success: true, profiles: [] });

            await Profile.getAllPatients(); // No options

            // ** VERIFY CORRECT DEFAULT OPTIONS AGAIN, AS APPLIED BY getByRole **
            // When options is {}, getByRole applies its internal defaults
            expect(getByRoleSpy).toHaveBeenCalledWith('paciente', {}); // getAllPatients passes the empty options object
            getByRoleSpy.mockRestore();
        });

       it('should return error if getByRole fails', async () => {
            const roleError = { success: false, error: 'Failed to get role' };
            const getByRoleSpy = jest.spyOn(Profile, 'getByRole').mockResolvedValueOnce(roleError);

            const result = await Profile.getAllPatients();

            expect(result).toEqual(roleError);
            getByRoleSpy.mockRestore();
       });
   });

    // --- getAllDoctors ---
   describe('getAllDoctors', () => {
       const mockDoctorProfiles = [{ ...mockProfileRecord, role: 'medico' }];
       const defaultOptions = { limit: 20, offset: 0, orderBy: 'name', ascending: true };

       it(`should call getByRole with role 'medico' and pass options`, async () => {
            const getByRoleSpy = jest.spyOn(Profile, 'getByRole')
                .mockResolvedValueOnce({ success: true, profiles: mockDoctorProfiles });
            const customOptions = { limit: 10, offset: 5 };

            const result = await Profile.getAllDoctors(customOptions);

            expect(result.success).toBe(true);
            expect(result.profiles).toEqual(mockDoctorProfiles); // Correct key
            expect(getByRoleSpy).toHaveBeenCalledWith('medico', customOptions);
            getByRoleSpy.mockRestore();
       });

        it('should use default options if none provided', async () => {
            const getByRoleSpy = jest.spyOn(Profile, 'getByRole')
                 .mockResolvedValueOnce({ success: true, profiles: [] });

            await Profile.getAllDoctors(); // No options

             // ** VERIFY CORRECT DEFAULT OPTIONS AGAIN, AS APPLIED BY getByRole **
             // When options is {}, getByRole applies its internal defaults
            expect(getByRoleSpy).toHaveBeenCalledWith('medico', {}); // getAllDoctors passes the empty options object
            getByRoleSpy.mockRestore();
        });

       it('should return error if getByRole fails', async () => {
            const roleError = { success: false, error: 'Failed to get role' };
            const getByRoleSpy = jest.spyOn(Profile, 'getByRole').mockResolvedValueOnce(roleError);

            const result = await Profile.getAllDoctors();

            expect(result).toEqual(roleError);
            getByRoleSpy.mockRestore();
       });
   });

}); 