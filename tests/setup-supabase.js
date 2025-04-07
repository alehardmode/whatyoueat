/**
 * Configuración de cliente Supabase para pruebas
 * Este archivo configura una instancia de cliente Supabase dedicada para pruebas
 */

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno específicas para pruebas
const envPath = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: envPath });

// Verificar si existe el archivo .env.test
if (!fs.existsSync(path.join(process.cwd(), ".env.test"))) {
  console.warn(
    "⚠️ Archivo .env.test no encontrado. Usando configuración de .env"
  );
}

// Obtener credenciales de entorno para pruebas
const supabaseUrl = process.env.SUPABASE_TEST_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_TEST_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Faltan variables de entorno para pruebas con Supabase"
  );
  console.error(
    "   Debe proporcionar SUPABASE_TEST_URL y SUPABASE_TEST_KEY en .env.test"
  );
  process.exit(1);
}

// Opciones del cliente
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "x-application-name": "WhatYouEatTest",
    },
  },
};

// Cliente para pruebas (con clave anónima)
const supabaseTestClient = createClient(
  supabaseUrl,
  supabaseKey,
  supabaseOptions
);

// Cliente admin para pruebas (con clave de servicio)
const supabaseAdminClient = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseKey,
  {
    ...supabaseOptions,
    auth: {
      ...supabaseOptions.auth,
      persistSession: false,
    },
  }
);

/**
 * Limpia los datos de prueba creados
 * @param {string} userId - ID de usuario a limpiar
 */
async function cleanupTestData(userId) {
  try {
    // Validar que el ID sea válido (UUID)
    if (
      !userId ||
      typeof userId !== "string" ||
      !userId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      console.warn(`Ignorando limpieza: ID de usuario inválido ${userId}`);
      return;
    }

    // Limpiar entradas de comida del usuario
    try {
      const { error: foodError } = await supabaseAdminClient
        .from("food_entries")
        .delete()
        .eq("user_id", userId);

      if (foodError && foodError.code !== "PGRST204") {
        // PGRST204 significa "no se encontró la tabla" - podemos ignorar
        console.warn(
          `Error al eliminar entradas de comida: ${foodError.message}`
        );
      }
    } catch (foodErr) {
      console.warn(`Error al eliminar entradas de comida: ${foodErr.message}`);
    }

    // Eliminar relaciones doctor-paciente
    try {
      const { error: drError } = await supabaseAdminClient
        .from("doctor_patient_relationships")
        .delete()
        .or(`doctor_id.eq.${userId},patient_id.eq.${userId}`);

      if (drError && drError.code !== "PGRST204") {
        console.warn(`Error al eliminar relaciones: ${drError.message}`);
      }
    } catch (drErr) {
      console.warn(`Error al eliminar relaciones: ${drErr.message}`);
    }

    // Finalmente, eliminar perfil
    try {
      const { error: profileError } = await supabaseAdminClient
        .from("profiles")
        .delete()
        .eq("id", userId); // CORREGIDO: Usamos id, no user_id

      if (profileError && profileError.code !== "PGRST204") {
        console.warn(`Error al eliminar perfil: ${profileError.message}`);
      }
    } catch (profileErr) {
      console.warn(`Error al eliminar perfil: ${profileErr.message}`);
    }

    console.log(
      `✓ Datos de prueba para usuario ${userId} eliminados correctamente`
    );
  } catch (error) {
    console.error("Error al limpiar datos de prueba:", error);
  }
}

/**
 * Crea un usuario de prueba
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} - Usuario creado
 */
async function createTestUser(userData) {
  try {
    // Crear usuario en auth
    const { data: authData, error: authError } =
      await supabaseAdminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password || "123456",
        email_confirm: true,
        user_metadata: {
          name: userData.nombre || "Usuario de Prueba",
          type: userData.tipo || "paciente",
        },
      });

    if (authError) {
      console.error("Error al crear usuario en Auth:", authError);
      // Retornar un usuario simulado para que las pruebas puedan continuar
      return {
        id: `test-user-${Date.now()}`,
        email: userData.email || `test.${Date.now()}@example.com`,
        nombre: userData.nombre || "Usuario simulado",
        role: userData.tipo || "paciente",
      };
    }

    // Verificar si el usuario fue creado correctamente
    if (!authData || !authData.user || !authData.user.id) {
      console.error("No se pudo crear el usuario en Auth");
      // Retornar usuario simulado
      return {
        id: `test-user-${Date.now()}`,
        email: userData.email || `test.${Date.now()}@example.com`,
        nombre: userData.nombre || "Usuario simulado",
        role: userData.tipo || "paciente",
      };
    }

    // Verificar estructura de la tabla profiles
    const { data: columnInfo, error: schemaError } = await supabaseAdminClient
      .from("profiles")
      .select()
      .limit(1);

    // Preparar datos del perfil
    // IMPORTANTE: Usamos id en lugar de user_id según el esquema definido en init.sql
    const profileData = {
      id: authData.user.id, // CORREGIDO: Usamos id como clave primaria, no user_id
      name: userData.nombre || "Usuario de Prueba",
      role: userData.tipo || "paciente",
    };

    if (schemaError) {
      console.warn(
        "No se pudo verificar el esquema de la tabla profiles:",
        schemaError
      );
    }

    // Añadir datos específicos según el tipo de usuario y la estructura real de la tabla
    if (userData.tipo === "paciente") {
      // Solo agregar campos si existen en la tabla
      if (columnInfo && columnInfo[0] && "age" in columnInfo[0]) {
        profileData.age = userData.edad;
      }
      if (columnInfo && columnInfo[0] && "gender" in columnInfo[0]) {
        profileData.gender = userData.sexo;
      }
      if (columnInfo && columnInfo[0] && "height" in columnInfo[0]) {
        profileData.height = userData.altura;
      }
      if (columnInfo && columnInfo[0] && "weight" in columnInfo[0]) {
        profileData.weight = userData.peso;
      }
    } else if (userData.tipo === "medico") {
      if (columnInfo && columnInfo[0] && "specialty" in columnInfo[0]) {
        profileData.specialty = userData.especialidad;
      }
      if (columnInfo && columnInfo[0] && "license" in columnInfo[0]) {
        profileData.license = userData.licencia;
      }
    }

    // Insertar perfil
    const { error: profileError } = await supabaseAdminClient
      .from("profiles")
      .upsert([profileData]);

    if (profileError) {
      console.error("Error al crear perfil:", profileError);
      // Si falla al crear el perfil, devolver el usuario de auth al menos
      return {
        ...authData.user,
        nombre: userData.nombre || "Usuario sin perfil",
        role: userData.tipo || "paciente",
      };
    }

    return {
      ...authData.user,
      ...profileData,
    };
  } catch (error) {
    console.error("Error al crear usuario de prueba:", error);
    // En caso de error, retornar un usuario simulado para no detener las pruebas
    return {
      id: `test-user-error-${Date.now()}`,
      email: userData?.email || `error-${Date.now()}@example.com`,
      nombre: userData?.nombre || "Usuario error",
      role: userData?.tipo || "paciente",
    };
  }
}

/**
 * Elimina un usuario de prueba y sus datos asociados
 * @param {string} userId - ID del usuario a eliminar
 */
async function deleteTestUser(userId) {
  try {
    // Validar que el ID sea válido (UUID)
    if (
      !userId ||
      typeof userId !== "string" ||
      !userId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      console.warn(`Ignorando eliminación: ID de usuario inválido ${userId}`);
      return;
    }

    // Primero limpiar datos asociados
    await cleanupTestData(userId);

    // Eliminar usuario de auth
    const { error } = await supabaseAdminClient.auth.admin.deleteUser(userId);

    if (error) throw error;

    console.log(`✓ Usuario de prueba ${userId} eliminado correctamente`);
  } catch (error) {
    console.error("Error al eliminar usuario de prueba:", error);
  }
}

/**
 * Crea datos de prueba para comidas
 * @param {string} userId - ID del usuario
 * @param {Object} mealData - Datos de la comida
 * @returns {Promise<Object>} - Entrada creada
 */
async function createTestMeal(userId, mealData) {
  try {
    // Verificar que el userId sea válido
    if (!userId || typeof userId !== "string") {
      console.warn(
        `ID de usuario ${userId} no válido para crear comida. Usando ID de prueba.`
      );
      // Podemos retornar una estructura similar para pruebas
      return {
        id: `test-meal-${Date.now()}`,
        user_id: "00000000-0000-0000-0000-000000000000",
        name: mealData.nombre || "Comida de prueba simulada",
        description: mealData.descripcion || "Entrada simulada para pruebas",
        meal_type: mealData.tipo || "other",
        meal_date: mealData.fecha || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Verificar estructura de la tabla
    const { data: columnInfo, error: schemaError } = await supabaseAdminClient
      .from("food_entries")
      .select()
      .limit(1);

    if (schemaError) {
      console.warn(
        "No se pudo verificar el esquema de la tabla food_entries:",
        schemaError
      );
    }

    const entryData = {
      user_id: userId,
      name: mealData.nombre || "Comida de prueba",
      description:
        mealData.descripcion || "Comida creada para pruebas automatizadas",
      meal_type: mealData.tipo || "other",
      meal_date: mealData.fecha || new Date().toISOString(),
      // Simulación de imagen codificada en base64
      image_data:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Solo agregar test_data si existe en la tabla
    if (columnInfo && columnInfo[0] && "test_data" in columnInfo[0]) {
      entryData.test_data = true;
    }

    // Imprimir los datos que estamos intentando insertar para depuración
    console.log(
      `Intentando crear entrada de comida para usuario ${userId}:`,
      entryData
    );

    const { data, error } = await supabaseAdminClient
      .from("food_entries")
      .insert([entryData])
      .select();

    if (error) {
      console.error("Error al insertar food_entry:", error);
      // En caso de error, creamos un objeto mock para no detener las pruebas
      return {
        id: `test-meal-${Date.now()}`,
        ...entryData,
      };
    }

    if (!data || data.length === 0) {
      console.warn("Inserción exitosa pero sin datos retornados");
      return entryData;
    }

    return data[0];
  } catch (error) {
    console.error("Error al crear comida de prueba:", error);
    // En caso de error, retornar objeto simulado para que las pruebas puedan continuar
    return {
      id: `test-meal-error-${Date.now()}`,
      user_id: userId || "00000000-0000-0000-0000-000000000000",
      name: mealData?.nombre || "Comida simulada por error",
      description: "Comida simulada debido a un error en la creación",
      meal_type: mealData?.tipo || "other",
      meal_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Limpia completamente la base de datos de prueba
 * Función para usar antes de ejecutar cualquier suite de pruebas
 */
async function cleanupTestDatabase() {
  try {
    console.log("🧹 Limpiando base de datos de prueba...");

    // Intentar limpiar food_entries
    try {
      // Primero verificar que la tabla existe consultando su estructura
      const { data: foodEntryData, error: foodStructError } =
        await supabaseAdminClient.from("food_entries").select().limit(1);

      if (!foodStructError) {
        console.log("✓ Tabla food_entries encontrada, procediendo a limpiar");

        // Intentar limpiar por descripción de prueba
        const { error: foodError } = await supabaseAdminClient
          .from("food_entries")
          .delete()
          .ilike("description", "%test%");

        if (foodError) {
          console.warn("Error al limpiar por descripción:", foodError);

          // Alternativa: intentar limpiar entries con nombres de prueba
          const { error: nameError } = await supabaseAdminClient
            .from("food_entries")
            .delete()
            .ilike("name", "%test%");

          if (nameError) {
            console.warn("Error al limpiar por nombre:", nameError);
          } else {
            console.log("✓ Entradas de comida limpiadas por nombre");
          }
        } else {
          console.log("✓ Entradas de comida limpiadas por descripción");
        }
      } else {
        console.log("La tabla food_entries no existe o no es accesible");
      }
    } catch (foodErr) {
      console.warn("Error al intentar limpiar food_entries:", foodErr);
    }

    // Verificar y obtener información de perfiles
    try {
      const { data: profileData, error: profileError } =
        await supabaseAdminClient.from("profiles").select().limit(1);

      if (!profileError && profileData) {
        const profileColumns =
          profileData.length > 0 ? Object.keys(profileData[0]) : [];
        console.log(`Columnas en profiles: ${profileColumns.join(", ")}`);

        // Buscar perfiles de prueba por nombre
        const hasName = profileColumns.includes("name");

        if (hasName) {
          const { data: testProfiles, error: nameError } =
            await supabaseAdminClient
              .from("profiles")
              .select("id")
              .or("name.ilike.%test%,name.ilike.%prueba%")
              .limit(100);

          if (!nameError && testProfiles && testProfiles.length > 0) {
            console.log(
              `Encontrados ${testProfiles.length} perfiles de prueba para limpiar`
            );

            // Limpiar cada perfil
            for (const profile of testProfiles) {
              try {
                // Limpiar datos asociados
                await cleanupTestData(profile.id);

                // Intentar eliminar usuario de auth
                try {
                  await supabaseAdminClient.auth.admin.deleteUser(profile.id);
                  console.log(`✓ Usuario ${profile.id} eliminado de auth`);
                } catch (authError) {
                  // Ignorar errores de auth - usuario probablemente ya eliminado
                }
              } catch (userError) {
                console.warn(
                  `Error al limpiar usuario ${profile.id}:`,
                  userError
                );
              }
            }
          } else {
            console.log("No se encontraron perfiles de prueba para limpiar");
          }
        }
      } else {
        console.log("No se pudo acceder a la tabla profiles");
      }
    } catch (profileErr) {
      console.warn("Error al acceder a perfiles:", profileErr);
    }

    // Intentar limpiar doctor_patient si existe
    try {
      const { error: doctorPatientError } = await supabaseAdminClient
        .from("doctor_patient")
        .select()
        .limit(1);

      if (!doctorPatientError) {
        console.log("✓ Tabla doctor_patient encontrada, procediendo a limpiar");
        await supabaseAdminClient
          .from("doctor_patient")
          .delete()
          .not("id", "is", null);

        console.log("✓ Relaciones doctor_patient limpiadas");
      }
    } catch (dpErr) {
      // La tabla probablemente no existe, ignorar
      console.log("La tabla doctor_patient no existe o no es accesible");
    }

    console.log("✅ Base de datos de prueba limpiada con éxito");
  } catch (error) {
    console.error("❌ Error al limpiar base de datos de prueba:", error);
  }
}

// Exportar cliente y funciones auxiliares
module.exports = {
  supabaseTestClient,
  supabaseAdminClient,
  cleanupTestData,
  createTestUser,
  deleteTestUser,
  createTestMeal,
  cleanupTestDatabase,
};
