import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HotpointPicker, PaymentMethodIcons, Screen, DateTimePicker } from '../../components';
import { getHotpoints, getUserVehicles, publishTrip, publishTrips } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { buttonHeights, colors, spacing, typography, radii, cardShadow } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import { selectorStyles } from '../../utils/selectorStyles';
import { formatRwf } from '../../../../shared/src';
import type { Hotpoint, Vehicle, PaymentMethod } from '../../types';

const PUBLISH_STEPS = ['Intro', 'Vehicle', 'Route', 'Schedule', 'Details', 'Payment', 'Review'];
const SCHEDULED_AGENCY_STEPS = [
  'Intro',
  'Vehicle',
  'Route',
  'Schedule',
  'Repetition',
  'Details',
  'Payment',
  'Review',
];

const AMENITIES = [
  { id: 'ac', label: 'AC', icon: 'snow-outline' as const },
  { id: 'charger', label: 'USB Charger', icon: 'battery-charging-outline' as const },
  { id: 'music', label: 'Music', icon: 'musical-notes-outline' as const },
  { id: 'coffee', label: 'Coffee stop', icon: 'cafe-outline' as const },
] as const;

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
  const [durationDisplay, setDurationDisplay] = useState('45 mins');
  const [driverNote, setDriverNote] = useState('');
  const [amenities, setAmenities] = useState<string[]>(['ac', 'music']);
  const isAgency = currentRole === 'agency';
  const steps = isAgency ? SCHEDULED_AGENCY_STEPS : PUBLISH_STEPS;
  const currentStep = steps[step];
  const seatsMax = isAgency ? (vehicle?.seats ?? 18) : 6;
  const priceMin = 5000;
  const priceMax = 200000;
  const priceStep = 1000;

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
    setDurationDisplay('45 mins');
    setDriverNote('');
    setAmenities(['ac', 'music']);
  };

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (currentStep === 'Intro') return true;
    if (currentStep === 'Vehicle') return !!vehicle;
    if (currentStep === 'Route') return !!departure && !!destination;
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
    if (currentStep === 'Route') return 'Select departure and destination.';
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
      const depTime = scheduledTime || fallbackTime;
      const depHour = Number.parseInt(depTime.split(':')[0] || '0', 10);
      const depMin = Number.parseInt(depTime.split(':')[1] || '0', 10);
      const arrHour = (depHour + 3) % 24;
      const arrTime = `${arrHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`;
      const baseTrip = {
        type: 'scheduled' as const,
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
        isAgency && scheduledDate && scheduledTime && repetitionInterval > 0;

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
        const tripPayload = { ...baseTrip, departureDate: scheduledDate };
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

      {currentStep === 'Vehicle' && (
        <View style={styles.stepContent}>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.option, { backgroundColor: c.card, borderColor: c.border }, vehicle?.id === v.id && { backgroundColor: c.primary, borderColor: c.primary }]}
              onPress={() => {
                setVehicle(v);
                if (isAgency) setSeats(v.seats);
              }}
            >
              <View style={styles.optionRow}>
                <Ionicons name="car-sport-outline" size={18} color={vehicle?.id === v.id ? c.onPrimary : c.primary} />
                <Text style={[styles.optionText, { color: c.text }, vehicle?.id === v.id && { color: c.onPrimary }]}>{v.make} {v.model}</Text>
              </View>
              <Text style={[styles.optionSub, { color: c.textSecondary }, vehicle?.id === v.id && { color: c.onPrimary, opacity: 0.9 }]}>{v.color} • {v.licensePlate}</Text>
            </TouchableOpacity>
          ))}
          {vehicles.length === 0 && (
            <Text style={[styles.empty, { color: c.textSecondary }]}>No approved vehicles. Add one in Vehicle Garage.</Text>
          )}
        </View>
      )}

      {currentStep === 'Route' && (
        <View style={styles.stepContent}>
          <View style={[styles.routeCard, { backgroundColor: c.primaryTint, borderColor: c.border }, cardShadow]}>
            <View style={styles.routeLineWrap}>
              <View style={[styles.routeDotStart, { borderColor: c.primary }]} />
              <View style={[styles.routeLine, { backgroundColor: c.border }]} />
              <View style={[styles.routeDotEnd, { backgroundColor: c.primary }]} />
            </View>
            <View style={styles.routePickers}>
              <View style={styles.routePickerRow}>
                <Text style={[styles.routeLabel, { color: c.textSecondary }]}>Where from?</Text>
                <HotpointPicker
                  value={departure}
                  hotpoints={hotpoints}
                  onSelect={setDeparture}
                  placeholder="Where from?"
                  triggerStyle={[styles.routeTrigger, { borderBottomColor: c.border }]}
                />
              </View>
              <View style={styles.routePickerRow}>
                <Text style={[styles.routeLabel, { color: c.textSecondary }]}>Where to?</Text>
                <HotpointPicker
                  value={destination}
                  hotpoints={hotpoints}
                  onSelect={setDestination}
                  placeholder="Where to?"
                  triggerStyle={styles.routeTrigger}
                />
              </View>
            </View>
          </View>
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
          <DateTimePicker
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
            value={scheduledDateObj}
            onChange={(selectedDate) => {
              setScheduledDateObj(selectedDate);
              setScheduledDate(formatDateValue(selectedDate));
            }}
            mode="date"
          />

          <Text style={[styles.label, styles.scheduleLabel]}>Departure time</Text>
          <TouchableOpacity style={selectorStyles.trigger} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={[scheduledTime ? selectorStyles.triggerText : selectorStyles.triggerPlaceholder]}>
              {scheduledTime || 'Select time'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <DateTimePicker
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
            value={scheduledDateObj}
            onChange={(selectedTime) => {
              setScheduledDateObj(selectedTime);
              setScheduledTime(formatTimeValue(selectedTime));
            }}
            mode="time"
          />
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
          <DateTimePicker
            visible={showRepetitionEndPicker}
            onRequestClose={() => setShowRepetitionEndPicker(false)}
            value={repetitionEndDateObj}
            onChange={(selectedTime) => {
              setRepetitionEndDateObj(selectedTime);
              setRepetitionEndTime(formatTimeValue(selectedTime));
            }}
            mode="time"
          />
          <Text style={styles.scheduleHint}>
            Buses will depart at the selected interval. Set an end time to limit the number of trips.
          </Text>
        </View>
      )}

      {currentStep === 'Details' && (
        <View style={styles.stepContent}>
          <View style={styles.detailsGrid}>
            <View style={[styles.detailsCard, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
              <Text style={[styles.detailsCardLabel, { color: c.textSecondary }]}>CAPACITY</Text>
              <View style={styles.detailsStepperRow}>
                <TouchableOpacity
                  style={[styles.detailsStepperBtn, { backgroundColor: c.primaryTint, borderColor: c.border }]}
                  onPress={() => setSeats((s) => Math.max(1, s - 1))}
                >
                  <Ionicons name="remove" size={18} color={c.text} />
                </TouchableOpacity>
                <Text style={[styles.detailsStepperValue, { color: c.text }]}>{seats}</Text>
                <TouchableOpacity
                  style={[styles.detailsStepperBtn, { backgroundColor: c.primaryTint, borderColor: c.border }]}
                  onPress={() => setSeats((s) => Math.min(seatsMax, s + 1))}
                >
                  <Ionicons name="add" size={18} color={c.text} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.detailsCard, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
              <Text style={[styles.detailsCardLabel, { color: c.textSecondary }]}>PRICE / SEAT</Text>
              <View style={styles.detailsPriceRow}>
                <Text style={[styles.detailsPricePrefix, { color: c.primary }]}>RWF</Text>
                <View style={styles.detailsPriceStepper}>
                  <TouchableOpacity
                    style={[styles.detailsStepperBtn, { backgroundColor: c.primaryTint, borderColor: c.border }]}
                    onPress={() => setPrice((p) => Math.max(priceMin, p - priceStep))}
                  >
                    <Ionicons name="remove" size={16} color={c.text} />
                  </TouchableOpacity>
                  <Text style={[styles.detailsStepperValue, { color: c.text }]}>{formatRwf(price)}</Text>
                  <TouchableOpacity
                    style={[styles.detailsStepperBtn, { backgroundColor: c.primaryTint, borderColor: c.border }]}
                    onPress={() => setPrice((p) => Math.min(priceMax, p + priceStep))}
                  >
                    <Ionicons name="add" size={16} color={c.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.durationRow, { backgroundColor: c.primaryTint, borderColor: c.border }]}>
            <View style={[styles.durationIconWrap, { backgroundColor: c.background }]}>
              <Ionicons name="time-outline" size={20} color={c.primary} />
            </View>
            <View style={styles.durationBody}>
              <Text style={[styles.detailsCardLabel, { color: c.textSecondary }]}>TRIP DURATION</Text>
              <TextInput
                style={[styles.durationInput, { color: c.text }]}
                value={durationDisplay}
                onChangeText={setDurationDisplay}
                placeholder="e.g. 45 mins"
                placeholderTextColor={c.textSecondary}
              />
            </View>
            <View style={[styles.autoCalcBadge, { backgroundColor: c.primary }]}>
              <Text style={[styles.autoCalcText, { color: c.onPrimary }]}>Auto-Calc</Text>
            </View>
          </View>

          <View style={styles.amenitiesSection}>
            <View style={styles.amenitiesHeader}>
              <Text style={[styles.amenitiesTitle, { color: c.text }]}>AMENITIES</Text>
              <Text style={[styles.amenitiesCount, { color: c.textSecondary }]}>{amenities.length} selected</Text>
            </View>
            <View style={styles.amenitiesGrid}>
              {AMENITIES.map((a) => {
                const selected = amenities.includes(a.id);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.amenityChip,
                      { borderColor: c.border, backgroundColor: selected ? c.primary : c.card },
                      selected && cardShadow,
                    ]}
                    onPress={() => toggleAmenity(a.id)}
                  >
                    <Ionicons
                      name={a.icon}
                      size={18}
                      color={selected ? c.onPrimary : c.textSecondary}
                    />
                    <Text style={[styles.amenityLabel, { color: selected ? c.onPrimary : c.text }]}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.noteSection}>
            <View style={styles.noteHeader}>
              <Ionicons name="information-circle-outline" size={16} color={c.primary} />
              <Text style={[styles.noteTitle, { color: c.text }]}>DRIVER NOTE</Text>
            </View>
            <TextInput
              style={[styles.noteInput, { backgroundColor: c.primaryTint, borderColor: c.border, color: c.text }]}
              value={driverNote}
              onChangeText={setDriverNote}
              placeholder="e.g. Please no large suitcases..."
              placeholderTextColor={c.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          {!isAgency ? (
            <>
              <TouchableOpacity style={styles.checkRow} onPress={() => setMaxRear(!maxRear)}>
                <View style={[styles.checkbox, maxRear && { borderColor: c.primary, backgroundColor: c.primary }]}>
                  {maxRear && <Ionicons name="checkmark" size={16} color={c.onPrimary} />}
                </View>
                <Text style={[styles.checkLabel, { color: c.text }]}>Max 2 in the back (comfort)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkRow} onPress={() => setAllowFullCar(!allowFullCar)}>
                <View style={[styles.checkbox, allowFullCar && { borderColor: c.primary, backgroundColor: c.primary }]}>
                  {allowFullCar && <Ionicons name="checkmark" size={16} color={c.onPrimary} />}
                </View>
                <Text style={[styles.checkLabel, { color: c.text }]}>Allow full car booking</Text>
              </TouchableOpacity>
            </>
          ) : null}
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
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.reviewText}>Scheduled</Text>
            </View>
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
            {durationDisplay ? (
              <View style={styles.reviewRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.reviewText}>{durationDisplay}</Text>
              </View>
            ) : null}
            {driverNote ? (
              <View style={styles.reviewRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                <Text style={styles.reviewText} numberOfLines={2}>{driverNote}</Text>
              </View>
            ) : null}
            {amenities.length > 0 ? (
              <View style={styles.reviewRow}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={styles.reviewText}>{AMENITIES.filter((a) => amenities.includes(a.id)).map((a) => a.label).join(', ')}</Text>
              </View>
            ) : null}
            <View style={styles.reviewRow}>
              <Ionicons name="card-outline" size={16} color={colors.primary} />
              <Text style={styles.reviewText}>
                {paymentMethods.map((m) => m.replace('_', ' ')).join(' • ')}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())} style={styles.footerBack}>
          <Ionicons name="chevron-back" size={24} color={c.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.publishBtn,
            { backgroundColor: c.text },
            !canProceed() && styles.nextBtnDisabled,
          ]}
          onPress={nextStep}
        >
          <Ionicons name="navigate" size={20} color={colors.onAccent} />
          <Text style={styles.publishBtnText}>
            {currentStep === 'Review' ? 'Publish Trip' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
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
  introContinueText: { ...typography.body, fontWeight: '700', color: colors.onAccent },
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
  routeCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  routeLineWrap: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  routeDotStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.background,
    borderWidth: 2,
  },
  routeLine: { width: 2, flex: 1, minHeight: 24, marginVertical: 4 },
  routeDotEnd: { width: 10, height: 10, borderRadius: 5 },
  routePickers: { flex: 1 },
  routePickerRow: { marginBottom: spacing.sm },
  routeLabel: { ...typography.caption, marginBottom: 2 },
  routeTrigger: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    paddingVertical: 8,
    borderRadius: 0,
    marginBottom: 0,
  },
  detailsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  detailsCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
  },
  detailsCardLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  detailsStepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailsStepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsStepperValue: { ...typography.h2 },
  detailsPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  detailsPricePrefix: { ...typography.bodySmall, fontWeight: '700' },
  detailsPriceStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  durationIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  durationBody: { flex: 1 },
  durationInput: { ...typography.body, fontWeight: '600', paddingVertical: 4 },
  autoCalcBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  autoCalcText: { ...typography.caption, fontWeight: '700' },
  amenitiesSection: { marginBottom: spacing.lg },
  amenitiesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  amenitiesTitle: { ...typography.bodySmall, fontWeight: '700' },
  amenitiesCount: { ...typography.caption },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: '47%',
  },
  amenityLabel: { ...typography.bodySmall, fontWeight: '700' },
  noteSection: { marginBottom: spacing.lg },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  noteTitle: { ...typography.bodySmall, fontWeight: '700' },
  noteInput: {
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.lg,
    ...typography.bodySmall,
    minHeight: 100,
    textAlignVertical: 'top',
  },
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
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  footerBack: { padding: spacing.sm },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
    borderRadius: 20,
  },
  publishBtnText: { ...typography.body, fontWeight: '700', color: colors.onAccent },
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
