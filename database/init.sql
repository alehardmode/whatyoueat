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