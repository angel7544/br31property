import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { Button } from '../../../../components/ui/Button';
import { pickImage, uploadImage } from '../../../../lib/imageUtils';
import { Image } from 'react-native';
import { 
  CheckSquare, 
  Square, 
  Camera, 
  Plus, 
  Trash, 
  CheckCircle,
  Home,
  Building2,
  MapPin,
  IndianRupee,
  BedDouble,
  ArrowLeft,
} from 'lucide-react-native';

const AMENITIES_LIST = [
  "Wi-Fi", "AC", "Power Backup", "Room Cleaning", "Parking", 
  "Security", "Geyser", "Laundry", "TV", "Lift", 
  "Gym", "Food/Mess", "CCTV", "Water Purifier", "Refrigerator"
];

export default function EditProperty() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    type: 'PG', // 'PG' | 'Flat'
    name: '',
    gender: 'Co-Living', // 'Male' | 'Female' | 'Co-Living'
    furnishing: '',
    description: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    amenities: [] as string[],
    minPrice: '',
    maxPrice: '',
    deposit: '',
    noticePeriod: '',
    lockInPeriod: '',
    agreementDuration: '',
    availableFrom: '',
    electricityCharges: '',
    maintenance: '',
    rooms: [] as any[],
    images: [] as string[],
  });

  // Room form state
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'Double Sharing',
    rent: '',
    totalBeds: '',
    deposit: '',
    availableBeds: '',
    status: 'Available',
    amenities: '',
  });

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, rooms(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          type: data.type || 'PG',
          name: data.name || '',
          gender: data.gender_preference || 'Co-Living',
          furnishing: data.furnishing || '', // Check if column exists
          description: data.description || '',
          phone: data.contact_number || '',
          email: data.email || '',
          city: data.city || '',
          address: data.address || '',
          amenities: data.amenities || [],
          minPrice: data.price_range_min ? String(data.price_range_min) : '',
          maxPrice: data.price_range_max ? String(data.price_range_max) : '',
          deposit: data.security_deposit || '', // Check if column exists on property
          noticePeriod: '', // These might be in rules or description, skipping for now if not in schema
          lockInPeriod: '',
          agreementDuration: '',
          availableFrom: '',
          electricityCharges: '',
          maintenance: '',
          rooms: data.rooms || [],
          images: data.images || [],
        });
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch property details: ' + error.message);
      router.back();
    } finally {
      setFetching(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
    }
  };

  const addRoom = () => {
    if (!newRoom.name || !newRoom.rent || !newRoom.totalBeds) {
      Alert.alert('Error', 'Please fill basic room details');
      return;
    }
    setFormData({ ...formData, rooms: [...formData.rooms, newRoom] });
    setNewRoom({
      name: '',
      type: 'Double Sharing',
      rent: '',
      totalBeds: '',
      deposit: '',
      availableBeds: '',
      status: 'Available',
      amenities: '',
    });
    setShowAddRoom(false);
  };

  const removeRoom = (index: number) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms.splice(index, 1);
    setFormData({ ...formData, rooms: updatedRooms });
  };

  const handleImagePick = async () => {
    try {
      const assets = await pickImage(true);
      if (!assets) return;

      const newImages = [...formData.images];
      for (const asset of assets) {
        if (asset.uri) {
           const uploadedUrl = await uploadImage(asset.uri, 'property-images');
           if (uploadedUrl) {
             newImages.push(uploadedUrl);
           }
        }
      }
      setFormData({ ...formData, images: newImages });
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({ ...formData, images: updatedImages });
  };

  async function handleSubmit() {
    if (!formData.name || !formData.address || !formData.city) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Address, City)');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.city, // simplified
        description: formData.description,
        price_range_min: parseFloat(formData.minPrice) || 0,
        price_range_max: parseFloat(formData.maxPrice) || 0,
        type: formData.type,
        amenities: formData.amenities,
        images: formData.images,
        contact_number: formData.phone,
        email: formData.email,
        gender_preference: formData.gender,
        // updated_at: new Date(), // Supabase handles this usually or we can send it
      };

      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // TODO: Handle room updates (insert/update/delete)
      // This requires diffing formData.rooms with DB rooms


      Alert.alert('Success', 'Property updated successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  const renderSectionHeader = (title: string, icon: any, sectionId: string) => (
    <View style={styles.sectionHeader}>
       <View style={styles.sectionHeaderLeft}>
         {icon}
         <Text style={styles.sectionTitle}>{title}</Text>
       </View>
    </View>
  );

  if (fetching) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: insets.top }}>
      {/* Custom Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Edit Property</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.form}>
        
        {/* Property Type */}
        <View style={styles.card}>
          {renderSectionHeader("Property Type", <Home size={20} color="#2563eb" />, 'type')}
          <View style={styles.typeContainer}>
            <TouchableOpacity 
              style={[styles.typeOption, formData.type === 'PG' && styles.typeOptionActive]}
              onPress={() => setFormData({...formData, type: 'PG'})}
            >
              <View style={styles.radioRow}>
                 <View style={[styles.radioOuter, formData.type === 'PG' && styles.radioOuterActive]}>
                    {formData.type === 'PG' && <View style={styles.radioInner} />}
                 </View>
                 <Text style={[styles.typeTitle, formData.type === 'PG' && styles.typeTitleActive]}>PG / Hostel</Text>
              </View>
              <Text style={styles.typeDesc}>Shared accommodation</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeOption, formData.type === 'Flat' && styles.typeOptionActive]}
              onPress={() => setFormData({...formData, type: 'Flat'})}
            >
              <View style={styles.radioRow}>
                 <View style={[styles.radioOuter, formData.type === 'Flat' && styles.radioOuterActive]}>
                    {formData.type === 'Flat' && <View style={styles.radioInner} />}
                 </View>
                 <Text style={[styles.typeTitle, formData.type === 'Flat' && styles.typeTitleActive]}>Flat / Apartment</Text>
              </View>
              <Text style={styles.typeDesc}>Entire unit for rent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Details */}
        <View style={styles.card}>
          {renderSectionHeader("Basic Details", <Building2 size={20} color="#2563eb" />, 'basic')}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Property Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(t) => setFormData({...formData, name: t})}
              placeholder="e.g. Sunshine Premium PG"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender Preference *</Text>
            <View style={styles.pillContainer}>
              {['Male', 'Female', 'Co-Living'].map((g) => (
                <TouchableOpacity 
                  key={g}
                  style={[styles.pill, formData.gender === g && styles.pillActive]}
                  onPress={() => setFormData({...formData, gender: g})}
                >
                  <Text style={[styles.pillText, formData.gender === g && styles.pillTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>About this Property</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(t) => setFormData({...formData, description: t})}
              placeholder="Tell us what makes your property unique..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{formData.description.length} chars</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(t) => setFormData({...formData, phone: t})}
                placeholder="Mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(t) => setFormData({...formData, email: t})}
                placeholder="Email address"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
           {renderSectionHeader("Location", <MapPin size={20} color="#2563eb" />, 'location')}
           <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(t) => setFormData({...formData, city: t})}
              placeholder="e.g. Bangalore"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Address *</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={formData.address}
              onChangeText={(t) => setFormData({...formData, address: t})}
              placeholder="House No, Street, Landmark, Area..."
              placeholderTextColor="#94a3b8"
              multiline
            />
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.card}>
           {renderSectionHeader("Amenities", <CheckCircle size={20} color="#2563eb" />, 'amenities')}
           <View style={styles.amenitiesGrid}>
             {AMENITIES_LIST.map((item) => (
               <TouchableOpacity 
                 key={item} 
                 style={styles.amenityItem}
                 onPress={() => toggleAmenity(item)}
               >
                 {formData.amenities.includes(item) ? (
                   <CheckSquare size={20} color="#2563eb" />
                 ) : (
                   <Square size={20} color="#cbd5e1" />
                 )}
                 <Text style={styles.amenityText}>{item}</Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>

        {/* Pricing & Terms */}
        <View style={styles.card}>
           {renderSectionHeader("Pricing & Terms", <IndianRupee size={20} color="#2563eb" />, 'pricing')}
           <View style={styles.row}>
             <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Min Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.minPrice}
                  onChangeText={(t) => setFormData({...formData, minPrice: t})}
                  placeholder="₹ Min"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
             </View>
             <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Max Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxPrice}
                  onChangeText={(t) => setFormData({...formData, maxPrice: t})}
                  placeholder="₹ Max"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
             </View>
           </View>

           <View style={styles.row}>
             <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Security Deposit</Text>
                <TextInput
                  style={styles.input}
                  value={formData.deposit}
                  onChangeText={(t) => setFormData({...formData, deposit: t})}
                  placeholder="e.g. 2 Months"
                  placeholderTextColor="#94a3b8"
                />
             </View>
             <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Notice Period</Text>
                <TextInput
                  style={styles.input}
                  value={formData.noticePeriod}
                  onChangeText={(t) => setFormData({...formData, noticePeriod: t})}
                  placeholder="e.g. 1 Month"
                  placeholderTextColor="#94a3b8"
                />
             </View>
           </View>
           
           <View style={styles.row}>
             <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Available From</Text>
                <TextInput
                  style={styles.input}
                  value={formData.availableFrom}
                  onChangeText={(t) => setFormData({...formData, availableFrom: t})}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor="#94a3b8"
                />
             </View>
           </View>
        </View>

        {/* Room Configuration - PG Only */}
        {formData.type === 'PG' && (
        <View style={styles.card}>
           {renderSectionHeader("Room Configuration", <BedDouble size={20} color="#2563eb" />, 'rooms')}
           
           {formData.rooms.map((room, index) => (
             <View key={index} style={styles.roomItem}>
               <View>
                 <Text style={styles.roomTitle}>{room.name} ({room.type})</Text>
                 <Text style={styles.roomSubtitle}>₹{room.rent}/mo • {room.totalBeds} Beds</Text>
               </View>
               <TouchableOpacity onPress={() => removeRoom(index)}>
                 <Trash size={18} color="#ef4444" />
               </TouchableOpacity>
             </View>
           ))}

           {showAddRoom ? (
             <View style={styles.addRoomForm}>
               <Text style={styles.subHeader}>Add New Room</Text>
               <View style={styles.row}>
                 <View style={[styles.inputGroup, styles.halfWidth]}>
                   <Text style={styles.label}>Room No/Name *</Text>
                   <TextInput
                     style={styles.input}
                     value={newRoom.name}
                     onChangeText={(t) => setNewRoom({...newRoom, name: t})}
                     placeholder="e.g. 101"
                     placeholderTextColor="#94a3b8"
                   />
                 </View>
                 <View style={[styles.inputGroup, styles.halfWidth]}>
                   <Text style={styles.label}>Rent (₹/mo) *</Text>
                   <TextInput
                     style={styles.input}
                     value={newRoom.rent}
                     onChangeText={(t) => setNewRoom({...newRoom, rent: t})}
                     keyboardType="numeric"
                     placeholder="Amount"
                     placeholderTextColor="#94a3b8"
                   />
                 </View>
               </View>
               
               <View style={styles.row}>
                 <View style={[styles.inputGroup, styles.halfWidth]}>
                   <Text style={styles.label}>Total Beds *</Text>
                   <TextInput
                     style={styles.input}
                     value={newRoom.totalBeds}
                     onChangeText={(t) => setNewRoom({...newRoom, totalBeds: t})}
                     keyboardType="numeric"
                     placeholder="Count"
                     placeholderTextColor="#94a3b8"
                   />
                 </View>
                 <View style={[styles.inputGroup, styles.halfWidth]}>
                   <Text style={styles.label}>Available Beds</Text>
                   <TextInput
                     style={styles.input}
                     value={newRoom.availableBeds}
                     onChangeText={(t) => setNewRoom({...newRoom, availableBeds: t})}
                     keyboardType="numeric"
                     placeholder="Count"
                     placeholderTextColor="#94a3b8"
                   />
                 </View>
               </View>

               <View style={styles.row}>
                 <Button onPress={addRoom} size="sm" style={styles.flexButton}>Add Room</Button>
                 <Button onPress={() => setShowAddRoom(false)} variant="outline" size="sm" style={styles.flexButton}>Cancel</Button>
               </View>
             </View>
           ) : (
             <TouchableOpacity style={styles.addRoomButton} onPress={() => setShowAddRoom(true)}>
               <Plus size={20} color="#2563eb" />
               <Text style={styles.addRoomText}>Add New Room</Text>
             </TouchableOpacity>
           )}
        </View>
        )}

        {/* Property Images */}
        <View style={styles.card}>
           {renderSectionHeader("Property Images", <Camera size={20} color="#2563eb" />, 'images')}
           <View style={styles.imageUploadContainer}>
             <TouchableOpacity style={styles.coverImagePlaceholder} onPress={handleImagePick}>
               <Camera size={32} color="#94a3b8" />
               <Text style={styles.uploadText}>Upload Images</Text>
             </TouchableOpacity>
             
             <View style={styles.galleryContainer}>
               {formData.images.map((img, index) => (
                 <View key={index} style={styles.galleryItem}>
                    <Image source={{ uri: img }} style={styles.galleryImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Trash size={12} color="#fff" />
                    </TouchableOpacity>
                 </View>
               ))}
             </View>
           </View>
        </View>

        <Button onPress={handleSubmit} disabled={loading} style={styles.submitButton} size="lg">
          {loading ? <ActivityIndicator color="#fff" /> : "Update Property"}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBtn: {
    padding: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  form: {
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  typeContainer: {
    gap: 12,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  typeOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterActive: {
    borderColor: '#2563eb',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  typeTitleActive: {
    color: '#2563eb',
  },
  typeDesc: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    height: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  pillTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  halfWidth: {
    flex: 1,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  amenityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  roomSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  addRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addRoomText: {
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 8,
  },
  addRoomForm: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  flexButton: {
    flex: 1,
  },
  imageUploadContainer: {
    gap: 12,
  },
  coverImagePlaceholder: {
    height: 160,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 13,
  },
  galleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryItem: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  galleryPlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    marginTop: 10,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
    marginBottom: 20,
  },
});
