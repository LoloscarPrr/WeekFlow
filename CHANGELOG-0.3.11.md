# WeekFlow Alpha 0.3.11

## Move — zonas a evitar (MOV-11)

- Move permite marcar hombros, rodillas, muñecas y espalda baja como zonas que el usuario prefiere no cargar hoy.
- La selección se guarda en las preferencias locales de Move y es compatible con datos de versiones anteriores.
- Rutina, vista previa y “Cambiar ejercicio” usan la misma lógica de compatibilidad para respetar simultáneamente enfoque, silla/suelo y zonas evitadas.
- El fallback de ejercicios ya no puede reintroducir silenciosamente una zona bloqueada cuando las alternativas normales no sirven.
- Se añadieron regresiones automatizadas para filtrado por zonas, fallback y sanitización de preferencias antiguas.

Versión pública: `0.3.11`  
Android versionCode: `67`

Spec: `WF-MOVE-001`
