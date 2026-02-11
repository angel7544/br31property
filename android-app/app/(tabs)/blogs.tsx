import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeaderBackground } from '../../components/ui/AnimatedHeaderBackground';

export default function Blogs() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <AnimatedHeaderBackground />
        <Text style={styles.headerTitle}>Community Blog</Text>
        <Text style={styles.headerSubtitle}>
            Latest updates, guides, and stories from PG Dekho.
        </Text>
      </View>
      
      <View style={styles.emptyState}>
        <View style={styles.iconContainer}>
            <FileText size={40} color="#cbd5e1" />
        </View>
        <Text style={styles.emptyTitle}>No stories yet</Text>
        <Text style={styles.emptyText}>
            Check back soon for updates from PG Dekho.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  iconContainer: {
    backgroundColor: '#f1f5f9',
    padding: 24,
    borderRadius: 999,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyText: {
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
