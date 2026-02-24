import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { QuantityStepper } from '@/components/quantity-stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApi } from '@/lib/api/client';
import type { AgentDashboardResponse } from '@/lib/api/types';
import { ApiError } from '@/lib/api/http';
import { useCart } from '@/lib/cart/CartProvider';
import { useAuth } from '@/lib/auth/AuthProvider';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#FFFFFF',
  text: '#11181C',
  muted: '#6B7280',
  border: '#E5E7EB',
  card: '#FFFFFF',
} as const;

function isRefill(sku: string) {
  return sku.toUpperCase().includes('REFILL');
}

function sortSku(a: string, b: string) {
  const a13 = a.startsWith('13') ? 1 : 0;
  const b13 = b.startsWith('13') ? 1 : 0;
  return a13 - b13;
}

export default function HomeScreen() {
  const { request } = useApi();
  const { profile } = useAuth();
  const router = useRouter();
  const { addToCart, totalItems } = useCart();

  const [data, setData] = useState<AgentDashboardResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const resp = await request<AgentDashboardResponse>({ path: '/api/agent/dashboard/', method: 'GET' });
    setData(resp);
  }, [request]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load stock.'));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const products = useMemo(() => data?.stock ?? [], [data]);

  const refill = useMemo(
    () => products.filter((p) => isRefill(p.sku)).sort((a, b) => sortSku(a.sku, b.sku)),
    [products]
  );
  const outright = useMemo(
    () => products.filter((p) => !isRefill(p.sku)).sort((a, b) => sortSku(a.sku, b.sku)),
    [products]
  );

  return (
    <ThemedView style={styles.container} lightColor={BRAND.bg}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.topHeader}>
          <View style={styles.brandLeft}>
            <View style={styles.logo} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.welcome}>Welcome</ThemedText>
              <ThemedText style={styles.agentName} numberOfLines={1}>
                {profile?.full_name || profile?.phone || 'Agent'}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push('/(agent)/cart' as any)} style={styles.cartBtn}>
            <MaterialIcons name="shopping-cart" size={22} color={BRAND.text} />
            {totalItems > 0 ? (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{totalItems}</ThemedText>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {!data ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : null}

        <Section title="Refill cylinders" subtitle="Exchange (refill) — scan token after payment">
          <View style={styles.grid}>
            {refill.map((p) => (
              <ProductCard
                key={p.sku}
                sku={p.sku}
                name={p.name}
                priceKes={p.price_kes}
                available={p.available}
                onAdd={(qty) => addToCart({ product_sku: p.sku, name: p.name, unit_price_kes: p.price_kes, available: p.available }, qty)}
                onOrderNow={() => {
                  addToCart({ product_sku: p.sku, name: p.name, unit_price_kes: p.price_kes, available: p.available }, 1);
                  router.push('/(agent)/cart' as any);
                }}
              />
            ))}
          </View>
        </Section>

        <Section title="Outright cylinders" subtitle="Buy cylinder outright">
          <View style={styles.grid}>
            {outright.map((p) => (
              <ProductCard
                key={p.sku}
                sku={p.sku}
                name={p.name}
                priceKes={p.price_kes}
                available={p.available}
                onAdd={(qty) => addToCart({ product_sku: p.sku, name: p.name, unit_price_kes: p.price_kes, available: p.available }, qty)}
                onOrderNow={() => {
                  addToCart({ product_sku: p.sku, name: p.name, unit_price_kes: p.price_kes, available: p.available }, 1);
                  router.push('/(agent)/cart' as any);
                }}
              />
            ))}
          </View>
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHead}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {title}
        </ThemedText>
        <ThemedText style={styles.sectionSubtitle}>{subtitle}</ThemedText>
      </View>
      {children}
    </View>
  );
}

function ProductCard({
  sku,
  name,
  priceKes,
  available,
  onAdd,
  onOrderNow,
}: {
  sku: string;
  name: string;
  priceKes: number;
  available: number;
  onAdd: (qty: number) => void;
  onOrderNow: () => void;
}) {
  const [qty, setQty] = useState(1);
  const out = available <= 0;

  return (
    <View style={[styles.card, out ? styles.cardDisabled : undefined]}>
      <View style={styles.cardTop}>
        <View style={styles.iconBubble}>
          <MaterialIcons name="propane-tank" size={28} color={BRAND.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.cardName} numberOfLines={1}>
            {name}
          </ThemedText>
          <ThemedText style={styles.cardSku}>{sku}</ThemedText>
        </View>
      </View>

      <View style={styles.cardMid}>
        <View>
          <ThemedText style={styles.priceLabel}>Price</ThemedText>
          <ThemedText style={styles.price}>KES {priceKes}</ThemedText>
        </View>
        <View style={styles.availPill}>
          <ThemedText style={styles.availText}>{out ? 'Out of stock' : `${available} available`}</ThemedText>
        </View>
      </View>

      <View style={styles.qtyRow}>
        <ThemedText style={styles.qtyLabel}>Qty</ThemedText>
        <QuantityStepper value={qty} min={1} max={Math.max(1, available)} onChange={setQty} />
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          disabled={out}
          onPress={() => onAdd(qty)}
          style={[styles.btnOutline, out ? styles.btnDisabled : undefined]}>
          <ThemedText style={styles.btnOutlineText}>Add to cart</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity disabled={out} onPress={onOrderNow} style={[styles.btnPrimary, out ? styles.btnDisabled : undefined]}>
          <ThemedText style={styles.btnPrimaryText}>Order now</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 26, gap: 18 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  brandLeft: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1, paddingRight: 10 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  welcome: { color: BRAND.muted, fontSize: 12 },
  agentName: { color: BRAND.text, fontWeight: '900', fontSize: 16, marginTop: 2 },
  cartBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  errorBox: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 12,
  },
  errorText: { color: '#B91C1C' },
  loading: { paddingVertical: 10 },
  sectionHead: { gap: 4 },
  sectionTitle: { color: BRAND.text },
  sectionSubtitle: { color: BRAND.muted, fontSize: 12, lineHeight: 18 },
  grid: { gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  cardDisabled: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { color: BRAND.text, fontWeight: '900' },
  cardSku: { color: BRAND.muted, fontSize: 11, marginTop: 2 },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { color: BRAND.muted, fontSize: 11 },
  price: { color: BRAND.orange, fontWeight: '900', fontSize: 18, marginTop: 2 },
  availPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  availText: { color: BRAND.blue, fontWeight: '800', fontSize: 12 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyLabel: { color: BRAND.muted, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnOutlineText: { color: BRAND.text, fontWeight: '900' },
  btnPrimary: {
    flex: 1,
    backgroundColor: BRAND.orange,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '900' },
  btnDisabled: { opacity: 0.5 },
});

