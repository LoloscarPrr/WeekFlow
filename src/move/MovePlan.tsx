import { useState } from 'react';
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

function optionLabel<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function equipmentSummary(move: MoveController) {
  const { equipment } = move.preferences;
  const parts: string[] = [];
  if (equipment.dumbbellsKg) parts.push(`Mancuernas ${equipment.dumbbellsKg} kg`);
  if (equipment.kettlebellKg) parts.push(`Kettlebell ${equipment.kettlebellKg} kg`);
  if (equipment.resistanceBand) parts.push('Banda');
  return parts.length ? parts.join(' · ') : 'Sin cargas externas';
}

export function MovePlan({ move }: { move: MoveController }) {
  const [profileOpen, setProfileOpen] = useState(false);
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

  const goalLabel = optionLabel(MOVE_GOAL_OPTIONS, preferences.goal);
  const experienceLabel = optionLabel(MOVE_EXPERIENCE_OPTIONS, preferences.experience);
  const selectedFocus = MOVE_FOCUS_OPTIONS.find((item) => item.value === preferences.focus);

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

            <Text style={styles.smallLabel}>Perfil base</Text>
            <View style={styles.preferenceButton}>
              <Text style={styles.preferenceIcon}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceTitleActive}>{goalLabel} · {experienceLabel}</Text>
                <Text style={styles.preferenceCopy}>{equipmentSummary(move)}</Text>
              </View>
              <Pressable style={styles.profileChip} onPress={() => setProfileOpen((open) => !open)}>
                <Text style={styles.profileChipText}>{profileOpen ? 'Cerrar' : 'Editar'}</Text>
              </Pressable>
            </View>

            {profileOpen ? (
              <>
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
                  <Text style={styles.profileHint}>Peso y altura solo dan contexto a la carga; WeekFlow no clasifica tu cuerpo.</Text>
                </View>

                <Text style={styles.smallLabel}>Equipo habitual</Text>
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
                    <Text style={[styles.preferenceTitle, preferences.equipment.resistanceBand && styles.preferenceTitleActive]}>Banda de resistencia</Text>
                    <Text style={styles.preferenceCopy}>Se usa solo cuando el ejercicio y la intensidad encajan.</Text>
                  </View>
                  <Text style={styles.preferenceCheck}>{preferences.equipment.resistanceBand ? '✓' : '○'}</Text>
                </Pressable>
              </>
            ) : null}

            <Text style={styles.smallLabel}>Enfoque de hoy</Text>
            <View style={styles.profileChips}>
              {MOVE_FOCUS_OPTIONS.map((item) => {
                const active = preferences.focus === item.value;
                return (
                  <Pressable key={item.value} style={[styles.profileChip, active && styles.profileChipActive]} onPress={() => setFocus(item.value)}>
                    <Text style={[styles.profileChipText, active && styles.profileChipTextActive]}>{item.icon} {item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedFocus ? <Text style={styles.profileHint}>{selectedFocus.copy}</Text> : null}

            <Text style={styles.smallLabel}>Ajustes de hoy</Text>
            <View style={styles.profileChips}>
              <Pressable style={[styles.profileChip, preferences.chairAvailable && styles.profileChipActive]} onPress={toggleChairAvailable}>
                <Text style={[styles.profileChipText, preferences.chairAvailable && styles.profileChipTextActive]}>🪑 Silla</Text>
              </Pressable>
              <Pressable style={[styles.profileChip, preferences.floorAllowed && styles.profileChipActive]} onPress={toggleFloorAllowed}>
                <Text style={[styles.profileChipText, preferences.floorAllowed && styles.profileChipTextActive]}>⬇️ Suelo</Text>
              </Pressable>
            </View>

            <Text style={styles.profileSubLabel}>EVITAR HOY</Text>
            <View style={styles.profileChips}>
              {MOVE_AVOID_AREA_OPTIONS.map((item) => {
                const active = preferences.avoidAreas.includes(item.value);
                return (
                  <Pressable key={item.value} style={[styles.profileChip, active && styles.profileChipActive]} onPress={() => toggleAvoidArea(item.value)}>
                    <Text style={[styles.profileChipText, active && styles.profileChipTextActive]}>{item.icon} {item.label}</Text>
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

          <Text style={styles.section}>VISTA PREVIA</Text>
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
            <Text style={styles.libraryNote}>La rutina se adapta con energía, feedback, perfil, equipo, tiempo y restricciones. Puedes cambiar un ejercicio durante la sesión.</Text>
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
