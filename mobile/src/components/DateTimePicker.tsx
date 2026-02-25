import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, typography, radii } from '../utils/theme';

export type DateTimePickerMode = 'date' | 'time' | 'datetime';

export interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: DateTimePickerMode;
  minimumDate?: Date;
  label?: string;
  onOpen?: () => void;
  visible: boolean;
  onRequestClose: () => void;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getDaysInMonth(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Array(firstDay).fill(null);
  const numDays = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= numDays; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DateTimePicker({
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  label,
  visible,
  onRequestClose,
}: DateTimePickerProps) {
  const c = useThemeColors();
  const [view, setView] = useState<'date' | 'time'>(
    mode === 'time' ? 'time' : 'date'
  );
  const [tempDate, setTempDate] = useState(value);
  const [currentMonth, setCurrentMonth] = useState(value);

  useEffect(() => {
    setTempDate(value);
    setCurrentMonth(value);
  }, [value, visible]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + offset,
        1
      )
    );
  };

  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    const newDate = new Date(tempDate);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    setTempDate(newDate);
  };

  const handleTimeChange = (
    type: 'hour' | 'minute' | 'ampm',
    val: number | 'AM' | 'PM'
  ) => {
    const newDate = new Date(tempDate);
    if (type === 'hour') {
      const isPm = newDate.getHours() >= 12;
      let h = val as number;
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      newDate.setHours(h);
    } else if (type === 'minute') {
      newDate.setMinutes(val as number);
    } else if (type === 'ampm') {
      const currentH = newDate.getHours();
      if (val === 'PM' && currentH < 12) newDate.setHours(currentH + 12);
      if (val === 'AM' && currentH >= 12) newDate.setHours(currentH - 12);
    }
    setTempDate(newDate);
  };

  const confirmSelection = () => {
    onChange(new Date(tempDate));
    onRequestClose();
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date || !minimumDate) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const min = new Date(
      minimumDate.getFullYear(),
      minimumDate.getMonth(),
      minimumDate.getDate()
    );
    return d.getTime() < min.getTime();
  };

  const displayHour12 =
    tempDate.getHours() === 0
      ? 12
      : tempDate.getHours() > 12
        ? tempDate.getHours() - 12
        : tempDate.getHours();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={onRequestClose} />
      <View style={[styles.drawer, { backgroundColor: c.surface }]}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={onRequestClose} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="close" size={24} color={c.textSecondary} />
          </TouchableOpacity>
          {mode === 'datetime' && (
            <View style={[styles.tabs, { backgroundColor: c.ghostBg }]}>
              <TouchableOpacity
                onPress={() => setView('date')}
                style={[
                  styles.tab,
                  view === 'date' && { backgroundColor: c.surface, borderColor: c.border },
                  view === 'date' && styles.tabActive,
                ]}
              >
                <Text style={[styles.tabText, view === 'date' && { color: c.primary }]}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setView('time')}
                style={[
                  styles.tab,
                  view === 'time' && { backgroundColor: c.surface, borderColor: c.border },
                  view === 'time' && styles.tabActive,
                ]}
              >
                <Text style={[styles.tabText, view === 'time' && { color: c.primary }]}>Time</Text>
              </TouchableOpacity>
            </View>
          )}
          {mode !== 'datetime' && <View style={styles.headerSpacer} />}
          <TouchableOpacity
            onPress={confirmSelection}
            style={[styles.confirmBtn, { backgroundColor: c.primary }]}
            hitSlop={12}
          >
            <Ionicons name="checkmark" size={24} color={c.onPrimary} />
          </TouchableOpacity>
        </View>

        {view === 'date' && (mode === 'date' || mode === 'datetime') && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            <View style={styles.monthRow}>
              <Text style={[styles.monthTitle, { color: c.text }]}>
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={20} color={c.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.dayGrid}>
              {DAY_LABELS.map((d, i) => (
                <Text key={`h-${i}`} style={[styles.dayHeader, { color: c.textMuted }]}>
                  {d}
                </Text>
              ))}
              {getDaysInMonth(currentMonth).map((date, idx) => {
                const isSelected =
                  date && date.toDateString() === tempDate.toDateString();
                const isToday =
                  date && date.toDateString() === new Date().toDateString();
                const disabled = isDateDisabled(date);
                return (
                  <TouchableOpacity
                    key={date ? date.getTime() : `e-${idx}`}
                    style={[
                      styles.dayCell,
                      !date && styles.dayCellEmpty,
                      isSelected && { backgroundColor: c.primary },
                      isToday && !isSelected && { borderWidth: 1, borderColor: c.primary },
                      disabled && styles.dayCellDisabled,
                    ]}
                    onPress={() => !disabled && handleDateSelect(date)}
                    disabled={!date || disabled}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        { color: isSelected ? c.onPrimary : c.text },
                        disabled && { color: c.textMuted },
                      ]}
                    >
                      {date?.getDate() ?? ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {view === 'time' && (mode === 'time' || mode === 'datetime') && (
          <ScrollView style={styles.content} contentContainerStyle={styles.timeContent}>
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Text style={[styles.timeDisplay, { color: c.text }]}>
                  {displayHour12.toString().padStart(2, '0')}
                </Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    onPress={() =>
                      handleTimeChange(
                        'hour',
                        displayHour12 <= 1 ? 12 : displayHour12 - 1
                      )
                    }
                    style={[styles.stepperBtn, { backgroundColor: c.ghostBg, borderColor: c.border }]}
                  >
                    <Ionicons name="remove" size={18} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleTimeChange(
                        'hour',
                        displayHour12 >= 12 ? 1 : displayHour12 + 1
                      )
                    }
                    style={[styles.stepperBtn, { backgroundColor: c.ghostBg, borderColor: c.border }]}
                  >
                    <Ionicons name="add" size={18} color={c.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.timeLabel, { color: c.textMuted }]}>Hour</Text>
              </View>
              <Text style={[styles.timeColon, { color: c.textMuted }]}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={[styles.timeDisplay, { color: c.text }]}>
                  {tempDate.getMinutes().toString().padStart(2, '0')}
                </Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    onPress={() =>
                      handleTimeChange(
                        'minute',
                        tempDate.getMinutes() <= 0 ? 59 : tempDate.getMinutes() - 1
                      )
                    }
                    style={[styles.stepperBtn, { backgroundColor: c.ghostBg, borderColor: c.border }]}
                  >
                    <Ionicons name="remove" size={18} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleTimeChange(
                        'minute',
                        tempDate.getMinutes() >= 59 ? 0 : tempDate.getMinutes() + 1
                      )
                    }
                    style={[styles.stepperBtn, { backgroundColor: c.ghostBg, borderColor: c.border }]}
                  >
                    <Ionicons name="add" size={18} color={c.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.timeLabel, { color: c.textMuted }]}>Min</Text>
              </View>
              <View style={styles.ampmBlock}>
                <TouchableOpacity
                  onPress={() => handleTimeChange('ampm', 'AM')}
                  style={[
                    styles.ampmBtn,
                    { backgroundColor: tempDate.getHours() < 12 ? c.primary : c.ghostBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.ampmText,
                      { color: tempDate.getHours() < 12 ? c.onPrimary : c.textSecondary },
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleTimeChange('ampm', 'PM')}
                  style={[
                    styles.ampmBtn,
                    { backgroundColor: tempDate.getHours() >= 12 ? c.primary : c.ghostBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.ampmText,
                      { color: tempDate.getHours() >= 12 ? c.onPrimary : c.textSecondary },
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.quickMinutes}>
              {[0, 15, 30, 45].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => handleTimeChange('minute', m)}
                  style={[styles.quickMinBtn, { backgroundColor: c.ghostBg, borderColor: c.border }]}
                >
                  <Text style={[styles.quickMinText, { color: c.text }]}>
                    :{m.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        <Text style={[styles.hint, { color: c.textMuted }]}>Swipe down to dismiss</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: spacing.sm },
  headerSpacer: { width: 40 },
  tabs: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {},
  tabText: { ...typography.bodySmall, fontWeight: '600' },
  confirmBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { maxHeight: 400 },
  contentInner: { padding: spacing.md },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  monthTitle: { ...typography.h3 },
  monthNav: { flexDirection: 'row', gap: spacing.xs },
  navBtn: { padding: spacing.sm },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayHeader: {
    width: '13%',
    textAlign: 'center',
    ...typography.caption,
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellEmpty: { opacity: 0 },
  dayCellDisabled: { opacity: 0.4 },
  dayCellText: { ...typography.bodySmall, fontWeight: '600' },
  timeContent: { padding: spacing.lg },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeBlock: { alignItems: 'center' },
  timeDisplay: {
    fontSize: 48,
    fontWeight: '300',
    marginBottom: spacing.sm,
  },
  stepperRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: { ...typography.caption, fontWeight: '700', textTransform: 'uppercase' },
  timeColon: { fontSize: 32, fontWeight: '300', marginBottom: 32 },
  ampmBlock: { flexDirection: 'column', gap: spacing.sm, marginLeft: spacing.md },
  ampmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  ampmText: { ...typography.bodySmall, fontWeight: '700' },
  quickMinutes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickMinBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  quickMinText: { ...typography.bodySmall, fontWeight: '600' },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export { formatDate, formatTime };
