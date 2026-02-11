import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Building2, Users, Target } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function About() {
  return (
    <ScrollView style={styles.container} bounces={false}>
      <Stack.Screen 
        options={{ 
          title: 'About Us', 
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '600',
            color: '#ffffff',
          },
        }} 
      />
      <StatusBar style="light" />
      
      <View style={styles.heroSection}>
        <View style={styles.iconContainer}>
            <Building2 size={48} color="#2563eb" />
        </View>
        <Text style={styles.heroTitle}>BR31 PMS</Text>
        <Text style={styles.heroSubtitle}>
            Revolutionizing Property Management for the Modern Era
        </Text>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIconBg}>
                    <Target size={24} color="#2563eb" />
                </View>
                <Text style={styles.cardTitle}>Our Mission</Text>
            </View>
            <Text style={styles.cardText}>
                To provide a seamless, transparent, and efficient platform for property owners and tenants to connect, manage, and thrive.
            </Text>
        </View>

        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIconBg}>
                    <Users size={24} color="#2563eb" />
                </View>
                <Text style={styles.cardTitle}>Who We Are</Text>
            </View>
            <Text style={styles.cardText}>
                BR31 is a team of dedicated professionals passionate about solving the complexities of property rentals and management. We combine technology with human-centric design to create the best experience for our users.
            </Text>
        </View>

        <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Why Choose Us?</Text>
            <View style={styles.featuresList}>
                {['Verified Listings', 'Secure Payments', '24/7 Support', 'Easy Management Tools'].map((item, index) => (
                    <View key={index} style={styles.featureRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.featureItem}>{item}</Text>
                    </View>
                ))}
            </View>
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
  heroSection: {
    backgroundColor: '#0f172a',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  heroSubtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 300,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  contentSection: {
    padding: 24,
    gap: 20,
    marginTop: -24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
  },
  featuresCard: {
    backgroundColor: '#2563eb',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 8,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#93c5fd',
    marginRight: 12,
  },
  featureItem: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});
