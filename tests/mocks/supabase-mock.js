/**
 * Mocks para Supabase
 * Permite realizar pruebas sin conexión a la base de datos real
 */

// Base de datos en memoria
const mockDatabase = {
  profiles: [],
  food_entries: [],
  doctor_patient: [],
  doctor_patient_relationships: [],
};

// UUID mock generator
const mockUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock para Supabase
const createMockSupabase = () => {
  let authUser = null;

  // Resetear la BD de prueba
  const resetDatabase = () => {
    mockDatabase.profiles = [];
    mockDatabase.food_entries = [];
    mockDatabase.doctor_patient = [];
    mockDatabase.doctor_patient_relationships = [];
  };

  // Añadir usuario de prueba
  const addTestUser = (userData) => {
    const userId = mockUUID();
    const user = {
      id: userId,
      email: userData.email || `test.${Date.now()}@example.com`,
      role: userData.tipo || "paciente",
      name: userData.nombre || "Usuario Test",
      updated_at: new Date().toISOString(),
    };

    mockDatabase.profiles.push(user);
    return user;
  };

  // Cliente mock
  const mockClient = {
    from: (table) => {
      let query = {
        data: null,
        filters: [],
        limit: null,
        order: null,
        rangeFilter: null,

        // Seleccionar
        select: (columns) => {
          const columnsToSelect = columns || "*";

          // Si columnsToSelect es una cadena, analizar las columnas separadas por comas
          const columnsArray =
            typeof columnsToSelect === "string"
              ? columnsToSelect.split(",").map((c) => c.trim())
              : columnsToSelect;

          // Guardar las columnas seleccionadas en query
          return {
            ...query,
            select: columnsArray,
            then: (callback) => {
              try {
                let filteredData = filterMockData(mockDatabase[table], query);

                // Si select no es "*", filtrar las columnas
                if (columnsArray !== "*") {
                  filteredData = filteredData.map((item) => {
                    const result = {};
                    for (const col of columnsArray) {
                      // Manejar selección condicional, como campos que incluyen image_data
                      if (col === "*") {
                        Object.assign(result, item);
                      } else if (col.includes("!image_data")) {
                        // Caso especial para excluir image_data
                        Object.assign(result, { ...item });
                        delete result.image_data;
                      } else {
                        result[col] = item[col];
                      }
                    }
                    return result;
                  });
                }

                // Aplicar límite si existe
                const limitedData = query.limit
                  ? filteredData.slice(0, query.limit)
                  : filteredData;

                const result = {
                  data: limitedData,
                  error: null,
                  count: filteredData.length,
                };
                return callback(result);
              } catch (error) {
                return callback({ data: null, error, count: 0 });
              }
            },
          };
        },

        // Insertar
        insert: (data) => {
          const records = Array.isArray(data) ? data : [data];
          const result = [];

          try {
            records.forEach((record) => {
              // Validar foreign keys si es tabla food_entries
              if (table === "food_entries" && record.user_id) {
                // Verificar que el usuario existe en la BD mock
                const userExists = mockDatabase.profiles.some(
                  (p) => p.id === record.user_id
                );

                // Si es un UUID válido pero no existe en nuestra BD mock y no es un ID de prueba
                if (
                  !userExists &&
                  record.user_id !== "00000000-0000-0000-0000-000000000000" &&
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    record.user_id
                  )
                ) {
                  // Simular error de foreign key
                  throw {
                    code: "23503",
                    details: `Key (user_id)=(${record.user_id}) is not present in table "users".`,
                    message:
                      'insert or update on table "food_entries" violates foreign key constraint "food_entries_user_id_fkey"',
                  };
                }
              }

              const newRecord = {
                ...record,
                id: record.id || mockUUID(),
                created_at: record.created_at || new Date().toISOString(),
              };
              mockDatabase[table].push(newRecord);
              result.push(newRecord);
            });

            return {
              ...query,
              data: result,
              error: null,
              select: () => ({ data: result, error: null }),
            };
          } catch (error) {
            return {
              ...query,
              data: null,
              error: error,
              select: () => ({ data: null, error: error }),
            };
          }
        },

        // Actualizar
        update: (data) => {
          try {
            // Aplicar filtros para encontrar los registros
            const filteredData = filterMockData(mockDatabase[table], query);

            // Actualizar los registros encontrados
            filteredData.forEach((record) => {
              const index = mockDatabase[table].findIndex(
                (r) => r.id === record.id
              );
              if (index !== -1) {
                mockDatabase[table][index] = {
                  ...mockDatabase[table][index],
                  ...data,
                  updated_at: new Date().toISOString(),
                };
              }
            });

            return {
              ...query,
              data: filteredData.map((record) => ({
                ...record,
                ...data,
                updated_at: new Date().toISOString(),
              })),
              error: null,
              select: () => ({
                data: filteredData.map((record) => ({
                  ...record,
                  ...data,
                  updated_at: new Date().toISOString(),
                })),
                error: null,
              }),
            };
          } catch (error) {
            return {
              ...query,
              data: null,
              error: error,
              select: () => ({ data: null, error: error }),
            };
          }
        },

        // Eliminar
        delete: () => {
          try {
            // Aplicar filtros para encontrar los registros
            const filteredData = filterMockData(mockDatabase[table], query);

            // Eliminar los registros encontrados
            filteredData.forEach((record) => {
              const index = mockDatabase[table].findIndex(
                (r) => r.id === record.id
              );
              if (index !== -1) {
                mockDatabase[table].splice(index, 1);
              }
            });

            return {
              ...query,
              data: null,
              error: null,
              select: () => ({ data: null, error: null }),
            };
          } catch (error) {
            return {
              ...query,
              data: null,
              error: error,
              select: () => ({ data: null, error: error }),
            };
          }
        },

        // Filtros
        eq: (column, value) => {
          query.filters.push({ type: "eq", column, value });
          return query;
        },

        neq: (column, value) => {
          query.filters.push({ type: "neq", column, value });
          return query;
        },

        like: (column, pattern) => {
          query.filters.push({ type: "like", column, pattern });
          return query;
        },

        ilike: (column, pattern) => {
          query.filters.push({ type: "ilike", column, pattern });
          return query;
        },

        or: (conditions) => {
          query.filters.push({ type: "or", conditions });
          return query;
        },

        is: (column, value) => {
          query.filters.push({ type: "is", column, value });
          return query;
        },

        in: (column, values) => {
          query.filters.push({ type: "in", column, values });
          return query;
        },

        gte: (column, value) => {
          query.filters.push({ type: "gte", column, value });
          return query;
        },

        lte: (column, value) => {
          query.filters.push({ type: "lte", column, value });
          return query;
        },

        gt: (column, value) => {
          query.filters.push({ type: "gt", column, value });
          return query;
        },

        lt: (column, value) => {
          query.filters.push({ type: "lt", column, value });
          return query;
        },

        range: (column, from, to) => {
          query.rangeFilter = { column, from, to };
          return query;
        },

        limit: (n) => {
          query.limit = n;
          return query;
        },

        order: (column, options) => {
          query.order = { column, ...options };
          return query;
        },

        // Obtener un solo registro
        single: () => {
          return {
            ...query,
            then: (callback) => {
              try {
                const filteredData = filterMockData(mockDatabase[table], query);
                const result = {
                  data: filteredData.length > 0 ? filteredData[0] : null,
                  error: null,
                };
                return callback(result);
              } catch (error) {
                return callback({ data: null, error });
              }
            },
          };
        },

        then: (callback) => {
          try {
            const filteredData = filterMockData(mockDatabase[table], query);

            // Aplicar límite si existe
            const limitedData = query.limit
              ? filteredData.slice(0, query.limit)
              : filteredData;

            const result = { data: limitedData, error: null };
            return callback(result);
          } catch (error) {
            return callback({ data: null, error });
          }
        },
      };

      return query;
    },

    auth: {
      signIn: ({ email, password }) => {
        const user = mockDatabase.profiles.find((u) => u.email === email);

        if (user) {
          authUser = user;
          return { data: { user }, error: null };
        }

        return { data: null, error: { message: "Invalid credentials" } };
      },

      // Añadir función signUp para los tests de integración
      signUp: ({ email, password, options }) => {
        // Comprobar si el usuario ya existe
        const existingUser = mockDatabase.profiles.find(
          (u) => u.email === email
        );
        if (existingUser) {
          return {
            data: {
              user: {
                email: email,
                identities: [],
              },
            },
            error: {
              message: "Este correo ya está registrado",
              code: "23505",
            },
          };
        }

        // Crear nuevo usuario
        const userId = mockUUID();
        const userData = {
          id: userId,
          email: email,
          name: options?.data?.name || email.split("@")[0],
          role: options?.data?.role || "paciente",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Añadir a la base de datos mock
        mockDatabase.profiles.push(userData);
        authUser = userData;

        return {
          data: {
            user: {
              id: userId,
              email: email,
              user_metadata: {
                name: userData.name,
                role: userData.role,
              },
              identities: [{ id: mockUUID() }],
            },
          },
          error: null,
        };
      },

      // Añadir función signInWithPassword para los tests de integración
      signInWithPassword: ({ email, password }) => {
        const user = mockDatabase.profiles.find((u) => u.email === email);

        // Si el usuario existe y se trata de una credencial correcta
        if (user && password !== "ContraseñaIncorrecta123!") {
          authUser = user;
          return {
            data: {
              user: {
                id: user.id,
                email: user.email,
                user_metadata: {
                  name: user.name,
                  role: user.role,
                },
                email_confirmed_at: new Date().toISOString(),
              },
            },
            error: null,
          };
        }

        return {
          data: null,
          error: { message: "Invalid login credentials" },
        };
      },

      // Añadir función resetPasswordForEmail para los tests de integración
      resetPasswordForEmail: (email, options) => {
        const user = mockDatabase.profiles.find((u) => u.email === email);

        if (user) {
          return { data: {}, error: null };
        }

        // Incluso si el usuario no existe, no revelamos eso por razones de seguridad
        return { data: {}, error: null };
      },

      signOut: () => {
        authUser = null;
        return { error: null };
      },

      getUser: () => {
        return { data: { user: authUser }, error: null };
      },

      admin: {
        createUser: (userData) => {
          const user = addTestUser(userData);
          return { data: { user }, error: null };
        },

        deleteUser: (userId) => {
          const index = mockDatabase.profiles.findIndex((u) => u.id === userId);

          if (index >= 0) {
            mockDatabase.profiles.splice(index, 1);
            return { error: null };
          }

          return { error: { message: "User not found" } };
        },
      },
    },

    // Simular funciones RPC
    rpc: (functionName, params) => {
      if (functionName === "list_tables") {
        return {
          data: [
            { table_name: "profiles" },
            { table_name: "food_entries" },
            { table_name: "doctor_patient" },
          ],
          error: null,
        };
      }

      return { data: null, error: { message: "Function not mocked" } };
    },
  };

  // Función auxiliar para filtrar datos según los criterios del query
  function filterMockData(data, query) {
    // Primero filtrar por filtros normales
    let filteredData = data.filter((item) => {
      // Si no hay filtros, devolver todo
      if (query.filters.length === 0) return true;

      return query.filters.every((filter) => {
        switch (filter.type) {
          case "eq":
            return item[filter.column] === filter.value;
          case "neq":
            return item[filter.column] !== filter.value;
          case "like":
            return String(item[filter.column]).includes(
              filter.pattern.replace(/%/g, "")
            );
          case "ilike":
            return String(item[filter.column])
              .toLowerCase()
              .includes(filter.pattern.replace(/%/g, "").toLowerCase());
          case "is":
            if (filter.value === "null") return item[filter.column] == null;
            if (filter.value === "not.null") return item[filter.column] != null;
            return false;
          case "in":
            return filter.values.includes(item[filter.column]);
          case "gte":
            return item[filter.column] >= filter.value;
          case "lte":
            return item[filter.column] <= filter.value;
          case "gt":
            return item[filter.column] > filter.value;
          case "lt":
            return item[filter.column] < filter.value;
          default:
            return true;
        }
      });
    });

    // Aplicar filtro de rango si existe
    if (query.rangeFilter) {
      const { column, from, to } = query.rangeFilter;
      filteredData = filteredData.filter((item) => {
        const value = item[column];
        return value >= from && value <= to;
      });
    }

    // Aplicar orden si existe
    if (query.order) {
      const { column, ascending = true } = query.order;
      filteredData.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  }

  return {
    client: mockClient,
    resetDatabase,
    addTestUser,
    mockDatabase,
  };
};

module.exports = {
  createMockSupabase,
};
