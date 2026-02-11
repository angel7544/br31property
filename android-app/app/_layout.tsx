import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View } from 'react-native';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '../components/ui/LoadingScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS === 'android') {
          // Enable edge-to-edge on Android by making the navigation bar transparent
          await NavigationBar.setPositionAsync('absolute');
          await NavigationBar.setBackgroundColorAsync('transparent');
          await NavigationBar.setButtonStyleAsync('dark'); // Dark icons for light background
        }
        
        // Artificial delay for the splash screen animation to be visible
        // In a real app, you might load fonts or make API calls here
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        // Hide the native splash screen immediately
        await SplashScreen.hideAsync();
        
        // Keep our custom splash screen for a bit longer if needed, 
        // or let it fade out via its own internal logic if we passed a prop,
        // but here we'll just toggle the state after a brief moment to ensure smooth transition
        setTimeout(() => {
            setShowSplash(false);
        }, 500);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ 
          headerShown: true,
          headerBackTitleVisible: true,
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
        {showSplash && <LoadingScreen visible={true} />}
      </View>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
    </SafeAreaProvider>
  );
}
