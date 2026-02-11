import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, Text, TouchableOpacity, StyleSheet, StatusBar, TextInput, Modal, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { Search, Filter, MapPin, X, Check, SlidersHorizontal } from 'lucide-react-native';
import PropertyCard from '../../components/PropertyCard';
import { AnimatedHeaderBackground } from '../../components/ui/AnimatedHeaderBackground';

export default function PGs() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Filter States
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    gender: ''
  });
  
  // Modals
  const [showCityModal, setShowCityModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    fetchCities();
    fetchProperties();
  }, []);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, filters]);

  async function fetchCities() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('city');
      
      if (error) throw error;

      if (data) {
        const uniqueCities = Array.from(new Set(data.map(item => item.city).filter(Boolean))).sort();
        setCities(['All Cities', ...uniqueCities]);
      }
    } catch (error) {
      console.log('Error fetching cities:', error);
    }
  }

  async function fetchProperties() {
    try {
      setLoading(true);
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      // STRICTLY FILTER FOR PGs/HOSTELS since this is the "PGs" tab
      query = query.in('type', ['PG', 'pg', 'Pg', 'Hostel', 'hostel', 'Co-living']);

      // Filter by City
      if (selectedCity && selectedCity !== 'All Cities') {
        query = query.ilike('city', `%${selectedCity}%`);
      }

      // Filter by Search Query
      if (searchQuery && searchQuery.trim()) {
        const term = searchQuery.trim();
        query = query.or(`name.ilike.%${term}%,address.ilike.%${term}%`);
      }

      // Advanced Filters
      if (filters.gender && filters.gender !== 'Any') {
        query = query.eq('gender_preference', filters.gender);
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
    fetchCities();
    fetchProperties();
  };

  const applyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <AnimatedHeaderBackground />
        <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Explore PGs</Text>
            <TouchableOpacity 
                style={styles.citySelector}
                onPress={() => setShowCityModal(true)}
            >
                <MapPin size={14} color="#bfdbfe" />
                <Text style={styles.citySelectorText} numberOfLines={1}>
                    {selectedCity === 'All Cities' ? 'Select City' : selectedCity}
                </Text>
            </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
                <Search size={20} color="#94a3b8" />
                <TextInput 
                    placeholder="Search by name or locality..."
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
                style={[styles.filterButton, (filters.gender || filters.priceMax) ? styles.filterButtonActive : null]}
                onPress={() => setShowFilterModal(true)}
            >
                <SlidersHorizontal size={20} color={(filters.gender || filters.priceMax) ? "#fff" : "#2563eb"} />
            </TouchableOpacity>
        </View>
      </View>

      {/* Property List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
            data={properties}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => <PropertyCard property={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No PGs found</Text>
                    <Text style={styles.emptySubtitle}>Try adjusting your filters or search query</Text>
                    <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchQuery('');
                            setSelectedCity('All Cities');
                            setFilters({ priceMin: '', priceMax: '', gender: '' });
                        }}
                    >
                        <Text style={styles.clearButtonText}>Clear All Filters</Text>
                    </TouchableOpacity>
                </View>
            }
        />
      )}

      {/* City Modal */}
      <Modal visible={showCityModal} transparent animationType="slide" onRequestClose={() => setShowCityModal(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select City</Text>
                    <TouchableOpacity onPress={() => setShowCityModal(false)}>
                        <X size={24} color="#0f172a" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={cities}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.cityOption, selectedCity === item && styles.cityOptionSelected]}
                            onPress={() => {
                                setSelectedCity(item);
                                setShowCityModal(false);
                            }}
                        >
                            <Text style={[styles.cityOptionText, selectedCity === item && styles.cityOptionTextSelected]}>{item}</Text>
                            {selectedCity === item && <Check size={18} color="#2563eb" />}
                        </TouchableOpacity>
                    )}
                    style={styles.cityList}
                />
            </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filters</Text>
                    <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                        <X size={24} color="#0f172a" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Gender</Text>
                    <View style={styles.chipRow}>
                        {['Any', 'Male', 'Female', 'Unisex'].map((g) => (
                            <TouchableOpacity 
                                key={g}
                                style={[styles.chip, filters.gender === g && styles.chipActive]}
                                onPress={() => setFilters({...filters, gender: g === 'Any' ? '' : g})}
                            >
                                <Text style={[styles.chipText, filters.gender === g && styles.chipTextActive]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Max Price (₹)</Text>
                    <View style={styles.chipRow}>
                        {['5000', '10000', '15000', '20000'].map((p) => (
                            <TouchableOpacity 
                                key={p}
                                style={[styles.chip, filters.priceMax === p && styles.chipActive]}
                                onPress={() => setFilters({...filters, priceMax: filters.priceMax === p ? '' : p})}
                            >
                                <Text style={[styles.chipText, filters.priceMax === p && styles.chipTextActive]}>₹{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={() => setShowFilterModal(false)}
                >
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  citySelectorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 100,
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
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
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
    borderWidth: 2,
    borderColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Space for tab bar
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cityList: {
    maxHeight: 300,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cityOptionSelected: {
    backgroundColor: '#eff6ff',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  cityOptionText: {
    fontSize: 16,
    color: '#334155',
  },
  cityOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#64748b',
  },
  chipTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
