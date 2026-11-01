import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getWeekSummary } from '@/src/application/useCases/getWeekView';
import {
  completeWeekRitual, removeImportantMoment, setWeekWorkDay,
  upsertImportantMoment, updateWeekShift, type WeekShiftPatch,
} from '@/src/application/useCases/updateWeekSchedule';
import type { ImportantMoment, WeekSchedule } from '@/src/domain/entities/Shift';
import { addWeek, mondayKey } from '@/src/domain/services/weekWindow';
import { syncLivePlanReminders } from '@/src/services/notifications';
import {
  hasPreparedNextWeek, loadWeekState, loadWeekStateForOffset,
  saveWeekState, saveWeekStateForOffset,
} from '@/src/state/persistence';

export type TimePickerTarget = {
  day: number;
  field: 'start' | 'end';
  value: Date;
};
function dateFromTime(value: string, fallback: string) {
  const source = /^\d{2}:\d{2}$/.test(value) ? value : fallback;
  const parts = source.split(':').map(Number);
  const date = new Date();
  date.setHours(parts[0], parts[1], 0, 0);
  return date;
}
function timeFromDate(date: Date) {
  return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}
function refreshScheduledReminders() {
  void syncLivePlanReminders().catch(error => {
    console.warn('Could not refresh WeekFlow reminders after schedule change', error);
  });
}
export function useWeekController() {
  const [selectedWeek, setSelectedWeek] = useState<0 | 1>(0);
  const [visibleMonday, setVisibleMonday] = useState(() => mondayKey(new Date()));
  const [currentWeek, setCurrentWeek] = useState(() => loadWeekState());
  const [week, setWeek] = useState<WeekSchedule>(() => loadWeekState());
  const [nextPrepared, setNextPrepared] = useState(() => hasPreparedNextWeek());
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [timePicker, setTimePicker] = useState<TimePickerTarget | null>(null);
  const summary = useMemo(() => getWeekSummary(week), [week]);
  const selectedMonday = addWeek(visibleMonday, selectedWeek);

  const refreshWeek = useCallback(() => {
    const monday = mondayKey(new Date());
    const rolled = monday !== visibleMonday;
    const current = loadWeekState();
    const offset: 0 | 1 = rolled ? 0 : selectedWeek;
    setVisibleMonday(monday);
    if (rolled) setSelectedWeek(0);
    setCurrentWeek(current);
    setWeek(offset === 0 ? current : loadWeekStateForOffset(1));
    setNextPrepared(hasPreparedNextWeek());
    setEditingDay(null);
    setTimePicker(null);
  }, [selectedWeek, visibleMonday]);

  useFocusEffect(useCallback(() => { refreshWeek(); }, [refreshWeek]));
  useEffect(() => {
    const interval = setInterval(() => {
      if (mondayKey(new Date()) !== visibleMonday) refreshWeek();
    }, 60_000);
    return () => clearInterval(interval);
  }, [refreshWeek, visibleMonday]);

  const selectWeek = useCallback((offset: 0 | 1) => {
    setSelectedWeek(offset);
    const current = loadWeekState();
    setCurrentWeek(current);
    setWeek(offset === 0 ? current : loadWeekStateForOffset(1));
    setNextPrepared(hasPreparedNextWeek());
    setEditingDay(null);
    setTimePicker(null);
  }, []);
  const saveEditedWeek = useCallback((next: WeekSchedule, syncReminders = true) => {
    if (selectedWeek === 0) {
      saveWeekState(next);
      setCurrentWeek(next);
    } else {
      saveWeekStateForOffset(1, next);
      setNextPrepared(true);
    }
    if (syncReminders) refreshScheduledReminders();
  }, [selectedWeek]);
  const toggleEditingDay = useCallback((day: number) => {
    setEditingDay(current => current === day ? null : day);
  }, []);
  const patchShift = useCallback((day: number, patch: WeekShiftPatch, syncReminders = true) => {
    setWeek(current => {
      const next = updateWeekShift(current, day, patch);
      saveEditedWeek(next, syncReminders);
      return next;
    });
  }, [saveEditedWeek]);
  const setWorkDay = useCallback((day: number) => {
    setWeek(current => {
      const next = setWeekWorkDay(current, day);
      saveEditedWeek(next);
      return next;
    });
  }, [saveEditedWeek]);
  const setFreeDay = useCallback((day: number) => patchShift(day, { off: true }), [patchShift]);
  const setBreakMinutes = useCallback((day: number, breakMinutes: number) => {
    patchShift(day, { breakMinutes }, false);
  }, [patchShift]);
  const saveImportantMoment = useCallback((moment: ImportantMoment) => {
    const next = upsertImportantMoment(loadWeekState(), moment);
    saveWeekState(next);
    setCurrentWeek(next);
    if (selectedWeek === 0) setWeek(next);
    refreshScheduledReminders();
  }, [selectedWeek]);
  const deleteImportantMoment = useCallback((id: string) => {
    const next = removeImportantMoment(loadWeekState(), id);
    saveWeekState(next);
    setCurrentWeek(next);
    if (selectedWeek === 0) setWeek(next);
    refreshScheduledReminders();
  }, [selectedWeek]);
  const completeRitual = useCallback(() => {
    setWeek(current => {
      const next = completeWeekRitual(current, new Date().toISOString());
      saveEditedWeek(next);
      return next;
    });
  }, [saveEditedWeek]);

  const copyCurrentToNext = useCallback(() => {
    const current = loadWeekState();
    const next: WeekSchedule = {
      ...loadWeekStateForOffset(1),
      shifts: current.shifts.map(shift => ({ ...shift })),
      organizedAt: null,
      source: 'manual',
    };
    saveWeekStateForOffset(1, next);
    setSelectedWeek(1);
    setCurrentWeek(current);
    setWeek(next);
    setNextPrepared(true);
    setEditingDay(null);
    setTimePicker(null);
    refreshScheduledReminders();
  }, []);
  const openTimePicker = useCallback((day: number, field: 'start' | 'end', value: string) => {
    setTimePicker({ day, field, value: dateFromTime(value, field === 'start' ? '09:00' : '17:00') });
  }, []);
  const applyPickedTime = useCallback((selectedDate: Date) => {
    setTimePicker(current => {
      if (!current) return null;
      const value = timeFromDate(selectedDate);
      setWeek(weekCurrent => {
        const patch = current.field === 'start' ? { start: value } : { end: value };
        const next = updateWeekShift(weekCurrent, current.day, patch);
        saveEditedWeek(next);
        return next;
      });
      return null;
    });
  }, [saveEditedWeek]);
  const closeTimePicker = useCallback(() => setTimePicker(null), []);
  return {
    week, currentWeek, selectedWeek, selectedMonday, nextPrepared,
    summary, editingDay, timePicker,
    refreshWeek, selectWeek, copyCurrentToNext,
    toggleEditingDay, setWorkDay, setFreeDay, setBreakMinutes,
    saveImportantMoment, deleteImportantMoment, completeRitual,
    openTimePicker, applyPickedTime, closeTimePicker,
  };
}
