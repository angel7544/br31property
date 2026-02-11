import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Stack, router } from 'expo-router';
import { Calendar, MapPin, ArrowRight, MessageSquare, Clock } from 'lucide-react-native';

export default function ContactedOwners() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  async function fetchEnquiries() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const { data, error } = await supabase
        .from('enquiries')
        .select(`
          *,
          properties (
            id,
            name,
            address,
            city,
            images
          )
        `)
        .eq('email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Image 
                source={{ uri: item.properties?.images?.[0] || 'https://via.placeholder.com/150' }} 
                style={styles.image}
            />
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.propertyName} numberOfLines={1}>{item.properties?.name || 'Unknown Property'}</Text>
                    <View style={[
                        styles.statusBadge, 
                        item.status === 'New' ? styles.statusNew : 
                        item.status === 'Responded' ? styles.statusResponded : styles.statusDefault
                    ]}>
                        <Text style={[
                            styles.statusText,
                            item.status === 'New' ? styles.textNew : 
                            item.status === 'Responded' ? styles.textResponded : styles.textDefault
                        ]}>{item.status}</Text>
                    </View>
                </View>
                
                <View style={styles.locationRow}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {item.properties?.address}, {item.properties?.city}
                    </Text>
                </View>

                <View style={styles.dateRow}>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.dateText}>Enquired on {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Move-in Date</Text>
                <Text style={styles.detailValue}>{item.move_in_date || 'Not specified'}</Text>
            </View>
            <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => router.push(`/property/${item.properties?.id}`)}
            >
                <Text style={styles.viewButtonText}>View Property</Text>
                <ArrowRight size={16} color="#2563EB" />
            </TouchableOpacity>
        </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Contacted Owners', headerBackTitle: 'Back', headerShadowVisible: false, headerStyle: { backgroundColor: '#F9FAFB' } }} />
      <FlatList
        data={enquiries}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.iconContainer}>
                <MessageSquare size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No enquiries found</Text>
            <Text style={styles.emptySubtitle}>You haven't contacted any property owners yet.</Text>
            <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/pgs')}
            >
                <Text style={styles.browseButtonText}>Browse Properties</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusNew: {
    backgroundColor: '#EFF6FF',
  },
  statusResponded: {
    backgroundColor: '#ECFDF5',
  },
  statusDefault: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  textNew: {
    color: '#2563EB',
  },
  textResponded: {
    color: '#059669',
  },
  textDefault: {
    color: '#4B5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});
