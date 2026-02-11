import { View, Text, ScrollView, TextInput, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Mail, Phone, MapPin } from 'lucide-react-native';
import { Button } from '../components/ui/Button';

export default function Contact() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen 
        options={{ 
          title: 'Contact Us', 
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
            color: '#111827',
          },
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
            <Text style={styles.title}>Get in Touch</Text>
            <Text style={styles.subtitle}>We'd love to hear from you. Please fill out this form or reach us using the contact details below.</Text>
        </View>

        <View style={styles.contactInfo}>
            <TouchableOpacity 
                onPress={() => Linking.openURL('tel:+911234567890')} 
                style={styles.contactItem}
                activeOpacity={0.7}
            >
                <View style={styles.iconWrapper}>
                    <Phone size={24} color="#2563eb" />
                </View>
                <View style={styles.contactTextWrapper}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>+91 123 456 7890</Text>
                </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={() => Linking.openURL('mailto:info@br31tech.live')} 
                style={styles.contactItem}
                activeOpacity={0.7}
            >
                <View style={styles.iconWrapper}>
                    <Mail size={24} color="#2563eb" />
                </View>
                <View style={styles.contactTextWrapper}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>info@br31tech.live</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.contactItem}>
                <View style={styles.iconWrapper}>
                    <MapPin size={24} color="#2563eb" />
                </View>
                <View style={styles.contactTextWrapper}>
                    <Text style={styles.contactLabel}>Office</Text>
                    <Text style={styles.contactValue}>123 Street Name, City, State</Text>
                </View>
            </View>
        </View>

        <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send us a message</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#94a3b8" />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} placeholder="Your email" keyboardType="email-address" placeholderTextColor="#94a3b8" />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="How can we help?" multiline textAlignVertical="top" placeholderTextColor="#94a3b8" />
            </View>
            
            <Button style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Send Message</Text>
            </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  contactInfo: {
    gap: 16,
    marginBottom: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  contactTextWrapper: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    height: 120,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
