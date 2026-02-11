import { useEffect, useState } from 'react';
import { View, Text, Alert, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { User, LogOut, Heart, List, Info, Crown, MessageSquare, PhoneCall, Headphones, ChevronRight, Settings } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeaderBackground } from '../../components/ui/AnimatedHeaderBackground';

const { width } = Dimensions.get('window');

export default function More() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
    router.replace('/(auth)/login');
  }

  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: User, label: 'My Profile', route: '/profile/edit', color: '#2563EB' },
        { icon: Crown, label: 'My Subscription', route: '/profile/subscription', color: '#EAB308' },
      ]
    },
    {
      title: 'Property Management',
      items: [
        { icon: List, label: 'My Listings', route: '/profile/my-listings', color: '#7C3AED' },
        { icon: Heart, label: 'Wishlist Properties', route: '/profile/wishlist', color: '#DB2777' },
        { icon: MessageSquare, label: 'Contacted Owners', route: '/profile/contacted-owners', color: '#059669' },
      ]
    },
    {
      title: 'Support & Info',
      items: [
        { icon: PhoneCall, label: 'Request Call Back', route: '/profile/callback', color: '#EA580C' },
        { icon: Headphones, label: 'Contact Us', route: '/contact', color: '#4B5563' },
        { icon: Info, label: 'About Us', route: '/about', color: '#4B5563' },
      ]
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />
      {/* Header Profile Section */}
      <View style={styles.headerContainer}>
        {/* Abstract Animated Background */}
        <AnimatedHeaderBackground />

        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                    <View style={styles.avatarContainer}>
                        {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                            {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        )}
                        {/* Optional: Add an edit badge */}
                        <TouchableOpacity style={styles.editBadge} onPress={() => router.push('/profile/edit')}>
                            <Settings size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>{profile?.full_name || 'User'}</Text>
                        <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
                        {profile?.role === 'owner' && (
                            <View style={styles.roleBadge}>
                                <Crown size={12} color="#FFF" />
                                <Text style={styles.roleText}>Owner</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Logout Button moved here */}
                <TouchableOpacity 
                    style={styles.headerLogoutBtn} 
                    onPress={signOut}
                    activeOpacity={0.7}
                >
                    <View style={styles.logoutIconContainer}>
                        <LogOut size={18} color="#FFF" />
                    </View>
                    <Text style={styles.headerLogoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
        
        {/* Decorative Curve or overlapping container could go here, but using simple overlap for now */}
      </View>

      <View style={styles.contentContainer}>
        {sections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionContent}>
                    {section.items.map((item, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={[
                                styles.menuItem, 
                                index === section.items.length - 1 && styles.lastMenuItem
                            ]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <ChevronRight size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        ))}

        <View style={styles.footer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    backgroundColor: '#2563EB',
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden', // Ensure blobs don't overflow
    position: 'relative',
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flex: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerLogoutBtn: {
    alignItems: 'center',
    gap: 4,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerLogoutText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: -40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
