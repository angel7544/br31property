import { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.timing(opacity, { toValue: 0, duration: 400, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (e) {
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image source={require('../assets/splash-icon.png')} style={{ width: Dimensions.get('window').width * 0.45, height: Dimensions.get('window').width * 0.45, resizeMode: 'contain' }} />
      </Animated.View>
    </View>
  );
}
