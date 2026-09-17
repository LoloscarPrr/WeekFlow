import { Pressable, Text, TextInput, View } from 'react-native';
import {
  MOVE_AVOID_AREA_OPTIONS,
  MOVE_EXPERIENCE_OPTIONS,
  MOVE_FOCUS_OPTIONS,
  MOVE_GOAL_OPTIONS,
  MOVE_INTENSITY_LABELS,
} from '@/src/move/adaptation';
import { exerciseCueForPreferences, moveExerciseEquipmentLabel } from '@/src/move/library';
import { moveStyles as styles } from '@/src/move/styles';
import { MOVE_DURATIONS, moveRecordDuration, type MoveController } from '@/src/move/useMoveController';

function parseNumber(text: string, min: number, max: number) {
  const value = Number(text.trim().replace(',', '.'));
  if (!text.trim() || !Number.isFinite(value) || value < min || value > max) return null;
  return Math.round(value * 100) / 100;
}

export function MovePlan({ move }: { move: MoveController }) {
  const {
    duration,
    setDuration,
    lastRecord,
    extraOpen,
    setExtraOpen,
    preferences,
    setFocus,
    setExperience,
    setGoal,
    setWeightKg,
    setHeightCm,
    setDumbbellsKg,
    setKettlebellKg,
    toggleResistanceBand,
    toggleFloorAllowed,
    toggleChairAvailable,
    toggleAvoidArea,
    recommended,
    adaptiveIntensity,
    recommendationCopy,
    useRecommendation,
    preview,
    doneToday,
    startSession,
  } = move;

  return (
    <>
      {doneToday && !extraOpen && lastRecord ? (
        <View style={styles.doneTodayCard}>
          <Text style={styles.doneTodayIcon}>✓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.doneTodayTitle}>Move ya está hecho por hoy</Text>
            <Text style={styles.doneTodayCopy}>{moveRecordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
          </View>
          <Pressable style={styles.extraButton} onPress={() => setExtraOpen(true)}><Text style={styles.extraButtonText}>Otra sesión</Text></Pressable>
        </View>
      ) : null}

      {!doneToday || extraOpen ? (
        <>
          <View style={styles.recommendCard}>
            <View style={styles.recommendTop}>
              <View style={styles.moveIcon}><Text style={styles.moveEmoji}>🏃</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendEyebrow}>{doneToday ? 'OPCIONAL' : 'HOY'} · {MOVE_INTENSITY_LABELS[adaptiveIntensity].toUpperCase()}</Text>
                <Text style={styles.recommendTitle}>{recommended} min recomendados</Text>
                <Text style={styles.recommendCopy}>{doneToday ? 'Ya hiciste una sesión. Esta segunda queda totalmente opcional.' : recommendationCopy}</Text>
              </View>
            </View>

            {duration !== recommended ? (
              <Pressable style={styles.recommendUseButton} onPress={useRecommendation}>
                <Text style={styles.recommendUseText}>Usar recomendación de {recommended} min</Text>
              </Pressable>
            ) : null}

            <Text style={styles.smallLabel}>Tu perfil Move</Text>
            <View style={styles.profilePanel}>
              <Text style={styles.profileSubLabel}>OBJETIVO BASE</Text>
              <View style={styles.profileChips}>
                {MOVE_GOAL_OPTIONS.map((item) => {
                  const active = preferences.goal === item.value;
                  return (
                    <Pressable key={item.value} style={[styles.profileChip, active && styles.profileChipActive]} onPress={() => setGoal(item.value)}>
                      <Text style={[styles.profileChipText, active && styles.profileChipTextActive]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.profileSubLabel}>EXPERIENCIA</Text>
              <View style={styles.profileChips}>
                {MOVE_EXPERIENCE_OPTIONS.map((item) => {
                  const active = preferences.experience === item.value;
                  return (
                    <Pressable key={item.value} style={[styles.profileChip, active && styles.profileChipActive]} onPress={() => setExperience(item.value)}>
                      <Text style={[styles.profileChipText, active && styles.profileChipTextActive]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricField}>
                  <Text style={styles.metricLabel}>Peso</Text>
                  <View style={styles.metricInputWrap}>
                    <TextInput
                      defaultValue={preferences.weightKg ? String(preferences.weightKg) : ''}
                      style={styles.metricInput}
                      keyboardType="decimal-pad"
                      placeholder="Opcional"
                      placeholderTextColor="#60718A"
                      returnKeyType="done"
                      onEndEditing={(event) => setWeightKg(parseNumber(event.nativeEvent.text, 1, 500))}
                    />
                    <Text style={styles.metricUnitText}>kg</Text>
                  </View>
                </View>
                <View style={styles.metricField}>
                  <Text style={styles.metricLabel}>Altura</Text>
                  <View style={styles.metricInputWrap}>
                    <TextInput
                      defaultValue={preferences.heightCm ? String(preferences.heightCm) : ''}
                      style={styles.metricInput}
                      keyboardType="decimal-pad"
                      placeholder="Opcional"
                      placeholderTextColor="#60718A"
                      returnKeyType="done"
                      onEndEditing={(event) => setHeightCm(parseNumber(event.nativeEvent.text, 50, 260))}
                    />
                    <Text style={styles.metricUnitText}>cm</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.profileHint}>Peso y altura dan contexto; WeekFlow no calcula somatotipos ni clasifica tu cuerpo.</Text>
            </View>

            <Text style={styles.smallLabel}>Equipo disponible</Text>
            <View style={styles.equipmentGrid}>
              <View style={[styles.equipmentCard, preferences.equipment.dumbbellsKg !== null && styles.equipmentCardActive]}>
                <Text style={styles.equipmentIcon}>🏋️</Text>
                <Text style={styles.equipmentTitle}>Mancuernas</Text>
                <Text style={styles.equipmentCopy}>Peso por mancuerna</Text>
                <View style={styles.metricInputWrap}>
                  <TextInput
                    defaultValue={preferences.equipment.dumbbellsKg ? String(preferences.equipment.dumbbellsKg) : ''}
                    style={styles.equipmentInput}
                    keyboardType="decimal-pad"
                    placeholder="Sin equipo"
                    placeholderTextColor="#60718A"
                    returnKeyType="done"
                    onEndEditing={(event) => setDumbbellsKg(parseNumber(event.nativeEvent.text, 0.25, 200))}
                  />
                  <Text style={styles.metricUnitText}>kg</Text>
                </View>
              </View>

              <View style={[styles.equipmentCard, preferences.equipment.kettlebellKg !== null && styles.equipmentCardActive]}>
                <Text style={styles.equipmentIcon}>🔔</Text>
                <Text style={styles.equipmentTitle}>Kettlebell</Text>
                <Text style={styles.equipmentCopy}>Carga disponible</Text>
                <View style={styles.metricInputWrap}>
                  <TextInput
                    defaultValue={preferences.equipment.kettlebellKg ? String(preferences.equipment.kettlebellKg) : ''}
                    style={styles.equipmentInput}
                    keyboardType="decimal-pad"
                    placeholder="Sin equipo"
                    placeholderTextColor="#60718A"
                    returnKeyType="done"
                    onEndEditing={(event) => setKettlebellKg(parseNumber(event.nativeEvent.text, 0.25, 200))}
                  />
                  <Text style={styles.metricUnitText}>kg</Text>
                </View>
              </View>
            </View>
            <Pressable style={[styles.preferenceButton, preferences.equipment.resistanceBand && styles.preferenceButtonActive]} onPress={toggleResistanceBand}>
              <Text style={styles.preferenceIcon}>➰</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.preferenceTitle, preferences.equipment.resistanceBand && styles.preferenceTitleActive]}>Tengo banda de resistencia</Text>
                <Text style={styles.preferenceCopy}>Habilita remos y aperturas con banda cuando encajen con la energía y el enfoque.</Text>
              </View>
              <Text style={styles.preferenceCheck}>{preferences.equipment.resistanceBand ? '✓' : '○'}</Text>
            </Pressable>

            <Text style={styles.smallLabel}>¿Qué necesitas de esta sesión?</Text>
            <View style={styles.focusGrid}>
              {MOVE_FOCUS_OPTIONS.map((item) => {
                const active = preferences.focus === item.value;
                return (
                  <Pressable key={item.value} style={[styles.focusButton, active && styles.focusButtonActive]} onPress={() => setFocus(item.value)}>
                    <Text style={styles.focusIcon}>{item.icon}</Text>
                    <Text style={[styles.focusLabel, active && styles.focusLabelActive]}>{item.label}</Text>
                    <Text style={styles.focusCopy}>{item.copy}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.smallLabel}>Cómo quieres moverte</Text>
            <View style={styles.preferenceRow}>
              <Pressable style={[styles.preferenceButton, preferences.chairAvailable && styles.preferenceButtonActive]} onPress={toggleChairAvailable}>
                <Text style={styles.preferenceIcon}>🪑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.preferenceTitle, preferences.chairAvailable && styles.preferenceTitleActive]}>Tengo una silla</Text>
                  <Text style={styles.preferenceCopy}>Puede usarla como apoyo o para movimientos simples.</Text>
                </View>
                <Text style={styles.preferenceCheck}>{preferences.chairAvailable ? '✓' : '○'}</Text>
              </Pressable>
              <Pressable style={[styles.preferenceButton, preferences.floorAllowed && styles.preferenceButtonActive]} onPress={toggleFloorAllowed}>
                <Text style={styles.preferenceIcon}>⬇️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.preferenceTitle, preferences.floorAllowed && styles.preferenceTitleActive]}>Puede incluir suelo</Text>
                  <Text style={styles.preferenceCopy}>Si está apagado, toda la sesión queda de pie o con silla.</Text>
                </View>
                <Text style={styles.preferenceCheck}>{preferences.floorAllowed ? '✓' : '○'}</Text>
              </Pressable>
            </View>

            <Text style={styles.smallLabel}>¿Hay zonas que prefieres no cargar hoy?</Text>
            <View style={styles.preferenceRow}>
              {MOVE_AVOID_AREA_OPTIONS.map((item) => {
                const active = preferences.avoidAreas.includes(item.value);
                return (
                  <Pressable key={item.value} style={[styles.preferenceButton, active && styles.preferenceButtonActive]} onPress={() => toggleAvoidArea(item.value)}>
                    <Text style={styles.preferenceIcon}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.preferenceTitle, active && styles.preferenceTitleActive]}>{item.label}</Text>
                      <Text style={styles.preferenceCopy}>{active ? 'Move evitará ejercicios etiquetados con esta zona.' : 'Toca si hoy prefieres no cargar esta zona.'}</Text>
                    </View>
                    <Text style={styles.preferenceCheck}>{active ? '✓' : '○'}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.smallLabel}>¿Cuánto tiempo tienes?</Text>
            <View style={styles.durationRow}>
              {MOVE_DURATIONS.map((item) => (
                <Pressable key={item} style={[styles.duration, duration === item && styles.durationActive]} onPress={() => setDuration(item)}>
                  <Text style={[styles.durationText, duration === item && styles.durationTextActive]}>{item}</Text>
                  <Text style={[styles.durationUnit, duration === item && styles.durationTextActive]}>min</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.primaryButton} onPress={startSession}><Text style={styles.primaryButtonText}>Empezar sesión guiada</Text></Pressable>
          </View>

          <Text style={styles.section}>QUÉ HARÁS</Text>
          <View style={styles.libraryCard}>
            {preview.map((exercise, index) => {
              const equipment = moveExerciseEquipmentLabel(exercise, preferences);
              return (
                <View key={exercise.id} style={[styles.libraryRow, index === preview.length - 1 && styles.libraryRowLast]}>
                  <Text style={styles.libraryIcon}>{exercise.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.libraryTitle}>{exercise.title}</Text>
                    {equipment ? <Text style={styles.equipmentBadge}>{equipment}</Text> : null}
                    <Text style={styles.libraryCopy}>{exerciseCueForPreferences(exercise, preferences)}</Text>
                  </View>
                </View>
              );
            })}
            <Text style={styles.libraryNote}>La vista previa cambia con energía, objetivo, experiencia, equipo, enfoque, tiempo y restricciones. Puedes cambiar un ejercicio durante la sesión sin perder el progreso.</Text>
          </View>
        </>
      ) : null}

      {!doneToday && lastRecord ? (
        <View style={styles.lastCard}>
          <Text style={styles.lastLabel}>ÚLTIMA SESIÓN</Text>
          <Text style={styles.lastValue}>{moveRecordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
        </View>
      ) : null}
    </>
  );
}
