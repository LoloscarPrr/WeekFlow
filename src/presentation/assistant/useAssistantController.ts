import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getNowView } from '@/src/application/useCases/getNowView';
import { correctActualExitTime } from '@/src/application/useCases/registerActualExit';
import { assessExitReplanImpact } from '@/src/brain/exitImpact';
import { describeExitImpact } from '@/src/assistant/exitExplanation';
import { getRestView } from '@/src/application/useCases/getRestView';
import { buildAssistantRealState } from '@/src/assistant/context';
import { interpretAssistantText } from '@/src/assistant/interpret';
import { interpretAssistantQuestion, answerAssistantQuestion } from '@/src/assistant/questions';
import { interpretDayAdviceQuestion, answerDayAdvice } from '@/src/assistant/dayAdvice';
import { relativeExitFromShiftEnd } from '@/src/assistant/relativeExit';
import { recommendMoveIntensity } from '@/src/move/adaptation';
import { compatibleTargetedExercises } from '@/src/move/library';
import { describeTargetMuscles } from '@/src/move/muscles';
import {
  applyBrainAction,
  receiptHasEffectiveChange,
  undoBrainAction,
  type BrainActionProposal,
  type BrainActionReceipt,
} from '@/src/brain/actions';
import { syncLivePlanReminders } from '@/src/services/notifications';
import {
  loadDayState,
  loadFoodDay,
  saveFoodEntry,
  removeFoodEntry,
  loadMoveHistory,
  loadMovePreferences,
  loadActiveMoveSession,
  saveMovePreferences,
  saveAssistantEnergyMove,
  loadUserProfile,
  loadWeekState,
  moveSessionDoneToday,
  saveDayState,
  saveWeekState,
} from '@/src/state/persistence';

function readAssistantContext(now = new Date()) {
  const profile = loadUserProfile();
  const dayState = loadDayState();
  const weekState = loadWeekState();
  const moveHistory = loadMoveHistory();
  const foodDay = loadFoodDay(now);

  const nowView = getNowView({
    dayState,
    weekState,
    moveDoneToday: moveSessionDoneToday(now),
    now,
  });
  const restView = getRestView(dayState, weekState, now);

  return {
    ...buildAssistantRealState({
      profile,
      dayState,
      moveHistory,
      foodDay,
      nowView,
      restView,
      now,
    }),
    needsExitReview: nowView.needsExitReview,
  };
}

export function useAssistantController() {
  const [context, setContext] = useState(() => readAssistantContext());
  const [pendingProposal, setPendingProposal] = useState<BrainActionProposal | null>(null);
  const [lastReceipt, setLastReceipt] = useState<BrainActionReceipt | null>(null);
  const [assistantMessage, setAssistantMessage] = useState(
    'Puedes consultar tu día o pedirme una rutina por músculos, por ejemplo: quiero entrenar espalda y bíceps.',
  );

  const refresh = useCallback(() => {
    setContext(readAssistantContext());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const interpret = useCallback((input: string) => {
    const question = interpretAssistantQuestion(input);
    if (question) {
      // Consultas de solo lectura: siempre refrescar las fuentes canónicas.
      const fresh = readAssistantContext();
      setContext(fresh);
      setPendingProposal(null);
      setAssistantMessage(answerAssistantQuestion(question, fresh));
      return 'answered' as const;
    }

    const guidance = interpretDayAdviceQuestion(input);
    if (guidance) {
      // Síntesis de solo lectura de Ahora, Rest y Move. Nunca crear propuestas
      // ni aceptar tiempos inventados ni cambiar el calendario desde una pregunta.
      const now = new Date();
      const dayState = loadDayState();
      const weekState = loadWeekState();
      const doneToday = moveSessionDoneToday(now);
      const nowView = getNowView({ dayState, weekState, moveDoneToday: doneToday, now });
      const restView = getRestView(dayState, weekState, now);
      const preferences = loadMovePreferences();
      const last = loadMoveHistory()[0];
      const answer = answerDayAdvice(guidance, {
        energy: dayState.energy,
        phase: nowView.phase,
        mode: nowView.plan.mode,
        jornadaLabel: nowView.jornadaLabel,
        needsExitReview: nowView.needsExitReview,
        moveDoneToday: doneToday,
        upcomingMoments: nowView.upcomingMoments,
        restTitle: restView.contextTitle,
        restMeta: restView.contextMeta,
        postNightRecovery: restView.contextTitle === 'Recuperación post-turno nocturno',
        preferences,
        previousFeedback: last?.feedback,
        previousEndedEarly: last?.endedEarly,
      });
      setContext(readAssistantContext(now));
      setPendingProposal(null);
      setAssistantMessage(answer);
      return 'answered' as const;
    }

    // Una pregunta desconocida nunca debe convertirse accidentalmente en
    // un registro de energía, comida o cambio de turno.
    if (/[¿?]/.test(input)) {
      setPendingProposal(null);
      setAssistantMessage('No interpreté esta pregunta como un cambio. Por ahora puedo orientarte sobre tu día, entrenamiento y descanso, o consultar el estado de los pilares.');
      return 'answered' as const;
    }

    const now = new Date();
    const result = interpretAssistantText(input, now);
    if (result.status === 'energy-move-intent') {
      if (loadActiveMoveSession()) {
        setPendingProposal(null);
        setAssistantMessage('Ya tienes una sesión guiada activa. Termínala antes de cambiar tu energía y el enfoque de Move.');
        return false;
      }
      const dayState = loadDayState();
      const preferences = loadMovePreferences();
      const lastRecord = loadMoveHistory()[0];
      const intensity = recommendMoveIntensity(
        result.energy,
        preferences.experience,
        lastRecord?.feedback,
        Boolean(lastRecord?.endedEarly),
      );
      const candidate = { ...preferences, targetMuscles: result.targetMuscles };
      const compatible = result.targetMuscles.length
        ? compatibleTargetedExercises(candidate, intensity)
        : [];
      if (result.targetMuscles.length && !compatible.length) {
        setPendingProposal(null);
        setAssistantMessage('Con esa energía, equipo y restricciones no hay ejercicios compatibles. No cambié tu energía ni Move.');
        return false;
      }
      const dayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      setPendingProposal({
        id: `assistant-energy-move-${now.getTime()}`,
        kind: 'set-energy-move',
        title: 'Ajustar energía y entrenamiento',
        explanation: `Energía de hoy: ${result.energy}. Move: ${describeTargetMuscles(result.targetMuscles)}. Intensidad adaptada: ${intensity}.` +
          (result.targetMuscles.length ? ` Encontré ${compatible.length} ejercicios compatibles.` : '') +
          ' No modificaré tus turnos ni compromisos; confirma ambos cambios juntos.',
        createdAt: now.toISOString(),
        requiresConfirmation: true,
        payload: {
          energy: result.energy,
          targetMuscles: result.targetMuscles,
          dayKey,
          expectedDayState: dayState,
          expectedMovePreferences: preferences,
        },
      });
      setAssistantMessage('');
      return true;
    }
    if (result.status === 'move-target-intent') {
      if (loadActiveMoveSession()) {
        setPendingProposal(null);
        setAssistantMessage('Ya tienes una sesión guiada en curso. Termínala antes de cambiar los músculos.');
        return false;
      }
      const preferences = loadMovePreferences();
      const history = loadMoveHistory();
      const lastRecord = history[0];
      const intensity = recommendMoveIntensity(
        loadDayState().energy,
        preferences.experience,
        lastRecord?.feedback,
        Boolean(lastRecord?.endedEarly),
      );
      const compatible = result.targetMuscles.length
        ? compatibleTargetedExercises({ ...preferences, targetMuscles: result.targetMuscles }, intensity)
        : [];
      if (result.targetMuscles.length && !compatible.length) {
        setPendingProposal(null);
        setAssistantMessage('No encontré ejercicios compatibles para esos músculos con tus restricciones y equipo actuales. Revisa tu perfil en Move.');
        return false;
      }
      setPendingProposal({
        id: `assistant-move-${now.getTime()}`,
        kind: 'set-move-target',
        title: 'Preparar Move por músculos',
        explanation: result.targetMuscles.length
          ? `Enfoque: ${describeTargetMuscles(result.targetMuscles)}. Hay ${compatible.length} ejercicios compatibles con tu perfil e intensidad de hoy. Tras confirmar, podrás revisar duración, series y la sesión en Move.`
          : 'Volver a cuerpo completo. Move conservará tu perfil y adaptará intensidad y ejercicios al contexto real.',
        createdAt: now.toISOString(),
        requiresConfirmation: true,
        payload: {
          targetMuscles: result.targetMuscles,
          expectedTargetMuscles: preferences.targetMuscles,
        },
      });
      setAssistantMessage('');
      return true;
    }
    if (result.status === 'actual-exit-intent' || result.status === 'actual-exit-relative-intent') {
      const dayState = loadDayState();
      const weekState = loadWeekState();
      const view = getNowView({
        dayState,
        weekState,
        moveDoneToday: moveSessionDoneToday(now),
        now,
      });
      if (view.todayShift.type === 'off' || (view.phase !== 'working' && view.phase !== 'after')) {
        setPendingProposal(null);
        setAssistantMessage('No hay una jornada activa para registrar esa salida.');
        return false;
      }
      const isRelative = result.status === 'actual-exit-relative-intent';
      if (isRelative && (!view.shiftContext.endAt || !view.shiftContext.startAt)) {
        setPendingProposal(null);
        setAssistantMessage('No encontré una jornada completa para calcular esa salida.');
        return false;
      }
      const resolved = isRelative
        ? relativeExitFromShiftEnd(view.shiftContext.endAt!, result.deltaMinutes)
        : null;
      if (resolved) {
        const startAt = new Date(view.shiftContext.startAt!);
        if (resolved.exitAt < startAt || resolved.exitAt > now) {
          setPendingProposal(null);
          setAssistantMessage('Esa salida aún no ocurrió o queda antes del inicio del turno.');
          return false;
        }
      }
      const time = resolved?.time ?? (result.status === 'actual-exit-intent' ? result.time : '');
      if (!view.shiftContext.startAt || !view.shiftContext.endAt) {
        setPendingProposal(null);
        setAssistantMessage('No pude ubicar una jornada con inicio y fin claros.');
        return false;
      }
      const projected = correctActualExitTime({
        state: dayState,
        shiftKey: view.shiftContext.key,
        shiftEndAt: view.shiftContext.endAt,
        snapshot: view.snapshot,
        currentPlan: view.basePlan,
        time,
        referenceAt: now,
      });
      const startAt = new Date(view.shiftContext.startAt);
      if (projected.recordedAt < startAt || projected.recordedAt > now) {
        setPendingProposal(null);
        setAssistantMessage('Esa salida aún no ocurrió o es anterior al inicio del turno.');
        return false;
      }
      const preview = assessExitReplanImpact(view.snapshot, view.basePlan, time, {
        actualExitAt: projected.recordedAt,
        scheduledEndAt: new Date(view.shiftContext.endAt),
      });
      setPendingProposal({
        id: `assistant-exit-${now.getTime()}`,
        kind: 'record-actual-exit',
        title: 'Registrar salida real',
        explanation: describeExitImpact(time, preview, false),
        createdAt: now.toISOString(),
        requiresConfirmation: true,
        payload: {
          time,
          shiftKey: view.shiftContext.key,
          plannedEnd: view.todayShift.end,
        },
      });
      setAssistantMessage('');
      return true;
    }
    if (result.status === 'unsupported') {
      setPendingProposal(null);
      setAssistantMessage(result.message);
      return false;
    }
    setPendingProposal(result.proposal);
    setAssistantMessage('');
    return true;
  }, []);

  const cancelProposal = useCallback(() => {
    setPendingProposal(null);
    setAssistantMessage('No cambié nada.');
  }, []);

  const confirmProposal = useCallback(() => {
    if (!pendingProposal) return false;
    if ((pendingProposal.kind === 'set-move-target' || pendingProposal.kind === 'set-energy-move') && loadActiveMoveSession()) {
      setPendingProposal(null);
      setAssistantMessage('Se inició una sesión Move antes de confirmar. No cambié el objetivo.');
      return false;
    }

    const now = new Date();
    const state = {
      dayState: loadDayState(),
      weekState: loadWeekState(),
      foodDay: loadFoodDay(now),
      movePreferences: loadMovePreferences(),
    };
    const actualExitContext = pendingProposal.kind === 'record-actual-exit'
      ? (() => {
        const view = getNowView({
          dayState: state.dayState,
          weekState: state.weekState,
          moveDoneToday: moveSessionDoneToday(now),
          now,
        });
        return {
          shiftKey: view.shiftContext.key,
          shiftStartAt: view.shiftContext.startAt,
          shiftEndAt: view.shiftContext.endAt,
          snapshot: view.snapshot,
          currentPlan: view.basePlan,
          phase: view.phase,
        };
      })()
      : undefined;
    const result = applyBrainAction(state, pendingProposal, { confirmed: true, now, actualExitContext });

    if (result.status !== 'applied') {
      if (result.status === 'conflict') setPendingProposal(null);
      setAssistantMessage(result.message);
      setContext(readAssistantContext());
      return false;
    }

    if (pendingProposal.kind === 'set-energy-move') {
      saveAssistantEnergyMove(result.state.dayState, result.state.movePreferences!);
    } else if (pendingProposal.kind === 'set-move-target') {
      saveMovePreferences(result.state.movePreferences!);
    } else if (pendingProposal.kind === 'log-food-entry') {
      const record = result.state.foodDay?.entries.find((entry) => entry.id === pendingProposal.id);
      if (!record) throw new Error('Confirmed Food entry missing');
      saveFoodEntry(record, now);
    } else if (pendingProposal.kind === 'set-energy' || pendingProposal.kind === 'record-actual-exit') {
      saveDayState(result.state.dayState);
    } else {
      saveWeekState(result.state.weekState);
    }

    setPendingProposal(null);
    setLastReceipt(result.receipt && receiptHasEffectiveChange(result.receipt) ? result.receipt : null);
    const nextContext = readAssistantContext();
    const afterView = pendingProposal.kind === 'record-actual-exit'
      ? getNowView({
        dayState: result.state.dayState,
        weekState: result.state.weekState,
        moveDoneToday: moveSessionDoneToday(now),
        now,
      })
      : null;
    setAssistantMessage(pendingProposal.kind === 'set-energy-move'
      ? 'Energía de hoy registrada: ' + pendingProposal.payload.energy + '. Move: ' + describeTargetMuscles(pendingProposal.payload.targetMuscles) + '. Abre Move para revisar y comenzar.'
      : pendingProposal.kind === 'set-move-target'
      ? 'Move preparado: ' + describeTargetMuscles(pendingProposal.payload.targetMuscles) + '. Abre Move para revisar y empezar la sesión.'
      : pendingProposal.kind === 'record-actual-exit'
      ? afterView?.exitImpact
        ? describeExitImpact(pendingProposal.payload.time, afterView.exitImpact, true)
        : 'Salida registrada. La planificación de Ahora está actualizada.'
      : pendingProposal.kind === 'log-food-entry'
        ? 'Registrado en Food: ' + pendingProposal.payload.title + '.'
        : result.message);
    setContext(nextContext);

    if (pendingProposal.kind !== 'log-food-entry' && pendingProposal.kind !== 'set-move-target') {
      void syncLivePlanReminders().catch((error) => {
        console.warn('Could not refresh WeekFlow reminders after Assistant action', error);
      });
    }
    return true;
  }, [pendingProposal]);

  const undoLastChange = useCallback(() => {
    if (!lastReceipt) return false;
    if ((lastReceipt.before.target === 'move-preferences' || lastReceipt.before.target === 'day-move') && loadActiveMoveSession()) {
      setAssistantMessage('No puedo deshacer el enfoque Move durante una sesión activa. Termínala antes.');
      return false;
    }

    const recordDate = new Date(lastReceipt.appliedAt);
    const state = {
      dayState: loadDayState(),
      weekState: loadWeekState(),
      foodDay: loadFoodDay(recordDate),
      movePreferences: loadMovePreferences(),
    };
    const result = undoBrainAction(state, lastReceipt);
    // A stale receipt must never remain actionable after a conflict or successful undo.
    setLastReceipt(null);
    setAssistantMessage(result.message);
    if (result.status !== 'reverted') {
      setContext(readAssistantContext());
      return false;
    }

    if (lastReceipt.before.target === 'day-move') {
      saveAssistantEnergyMove(result.state.dayState, result.state.movePreferences!);
    } else if (lastReceipt.before.target === 'move-preferences') {
      saveMovePreferences(result.state.movePreferences!);
    } else if (lastReceipt.before.target === 'food-day') {
      // This removes only the confirmed manual entry, never other Food entries.
      removeFoodEntry(lastReceipt.proposalId, recordDate);
    } else if (lastReceipt.before.target === 'day-state') {
      saveDayState(result.state.dayState);
    } else {
      saveWeekState(result.state.weekState);
    }

    setContext(readAssistantContext());
    if (lastReceipt.before.target !== 'food-day' && lastReceipt.before.target !== 'move-preferences') {
      void syncLivePlanReminders().catch((error) => {
        console.warn('Could not refresh WeekFlow reminders after Assistant undo', error);
      });
    }
    return true;
  }, [lastReceipt]);

  return {
    context,
    refresh,
    pendingProposal,
    lastReceipt,
    undoLastChange,
    assistantMessage,
    interpret,
    confirmProposal,
    cancelProposal,
  };
}
