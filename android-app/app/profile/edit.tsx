import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { User, Mail, Phone, MapPin, Camera } from 'lucide-react-native';
import { pickImage, uploadImage } from '../../lib/imageUtils';

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    avatar_url: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        // Init from user metadata if profile doesn't exist
        setProfile(prev => ({
            ...prev,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || ''
        }));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarPick() {
    try {
      const assets = await pickImage(false);
      if (!assets || !assets[0].uri) return;

      // Upload immediately
      // Better UX: Show loading on avatar
      const uploadedUrl = await uploadImage(assets[0].uri, 'avatars'); // Ensure bucket exists
      if (uploadedUrl) {
        setProfile({ ...profile, avatar_url: uploadedUrl });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload avatar');
    }
  }

  async function updateProfile() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user on the session!');

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        avatar_url: profile.avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Profile', 
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTintColor: '#1e293b',
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                    {profile.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <User size={48} color="#94a3b8" />
                      </View>
                    )}
                    <TouchableOpacity style={styles.cameraButton} onPress={handleAvatarPick} activeOpacity={0.8}>
                        <Camera size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.headerTitle}>{profile.full_name || 'Your Profile'}</Text>
            <Text style={styles.headerSubtitle}>{profile.email}</Text>
        </View>

        <View style={styles.formCard}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                    <User size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        value={profile.full_name}
                        onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                        placeholder="Enter full name"
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                    <Phone size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        value={profile.phone}
                        onChangeText={(text) => setProfile({ ...profile, phone: text })}
                        placeholder="Enter phone number"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <View style={styles.inputWrapper}>
                    <MapPin size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        value={profile.address}
                        onChangeText={(text) => setProfile({ ...profile, address: text })}
                        placeholder="Enter your address"
                        placeholderTextColor="#94a3b8"
                        multiline
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>City</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={profile.city}
                            onChangeText={(text) => setProfile({ ...profile, city: text })}
                            placeholder="City"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>State</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={profile.state}
                            onChangeText={(text) => setProfile({ ...profile, state: text })}
                            placeholder="State"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>
            </View>

            <Button 
                onPress={updateProfile} 
                loading={saving}
                style={styles.saveButton}
                textStyle={styles.saveButtonText}
            >
                Save Changes
            </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8fafc',
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  formCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
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
    color: '#0f172a',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    height: 56,
    borderRadius: 14,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
