import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, BedDouble, PlusCircle, FileText, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb', // blue-600
        tabBarInactiveTintColor: '#64748b', // slate-500
        tabBarBackground: () => (
            <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="systemThinMaterialLight" />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom:  + insets.bottom,
          left: 15,
          right: 15,
          elevation: 5,
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: 25,
          height: 90,
          paddingBottom: 0,
          paddingTop: 20,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
          shadowColor: '#0404047f',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          overflow: 'hidden', // Required for BlurView to respect border radius
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '400',
          marginBottom:2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="pgs"
        options={{
          title: 'PGs',
          tabBarIcon: ({ color }) => <BedDouble color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="list-pg"
        options={{
          title: 'List',
          tabBarIcon: ({ color }) => <PlusCircle color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="blogs"
        options={{
          title: 'Blogs',
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="property/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="property/edit/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
