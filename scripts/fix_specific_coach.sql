-- 🎯 SCRIPT PARA ACTIVAR COACH ESPECÍFICO
-- Ejecutar este script en la base de datos para activar el coach amizaday.dev@gmail.com

-- 1. Verificar estado actual del coach
SELECT 
    id,
    email,
    nombre,
    rol,
    estado_atleta,
    datos_fisicos_capturados,
    fecha_aprobacion,
    created_at as fecha_creacion
FROM users 
WHERE email = 'amizaday.dev@gmail.com'
AND role = 'Entrenador';

-- 2. Activar el coach específico
UPDATE users 
SET estado_atleta = 'activo',
    datos_fisicos_capturados = true,
    fecha_aprobacion = NOW()
WHERE email = 'amizaday.dev@gmail.com'
AND role = 'Entrenador';

-- 3. Verificar el cambio
SELECT 
    id,
    email,
    nombre,
    rol,
    estado_atleta,
    datos_fisicos_capturados,
    fecha_aprobacion
FROM users 
WHERE email = 'amizaday.dev@gmail.com';

-- 4. Verificar todos los coaches
SELECT 
    id,
    email,
    nombre,
    rol,
    estado_atleta,
    datos_fisicos_capturados,
    fecha_aprobacion
FROM users 
WHERE role = 'Entrenador'
ORDER BY created_at DESC;

-- 5. Estadísticas de coaches
SELECT 
    role,
    estado_atleta,
    COUNT(*) as cantidad
FROM users 
WHERE role = 'Entrenador'
GROUP BY role, estado_atleta
ORDER BY role, estado_atleta; 