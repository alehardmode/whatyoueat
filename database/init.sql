-- Script de inicialización para Supabase SQL Editor
-- Ejecutar desde la consola SQL de Supabase
-- https://app.supabase.io/ > Tu Proyecto > SQL Editor > Nuevo Query

-- Activar la extensión UUID si no está activada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear un tipo personalizado para roles
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('paciente', 'medico');

-- Crear tabla de perfiles (extiende la información del usuario de auth.users)
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'paciente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('paciente', 'medico'))
);

-- Comentarios para la tabla de perfiles
COMMENT ON TABLE profiles IS 'Información de perfil extendido para usuarios autenticados por Supabase';
COMMENT ON COLUMN profiles.id IS 'Referencia al id de auth.users';
COMMENT ON COLUMN profiles.name IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.role IS 'Rol del usuario: paciente o médico';
COMMENT ON COLUMN profiles.created_at IS 'Fecha de creación del perfil';
COMMENT ON COLUMN profiles.updated_at IS 'Fecha de última actualización del perfil';

-- Tabla de Entradas de Comida (modificada para referenciar a auth.users)
DROP TABLE IF EXISTS food_entries CASCADE;
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  comments TEXT,
  ingredients TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios para la tabla de entradas de comida
COMMENT ON TABLE food_entries IS 'Almacena las entradas de comida subidas por los pacientes';
COMMENT ON COLUMN food_entries.id IS 'Identificador único para cada entrada';
COMMENT ON COLUMN food_entries.user_id IS 'Identificador del usuario (paciente) que subió la entrada';
COMMENT ON COLUMN food_entries.image_url IS 'URL de la imagen subida';
COMMENT ON COLUMN food_entries.comments IS 'Comentarios sobre la comida';
COMMENT ON COLUMN food_entries.ingredients IS 'Lista de ingredientes y cantidades';
COMMENT ON COLUMN food_entries.created_at IS 'Fecha de creación de la entrada';
COMMENT ON COLUMN food_entries.updated_at IS 'Fecha de última actualización de la entrada';

-- Tabla de relaciones médico-paciente
DROP TABLE IF EXISTS doctor_patient_relationships CASCADE;
CREATE TABLE doctor_patient_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_relationship CHECK (doctor_id <> patient_id),
  CONSTRAINT unique_doctor_patient UNIQUE (doctor_id, patient_id)
);

-- Función para validar roles en relaciones médico-paciente
CREATE OR REPLACE FUNCTION check_doctor_patient_roles()
RETURNS TRIGGER AS $$
DECLARE
  doctor_role TEXT;
  patient_role TEXT;
BEGIN
  -- Obtener los roles
  SELECT role INTO doctor_role FROM profiles WHERE id = NEW.doctor_id;
  SELECT role INTO patient_role FROM profiles WHERE id = NEW.patient_id;

  -- Validar roles
  IF doctor_role <> 'medico' THEN
    RAISE EXCEPTION 'El usuario con ID % no es médico', NEW.doctor_id;
  END IF;
  
  IF patient_role <> 'paciente' THEN
    RAISE EXCEPTION 'El usuario con ID % no es paciente', NEW.patient_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar roles en relaciones médico-paciente
DROP TRIGGER IF EXISTS trigger_check_doctor_patient_roles ON doctor_patient_relationships;
CREATE TRIGGER trigger_check_doctor_patient_roles
BEFORE INSERT OR UPDATE ON doctor_patient_relationships
FOR EACH ROW
EXECUTE FUNCTION check_doctor_patient_roles();

-- Comentarios para la tabla de relaciones médico-paciente
COMMENT ON TABLE doctor_patient_relationships IS 'Almacena las relaciones entre médicos y sus pacientes';
COMMENT ON COLUMN doctor_patient_relationships.id IS 'Identificador único para cada relación';
COMMENT ON COLUMN doctor_patient_relationships.doctor_id IS 'Identificador del médico';
COMMENT ON COLUMN doctor_patient_relationships.patient_id IS 'Identificador del paciente';
COMMENT ON COLUMN doctor_patient_relationships.status IS 'Estado de la relación: pending (pendiente), active (activa), terminated (terminada)';
COMMENT ON COLUMN doctor_patient_relationships.created_at IS 'Fecha de creación de la relación';
COMMENT ON COLUMN doctor_patient_relationships.updated_at IS 'Fecha de última actualización de la relación';

-- Índices para mejorar el rendimiento
CREATE INDEX idx_doctor_patient_doctor_id ON doctor_patient_relationships(doctor_id);
CREATE INDEX idx_doctor_patient_patient_id ON doctor_patient_relationships(patient_id);
CREATE INDEX idx_doctor_patient_status ON doctor_patient_relationships(status);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_doctor_patient_relationships_updated_at ON doctor_patient_relationships;
CREATE TRIGGER update_doctor_patient_relationships_updated_at
BEFORE UPDATE ON doctor_patient_relationships
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Habilitar RLS en la tabla
ALTER TABLE doctor_patient_relationships ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para la tabla de relaciones médico-paciente
DROP POLICY IF EXISTS "Doctors can view their patient relationships" ON doctor_patient_relationships;
CREATE POLICY "Doctors can view their patient relationships"
ON doctor_patient_relationships FOR SELECT
TO authenticated
USING (doctor_id = auth.uid() OR patient_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can insert relationships" ON doctor_patient_relationships;
CREATE POLICY "Doctors can insert relationships"
ON doctor_patient_relationships FOR INSERT
TO authenticated
WITH CHECK (doctor_id = auth.uid() AND is_doctor(auth.uid()));

DROP POLICY IF EXISTS "Doctors can update their patient relationships" ON doctor_patient_relationships;
CREATE POLICY "Doctors can update their patient relationships"
ON doctor_patient_relationships FOR UPDATE
TO authenticated
USING (doctor_id = auth.uid() AND is_doctor(auth.uid()));

DROP POLICY IF EXISTS "Doctors can delete their patient relationships" ON doctor_patient_relationships;
CREATE POLICY "Doctors can delete their patient relationships"
ON doctor_patient_relationships FOR DELETE
TO authenticated
USING (doctor_id = auth.uid() AND is_doctor(auth.uid()));

-- Índices para mejorar el rendimiento
CREATE INDEX idx_food_entries_user_id ON food_entries(user_id);
CREATE INDEX idx_food_entries_created_at ON food_entries(created_at);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_entries_updated_at ON food_entries;
CREATE TRIGGER update_food_entries_updated_at
BEFORE UPDATE ON food_entries
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)

-- Habilitar RLS en las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

-- Función para verificar si un usuario es médico
CREATE OR REPLACE FUNCTION is_doctor(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'medico'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Política para perfiles (usuarios pueden ver y editar su propio perfil, médicos pueden ver todos)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid() OR is_doctor(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- Política para entradas de comida
DROP POLICY IF EXISTS "Patients can manage own entries" ON food_entries;
CREATE POLICY "Patients can manage own entries" 
ON food_entries 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid() OR is_doctor(auth.uid()));

-- Función mejorada para crear perfil automáticamente después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
BEGIN
  -- Obtener el nombre de los metadatos, con fallback al email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_app_meta_data->>'name',
    NEW.email
  );
  
  -- Determinar el rol como texto, con fallback a 'paciente'
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_app_meta_data->>'role',
    'paciente'
  );
  
  -- Validar el rol para asegurarse que sea uno de los valores permitidos
  IF user_role NOT IN ('paciente', 'medico') THEN
    user_role := 'paciente';
  END IF;
  
  -- Insertar el perfil con los valores determinados, con conversión explícita
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id, 
    user_name, 
    user_role::public.user_role  -- Conversión explícita con calificación de esquema
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Capturar cualquier error y hacer un intento con el valor predeterminado
    INSERT INTO public.profiles (id, name, role)
    VALUES (NEW.id, COALESCE(user_name, NEW.email), 'paciente'::public.user_role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Buckets de almacenamiento para imágenes
-- NOTA: Esto debe configurarse manualmente desde la UI de Supabase Storage
-- Crear un bucket llamado "food-photos" con permisos RLS adecuados