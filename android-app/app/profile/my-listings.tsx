import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { Plus, Home, MapPin, Edit2, Eye, MoreHorizontal, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function MyListingsScreen() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Home size={24} color="#9CA3AF" />
            </View>
          )}
          <View style={[styles.statusTag, item.status === 'Active' ? styles.statusActive : styles.statusDraft]}>
            <Text style={[styles.statusText, item.status === 'Active' ? styles.statusTextActive : styles.statusTextDraft]}>
                {item.status || 'Draft'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
            {/* Optional: Menu for delete/etc */}
          </View>
          
          <View style={styles.locationRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address}, {item.city}
            </Text>
          </View>

          <View style={styles.priceRow}>
             <Text style={styles.price}>₹{item.price_range_min || item.min_price || 'N/A'}<Text style={styles.period}>/mo</Text></Text>
             <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{item.type}</Text>
             </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actionsFooter}>
        <Link href={`/property/${item.id}`} asChild>
          <TouchableOpacity style={styles.actionButton}>
            <Eye size={18} color="#4B5563" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
        </Link>
        
        <View style={styles.verticalDivider} />
        
        <Link href={`/property/edit/${item.id}`} asChild>
          <TouchableOpacity style={styles.actionButton}>
            <Edit2 size={18} color="#2563EB" />
            <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'My Listings',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerRight: () => (
            <Link href="/(tabs)/list-pg" asChild>
              <TouchableOpacity style={styles.headerButton}>
                <Plus size={24} color="#2563EB" />
              </TouchableOpacity>
            </Link>
          )
        }} 
      />

      {properties.length > 0 ? (
        <FlatList
          data={properties}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Home size={40} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Properties Listed</Text>
          <Text style={styles.emptySubtitle}>
            You haven't listed any properties yet. Become a host and start earning!
          </Text>
          <Link href="/(tabs)/list-pg" asChild>
            <TouchableOpacity style={styles.createButton}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>List Your Property</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerButton: {
    padding: 8,
    marginRight: -8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusDraft: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextDraft: {
    color: '#4B5563',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  period: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  typeTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  actionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  editButtonText: {
    color: '#2563EB',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
