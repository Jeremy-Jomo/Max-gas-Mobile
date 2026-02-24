import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useApi } from '@/lib/api/client';
import type { Order } from '@/lib/api/types';
import { ApiError } from '@/lib/api/http';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#FFFFFF',
  text: '#11181C',
  muted: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
} as const;

export default function PendingScreen() {
  const { request } = useApi();
  const router = useRouter();
  const [items, setItems] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const resp = await request<Order[]>({ path: '/api/orders/pending-release/', method: 'GET' });
    setItems(resp ?? []);
  }, [request]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load pending releases.'));
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Pending Releases
          </ThemedText>
          <ThemedText style={styles.subtitle}>Paid orders waiting for QR token scans to complete.</ThemedText>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {!items.length ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>No pending releases</ThemedText>
            <ThemedText style={styles.emptyHint}>
              After a customer pays, come here and scan the cylinder token QR codes to complete the order.
            </ThemedText>
          </View>
        ) : (
          items.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onComplete={() => router.push({ pathname: '/(agent)/scan' as any, params: { orderId: String(o.id) } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderCard({ order, onComplete }: { order: Order; onComplete: () => void }) {
  const remaining = useMemo(
    () => order.items.reduce((sum, it) => sum + Math.max(0, it.qty - it.released_qty), 0),
    [order.items]
  );
  const totalQty = useMemo(() => order.items.reduce((sum, it) => sum + it.qty, 0), [order.items]);
  const progress = totalQty > 0 ? `${totalQty - remaining}/${totalQty}` : '0/0';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.cardTitle}>Order #{order.id}</ThemedText>
          <ThemedText style={styles.cardMeta}>
            {order.payment_method} • KES {order.total_amount_kes} • {order.customer_phone}
          </ThemedText>
          <ThemedText style={styles.cardMeta}>Progress: {progress} scanned</ThemedText>
          <ThemedText style={styles.cardItems} numberOfLines={2}>
            {order.items.map((i) => `${i.product_sku} x${i.qty}`).join('  •  ')}
          </ThemedText>
        </View>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>PAID</ThemedText>
        </View>
      </View>

      <TouchableOpacity onPress={onComplete} style={styles.button}>
        <ThemedText style={styles.buttonText}>Complete order</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.white },
  content: { padding: 16, paddingBottom: 30, gap: 14 },
  header: { marginTop: 10 },
  title: { fontSize: 28, lineHeight: 32, color: BRAND.text },
  subtitle: { marginTop: 6, color: BRAND.muted },
  errorBox: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
  },
  errorText: { color: '#B91C1C' },
  emptyCard: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    gap: 6,
  },
  emptyTitle: { fontWeight: '800', color: BRAND.text },
  emptyHint: { color: BRAND.muted, lineHeight: 18, fontSize: 12 },
  card: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontWeight: '800', color: BRAND.text },
  cardMeta: { color: BRAND.muted, fontSize: 12, marginTop: 2 },
  cardItems: { color: BRAND.muted, fontSize: 12, marginTop: 8, lineHeight: 18 },
  badge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: '#166534', fontWeight: '800', fontSize: 12 },
  button: {
    backgroundColor: BRAND.blue,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '800' },
});
