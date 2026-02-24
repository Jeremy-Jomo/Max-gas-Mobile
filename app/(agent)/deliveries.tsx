import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApi } from '@/lib/api/client';
import { ApiError } from '@/lib/api/http';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#FFFFFF',
  text: '#11181C',
  muted: '#6B7280',
  border: '#E5E7EB',
} as const;

type DeliveryResponse = {
  range: { start: string; end: string };
  deliveries: {
    id: number;
    created_at: string;
    driver: number;
    driver_name: string;
    driver_phone: string;
    empties_6kg: number;
    empties_13kg: number;
    notes: string;
    items: { id: number; product_sku: string; qty_delivered: number }[];
  }[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function DeliveriesScreen() {
  const router = useRouter();
  const { request } = useApi();

  const [end, setEnd] = useState(isoDate(new Date()));
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return isoDate(d);
  });
  const [data, setData] = useState<DeliveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const path = useMemo(() => `/api/agent/deliveries/?start=${start}&end=${end}`, [end, start]);

  const load = useCallback(async () => {
    setError(null);
    const resp = await request<DeliveryResponse>({ path, method: 'GET' });
    setData(resp);
  }, [path, request]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load deliveries.'));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <ThemedView style={styles.container} lightColor={BRAND.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            Deliveries
          </ThemedText>
          <ThemedText style={styles.subtitle}>Stock received from drivers.</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Date range</ThemedText>
          <View style={styles.filterRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>Start</ThemedText>
              <TextInput value={start} onChangeText={setStart} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={BRAND.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>End</ThemedText>
              <TextInput value={end} onChangeText={setEnd} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={BRAND.muted} />
            </View>
          </View>
          <ThemedText style={styles.hint}>Pull to refresh after changing dates.</ThemedText>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {(data?.deliveries ?? []).map((d) => (
          <View key={d.id} style={styles.deliveryCard}>
            <ThemedText style={styles.deliveryTitle}>Delivery #{d.id}</ThemedText>
            <ThemedText style={styles.deliveryMeta}>
              Driver: {d.driver_name} • {d.driver_phone}
            </ThemedText>
            <ThemedText style={styles.deliveryMeta}>
              Empties collected: 6kg {d.empties_6kg} • 13kg {d.empties_13kg}
            </ThemedText>
            {d.notes ? <ThemedText style={styles.deliveryMeta}>Notes: {d.notes}</ThemedText> : null}
            <ThemedText style={styles.itemsText}>
              {d.items.map((i) => `${i.product_sku} x${i.qty_delivered}`).join('  •  ')}
            </ThemedText>
          </View>
        ))}

        {!data?.deliveries?.length ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>No deliveries in this range</ThemedText>
            <ThemedText style={styles.emptyHint}>If a driver delivered stock, it will appear here.</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  backText: { color: BRAND.text, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 28, color: BRAND.text },
  subtitle: { marginTop: 4, color: BRAND.muted, fontSize: 12 },
  content: { padding: 16, paddingBottom: 26, gap: 14 },
  card: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 18, padding: 14, backgroundColor: '#fff', gap: 10 },
  cardTitle: { fontWeight: '900', color: BRAND.text },
  filterRow: { flexDirection: 'row', gap: 10 },
  label: { color: BRAND.muted, fontSize: 12 },
  input: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', fontSize: 13 },
  hint: { color: BRAND.muted, fontSize: 12, lineHeight: 18 },
  errorBox: { borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', borderRadius: 16, padding: 12 },
  errorText: { color: '#B91C1C' },
  deliveryCard: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 18, padding: 14, backgroundColor: '#fff', gap: 4 },
  deliveryTitle: { color: BRAND.text, fontWeight: '900' },
  deliveryMeta: { color: BRAND.muted, fontSize: 12 },
  itemsText: { color: BRAND.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  emptyCard: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', gap: 6 },
  emptyTitle: { fontWeight: '900', color: BRAND.text },
  emptyHint: { color: BRAND.muted, fontSize: 12, lineHeight: 18 },
});

