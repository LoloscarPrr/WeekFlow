# WeekFlow 0.4.8

## Rest
- Añade pausas de descanso opcionales cuando la energía viene baja y existe margen real.
- `cansado` propone 20 min y `agotado` 30 min.
- La pausa nunca reemplaza el sueño principal ni aparece dentro de su ventana protegida.
- Mantiene prioridad de recuperación post-turno nocturno.
- El plan principal de cierre, sueño, despertar y entrada sigue visible.

## Semana
- Oculta temporalmente `Importar horario` de la interfaz.
- La edición manual de los 7 días sigue siendo el flujo oficial por ahora.
- El código OCR/Excel/PDF se conserva, pero queda fuera de la experiencia hasta Smart Import con WeekFlow Brain.

## QA
- Nuevas regresiones Rest para energía, margen, sueño principal y recuperación nocturna.
- Regresión estructural para impedir que Semana vuelva a exponer el importador heredado antes de tiempo.
- Sin cambios de esquema ni migraciones.
- Android source versionCode 90.
