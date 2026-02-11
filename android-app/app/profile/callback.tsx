import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Phone, Clock, CheckCircle, Loader2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const TIME_SLOTS = [
  "Morning (9 AM - 12 PM)",
  "Afternoon (12 PM - 4 PM)",
  "Evening (4 PM - 8 PM)",
  "Anytime"
];

export default function CallbackScreen() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Login Required', 'You must be logged in to request a callback');
        router.push('/(auth)/login');
        return;
      }

      const { error } = await supabase.from('call_requests').insert([
        {
          user_id: user.id,
          phone: phone,
          preferred_time: preferredTime,
          status: 'Pending'
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      setPhone('');
      setPreferredTime(TIME_SLOTS[0]);
      
    } catch (error: any) {
      console.error('Error submitting callback request:', error);
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Stack.Screen options={{ title: 'Request Callback' }} />
        <View style={styles.successIconContainer}>
          <CheckCircle size={48} color="#16A34A" />
        </View>
        <Text style={styles.successTitle}>Request Received!</Text>
        <Text style={styles.successMessage}>
          Our support team has received your request. We will call you at your preferred time.
        </Text>
        <TouchableOpacity 
          style={styles.anotherButton}
          onPress={() => setSuccess(false)}
        >
          <Text style={styles.anotherButtonText}>Request Another Call</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen 
        options={{ 
          title: 'Request Callback', 
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
            color: '#111827',
          },
        }} 
      />
      
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Phone size={24} color="#2563EB" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Request a Call Back</Text>
          <Text style={styles.headerSubtitle}>
            Leave your number and our support team will call you within 24 hours.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrapper}>
             <Phone size={20} color="#64748b" style={styles.inputIcon} />
             <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#9CA3AF"
             />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Time <Text style={styles.required}>*</Text></Text>
          <View style={styles.slotsContainer}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotButton,
                  preferredTime === slot && styles.activeSlotButton
                ]}
                onPress={() => setPreferredTime(slot)}
                activeOpacity={0.8}
              >
                <Clock size={16} color={preferredTime === slot ? "#2563EB" : "#6B7280"} />
                <Text style={[
                  styles.slotText,
                  preferredTime === slot && styles.activeSlotText
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Phone size={20} color="#FFFFFF" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>Request Call</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  slotsContainer: {
    gap: 10,
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  activeSlotButton: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  slotText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activeSlotText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  successIconContainer: {
    marginBottom: 24,
    backgroundColor: '#DCFCE7',
    padding: 20,
    borderRadius: 50,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  anotherButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  anotherButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});
