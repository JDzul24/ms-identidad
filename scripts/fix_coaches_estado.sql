-- 🎯 SCRIPT PARA ACTIVAR COACHES EXISTENTES
-- Ejecutar este script en la base de datos para corregir coaches que están en estado pendiente

-- Activar todos los coaches existentes
UPDATE users 
SET estado_atleta = 'activo',
    datos_fisicos_capturados = true,
    fecha_aprobacion = NOW()
WHERE role IN ('Entrenador', 'Admin')
AND estado_atleta = 'pendiente_datos';

-- Verificar cambios
SELECT 
    id, 
    name, 
    email, 
    role, 
    estado_atleta, 
    datos_fisicos_capturados,
    fecha_aprobacion
FROM users 
WHERE role IN ('Entrenador', 'Admin')
ORDER BY role, name;

-- Mostrar estadísticas
SELECT 
    role,
    estado_atleta,
    COUNT(*) as cantidad
FROM users 
WHERE role IN ('Entrenador', 'Admin')
GROUP BY role, estado_atleta
ORDER BY role, estado_atleta; 