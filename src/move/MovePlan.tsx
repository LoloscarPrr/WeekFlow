import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  MOVE_AVOID_AREA_OPTIONS,
  MOVE_EXPERIENCE_OPTIONS,
  MOVE_FOCUS_OPTIONS,
  MOVE_GOAL_OPTIONS,
  MOVE_INTENSITY_LABELS,
  type MoveEquipmentLoadField,
  type MoveEquipmentToggleField,
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
    setFocus,
    setExperience,
    setGoal,
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

                <Text style={styles.profileHint}>
                  Move no sube automáticamente tus kilos: usa exactamente el equipo y las cargas que declares.
                </Text>

              </>
            ) : null}

            <Pressable style={styles.recommendUseButton} onPress={() => router.push('/move-library')}>
              <Text style={styles.recommendUseText}>Abrir Biblioteca Move · 70+ ejercicios</Text>
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
            {selectedFocus ? <Text style={styles.profileHint}>{selectedFocus.copy}</Text> : null}

            <Text style={styles.smallLabel}>Ajustes de hoy</Text>
            <View style={styles.profileChips}>
              <Pressable style={[styles.profileChip, preferences.chairAvailable && styles.profileChipActive]} onPress={toggleChairAvailable}>
                <Text style={[styles.profileChipText, preferences.chairAvailable && styles.profileChipTextActive]}>🪑 Silla</Text>
              </Pressable>
              <Pressable style={[styles.profileChip, preferences.floorAllowed && styles.profileChipActive]} onPress={toggleFloorAllowed}>
                <Text style={[styles.profileChipText, preferences.floorAllowed && styles.profileChipTextActive]}>⬇️ Suelo</Text>
              </Pressable>
              <Pressable style={[styles.profileChip, preferences.lowImpactOnly && styles.profileChipActive]} onPress={toggleLowImpactOnly}>
                <Text style={[styles.profileChipText, preferences.lowImpactOnly && styles.profileChipTextActive]}>🌿 Bajo impacto</Text>
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
            <Text style={styles.libraryNote}>La rutina se adapta con energía, feedback, dificultad previa, perfil, equipo, tiempo y restricciones. “Muy fácil” busca progresiones; “Difícil/Demasiado” busca regresiones compatibles.</Text>
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
