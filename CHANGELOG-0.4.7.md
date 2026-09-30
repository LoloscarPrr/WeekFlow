# WeekFlow 0.4.7

## Food — recomendaciones menos repetitivas

- Food usa el historial local reciente como una señal adicional al ordenar recetas viables.
- Una receta consumida hoy o en los últimos días baja de prioridad frente a alternativas comparables.
- La penalización disminuye con los días y nunca oculta una receta.
- Una receta repetida puede seguir primera cuando despensa, tiempo o contexto la hacen claramente más viable.
- Registros manuales con el mismo texto de una receta no generan penalización accidental.
- Consumos desde receta, sugerencia o porción preparada pueden alimentar la señal de recencia.
- Al completar una receta, el ranking se actualiza inmediatamente sin reiniciar Food.
- Se reutiliza `food-history`; no hay migración SQLite ni cambio de formato de datos.

Android source versionCode: `89`

Spec: WF-FOOD-004
