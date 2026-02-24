import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HotpointPicker, PaymentMethodIcons, Screen } from '../../components';
import { getHotpoints, getUserVehicles, publishTrip, publishTrips } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { buttonHeights, colors, spacing, typography, radii, cardShadow } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import { selectorStyles } from '../../utils/selectorStyles';
import { formatRwf } from '../../../../shared/src';
import type { Hotpoint, Vehicle, PaymentMethod } from '../../types';

const INSTANT_STEPS = ['Intro', 'Ride Type', 'Vehicle', 'Departure', 'Destination', 'Details', 'Payment', 'Review'];
const SCHEDULED_STEPS = [
  'Intro',
  'Ride Type',
  'Vehicle',
  'Departure',
  'Destination',
  'Schedule',
  'Details',
  'Payment',
  'Review',
];
const SCHEDULED_AGENCY_STEPS = [
  'Intro',
  'Vehicle',
  'Departure',
  'Destination',
  'Schedule',
  'Repetition',
  'Details',
  'Payment',
  'Review',
];

function formatDateValue(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeValue(date: Date) {
  const h = `${date.getHours()}`.padStart(2, '0');
  const m = `${date.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

const REPETITION_INTERVALS = [15, 30, 60, 120] as const;

export default function PublishRideScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentRole } = useRole();
  const c = useThemeColors();
  const [step, setStep] = useState(0);
  const [hotpoints, setHotpoints] = useState<Hotpoint[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [rideType, setRideType] = useState<'insta' | 'scheduled'>('insta');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [departure, setDeparture] = useState<Hotpoint | null>(null);
  const [destination, setDestination] = useState<Hotpoint | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDateObj, setScheduledDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repetitionInterval, setRepetitionInterval] = useState<number>(30);
  const [repetitionEndTime, setRepetitionEndTime] = useState('');
  const [showRepetitionEndPicker, setShowRepetitionEndPicker] = useState(false);
  const [repetitionEndDateObj, setRepetitionEndDateObj] = useState<Date>(new Date());
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState(30000);
  const [maxRear, setMaxRear] = useState(false);
  const [allowFullCar, setAllowFullCar] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(['cash', 'mobile_money', 'card']);
  const isAgency = currentRole === 'agency';
  const steps =
    rideType === 'scheduled' && isAgency
      ? SCHEDULED_AGENCY_STEPS
      : rideType === 'scheduled'
        ? SCHEDULED_STEPS
        : INSTANT_STEPS;
  const currentStep = steps[step];
  const seatsMax = isAgency ? (vehicle?.seats ?? 18) : 6;
  const priceMin = 5000;
  const priceMax = 200000;
  const priceStep = 1000;

  useEffect(() => {
    if (isAgency) setRideType('scheduled');
  }, [isAgency]);

  useEffect(() => {
    if (step > steps.length - 1) {
      setStep(steps.length - 1);
    }
  }, [step, steps.length]);

  useEffect(() => {
    getHotpoints().then(setHotpoints);
    if (user) getUserVehicles(user.id).then((v) => setVehicles(v.filter((x) => x.approvalStatus === 'approved')));
  }, [user]);

  useEffect(() => {
    if (isAgency && vehicle) setSeats(vehicle.seats);
  }, [isAgency, vehicle]);

  const resetForm = () => {
    setStep(0);
    setRideType(isAgency ? 'scheduled' : 'insta');
    setVehicle(null);
    setDeparture(null);
    setDestination(null);
    setScheduledDate('');
    setScheduledTime('');
    setShowDatePicker(false);
    setShowTimePicker(false);
    setRepetitionInterval(30);
    setRepetitionEndTime('');
    setShowRepetitionEndPicker(false);
    setSeats(isAgency && vehicle ? vehicle.seats : 3);
    setPrice(30000);
    setMaxRear(false);
    setAllowFullCar(true);
    setPaymentMethods(['cash', 'mobile_money', 'card']);
  };

  const canProceed = () => {
    if (currentStep === 'Intro') return true;
    if (currentStep === 'Vehicle') return !!vehicle;
    if (currentStep === 'Departure') return !!departure;
    if (currentStep === 'Destination') return !!destination;
    if (currentStep === 'Schedule') {
      return scheduledDate.trim().length > 0 && scheduledTime.trim().length > 0;
    }
    if (currentStep === 'Repetition') return repetitionInterval > 0;
    if (currentStep === 'Payment') return paymentMethods.length > 0;
    if (currentStep === 'Review') return !!vehicle && !!departure && !!destination;
    return true;
  };

  const getStepValidationMessage = () => {
    if (currentStep === 'Vehicle') return 'Select an approved vehicle first.';
    if (currentStep === 'Departure') return 'Select a departure hotpoint.';
    if (currentStep === 'Destination') return 'Select a destination hotpoint.';
    if (currentStep === 'Schedule') return 'Select both schedule date and departure time.';
    if (currentStep === 'Repetition') return 'Select repetition interval.';
    if (currentStep === 'Payment') return 'Choose at least one payment method.';
    if (currentStep === 'Review') return 'Please complete all required steps before publishing.';
    return 'Complete this step first.';
  };

  const nextStep = () => {
    if (!canProceed()) {
      Alert.alert('Step incomplete', getStepValidationMessage());
      return;
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handlePublish();
    }
  };

  const handlePublish = async () => {
    if (!user || !vehicle || !departure || !destination) {
      Alert.alert('Missing required fields');
      return;
    }
    try {
      const now = new Date();
      const fallbackTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const depTime = rideType === 'scheduled' ? scheduledTime || fallbackTime : fallbackTime;
      const depHour = Number.parseInt(depTime.split(':')[0] || '0', 10);
      const depMin = Number.parseInt(depTime.split(':')[1] || '0', 10);
      const arrHour = (depHour + 3) % 24;
      const arrTime = `${arrHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`;
      const baseTrip = {
        type: rideType,
        departureHotpoint: departure,
        destinationHotpoint: destination,
        departureTime: depTime,
        arrivalTime: arrTime,
        durationMinutes: 180,
        seatsAvailable: seats,
        pricePerSeat: price,
        allowFullCar,
        paymentMethods,
        maxRearPassengers: maxRear ? 2 : undefined,
        driver: user,
        vehicle,
        status: 'active' as const,
      };

      const useRepetition =
        isAgency && rideType === 'scheduled' && scheduledDate && scheduledTime && repetitionInterval > 0;

      if (useRepetition) {
        const trips = await publishTrips(
          { ...baseTrip, departureDate: scheduledDate },
          {
            departureDate: scheduledDate,
            startTime: scheduledTime,
            intervalMinutes: repetitionInterval,
            endTime: repetitionEndTime.trim() || undefined,
          }
        );
        Alert.alert('Rides published!', `${trips.length} trip(s) created.`);
      } else {
        const tripPayload =
          rideType === 'scheduled' && scheduledDate
            ? { ...baseTrip, departureDate: scheduledDate }
            : baseTrip;
        await publishTrip(tripPayload);
        Alert.alert('Ride published!');
      }
      resetForm();
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('DriverHome');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not publish ride');
    }
  };

  const togglePayment = (m: PaymentMethod) => {
    setPaymentMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      {currentStep === 'Intro' ? (
        <View style={styles.introWrap}>
          <Text style={[styles.introTitle, { color: c.text }]}>Publish a Ride</Text>
          <Text style={[styles.introSub, { color: c.textSecondary }]}>
            Share your trip and earn. Set your route, time and price.
          </Text>
          <View style={styles.introSteps}>
            <View style={styles.introStepRow}>
              <View style={[styles.introStepIcon, { backgroundColor: c.primaryTint }]}>
                <Ionicons name="map" size={22} color={c.primary} />
              </View>
              <View style={styles.introStepBody}>
                <Text style={[styles.introStepLabel, { color: c.textSecondary }]}>ROUTE</Text>
                <Text style={[styles.introStepValue, { color: c.text }]}>Set pick-up and drop-off</Text>
              </View>
            </View>
            <View style={[styles.introStepDivider, { borderBottomColor: c.border }]} />
            <View style={styles.introStepRow}>
              <View style={[styles.introStepIcon, { backgroundColor: c.primaryTint }]}>
                <Ionicons name="time-outline" size={22} color={c.primary} />
              </View>
              <View style={styles.introStepBody}>
                <Text style={[styles.introStepLabel, { color: c.textSecondary }]}>TIME</Text>
                <Text style={[styles.introStepValue, { color: c.text }]}>Choose date and time</Text>
              </View>
            </View>
            <View style={[styles.introStepDivider, { borderBottomColor: c.border }]} />
            <View style={styles.introStepRow}>
              <View style={[styles.introStepIcon, { backgroundColor: c.primaryTint }]}>
                <Ionicons name="people-outline" size={22} color={c.primary} />
              </View>
              <View style={styles.introStepBody}>
                <Text style={[styles.introStepLabel, { color: c.textSecondary }]}>SEATS</Text>
                <Text style={[styles.introStepValue, { color: c.text }]}>How many passengers?</Text>
              </View>
            </View>
            <View style={[styles.introStepDivider, { borderBottomColor: c.border }]} />
            <View style={styles.introStepRow}>
              <View style={[styles.introStepIcon, { backgroundColor: c.primaryTint }]}>
                <Ionicons name="cash-outline" size={22} color={c.primary} />
              </View>
              <View style={styles.introStepBody}>
                <Text style={[styles.introStepLabel, { color: c.textSecondary }]}>PRICE</Text>
                <Text style={[styles.introStepValue, { color: c.text }]}>Set your price per seat</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.introContinueBtn, { backgroundColor: c.text }]}
            onPress={() => setStep(1)}
            activeOpacity={0.85}
          >
            <Text style={styles.introContinueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
      <View style={styles.stepMetaRow}>
        <Text style={styles.stepCounter}>
          Step {step + 1}/{steps.length}
        </Text>
      </View>
      <Text style={styles.stepTitle}>{currentStep}</Text>

      {currentStep === 'Ride Type' && (
        <View style={styles.stepContent}>
          <TouchableOpacity
            style={[styles.option, rideType === 'insta' && styles.optionActive]}
            onPress={() => setRideType('insta')}
          >
            <View style={styles.optionRow}>
              <Ionicons name="flash-outline" size={18} color={rideType === 'insta' ? colors.onPrimary : colors.primary} />
              <Text style={[styles.optionText, rideType === 'insta' && styles.optionTextActive]}>InstaRide</Text>
            </View>
            <Text style={[styles.optionSub, rideType === 'insta' && styles.optionSubActive]}>Publish immediately for riders nearby.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, rideType === 'scheduled' && styles.optionActive]}
            onPress={() => setRideType('scheduled')}
          >
            <View style={styles.optionRow}>
              <Ionicons name="calendar-outline" size={18} color={rideType === 'scheduled' ? colors.onPrimary : colors.primary} />
              <Text style={[styles.optionText, rideType === 'scheduled' && styles.optionTextActive]}>Scheduled</Text>
            </View>
            <Text style={[styles.optionSub, rideType === 'scheduled' && styles.optionSubActive]}>Plan and publish in advance.</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 'Vehicle' && (
        <View style={styles.stepContent}>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.option, vehicle?.id === v.id && styles.optionActive]}
              onPress={() => {
                setVehicle(v);
                if (isAgency) setSeats(v.seats);
              }}
            >
              <View style={styles.optionRow}>
                <Ionicons name="car-sport-outline" size={18} color={vehicle?.id === v.id ? colors.onPrimary : colors.primary} />
                <Text style={[styles.optionText, vehicle?.id === v.id && styles.optionTextActive]}>{v.make} {v.model}</Text>
              </View>
              <Text style={[styles.optionSub, vehicle?.id === v.id && styles.optionSubActive]}>{v.color} • {v.licensePlate}</Text>
            </TouchableOpacity>
          ))}
          {vehicles.length === 0 && (
            <Text style={styles.empty}>No approved vehicles. Add one in Vehicle Garage.</Text>
          )}
        </View>
      )}

      {currentStep === 'Departure' && (
        <View style={styles.stepContent}>
          <HotpointPicker
            value={departure}
            hotpoints={hotpoints}
            onSelect={setDeparture}
            placeholder="Select departure"
          />
        </View>
      )}

      {currentStep === 'Destination' && (
        <View style={styles.stepContent}>
          <HotpointPicker
            value={destination}
            hotpoints={hotpoints}
            onSelect={setDestination}
            placeholder="Select destination"
          />
        </View>
      )}

      {currentStep === 'Schedule' && (
        <View style={styles.stepContent}>
          <Text style={styles.label}>Travel date</Text>
          <TouchableOpacity style={selectorStyles.trigger} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[scheduledDate ? selectorStyles.triggerText : selectorStyles.triggerPlaceholder]}>
              {scheduledDate || 'Select date'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showDatePicker ? (
            <DateTimePicker
              value={scheduledDateObj}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setScheduledDateObj(selectedDate);
                  setScheduledDate(formatDateValue(selectedDate));
                }
              }}
            />
          ) : null}

          <Text style={[styles.label, styles.scheduleLabel]}>Departure time</Text>
          <TouchableOpacity style={selectorStyles.trigger} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={[scheduledTime ? selectorStyles.triggerText : selectorStyles.triggerPlaceholder]}>
              {scheduledTime || 'Select time'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showTimePicker ? (
            <DateTimePicker
              value={scheduledDateObj}
              mode="time"
              display="default"
              onChange={(_, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setScheduledDateObj(selectedTime);
                  setScheduledTime(formatTimeValue(selectedTime));
                }
              }}
            />
          ) : null}
          <Text style={styles.scheduleHint}>
            Use picker controls to set date/time (no manual typing).
          </Text>
        </View>
      )}

      {currentStep === 'Repetition' && (
        <View style={styles.stepContent}>
          <Text style={styles.label}>Departures every (minutes)</Text>
          <View style={styles.repetitionRow}>
            {REPETITION_INTERVALS.map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.repetitionChip,
                  repetitionInterval === mins && styles.repetitionChipActive,
                ]}
                onPress={() => setRepetitionInterval(mins)}
              >
                <Text
                  style={[
                    styles.repetitionChipText,
                    repetitionInterval === mins && styles.repetitionChipTextActive,
                  ]}
                >
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, styles.scheduleLabel]}>End at (optional)</Text>
          <TouchableOpacity
            style={selectorStyles.trigger}
            onPress={() => setShowRepetitionEndPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text
              style={[
                repetitionEndTime ? selectorStyles.triggerText : selectorStyles.triggerPlaceholder,
              ]}
            >
              {repetitionEndTime || 'e.g. 18:00'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showRepetitionEndPicker ? (
            <DateTimePicker
              value={repetitionEndDateObj}
              mode="time"
              display="default"
              onChange={(_, selectedTime) => {
                setShowRepetitionEndPicker(false);
                if (selectedTime) {
                  setRepetitionEndDateObj(selectedTime);
                  setRepetitionEndTime(formatTimeValue(selectedTime));
                }
              }}
            />
          ) : null}
          <Text style={styles.scheduleHint}>
            Buses will depart at the selected interval. Set an end time to limit the number of trips.
          </Text>
        </View>
      )}

      {currentStep === 'Details' && (
        <View style={styles.stepContent}>
          <Text style={styles.label}>Seats available</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setSeats((s) => Math.max(1, s - 1))}
            >
              <Ionicons name="remove" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{seats}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setSeats((s) => Math.min(seatsMax, s + 1))}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {!isAgency ? (
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setMaxRear(!maxRear)}
            >
              <View style={[styles.checkbox, maxRear && styles.checkboxChecked]}>
                {maxRear && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </View>
              <Text style={styles.checkLabel}>Max 2 in the back (comfort)</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.label}>Price per seat (RWF)</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setPrice((p) => Math.max(priceMin, p - priceStep))}
            >
              <Ionicons name="remove" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.stepperValue, styles.priceText]}>{formatRwf(price)}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setPrice((p) => Math.min(priceMax, p + priceStep))}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.recommended}>Recommended: 30,000 - 35,000 RWF</Text>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAllowFullCar(!allowFullCar)}
          >
            <View style={[styles.checkbox, allowFullCar && styles.checkboxChecked]}>
              {allowFullCar && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </View>
            <Text style={styles.checkLabel}>Allow full car booking</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 'Payment' && (
        <View style={styles.stepContent}>
          <PaymentMethodIcons
            methods={['cash', 'mobile_money', 'card']}
            selected={paymentMethods}
            onSelect={togglePayment}
            multiSelect
          />
        </View>
      )}

      {currentStep === 'Review' && (
        <View style={styles.stepContent}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Trip details before posting</Text>
            <View style={styles.reviewRow}>
              <Ionicons name={rideType === 'insta' ? 'flash-outline' : 'calendar-outline'} size={16} color={colors.primary} />
              <Text style={styles.reviewText}>{rideType === 'insta' ? 'InstaRide' : 'Scheduled'}</Text>
            </View>
            {rideType === 'scheduled' ? (
              <>
                <View style={styles.reviewRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.reviewText}>{scheduledDate || 'No date selected'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.reviewText}>{scheduledTime || 'No time selected'}</Text>
                </View>
                {isAgency && repetitionInterval > 0 ? (
                  <View style={styles.reviewRow}>
                    <Ionicons name="repeat-outline" size={16} color={colors.primary} />
                    <Text style={styles.reviewText}>
                      Every {repetitionInterval} min{repetitionEndTime ? ` until ${repetitionEndTime}` : ''}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
            <View style={styles.reviewRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={styles.reviewText}>
                {departure?.name} → {destination?.name}
              </Text>
            </View>
            <View style={styles.reviewRow}>
              <Ionicons name="car-sport-outline" size={16} color={colors.primary} />
              <Text style={styles.reviewText}>{vehicle?.make} {vehicle?.model}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.reviewText}>{seats} seats</Text>
            </View>
            <View style={styles.reviewRow}>
              <Ionicons name="cash-outline" size={16} color={colors.primary} />
              <Text style={styles.reviewText}>{formatRwf(price)}/seat</Text>
            </View>
            <View style={styles.reviewRow}>
              <Ionicons name="card-outline" size={16} color={colors.primary} />
              <Text style={styles.reviewText}>
                {paymentMethods.map((m) => m.replace('_', ' ')).join(' • ')}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={nextStep}
        >
          <Ionicons name="arrow-forward" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  introWrap: { paddingVertical: spacing.md },
  introTitle: { ...typography.h2, marginBottom: spacing.xs },
  introSub: { ...typography.bodySmall, marginBottom: spacing.lg },
  introSteps: { marginBottom: spacing.xl },
  introStepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  introStepIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  introStepBody: { flex: 1 },
  introStepLabel: { ...typography.caption, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  introStepValue: { ...typography.bodySmall, fontWeight: '600' },
  introStepDivider: { borderBottomWidth: 1, marginLeft: 48 + spacing.md },
  introContinueBtn: { paddingVertical: 16, borderRadius: 20, alignItems: 'center' },
  introContinueText: { ...typography.body, fontWeight: '700', color: '#FFFFFF' },
  stepMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  stepCounter: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepTitle: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  stepContent: { marginBottom: spacing.md },
  option: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primary },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  optionText: { ...typography.body, color: colors.text },
  optionTextActive: { color: colors.onPrimary },
  optionSub: { ...typography.caption, color: colors.textSecondary },
  optionSubActive: { color: colors.onPrimary, opacity: 0.9 },
  empty: { ...typography.body, color: colors.textSecondary },
  label: { ...typography.body, color: colors.text, marginBottom: spacing.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: { ...typography.h1, color: colors.text },
  priceText: { color: colors.success },
  recommended: {
    ...typography.bodySmall,
    color: colors.successLight,
    marginBottom: spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {},
  checkLabel: { ...typography.body, color: colors.text },
  scheduleHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scheduleLabel: {
    marginTop: spacing.sm,
  },
  repetitionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  repetitionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  repetitionChipActive: {
    borderColor: colors.primaryButtonBorder,
    backgroundColor: colors.primary,
  },
  repetitionChipText: { ...typography.body, color: colors.textSecondary },
  repetitionChipTextActive: { color: colors.onPrimary, fontWeight: '600' },
  reviewCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  reviewTitle: { ...typography.body, color: colors.text, fontWeight: '700', marginBottom: spacing.xs },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewText: { ...typography.bodySmall, color: colors.text },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  nextBtn: {
    width: buttonHeights.large,
    height: buttonHeights.large,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.55,
  },
});
