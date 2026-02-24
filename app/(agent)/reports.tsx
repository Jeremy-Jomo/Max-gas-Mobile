import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApi } from '@/lib/api/client';
import { ApiError } from '@/lib/api/http';
import type { Order } from '@/lib/api/types';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#FFFFFF',
  text: '#11181C',
  muted: '#6B7280',
  border: '#E5E7EB',
} as const;

type OrdersReportResponse = {
  range: { start: string; end: string };
  summary: {
    total_orders: number;
    paid_orders: number;
    completed_orders: number;
    revenue_paid_kes: number;
    commission_balance_kes: number;
  };
  orders: Order[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ReportsScreen() {
  const router = useRouter();
  const { request } = useApi();

  const [q, setQ] = useState('');
  const [end, setEnd] = useState(isoDate(new Date()));
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return isoDate(d);
  });
  const [data, setData] = useState<OrdersReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const path = useMemo(() => {
    const qp = new URLSearchParams({ start, end });
    if (q.trim()) qp.set('q', q.trim());
    return `/api/orders/reports/?${qp.toString()}`;
  }, [end, q, start]);

  const load = useCallback(async () => {
    setError(null);
    const resp = await request<OrdersReportResponse>({ path, method: 'GET' });
    setData(resp);
  }, [path, request]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load reports.'));
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
            Reports
          </ThemedText>
          <ThemedText style={styles.subtitle}>Your completed orders and totals.</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Filters</ThemedText>
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
          <ThemedText style={styles.label}>Search (order id / customer phone)</ThemedText>
          <TextInput value={q} onChangeText={setQ} style={styles.input} placeholder="+2547... or 123" placeholderTextColor={BRAND.muted} />
          <ThemedText style={styles.hint}>Pull to refresh after changing filters.</ThemedText>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        <View style={styles.kpiRow}>
          <Kpi label="Revenue paid" value={`KES ${data?.summary.revenue_paid_kes ?? 0}`} accent />
          <Kpi label="Completed" value={String(data?.summary.completed_orders ?? 0)} />
        </View>
        <View style={styles.kpiRow}>
          <Kpi label="Paid orders" value={String(data?.summary.paid_orders ?? 0)} />
          <Kpi label="Commission" value={`KES ${data?.summary.commission_balance_kes ?? 0}`} />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Orders
          </ThemedText>
          <ThemedText style={styles.sectionHint}>
            {data?.range.start ?? start} → {data?.range.end ?? end}
          </ThemedText>
        </View>

        {(data?.orders ?? []).map((o) => (
          <View key={o.id} style={styles.orderCard}>
            <ThemedText style={styles.orderTitle}>Order #{o.id}</ThemedText>
            <ThemedText style={styles.orderMeta}>
              {o.payment_status} • {o.release_status} • KES {o.total_amount_kes}
            </ThemedText>
            <ThemedText style={styles.orderMeta}>{o.customer_phone}</ThemedText>
            <ThemedText style={styles.itemsText} numberOfLines={2}>
              {o.items.map((i) => `${i.product_sku} x${i.qty}`).join('  •  ')}
            </ThemedText>
          </View>
        ))}

        {!data?.orders?.length ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>No orders in this range</ThemedText>
            <ThemedText style={styles.emptyHint}>Try a different date range, or pull to refresh.</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.kpi, accent ? styles.kpiAccent : undefined]}>
      <ThemedText style={[styles.kpiLabel, accent ? styles.kpiLabelAccent : undefined]}>{label}</ThemedText>
      <ThemedText style={[styles.kpiValue, accent ? styles.kpiValueAccent : undefined]}>{value}</ThemedText>
    </View>
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
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1, borderWidth: 1, borderColor: BRAND.border, borderRadius: 16, padding: 12, backgroundColor: '#fff', gap: 6 },
  kpiAccent: { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },
  kpiLabel: { color: BRAND.muted, fontSize: 12 },
  kpiLabelAccent: { color: BRAND.orange, fontWeight: '800' },
  kpiValue: { color: BRAND.text, fontWeight: '900', fontSize: 16 },
  kpiValueAccent: { color: BRAND.orange },
  sectionHeader: { marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { color: BRAND.text },
  sectionHint: { color: BRAND.muted, fontSize: 12 },
  orderCard: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 18, padding: 14, backgroundColor: '#fff', gap: 4 },
  orderTitle: { color: BRAND.text, fontWeight: '900' },
  orderMeta: { color: BRAND.muted, fontSize: 12 },
  itemsText: { color: BRAND.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  emptyCard: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', gap: 6 },
  emptyTitle: { fontWeight: '900', color: BRAND.text },
  emptyHint: { color: BRAND.muted, fontSize: 12, lineHeight: 18 },
});

