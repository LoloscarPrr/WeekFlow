# WeekFlow Alpha 0.5.42 — Animaciones Lottie (piloto)

## Experiencia visual
- Primeras microanimaciones **reales dentro de WeekFlow**: una confirmación vectorial en Move y Semana.
- **Move:** al completar realmente una rutina, el check verde/azul se dibuja una sola vez antes del feedback; si terminas anticipadamente o retomas un feedback antiguo, queda el símbolo estático.
- **Semana:** tras tocar «Listo, organizar semana», la tarjeta confirmada anima una vez; volver a abrir Semana o alternar entre semanas no reanima el estado guardado.
- Se conserva la información como texto — ninguna animación reemplaza instrucciones ni botones.
- Motion dura ~1,33 segundos, no hace loops, no usa archivos externos, sonidos ni acceso a internet y permite mostrar check estático en «Reducir movimiento».
- Solo dos puntos de confirmación; no se añadieron animaciones permanentes a relojes, entrenamiento en curso o navegación.

## Compatibilidad y seguridad
- `lottie-react-native@~7.3.8`, compatible con la línea Expo 57 / React Native 0.86; lockfile generado y probado en runner aislado antes de integrar.
- Se preservan los parches de seguridad de Alpha 0.5.41, el mismo paquete Android `com.weekflow.app`, la firma release y el versionCode monotónico de CI.
- Sin cambios de SQLite, consentimiento, permisos, reglas Brain/Move/Rest, notificaciones ni Firebase.
- Nueva dependencia nativa exige **APK Android firmada**, no basta reiniciar Expo. Prueba física en Redmi: animación, tamaño, reducción de movimiento y actualización sin desinstalar siguen pendientes de validación.

Spec: WF-UX-004
