import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Heart } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PropertyCardProps {
  property: any;
}

const { width } = Dimensions.get('window');
const CARD_MARGIN = 20; // Margin/Padding of parent container
const CARD_WIDTH = width - (CARD_MARGIN * 2);

export default function PropertyCard({ property }: PropertyCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, []);

  const checkWishlistStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('property_id', property.id)
        .single();
        
      if (data) setIsWishlisted(true);
    } catch (error) {
      // Ignore error if not found or not logged in
    }
  };

  const toggleWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/(auth)/login');
        return;
      }

      if (isWishlisted) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', property.id);
          
        if (!error) setIsWishlisted(false);
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id, property_id: property.id });
          
        if (!error) setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const images = property.images && property.images.length > 0 
    ? property.images 
    : [property.image_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'];

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  const handlePress = () => {
    router.push(`/property/${property.id}`);
  };

  return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View>
            <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <Pressable onPress={handlePress}>
                        <Image
                            source={{ uri: item }}
                            style={{ width: CARD_WIDTH, height: 200, backgroundColor: '#f1f5f9' }}
                            resizeMode="cover"
                        />
                    </Pressable>
                )}
            />
            
            {/* Pagination Dots */}
            {images.length > 1 && (
                <View style={styles.pagination}>
                    {images.map((_: any, i: number) => (
                        <View 
                            key={i} 
                            style={[
                                styles.dot, 
                                i === activeIndex ? styles.activeDot : styles.inactiveDot
                            ]} 
                        />
                    ))}
                </View>
            )}

            {/* Type Badge */}
            <View style={styles.typeBadge}>
                 <Text style={styles.typeText}>{property.type || 'PG'}</Text>
            </View>

            {/* Wishlist Button */}
            <TouchableOpacity 
              style={styles.wishlistButton} 
              onPress={toggleWishlist}
              activeOpacity={0.8}
            >
              <Heart 
                size={20} 
                color={isWishlisted ? "#ef4444" : "#1f2937"} 
                fill={isWishlisted ? "#ef4444" : "rgba(0,0,0,0.3)"} 
              />
            </TouchableOpacity>
          </View>
          
          <Pressable onPress={handlePress}>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{property.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>4.5 ★</Text>
                    </View>
                </View>
                
                <View style={styles.locationContainer}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.locationText} numberOfLines={1}>
                    {property.address || property.city}, {property.city}
                </Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.footerRow}>
                    <View>
                        <Text style={styles.priceLabel}>Starts from</Text>
                        <Text style={styles.price}>₹{property.price_range_min || property.min_price || property.price_range?.split('-')[0] || 'N/A'}<Text style={styles.priceUnit}>/mo</Text></Text>
                    </View>
                    <View style={styles.amenitiesRow}>
                        {property.amenities?.slice(0, 3).map((amenity: string, index: number) => (
                            <View key={index} style={styles.amenityDot} />
                        ))}
                        {property.amenities?.length > 3 && <Text style={styles.moreAmenities}>+{property.amenities.length - 3}</Text>}
                    </View>
                </View>
            </View>
          </Pressable>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 16,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    backgroundColor: '#ecfccb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4d7c0f',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  amenitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amenityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  moreAmenities: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 2,
  },
});