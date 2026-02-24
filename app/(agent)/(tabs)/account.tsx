import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth/AuthProvider';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#FFFFFF',
  text: '#11181C',
  muted: '#6B7280',
  border: '#E5E7EB',
} as const;

export default function AccountScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  return (
    <ThemedView style={styles.container} lightColor={BRAND.bg}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Account
        </ThemedText>
        <ThemedText style={styles.subtitle}>Your details and quick actions.</ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Agent details</ThemedText>
        <Row label="Name" value={profile?.full_name || '-'} />
        <Row label="Phone" value={profile?.phone || '-'} />
        <Row label="Region" value={profile?.region || '-'} />
        <Row label="Location" value={profile?.location_name || '-'} />
        <Row label="Store no." value={profile?.shop_account_number || '-'} />
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Reports & stock</ThemedText>
        <TouchableOpacity onPress={() => router.push('/(agent)/reports' as any)} style={styles.actionBtn}>
          <ThemedText style={styles.actionText}>My reports</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(agent)/deliveries' as any)} style={styles.actionBtn}>
          <ThemedText style={styles.actionText}>Deliveries received</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Support & security</ThemedText>
        <TouchableOpacity onPress={() => Linking.openURL('tel:+254700000000')} style={styles.actionBtn}>
          <ThemedText style={styles.actionText}>Call us</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/change-password' as any)} style={styles.actionBtn}>
          <ThemedText style={styles.actionText}>Change password</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => logout()} style={styles.dangerBtn}>
          <ThemedText style={styles.dangerText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={styles.rowValue} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 26, gap: 14 },
  header: { marginTop: 10 },
  title: { fontSize: 28, lineHeight: 32, color: BRAND.text },
  subtitle: { marginTop: 6, color: BRAND.muted },
  card: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 18, padding: 14, backgroundColor: '#fff', gap: 10 },
  cardTitle: { fontWeight: '900', color: BRAND.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowLabel: { color: BRAND.muted, fontSize: 12 },
  rowValue: { color: BRAND.text, fontWeight: '800', maxWidth: '60%', textAlign: 'right' },
  actionBtn: { borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  actionText: { color: BRAND.blue, fontWeight: '900' },
  dangerBtn: { borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  dangerText: { color: '#B91C1C', fontWeight: '900' },
});

