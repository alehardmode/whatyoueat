-- =============================================
-- Script de Inicialización Optimizado para Supabase
-- Orden: Setup -> Tipos -> Tablas -> Funciones -> Triggers -> Índices -> RLS
-- =============================================

-- ==========================
-- SETUP INICIAL
-- ==========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ==========================
-- TIPOS PERSONALIZADOS
-- ==========================
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('paciente', 'medico');
COMMENT ON TYPE public.user_role IS 'Define los roles posibles para los usuarios en la tabla profiles.';

DROP TYPE IF EXISTS public.relationship_status CASCADE;
CREATE TYPE public.relationship_status AS ENUM ('pending', 'active', 'terminated');
COMMENT ON TYPE public.relationship_status IS 'Define los estados posibles para las relaciones médico-paciente.';

-- ==========================
-- DEFINICIÓN DE TABLAS
-- ==========================

-- Tabla: profiles
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role public.user_role NOT NULL DEFAULT 'paciente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Información de perfil extendido para usuarios autenticados.';
COMMENT ON COLUMN public.profiles.id IS 'Referencia al id del usuario en auth.users.';
COMMENT ON COLUMN public.profiles.name IS 'Nombre completo del usuario. No nulo.';
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario (paciente o medico).';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp de creación.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp de última actualización.';

-- Tabla: food_entries
DROP TABLE IF EXISTS public.food_entries CASCADE;
CREATE TABLE public.food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  meal_type VARCHAR(50),
  meal_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_data TEXT NULL, -- TEMPORAL: Almacenar imagen como Base64. Migrar a Storage.
  image_storage_path TEXT NULL, -- OBJETIVO FINAL: Path en Supabase Storage.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.food_entries IS 'Entradas de comida de pacientes.';
COMMENT ON COLUMN public.food_entries.id IS 'ID único de la entrada.';
COMMENT ON COLUMN public.food_entries.user_id IS 'ID del paciente que creó la entrada.';
COMMENT ON COLUMN public.food_entries.image_data IS '[TEMPORAL] Imagen Base64. Migrar a `image_storage_path`.';
COMMENT ON COLUMN public.food_entries.image_storage_path IS '[OBJETIVO] Ruta en Supabase Storage.';
COMMENT ON COLUMN public.food_entries.created_at IS 'Timestamp de creación.';
COMMENT ON COLUMN public.food_entries.updated_at IS 'Timestamp de última actualización.';


-- Tabla: doctor_patient_relationships
DROP TABLE IF EXISTS public.doctor_patient_relationships CASCADE;
CREATE TABLE public.doctor_patient_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.relationship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_relationship CHECK (doctor_id <> patient_id),
  CONSTRAINT unique_doctor_patient UNIQUE (doctor_id, patient_id)
);
COMMENT ON TABLE public.doctor_patient_relationships IS 'Relaciones médico-paciente.';
COMMENT ON COLUMN public.doctor_patient_relationships.id IS 'ID único de la relación.';
COMMENT ON COLUMN public.doctor_patient_relationships.doctor_id IS 'ID del perfil del médico.';
COMMENT ON COLUMN public.doctor_patient_relationships.patient_id IS 'ID del perfil del paciente.';
COMMENT ON COLUMN public.doctor_patient_relationships.status IS 'Estado de la relación.';
COMMENT ON COLUMN public.doctor_patient_relationships.created_at IS 'Timestamp de creación.';
COMMENT ON COLUMN public.doctor_patient_relationships.updated_at IS 'Timestamp de última actualización.';
COMMENT ON CONSTRAINT no_self_relationship ON public.doctor_patient_relationships IS 'Evita auto-relaciones.';
COMMENT ON CONSTRAINT unique_doctor_patient ON public.doctor_patient_relationships IS 'Evita relaciones duplicadas.';

-- ==========================
-- FUNCIONES AUXILIARES
-- ==========================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Actualiza updated_at automáticamente.';

CREATE OR REPLACE FUNCTION public.is_doctor(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'medico'::public.user_role);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
COMMENT ON FUNCTION public.is_doctor(UUID) IS 'Verifica si un usuario es médico.';

CREATE OR REPLACE FUNCTION public.check_doctor_patient_roles()
RETURNS TRIGGER AS $$
DECLARE doctor_role public.user_role; patient_role public.user_role;
BEGIN
  SELECT role INTO doctor_role FROM public.profiles WHERE id = NEW.doctor_id;
  SELECT role INTO patient_role FROM public.profiles WHERE id = NEW.patient_id;
  IF doctor_role IS NULL OR doctor_role <> 'medico'::public.user_role THEN RAISE EXCEPTION 'Usuario % no es médico.', NEW.doctor_id; END IF;
  IF patient_role IS NULL OR patient_role <> 'paciente'::public.user_role THEN RAISE EXCEPTION 'Usuario % no es paciente.', NEW.patient_id; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.check_doctor_patient_roles() IS 'Valida roles en relaciones médico-paciente (INSERT/UPDATE).';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE user_name TEXT; input_role TEXT; assigned_role public.user_role;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_app_meta_data->>'name', NEW.email, 'Usuario ' || NEW.id::text);
  input_role := COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_app_meta_data->>'role');
  IF input_role IS NOT NULL AND input_role IN ('paciente', 'medico') THEN assigned_role := input_role::public.user_role; ELSE assigned_role := 'paciente'::public.user_role; END IF;
  BEGIN
    INSERT INTO public.profiles (id, name, role) VALUES (NEW.id, user_name, assigned_role);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] Error insertando perfil para %: %.', NEW.id, SQLERRM;
    INSERT INTO public.profiles (id, name, role) VALUES (NEW.id, user_name, assigned_role) ON CONFLICT (id) DO NOTHING;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea perfil al registrar usuario en auth.users.';

-- NUEVA FUNCIÓN DE TRIGGER --
CREATE OR REPLACE FUNCTION public.prevent_relationship_patient_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_id IS DISTINCT FROM OLD.patient_id THEN
      RAISE EXCEPTION 'No se permite cambiar el paciente (patient_id) de una relación existente.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.prevent_relationship_patient_change() IS 'Trigger function: Previene cambio de patient_id en doctor_patient_relationships durante UPDATE.';

-- ==========================
-- TRIGGERS
-- ==========================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_entries_updated_at ON public.food_entries;
CREATE TRIGGER update_food_entries_updated_at BEFORE UPDATE ON public.food_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_patient_relationships_updated_at ON public.doctor_patient_relationships;
CREATE TRIGGER update_doctor_patient_relationships_updated_at BEFORE UPDATE ON public.doctor_patient_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_check_doctor_patient_roles ON public.doctor_patient_relationships;
CREATE TRIGGER trigger_check_doctor_patient_roles BEFORE INSERT OR UPDATE ON public.doctor_patient_relationships FOR EACH ROW EXECUTE FUNCTION public.check_doctor_patient_roles();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NUEVO TRIGGER --
DROP TRIGGER IF EXISTS trigger_prevent_relationship_patient_change ON public.doctor_patient_relationships;
CREATE TRIGGER trigger_prevent_relationship_patient_change
BEFORE UPDATE ON public.doctor_patient_relationships
FOR EACH ROW
WHEN ( public.is_doctor(auth.uid()) AND OLD.doctor_id = auth.uid() ) -- Aplica solo cuando el médico actualiza
EXECUTE FUNCTION public.prevent_relationship_patient_change();
COMMENT ON TRIGGER trigger_prevent_relationship_patient_change ON public.doctor_patient_relationships IS 'Previene que un médico cambie el patient_id al actualizar una relación.';


-- ==========================
-- ÍNDICES PARA RENDIMIENTO
-- ==========================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_id ON public.food_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_created_at ON public.food_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_meal_date ON public.food_entries(meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_doctor_id ON public.doctor_patient_relationships(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_patient_id ON public.doctor_patient_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_status ON public.doctor_patient_relationships(status);

-- =============================================
-- SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_relationships FORCE ROW LEVEL SECURITY;

-- Políticas RLS para 'profiles'
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Médicos pueden ver todos los perfiles (para buscar pacientes, etc.)" ON public.profiles;
CREATE POLICY "Médicos pueden ver todos los perfiles (para buscar pacientes, etc.)" ON public.profiles FOR SELECT TO authenticated USING (public.is_doctor(auth.uid())); -- Opción 1: Ver todos
-- DROP POLICY IF EXISTS "Médicos pueden ver perfiles de sus pacientes activos" ON public.profiles;
-- CREATE POLICY "Médicos pueden ver perfiles de sus pacientes activos" ON public.profiles FOR SELECT TO authenticated USING (public.is_doctor(auth.uid()) AND EXISTS (SELECT 1 FROM public.doctor_patient_relationships dpr WHERE dpr.doctor_id = auth.uid() AND dpr.patient_id = public.profiles.id AND dpr.status = 'active'::public.relationship_status)); -- Opción 2: Solo sus pacientes activos

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil (defensa en profundidad)" ON public.profiles;
CREATE POLICY "Usuarios pueden insertar su propio perfil (defensa en profundidad)" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Políticas RLS para 'food_entries'
DROP POLICY IF EXISTS "Pacientes pueden gestionar sus propias entradas de comida" ON public.food_entries;
CREATE POLICY "Pacientes pueden gestionar sus propias entradas de comida" ON public.food_entries FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Médicos pueden ver entradas de sus pacientes activos" ON public.food_entries;
CREATE POLICY "Médicos pueden ver entradas de sus pacientes activos" ON public.food_entries FOR SELECT TO authenticated USING (public.is_doctor(auth.uid()) AND EXISTS (SELECT 1 FROM public.doctor_patient_relationships dpr WHERE dpr.doctor_id = auth.uid() AND dpr.patient_id = public.food_entries.user_id AND dpr.status = 'active'::public.relationship_status));

-- Políticas RLS para 'doctor_patient_relationships'
DROP POLICY IF EXISTS "Médicos y Pacientes pueden ver sus relaciones" ON public.doctor_patient_relationships;
CREATE POLICY "Médicos y Pacientes pueden ver sus relaciones" ON public.doctor_patient_relationships FOR SELECT TO authenticated USING (doctor_id = auth.uid() OR patient_id = auth.uid());

DROP POLICY IF EXISTS "Médicos pueden crear relaciones" ON public.doctor_patient_relationships;
CREATE POLICY "Médicos pueden crear relaciones" ON public.doctor_patient_relationships FOR INSERT TO authenticated WITH CHECK (public.is_doctor(auth.uid()) AND doctor_id = auth.uid());

-- POLÍTICA UPDATE SIMPLIFICADA --
DROP POLICY IF EXISTS "Médicos pueden actualizar el estado de sus relaciones" ON public.doctor_patient_relationships;
CREATE POLICY "Médicos pueden actualizar el estado de sus relaciones"
ON public.doctor_patient_relationships FOR UPDATE
TO authenticated
USING (
    public.is_doctor(auth.uid())
    AND doctor_id = auth.uid()
)
WITH CHECK (
    doctor_id = auth.uid()
    -- Validación de patient_id movida a trigger 'trigger_prevent_relationship_patient_change'
);
-- FIN POLÍTICA SIMPLIFICADA --

DROP POLICY IF EXISTS "Médicos pueden terminar (eliminar) sus relaciones" ON public.doctor_patient_relationships;
CREATE POLICY "Médicos pueden terminar (eliminar) sus relaciones" ON public.doctor_patient_relationships FOR DELETE TO authenticated USING (public.is_doctor(auth.uid()) AND doctor_id = auth.uid());

DROP POLICY IF EXISTS "Pacientes pueden rechazar/eliminar relaciones pendientes" ON public.doctor_patient_relationships;
CREATE POLICY "Pacientes pueden rechazar/eliminar relaciones pendientes" ON public.doctor_patient_relationships FOR DELETE TO authenticated USING (patient_id = auth.uid() AND status = 'pending'::public.relationship_status);

-- ==========================
-- FIN DEL SCRIPT
-- ==========================