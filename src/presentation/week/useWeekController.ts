import { useCallback, useMemo, useState } from 'react';
import { getWeekSummary } from '@/src/application/useCases/getWeekView';
import {
  setWeekWorkDay,
  updateWeekShift,
  type WeekShiftPatch,
} from '@/src/application/useCases/updateWeekSchedule';
import type { WeekSchedule } from '@/src/domain/entities/Shift';
import { loadWeekState, saveWeekState } from '@/src/state/persistence';

export type TimePickerTarget = {
  day: number;
  field: 'start' | 'end';
  value: Date;
};

function dateFromTime(value: string, fallback: string) {
  const source = /^\d{2}:\d{2}$/.test(value) ? value : fallback;
  const [hours, minutes] = source.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function timeFromDate(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function useWeekController() {
  const [week, setWeek] = useState<WeekSchedule>(() => loadWeekState());
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [timePicker, setTimePicker] = useState<TimePickerTarget | null>(null);

  const summary = useMemo(() => getWeekSummary(week), [week]);

  const commit = useCallback((next: WeekSchedule) => {
    setWeek(next);
    saveWeekState(next);
  }, []);

  const refreshWeek = useCallback(() => {
    setWeek(loadWeekState());
    setEditingDay(null);
    setTimePicker(null);
  }, []);

  const toggleEditingDay = useCallback((day: number) => {
    setEditingDay((current) => current === day ? null : day);
  }, []);

  const patchShift = useCallback((day: number, patch: WeekShiftPatch) => {
    setWeek((current) => {
      const next = updateWeekShift(current, day, patch);
      saveWeekState(next);
      return next;
    });
  }, []);

  const setWorkDay = useCallback((day: number) => {
    setWeek((current) => {
      const next = setWeekWorkDay(current, day);
      saveWeekState(next);
      return next;
    });
  }, []);

  const setFreeDay = useCallback((day: number) => {
    patchShift(day, { off: true });
  }, [patchShift]);

  const openTimePicker = useCallback((day: number, field: 'start' | 'end', value: string) => {
    setTimePicker({
      day,
      field,
      value: dateFromTime(value, field === 'start' ? '09:00' : '17:00'),
    });
  }, []);

  const applyPickedTime = useCallback((selectedDate: Date) => {
    setTimePicker((current) => {
      if (!current) return null;
      const value = timeFromDate(selectedDate);
      setWeek((weekCurrent) => {
        const patch = current.field === 'start' ? { start: value } : { end: value };
        const next = updateWeekShift(weekCurrent, current.day, patch);
        saveWeekState(next);
        return next;
      });
      return null;
    });
  }, []);

  const closeTimePicker = useCallback(() => {
    setTimePicker(null);
  }, []);

  return {
    week,
    summary,
    editingDay,
    timePicker,
    refreshWeek,
    toggleEditingDay,
    setWorkDay,
    setFreeDay,
    openTimePicker,
    applyPickedTime,
    closeTimePicker,
  };
}
