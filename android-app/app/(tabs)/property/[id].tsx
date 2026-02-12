import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Alert, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft,
  MapPin, 
  CheckCircle, 
  Wifi, 
  Zap, 
  Wind, 
  Shield, 
  Tv, 
  Coffee, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  BedDouble, 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  MessageCircle,
  FileQuestion,
  FileText,
  IndianRupee,
  Share2,
  Clock,
  Wrench
} from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';

// Helper to map amenity name to icon
const getAmenityIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('wifi') || lower.includes('net')) return <Wifi size={20} color="#4B5563" />;
  if (lower.includes('power') || lower.includes('backup')) return <Zap size={20} color="#4B5563" />;
  if (lower.includes('ac') || lower.includes('condition')) return <Wind size={20} color="#4B5563" />;
  if (lower.includes('security') || lower.includes('cctv')) return <Shield size={20} color="#4B5563" />;
  if (lower.includes('tv')) return <Tv size={20} color="#4B5563" />;
  if (lower.includes('food') || lower.includes('mess')) return <Coffee size={20} color="#4B5563" />;
  if (lower.includes('gym')) return <Dumbbell size={20} color="#4B5563" />;
  return <CheckCircle size={20} color="#4B5563" />;
};

const getRuleIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('security') || l.includes('deposit')) return <IndianRupee size={20} color="#4B5563" />;
    if (l.includes('notice')) return <FileText size={20} color="#4B5563" />;
    if (l.includes('lock') || l.includes('agreement')) return <Clock size={20} color="#4B5563" />;
    if (l.includes('electricity') || l.includes('power')) return <Zap size={20} color="#4B5563" />;
    if (l.includes('maintenance')) return <Wrench size={20} color="#4B5563" />;
    if (l.includes('available')) return <Calendar size={20} color="#4B5563" />;
    return <CheckCircle size={20} color="#4B5563" />;
};

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [inquiry, setInquiry] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    message: ''
  });
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchProperty();
  }, [id]);

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
    }
  }

  async function fetchProperty() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Fetch owner profile if needed
      let ownerProfile = null;
      if (data && data.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user_id)
            .single();
          ownerProfile = profileData;
      }
      
      setProperty({ ...data, profiles: ownerProfile });
      if (data) {
        setInquiry(prev => ({
            ...prev,
            message: `I am interested in ${data.name}. Please provide more details.`
        }));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  }

  const handleSendInquiry = async () => {
    const name = userProfile?.full_name || inquiry.name;
    const phone = userProfile?.phone || inquiry.phone;

    if (!name || !phone) {
      Alert.alert('Required', 'Please provide Name and Phone number');
      return;
    }
    setSendingInquiry(true);
    
    // TODO: Implement actual inquiry storage in database
    setTimeout(() => {
        setSendingInquiry(false);
        Alert.alert('Success', 'Your inquiry has been sent to the owner!');
        if (!user) {
            setInquiry({ name: '', phone: '', email: '', date: '', message: '' });
        }
    }, 1500);
  };

  const openMap = () => {
    if (!property) return;
    const query = `${property.name}, ${property.address}, ${property.city}`;
    const url = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`
    });
    Linking.openURL(url || '');
  };

  const handleContact = (type: 'call' | 'sms' | 'whatsapp' | 'email') => {
      // Use property-specific contact info first, then fall back to owner profile
      const phone = property.contact_number || property.profiles?.phone;
      const email = property.email || property.profiles?.email;

      if (!phone && type !== 'email') {
          Alert.alert('Info', 'Owner phone number not available');
          return;
      }

      switch(type) {
          case 'call':
              Linking.openURL(`tel:${phone}`);
              break;
          case 'sms':
              Linking.openURL(`sms:${phone}`);
              break;
          case 'whatsapp':
              Linking.openURL(`whatsapp://send?phone=${phone}`);
              break;
          case 'email':
              if (email) Linking.openURL(`mailto:${email}`);
              else Alert.alert('Info', 'Owner email not available');
              break;
      }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.notFoundIconContainer}>
            <FileQuestion size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.errorTitle}>Property Not Found</Text>
        <Text style={styles.errorText}>The property you are looking for does not exist or has been removed.</Text>
        <Button onPress={() => router.replace('/(tabs)/pgs')} style={{ marginTop: 24, width: 200 }}>
            Browse Properties
        </Button>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
             <Text style={{ color: '#6B7280', fontWeight: '500' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const amenitiesToShow = showAllAmenities 
    ? property.amenities 
    : property.amenities?.slice(0, 6);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        
        {/* Header Image */}
        <View style={styles.imageContainer}>
             <Image
              source={{ uri: property.images?.[0] || 'https://via.placeholder.com/400x250' }}
              style={styles.image}
              resizeMode="cover"
            />
            
            {/* Header Actions - Glassmorphism */}
            <View style={[styles.headerActions, { top: insets.top + 10 }]}>
                <TouchableOpacity 
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                  style={styles.iconButtonWrapper}
                >
                  <BlurView intensity={50} tint="dark" style={styles.iconButtonBlur}>
                    <ArrowLeft size={24} color="#fff" />
                  </BlurView>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={styles.iconButtonWrapper}
                >
                  <BlurView intensity={50} tint="dark" style={styles.iconButtonBlur}>
                    <Share2 size={20} color="#fff" />
                  </BlurView>
                </TouchableOpacity>
            </View>

            {/* Price Tag - Glassmorphism */}
            <View style={styles.priceTagWrapper}>
                <BlurView intensity={40} tint="dark" style={styles.priceTagBlur}>
                    <Text style={styles.priceText}>Starts from ₹{property.price_range_min || property.min_price || property.price_range?.split('-')[0] || 'N/A'}/mo</Text>
                </BlurView>
            </View>
        </View>

        <View style={styles.content}>
          {/* Title Card */}
          <View style={styles.card}>
            <View style={styles.tagsRow}>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>{property.type || 'PG'}</Text>
                </View>
                <View style={[styles.tag, styles.genderTag]}>
                    <Users size={12} color="#4F46E5" />
                    <Text style={[styles.tagText, styles.genderText]}>{property.gender || 'Unisex'}</Text>
                </View>
            </View>
            
            <Text style={styles.title}>{property.name}</Text>
            
            <TouchableOpacity onPress={openMap} style={styles.locationRow}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.locationText}>{property.address}, {property.city}</Text>
                <Text style={styles.viewMapText}>(View on map)</Text>
            </TouchableOpacity>
          </View>

          {/* Amenities Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
                {amenitiesToShow?.map((amenity: string, idx: number) => (
                    <View key={idx} style={styles.amenityItem}>
                        <View style={styles.amenityIcon}>
                            {getAmenityIcon(amenity)}
                        </View>
                        <Text style={styles.amenityName}>{amenity}</Text>
                    </View>
                ))}
            </View>
            {property.amenities?.length > 6 && (
                <TouchableOpacity 
                    onPress={() => setShowAllAmenities(!showAllAmenities)}
                    style={styles.showMoreButton}
                >
                    <Text style={styles.showMoreText}>
                        {showAllAmenities ? 'Show Less' : `Show More (${property.amenities.length - 6} more)`}
                    </Text>
                    {showAllAmenities ? <ChevronUp size={16} color="#2563EB" /> : <ChevronDown size={16} color="#2563EB" />}
                </TouchableOpacity>
            )}
          </View>

          {/* About Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.description}>{property.description || 'No description provided.'}</Text>
          </View>

          {/* Available Rooms Card */}
          {property.rooms && property.rooms.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Available Rooms</Text>
                {property.rooms.map((room: any, idx: number) => (
                    <View key={idx} style={styles.roomCard}>
                        <View style={styles.roomHeader}>
                            <Text style={styles.roomName}>{room.name}</Text>
                            <Text style={styles.roomPrice}>₹{room.rent}/mo</Text>
                        </View>
                        <View style={styles.roomDetails}>
                            <View style={styles.roomDetailItem}>
                                <BedDouble size={16} color="#6B7280" />
                                <Text style={styles.roomDetailText}>{room.type}</Text>
                            </View>
                            <View style={styles.roomDetailItem}>
                                <Users size={16} color="#6B7280" />
                                <Text style={styles.roomDetailText}>{room.totalBeds} Beds</Text>
                            </View>
                            <View style={styles.roomDetailItem}>
                                <CheckCircle size={16} color="#10B981" />
                                <Text style={[styles.roomDetailText, { color: '#10B981' }]}>
                                    {room.availableBeds || room.totalBeds} Available
                                </Text>
                            </View>
                        </View>
                        <Button variant="outline" size="sm" style={styles.contactRoomBtn}>
                            Contact Owner for this Room
                        </Button>
                    </View>
                ))}
              </View>
          )}

          {/* Pricing & Terms Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pricing & Terms</Text>
            <View style={styles.pricingGrid}>
            {property.rules ? (
                property.rules.split('\n').map((rule: string, idx: number) => {
                    if (rule.includes(':')) {
                        const parts = rule.split(':');
                        const label = parts[0]?.trim();
                        const value = parts.slice(1).join(':').trim();
                        if (!label) return null;
                        return (
                            <View key={idx} style={styles.pricingItem}>
                                {getRuleIcon(label)}
                                <View>
                                    <Text style={styles.pricingLabel}>{label}</Text>
                                    <Text style={styles.pricingValue}>{value}</Text>
                                </View>
                            </View>
                        );
                    } else {
                        return (
                            <View key={idx} style={styles.pricingItem}>
                                <CheckCircle size={20} color="#4B5563" />
                                <Text style={[styles.pricingValue, { flex: 1, marginLeft: 8 }]}>{rule}</Text>
                            </View>
                        );
                    }
                })
            ) : (
                <>
                    <View style={styles.pricingItem}>
                        <IndianRupee size={20} color="#4B5563" />
                        <View>
                            <Text style={styles.pricingLabel}>Security Deposit</Text>
                            <Text style={styles.pricingValue}>{property.security_deposit ? `₹${property.security_deposit}` : 'Contact Owner'}</Text>
                        </View>
                    </View>
                    <View style={styles.pricingItem}>
                        <FileText size={20} color="#4B5563" />
                        <View>
                            <Text style={styles.pricingLabel}>Notice Period</Text>
                            <Text style={styles.pricingValue}>{property.notice_period || 'Contact Owner'}</Text>
                        </View>
                    </View>
                </>
            )}
            </View>
          </View>

          {/* Managed By Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Managed by</Text>
            <View style={styles.ownerProfileRow}>
                <Image 
                    source={{ uri: property.profiles?.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop' }} 
                    style={styles.ownerAvatar} 
                />
                <View style={styles.ownerInfo}>
                    <Text style={styles.ownerName}>{property.profiles?.full_name || 'Property Owner'}</Text>
                    <Text style={styles.ownerRole}>Host</Text>
                </View>
            </View>

            <View style={styles.contactGrid}>
                <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('call')}>
                    <View style={[styles.contactIconCtx, { backgroundColor: '#EEF2FF' }]}>
                        <Phone size={20} color="#4F46E5" />
                    </View>
                    <Text style={styles.contactLabel}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('sms')}>
                    <View style={[styles.contactIconCtx, { backgroundColor: '#F0FDF4' }]}>
                        <MessageCircle size={20} color="#16A34A" />
                    </View>
                    <Text style={styles.contactLabel}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('whatsapp')}>
                    <View style={[styles.contactIconCtx, { backgroundColor: '#DCFCE7' }]}>
                        <MessageCircle size={20} color="#25D366" />
                    </View>
                    <Text style={styles.contactLabel}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('email')}>
                    <View style={[styles.contactIconCtx, { backgroundColor: '#FEF2F2' }]}>
                        <Mail size={20} color="#DC2626" />
                    </View>
                    <Text style={styles.contactLabel}>Email</Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* Inquiry Form Card */}
          <View style={[styles.card, styles.inquirySection]}>
             <Text style={styles.sectionTitle}>{user ? 'Contact Owner' : 'Guest Inquiry'}</Text>
             
             {user ? (
                 <View>
                     <Text style={styles.inquirySubtitle}>
                         You are logged in as <Text style={{fontWeight: 'bold'}}>{userProfile?.full_name || user.email}</Text>. 
                         Your contact details will be shared with the owner.
                     </Text>
                     <View style={styles.loggedInInfo}>
                         <View style={styles.infoRow}>
                             <Phone size={16} color="#4B5563" />
                             <Text style={styles.infoText}>{userProfile?.phone || 'No phone number linked'}</Text>
                         </View>
                         <View style={styles.infoRow}>
                             <Mail size={16} color="#4B5563" />
                             <Text style={styles.infoText}>{user.email}</Text>
                         </View>
                     </View>
                     
                     <Text style={[styles.label, {marginTop: 16}]}>Message</Text>
                     <TextInput 
                        style={[styles.input, styles.textArea]} 
                        placeholder="Your message..."
                        multiline
                        numberOfLines={3}
                        value={inquiry.message}
                        onChangeText={t => setInquiry({...inquiry, message: t})}
                    />
                    
                    <Button onPress={handleSendInquiry} disabled={sendingInquiry} style={{marginTop: 16}}>
                        {sendingInquiry ? <ActivityIndicator color="#fff" /> : 'Send Interest'}
                    </Button>
                 </View>
             ) : (
                 <View>
                     <Text style={styles.inquirySubtitle}>You can send an inquiry without logging in. Please provide your mobile number so we can contact you.</Text>
                     
                     <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter your name"
                            value={inquiry.name}
                            onChangeText={t => setInquiry({...inquiry, name: t})}
                        />
                     </View>

                     <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone / Mobile No *</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Required for contact"
                            keyboardType="phone-pad"
                            value={inquiry.phone}
                            onChangeText={t => setInquiry({...inquiry, phone: t})}
                        />
                     </View>

                     <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Email address"
                            keyboardType="email-address"
                            value={inquiry.email}
                            onChangeText={t => setInquiry({...inquiry, email: t})}
                        />
                     </View>

                     <View style={styles.formGroup}>
                        <Text style={styles.label}>Expected Move-in Date</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="dd-mm-yyyy"
                            value={inquiry.date}
                            onChangeText={t => setInquiry({...inquiry, date: t})}
                        />
                     </View>

                     <View style={styles.formGroup}>
                        <Text style={styles.label}>Message</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            placeholder="Your message..."
                            multiline
                            numberOfLines={3}
                            value={inquiry.message}
                            onChangeText={t => setInquiry({...inquiry, message: t})}
                        />
                     </View>

                     <Text style={styles.secureNote}>Your details are shared securely only with the property owner.</Text>
                     
                     <Button onPress={handleSendInquiry} disabled={sendingInquiry}>
                        {sendingInquiry ? <ActivityIndicator color="#fff" /> : 'Send Inquiry'}
                     </Button>
                 </View>
             )}
          </View>

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  notFoundIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconButtonBlur: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  priceTagWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  priceTagBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    marginTop: -20, // Overlap image slightly
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerSection: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  genderTag: {
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genderText: {
    color: '#4F46E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  locationText: {
    color: '#4B5563',
    marginLeft: 4,
    fontSize: 14,
  },
  viewMapText: {
    color: '#2563EB',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    width: '48%', // Approx 2 columns
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amenityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  amenityName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  showMoreText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  roomCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  roomDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  roomDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactRoomBtn: {
    width: '100%',
  },
  rulesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  rulesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  pricingGrid: {
    gap: 16,
  },
  pricingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pricingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  inquirySection: {
    // Special styling for inquiry card if needed
  },
  inquirySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  loggedInInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  secureNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  ownerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ownerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  ownerRole: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactItem: {
    alignItems: 'center',
    flex: 1,
  },
  contactIconCtx: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
});
