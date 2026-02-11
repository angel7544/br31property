import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Dimensions, RefreshControl, Alert, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import PropertyCard from '../../components/PropertyCard';
import { MapPin, Search, Users, Home as HomeIcon, Building2, Bell, Filter, X, User as UserIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeaderBackground } from '../../components/ui/AnimatedHeaderBackground';

const { width } = Dimensions.get('window');

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pg' | 'flat'>('pg');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('All'); // Default city
  const [cities, setCities] = useState<string[]>([]);
  
  // Profile State
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');

  // Modals State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [tempCity, setTempCity] = useState('');

  // Filter State
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    gender: '', // 'Male', 'Female', 'Unisex', 'Family'
  });

  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchUserProfile();
    fetchCities();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProperties();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, searchQuery, cityFilter, filters]); 

  async function fetchCities() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('city');
      
      if (error) throw error;

      if (data) {
        const uniqueCities = Array.from(new Set(data.map(item => item.city).filter(Boolean)));
        setCities(['All', ...uniqueCities]);
      }
    } catch (error) {
      console.log('Error fetching cities:', error);
    }
  }

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || 'User');
        // Check profiles table for avatar
        const { data } = await supabase.from('profiles').select('avatar_url, full_name').eq('id', user.id).single();
        if (data) {
          if (data.avatar_url) setUserAvatar(data.avatar_url);
          if (data.full_name) setUserName(data.full_name);
        } else if (user.user_metadata?.avatar_url) {
          setUserAvatar(user.user_metadata.avatar_url);
        }
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  }

  async function fetchProperties() {
    try {
      setLoading(true);
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by type
      // Expand type list to be more robust
      if (activeTab === 'pg') {
        query = query.in('type', ['PG', 'pg', 'Pg', 'Hostel', 'hostel']);
      } else {
        query = query.in('type', ['Flat', 'flat', 'FLAT', 'Apartment', 'apartment', 'House', 'house']);
      }

      // Filter by City
      const cleanCity = cityFilter?.trim();
      if (cleanCity && cleanCity !== 'All' && cleanCity !== 'Select City') {
        query = query.ilike('city', `%${cleanCity}%`);
      }

      // Filter by Search Query (Name or Address)
      if (searchQuery && searchQuery.trim()) {
        const term = searchQuery.trim();
        // This requires simple OR logic. Supabase JS SDK supports .or()
        // format: column.operator.value,column.operator.value
        query = query.or(`name.ilike.%${term}%,address.ilike.%${term}%`);
      }

      // Advanced Filters
      if (filters.gender) {
        query = query.eq('gender_preference', filters.gender);
      }
      if (filters.priceMin) {
        query = query.gte('price_range_min', parseInt(filters.priceMin));
      }
      if (filters.priceMax) {
        query = query.lte('price_range_max', parseInt(filters.priceMax));
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
    fetchUserProfile();
    fetchCities();
  };


  const applyLocation = () => {
    setCityFilter(tempCity);
    setLocationModalVisible(false);
  };

  const clearFilters = () => {
    setFilters({
        priceMin: '',
        priceMax: '',
        gender: ''
    });
    setFilterModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Section (Fixed at top) */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <AnimatedHeaderBackground />
        <View style={styles.headerTopRow}>
           <View>
             <Text style={styles.greetingText}>Welcome Back 👋</Text>
             <TouchableOpacity 
                style={styles.locationSelector}
                onPress={() => {
                    setTempCity(cityFilter);
                    setLocationModalVisible(true);
                }}
             >
               <MapPin size={14} color="#bfdbfe" />
               <Text style={styles.locationText}>{cityFilter || 'Select City'}</Text>
               <Text style={styles.locationArrow}>▼</Text>
             </TouchableOpacity>
           </View>
           
           {/* Profile Image instead of Notification Bell */}
           <TouchableOpacity onPress={() => router.push('/(tabs)/more')}>
             {userAvatar ? (
               <Image source={{ uri: userAvatar }} style={styles.profileImage} />
             ) : (
                <View style={styles.profilePlaceholder}>
                    <UserIcon size={20} color="#fff" />
                </View>
             )}
           </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput 
              placeholder="Search by locality or landmark..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#94a3b8" />
                </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, (filters.gender || filters.priceMin || filters.priceMax) ? styles.filterButtonActive : null]}
            onPress={() => setFilterModalVisible(true)}
          >
             <Filter size={20} color={(filters.gender || filters.priceMin || filters.priceMax) ? "#fff" : "#2563eb"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
           <TouchableOpacity 
             style={[styles.categoryTab, activeTab === 'pg' && styles.categoryTabActive]}
             onPress={() => setActiveTab('pg')}
           >
              <HomeIcon size={18} color={activeTab === 'pg' ? '#fff' : '#64748b'} />
              <Text style={[styles.categoryTabText, activeTab === 'pg' && styles.categoryTabTextActive]}>PG / Hostel</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.categoryTab, activeTab === 'flat' && styles.categoryTabActive]}
             onPress={() => setActiveTab('flat')}
           >
              <Building2 size={18} color={activeTab === 'flat' ? '#fff' : '#64748b'} />
              <Text style={[styles.categoryTabText, activeTab === 'flat' && styles.categoryTabTextActive]}>Flat / House</Text>
           </TouchableOpacity>
        </View>

        {/* Quick Filters / Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
           {['All', 'Low to High', 'Single Room', 'Female Only'].map((chip, index) => (
             <TouchableOpacity 
                key={index} 
                style={[styles.chip, activeFilter === chip && styles.chipActive]}
                onPress={() => {
                  setActiveFilter(chip);
                  if (chip === 'Low to High') {
                    const sorted = [...properties].sort((a: any, b: any) => (a.price_range_min || 0) - (b.price_range_min || 0));
                    setProperties(sorted);
                  } else if (chip === 'Female Only') {
                    setFilters({...filters, gender: 'Female'});
                  } else if (chip === 'All') {
                     setFilters({ priceMin: '', priceMax: '', gender: '' });
                  }
                }}
             >
               <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>{chip}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        {/* Featured Properties */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Recommended for you</Text>
             <TouchableOpacity onPress={() => router.push('/(tabs)/pgs')}>
               <Text style={styles.seeAllText}>See All</Text>
             </TouchableOpacity>
          </View>

          {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
          ) : properties.length > 0 ? (
              <View>
                  {properties.map((property: any) => (
                      <PropertyCard key={property.id} property={property} />
                  ))}
              </View>
          ) : (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>No properties found in this category.</Text>
               <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                 <Text style={styles.refreshButtonText}>Refresh</Text>
               </TouchableOpacity>
             </View>
          )}
        </View>

        <View style={{ height: 80 }} /> 
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filter Properties</Text>
                    <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                        <X size={24} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Price Range (₹)</Text>
                    <View style={styles.priceInputs}>
                        <TextInput 
                            style={styles.priceInput} 
                            placeholder="Min" 
                            keyboardType="numeric"
                            value={filters.priceMin}
                            onChangeText={(text) => setFilters({...filters, priceMin: text})}
                        />
                        <Text style={styles.dash}>-</Text>
                        <TextInput 
                            style={styles.priceInput} 
                            placeholder="Max" 
                            keyboardType="numeric"
                            value={filters.priceMax}
                            onChangeText={(text) => setFilters({...filters, priceMax: text})}
                        />
                    </View>
                </View>

                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Gender Preference</Text>
                    <View style={styles.genderOptions}>
                        {['Unisex', 'Male', 'Female', 'Family'].map((gender) => (
                            <TouchableOpacity 
                                key={gender}
                                style={[styles.genderOption, filters.gender === gender && styles.genderOptionActive]}
                                onPress={() => setFilters({...filters, gender: filters.gender === gender ? '' : gender})}
                            >
                                <Text style={[styles.genderText, filters.gender === gender && styles.genderTextActive]}>{gender}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                        <Text style={styles.clearButtonText}>Clear All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.applyButton} onPress={() => setFilterModalVisible(false)}>
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: 'auto' }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Location</Text>
                    <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                        <X size={24} color="#0f172a" />
                    </TouchableOpacity>
                </View>
                
                <FlatList
                  data={cities}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.cityOption, 
                        tempCity === item && styles.cityOptionSelected
                      ]}
                      onPress={() => setTempCity(item)}
                    >
                      <MapPin size={18} color={tempCity === item ? '#2563eb' : '#64748b'} />
                      <Text style={[
                        styles.cityOptionText, 
                        tempCity === item && styles.cityOptionTextSelected
                      ]}>{item}</Text>
                      {tempCity === item && (
                        <View style={styles.checkIcon}>
                          <View style={styles.checkInner} />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.cityList}
                />

                <TouchableOpacity style={styles.applyButton} onPress={applyLocation}>
                    <Text style={styles.applyButtonText}>Set Location</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 14,
    color: '#bfdbfe',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  locationArrow: {
    fontSize: 10,
    color: '#bfdbfe',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderWidth: 1,
    borderColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  categoryTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#e2e8f0', // Slightly darker background for the track
    borderRadius: 16,
    padding: 4,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  categoryTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryTabTextActive: {
    color: '#0f172a',
  },
  chipsScroll: {
    marginTop: 16,
  },
  chipsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#64748b',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // City List Styles
  cityList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  cityOptionSelected: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  cityOptionText: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
  },
  cityOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  dash: {
    fontSize: 24,
    color: '#94a3b8',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  genderOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  genderText: {
    color: '#64748b',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 'auto',
    gap: 16,
  },
  clearButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  locationInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 20,
  }
});
