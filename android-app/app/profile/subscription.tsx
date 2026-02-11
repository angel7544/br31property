import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, Loader2, Crown, CreditCard, ShieldCheck, Zap } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const roles = (user.app_metadata?.roles as string[]) || [];
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (roles.includes('owner') || roles.includes('admin') || profile?.role === 'owner' || profile?.role === 'admin') {
        setIsOwner(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    Alert.alert(
      "Upgrade via Web",
      "In-app payments are coming soon. Please visit our website to upgrade your plan.",
      [
        { text: "OK" }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: 'My Subscription', headerShadowVisible: false, headerStyle: { backgroundColor: '#F9FAFB' } }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSubtitle}>Unlock the full potential of your property business</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Free Plan Card */}
        <View style={[styles.card, !isOwner && styles.currentPlanBorder]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.planName}>Tenant</Text>
              <Text style={styles.planDescription}>For property seekers</Text>
            </View>
            {!isOwner && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            )}
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹0</Text>
            <Text style={styles.period}>/forever</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresList}>
            <FeatureItem text="Search unlimited properties" />
            <FeatureItem text="Contact owners directly" />
            <FeatureItem text="Save to wishlist" />
            <FeatureItem text="Basic support" />
          </View>
        </View>

        {/* Owner Plan Card */}
        <View style={[styles.card, styles.ownerCard, isOwner && styles.currentPlanBorder]}>
          {/* Recommended Badge */}
          {!isOwner && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          )}

          {isOwner && (
            <View style={styles.activeLabel}>
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.activeLabelText}>ACTIVE PLAN</Text>
            </View>
          )}
          
          <View style={styles.cardHeader}>
            <View>
              <View style={styles.ownerTitleRow}>
                <Text style={[styles.planName, styles.ownerPlanName]}>Owner</Text>
                <Crown size={24} color="#F59E0B" fill="#F59E0B" />
              </View>
              <Text style={styles.planDescription}>For property owners</Text>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.price, styles.ownerPrice]}>₹999</Text>
            <Text style={styles.period}>/one-time</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresList}>
            <FeatureItem text="List unlimited properties" highlight />
            <FeatureItem text="Access Owner Dashboard" highlight />
            <FeatureItem text="Manage bookings & tenants" highlight />
            <FeatureItem text="Priority Support" highlight />
            <FeatureItem text="Verified Owner Badge" highlight />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              isOwner ? styles.disabledButton : styles.upgradeButton
            ]}
            onPress={handleUpgrade}
            disabled={isOwner || upgrading}
          >
            {isOwner ? (
              <Text style={styles.disabledButtonText}>Current Plan</Text>
            ) : (
              <>
                {upgrading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.guaranteeContainer}>
        <ShieldCheck size={24} color="#6B7280" />
        <Text style={styles.guaranteeText}>Secure payment powered by Razorpay</Text>
      </View>

    </ScrollView>
  );
}

function FeatureItem({ text, highlight = false }: { text: string, highlight?: boolean }) {
  return (
    <View style={styles.featureItem}>
      <CheckCircle size={20} color={highlight ? "#2563EB" : "#10B981"} />
      <Text style={[styles.featureText, highlight && styles.featureTextHighlight]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  ownerCard: {
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.02 }], // Slight emphasis
  },
  currentPlanBorder: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
  },
  activeLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  ownerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  ownerPlanName: {
    color: '#2563EB',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  currentBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
  },
  ownerPrice: {
    color: '#2563EB',
  },
  period: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#4B5563',
    flex: 1,
  },
  featureTextHighlight: {
    color: '#1F2937',
    fontWeight: '500',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButton: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  guaranteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    opacity: 0.7,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
