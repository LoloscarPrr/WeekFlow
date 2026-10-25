# TLC Initialization Snapshot — WF-SMART-003 (2026-10-25)

## Repo y estado
- Repo LoloscarPrr/WeekFlow main 49fcb95b2c75f10aab9f8f1ab51e4f9a1e415e27, rama feat/wf-smart-003-vision-gateway.
- Technical 0.5.20, Android versionCode fuente 112, package com.weekflow.app; firma permanente. Quality #40159272271 PASS; Android #40159272289 PASS y release .apk/.aab.
- Blueprint Maestro v4.0 §15, Smart Import 0.8.x: recuperar captura/imagen, identidad, horario de siete días, revisión mínima, confirmación y undo.

## Módulos y constraints
- Import UI OCR ML Kit en src/components/ScheduleImportCard.tsx, parseScheduleOcr, Excel, PDF, contrato Brain smartImport/confirmReviewedImport.
- Firebase Auth en src/account/firebaseAuth.ts usa getAuth().currentUser, cuenta opcional.
- Política vigente PRIVACY_POLICY.md: imágenes se procesan localmente, así que NUEVA capacidad debe avisar procesamiento externo antes de enviar.
- GitHub CI firma, paquete y No migration; Expo 57, RN 0.86.
- Infra externa: Supabase proyecto WeekFlow fkgccemweaqkdrjozgml existe INACTIVE. No se verificó secret OPENAI_API_KEY, no deploy; no afirmar servicio online operativo.
- El proveedor de IA puede procesar fotos de planilla con nombres de compañeros: opt-in específico; no usar por defecto.

## Decisión
- NOW WF-SMART-003 puente multimodal opcional y autenticado + procesamiento servidor fuente. Despliegue remoto y cuotas/secretos BACKLOG hasta condiciones verificadas.
- Sin añadir SDK pesado, nueva persistencia o claves en APK. QA física agrupada.
