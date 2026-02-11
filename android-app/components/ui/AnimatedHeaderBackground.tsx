import { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, withDelay } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Abstract Background Blob Component
const Blob = ({ color, size, top, left, delay = 0, duration = 4000 }: any) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-20, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
    
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.1, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.6,
        },
        animatedStyle,
      ]}
    />
  );
};

export const AnimatedHeaderBackground = ({ 
  primaryColor = '#3B82F6', 
  secondaryColor = '#60A5FA', 
  tertiaryColor = '#1D4ED8',
  overlayColor = 'rgba(37, 99, 235, 0.3)'
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Blob color={primaryColor} size={200} top={-50} left={-50} delay={0} />
        <Blob color={secondaryColor} size={150} top={20} left={width - 100} delay={1000} />
        <Blob color={tertiaryColor} size={180} top={100} left={50} delay={2000} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
    </View>
  );
};
