import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Alert, Linking, Platform } from 'react-native';
import { supabase } from '../../../lib/supabase';
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
  FileQuestion
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

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [inquiry, setInquiry] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    message: ''
  });
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  async function fetchProperty() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*') // Removed join to prevent errors if relation is missing
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);
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
    if (!inquiry.name || !inquiry.phone) {
      Alert.alert('Required', 'Please provide Name and Phone number');
      return;
    }
    setSendingInquiry(true);
    // Simulate API call
    setTimeout(() => {
        setSendingInquiry(false);
        Alert.alert('Success', 'Your inquiry has been sent to the owner!');
        setInquiry({ name: '', phone: '', email: '', date: '', message: '' });
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
      <Stack.Screen options={{ title: property.name }} />
      <ScrollView style={styles.container}>
        
        {/* Header Image */}
        <View style={styles.imageContainer}>
             <Image
              source={{ uri: property.images?.[0] || 'https://via.placeholder.com/400x250' }}
              style={styles.image}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <View style={styles.backButtonBlur}>
                <ArrowLeft size={24} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.priceTag}>
                <Text style={styles.priceText}>Starts from ₹{property.price_range_min || property.min_price || property.price_range?.split('-')[0] || 'N/A'}/mo</Text>
            </View>
        </View>

        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.headerSection}>
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

          <View style={styles.divider} />

          {/* Amenities */}
          <View style={styles.section}>
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

          <View style={styles.divider} />

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.description}>{property.description || 'No description provided.'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Available Rooms */}
          {property.rooms && property.rooms.length > 0 && (
              <View style={styles.section}>
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

          {/* Inquiry Form */}
          <View style={[styles.section, styles.inquirySection]}>
             <Text style={styles.sectionTitle}>Guest Inquiry</Text>
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

          {/* Managed By */}
          <View style={styles.managedBySection}>
            <Text style={styles.managedByText}>Managed by</Text>
            <View style={styles.ownerRow}>
                <View style={styles.ownerAvatar}>
                    <Users size={24} color="#fff" />
                </View>
                <View>
                    <Text style={styles.ownerName}>{property.profiles?.full_name || 'Property Owner'}</Text>
                    <Text style={styles.ownerRole}>Host</Text>
                </View>
            </View>
            <Button variant="outline" style={styles.whatsappBtn}>
                <MessageCircle size={18} color="#25D366" style={{ marginRight: 8 }} />
                View Contact / WhatsApp
            </Button>
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
    backgroundColor: '#F9FAFB',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40, // Adjust for status bar if needed, or use SafeAreaView
    left: 16,
    zIndex: 10,
  },
  backButtonBlur: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 20,
  },
  priceTag: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
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
    marginBottom: 4,
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  amenityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  amenityName: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  showMoreText: {
    color: '#2563EB',
    fontWeight: '500',
    marginRight: 4,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  roomDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  roomDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomDetailText: {
    fontSize: 13,
    color: '#4B5563',
  },
  contactRoomBtn: {
    width: '100%',
  },
  inquirySection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  inquirySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  secureNote: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  managedBySection: {
    marginTop: 24,
    marginBottom: 40,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
  },
  managedByText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  ownerRole: {
    fontSize: 13,
    color: '#60A5FA',
  },
  whatsappBtn: {
    backgroundColor: '#fff',
    borderColor: '#25D366',
  }
});
