import { MOVE_MUSCLE_GROUPS, MOVE_MUSCLE_LABELS, describeTargetMuscles } from './muscles';
import { compatibleTargetedExercises } from './library';
import { KeyboardAwareTextInput as TextInput } from '@/src/components/KeyboardAwareScrollView';
import { useState } from 'react';
import { router } from 'expo-router';
import { loadConfirmedWeeklyPlan } from '@/src/brain/weeklyPlanPersistence';
import { Pressable, Text, View } from 'react-native';
import {
  MOVE_AVOID_AREA_OPTIONS,
  MOVE_EXPERIENCE_OPTIONS,
  MOVE_FOCUS_OPTIONS,
  MOVE_GOAL_OPTIONS,
  MOVE_INTENSITY_LABELS,
  type MoveEquipmentLoadField,
  type MoveEquipmentToggleField,
  type MoveTrainingStyle,
} from '@/src/move/adaptation';
import {
  exerciseCueForPreferences,
  moveExerciseEquipmentLabel,
  routineExercisePrescription,
  routineStyleLabel,
  routineSummary,
} from '@/src/move/library';
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

const LOAD_EQUIPMENT: { field: MoveEquipmentLoadField; icon: string; title: string; copy: string; unit: string; min: number; max: number }[] = [
  { field: 'dumbbellsKg', icon: '🏋️', title: 'Mancuernas', copy: 'Peso por mancuerna', unit: 'kg c/u', min: 0.25, max: 200 },
  { field: 'kettlebellKg', icon: '🔔', title: 'Kettlebell', copy: 'Carga disponible', unit: 'kg', min: 0.25, max: 200 },
  { field: 'barbellKg', icon: '🏋️', title: 'Barra', copy: 'Peso total cargado', unit: 'kg', min: 1, max: 500 },
  { field: 'medicineBallKg', icon: '🏐', title: 'Balón medicinal', copy: 'Carga disponible', unit: 'kg', min: 0.25, max: 100 },
  { field: 'weightedVestKg', icon: '🎽', title: 'Chaleco lastrado', copy: 'Carga del chaleco', unit: 'kg', min: 0.25, max: 100 },
];

const TOGGLE_EQUIPMENT: { field: MoveEquipmentToggleField; icon: string; title: string }[] = [
  { field: 'resistanceBand', icon: '➰', title: 'Banda de resistencia' },
  { field: 'bench', icon: '🛋️', title: 'Banco' },
  { field: 'pullupBar', icon: '🧗', title: 'Barra de dominadas' },
  { field: 'cableMachine', icon: '🎛️', title: 'Polea / cable' },
  { field: 'gymMachines', icon: '⚙️', title: 'Máquinas de gimnasio' },
  { field: 'suspensionTrainer', icon: '🪢', title: 'TRX / suspensión' },
  { field: 'jumpRope', icon: '🪢', title: 'Cuerda para saltar' },
  { field: 'stepBox', icon: '🪜', title: 'Step / cajón' },
  { field: 'foamRoller', icon: '🧻', title: 'Foam roller' },
  { field: 'battleRope', icon: '🌊', title: 'Battle rope' },
  { field: 'parallelBars', icon: '💪', title: 'Paralelas' },
];

const TRAINING_STYLES: { value: MoveTrainingStyle; label: string; copy: string }[] = [
  { value: 'auto', label: 'Auto', copy: 'Move decide según objetivo, energía, nivel y tiempo.' },
  { value: 'intervalos', label: 'Intervalos', copy: 'Ejercicios temporizados con pausas cortas.' },
  { value: 'series', label: 'Series', copy: 'Series + repeticiones + descanso estructurado.' },
  { value: 'amrap', label: 'AMRAP', copy: 'Circuito por rondas de tiempo cuando el contexto lo permite.' },
];

function equipmentSummary(move: MoveController) {
  const { equipment } = move.preferences;
  const parts: string[] = [];
  if (equipment.dumbbellsKg) parts.push(`Mancuernas ${equipment.dumbbellsKg} kg`);
  if (equipment.kettlebellKg) parts.push(`Kettlebell ${equipment.kettlebellKg} kg`);
  if (equipment.barbellKg) parts.push(`Barra ${equipment.barbellKg} kg`);
  if (equipment.resistanceBand) parts.push('Banda');
  if (equipment.bench) parts.push('Banco');
  if (equipment.pullupBar) parts.push('Dominadas');
  if (equipment.cableMachine) parts.push('Polea');
  if (equipment.gymMachines) parts.push('Máquinas');
  if (equipment.suspensionTrainer) parts.push('TRX');
  if (equipment.medicineBallKg) parts.push(`Balón ${equipment.medicineBallKg} kg`);
  if (equipment.jumpRope) parts.push('Cuerda');
  if (equipment.stepBox) parts.push('Step');
  if (equipment.foamRoller) parts.push('Roller');
  if (equipment.battleRope) parts.push('Battle rope');
  if (equipment.parallelBars) parts.push('Paralelas');
  if (equipment.weightedVestKg) parts.push(`Chaleco ${equipment.weightedVestKg} kg`);
  return parts.length ? parts.join(' · ') : 'Sin equipo externo registrado';
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
    effectivePreferences,
    preparedWeekly,
    prepareWeeklySession,
    setFocus,
    setTargetMuscles,
    setExperience,
    setGoal,
    setTrainingStyle,
    setWeightKg,
    setHeightCm,
    setEquipmentLoad,
    toggleEquipment,
    toggleLowImpactOnly,
    toggleFloorAllowed,
    toggleChairAvailable,
    toggleAvoidArea,
    recommended,
    adaptiveIntensity,
    useRecommendation,
    preview,
    routine,
    doneToday,
    startSession,
  } = move;

  const goalLabel = optionLabel(MOVE_GOAL_OPTIONS, preferences.goal);
  const experienceLabel = optionLabel(MOVE_EXPERIENCE_OPTIONS, preferences.experience);
  const hasCompatibleTarget = !effectivePreferences.targetMuscles.length || compatibleTargetedExercises(effectivePreferences, adaptiveIntensity).length > 0;
  const todayKey = (() => {
    const today = new Date();
    return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  })();
  // A confirmed session remains actionable throughout its scheduled day even
  // after the clock time passes. A deep-linked slot takes precedence.
  const plannedMove = preparedWeekly ?? (loadConfirmedWeeklyPlan()?.moveSlots ?? [])
    .find(slot => slot.date > todayKey || (slot.date === todayKey && !doneToday));

  return (
    <>
      {plannedMove ? (
        <View style={styles.recommendCard}>
          <Text style={styles.smallLabel}>SESIÓN CONFIRMADA · PILAR MOVE</Text>
          <Text style={styles.recommendTitle}>{plannedMove.date} · {plannedMove.start}–{plannedMove.end}</Text>
          <Text style={styles.preferenceCopy}>{plannedMove.muscles} · {plannedMove.durationMin} min · intensidad orientativa {plannedMove.intensity}</Text>
          <Text style={styles.preferenceCopy}>Esta sesión tiene su propio enfoque muscular. Al iniciarla, Move recalcula intensidad y ejercicios con tu energía y equipamiento reales.</Text>
          {preparedWeekly?.id === plannedMove.id ? (
            <Text style={styles.preferenceCopy}>✓ Preparado: {describeTargetMuscles(effectivePreferences.targetMuscles)}. Revisa la vista previa y toca «Empezar sesión guiada».</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Preparar entrenamiento semanal con sus músculos y duración"
            disabled={Boolean(move.activeSession)}
            style={styles.recommendUseButton}
            onPress={() => prepareWeeklySession(plannedMove)}
          >
            <Text style={styles.recommendUseText}>Preparar sesión · {plannedMove.durationMin} min</Text>
          </Pressable>
        </View>
      ) : null}
      {doneToday && !extraOpen && lastRecord ? (
        <View style={styles.doneTodayCard}>
          <Text style={styles.doneTodayIcon}>✓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.doneTodayTitle}>Move ya está hecho por hoy</Text>
            <Text style={styles.doneTodayCopy}>{moveRecordDuration(lastRecord)}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
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
              </View>
            </View>

            {duration !== recommended ? (
              <Pressable style={styles.recommendUseButton} onPress={useRecommendation}>
                <Text style={styles.recommendUseText}>Usar recomendación de {recommended} min</Text>
              </Pressable>
            ) : null}

            <Text style={styles.smallLabel}>Perfil</Text>
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
                </View>

                <Text style={styles.smallLabel}>Equipo habitual</Text>
                <View style={styles.equipmentGrid}>
                  {LOAD_EQUIPMENT.map((item) => {
                    const value = preferences.equipment[item.field];
                    const active = typeof value === 'number' && value > 0;
                    return (
                      <View key={item.field} style={[styles.equipmentCard, active && styles.equipmentCardActive]}>
                        <Text style={styles.equipmentIcon}>{item.icon}</Text>
                        <Text style={styles.equipmentTitle}>{item.title}</Text>
                        <Text style={styles.equipmentCopy}>{item.copy}</Text>
                        <View style={styles.metricInputWrap}>
                          <TextInput
                            defaultValue={active ? String(value) : ''}
                            style={styles.equipmentInput}
                            keyboardType="decimal-pad"
                            placeholder="Sin equipo"
                            placeholderTextColor="#60718A"
                            returnKeyType="done"
                            onEndEditing={(event) => setEquipmentLoad(item.field, parseNumber(event.nativeEvent.text, item.min, item.max))}
                          />
                          <Text style={styles.metricUnitText}>{item.unit}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.profileChips}>
                  {TOGGLE_EQUIPMENT.map((item) => {
                    const active = preferences.equipment[item.field];
                    return (
                      <Pressable
                        key={item.field}
                        style={[styles.profileChip, active && styles.profileChipActive]}
                        onPress={() => toggleEquipment(item.field)}
                      >
                        <Text style={[styles.profileChipText, active && styles.profileChipTextActive]}>{item.icon} {item.title}</Text>
                      </Pressable>
                    );
                  })}
                </View>


                <Text style={styles.smallLabel}>Preferencias de ejercicio</Text>
                <View style={styles.profileChips}>
                  <Pressable style={[styles.profileChip, preferences.chairAvailable && styles.profileChipActive]} onPress={toggleChairAvailable}>
                    <Text style={[styles.profileChipText, preferences.chairAvailable && styles.profileChipTextActive]}>🪑 Silla disponible</Text>
                  </Pressable>
                  <Pressable style={[styles.profileChip, preferences.floorAllowed && styles.profileChipActive]} onPress={toggleFloorAllowed}>
                    <Text style={[styles.profileChipText, preferences.floorAllowed && styles.profileChipTextActive]}>⬇️ Puedo usar suelo</Text>
                  </Pressable>
                  <Pressable style={[styles.profileChip, preferences.lowImpactOnly && styles.profileChipActive]} onPress={toggleLowImpactOnly}>
                    <Text style={[styles.profileChipText, preferences.lowImpactOnly && styles.profileChipTextActive]}>🌿 Solo bajo impacto</Text>
                  </Pressable>
                </View>

                <Text style={styles.profileSubLabel}>ZONAS A EVITAR</Text>
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

              </>
            ) : null}

            <Pressable style={styles.recommendUseButton} onPress={() => router.push('/move-library')}>
              <Text style={styles.recommendUseText}>Biblioteca de ejercicios</Text>
            </Pressable>

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

            <Text style={styles.preferenceCopy}>La frecuencia y duración de tu semana se configuran en Semana → Organizar semana. Aquí ajustas el entrenamiento: músculos, material y dificultad.</Text>

            <Text style={styles.smallLabel}>Músculos de la sesión · {describeTargetMuscles(effectivePreferences.targetMuscles)}</Text>
            {preparedWeekly ? <Text style={styles.preferenceCopy}>Enfoque temporal del plan semanal. No modifica tu perfil general.</Text> : null}
            <View style={styles.profileChips}>
              <Pressable
                disabled={Boolean(move.activeSession)}
                style={[styles.profileChip, !preferences.targetMuscles.length && styles.profileChipActive]}
                onPress={() => setTargetMuscles([])}
              >
                <Text style={[styles.profileChipText, !preferences.targetMuscles.length && styles.profileChipTextActive]}>Cuerpo completo</Text>
              </Pressable>
              {MOVE_MUSCLE_GROUPS.map((group) => {
                const active = preferences.targetMuscles.includes(group);
                return (
                  <Pressable
                    key={group}
                    disabled={Boolean(move.activeSession)}
                    accessibilityRole="button"
                    accessibilityLabel={`Entrenar ${MOVE_MUSCLE_LABELS[group]}`}
                    style={[styles.profileChip, active && styles.profileChipActive]}
                    onPress={() => setTargetMuscles(active ? preferences.targetMuscles.filter((value) => value !== group) : [...preferences.targetMuscles, group])}
                  >
                    <Text style={[styles.profileChipText, active && styles.profileChipTextActive]}>{MOVE_MUSCLE_LABELS[group]}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!hasCompatibleTarget ? (
              <Text style={styles.preferenceCopy}>No hay ejercicios compatibles con el equipo y las restricciones actuales. Revisa el perfil antes de empezar.</Text>
            ) : null}

            <Text style={styles.smallLabel}>Formato de sesión</Text>
            <View style={styles.profileChips}>
              {TRAINING_STYLES.map((item) => {
                const active = preferences.trainingStyle === item.value;
                return (
                  <Pressable
                    key={item.value}
                    style={[styles.profileChip, active && styles.profileChipActive]}
                    onPress={() => setTrainingStyle(item.value)}
                  >
                    <Text style={[styles.profileChipText, active && styles.profileChipTextActive]}>{item.label}</Text>
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

            <Pressable disabled={!hasCompatibleTarget} style={[styles.primaryButton, !hasCompatibleTarget && { opacity: 0.45 }]} onPress={startSession}>
              <Text style={styles.primaryButtonText}>Empezar sesión guiada</Text>
            </Pressable>
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
                    {routineExercisePrescription(routine, exercise.id) ? (
                      <Text style={styles.prescriptionBadge}>{routineExercisePrescription(routine, exercise.id)}</Text>
                    ) : null}
                    <Text style={styles.libraryCopy}>{exerciseCueForPreferences(exercise, preferences)}</Text>
                  </View>
                </View>
              );
            })}
            <Text style={styles.libraryNote}>{routineStyleLabel(routine.style)} · {routineSummary(routine)}</Text>
          </View>
        </>
      ) : null}

      {!doneToday && lastRecord ? (
        <View style={styles.lastCard}>
          <Text style={styles.lastLabel}>ÚLTIMA SESIÓN</Text>
          <Text style={styles.lastValue}>{moveRecordDuration(lastRecord)}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
        </View>
      ) : null}
    </>
  );
}
