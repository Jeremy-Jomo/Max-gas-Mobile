import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { QuantityStepper } from '@/components/quantity-stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/lib/cart/CartProvider';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#FFFFFF',
  text: '#11181C',
  muted: '#6B7280',
  border: '#E5E7EB',
} as const;

export default function CartScreen() {
  const router = useRouter();
  const { lines, setQty, totalKes, clear } = useCart();

  return (
    <ThemedView style={styles.container} lightColor={BRAND.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            Cart
          </ThemedText>
          <ThemedText style={styles.subtitle}>Adjust quantities, then checkout.</ThemedText>
        </View>
        <TouchableOpacity disabled={!lines.length} onPress={clear} style={[styles.clearBtn, !lines.length ? styles.btnDisabled : undefined]}>
          <ThemedText style={styles.clearText}>Clear</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!lines.length ? (
          <View style={styles.empty}>
            <ThemedText style={styles.emptyTitle}>Your cart is empty</ThemedText>
            <ThemedText style={styles.emptyHint}>Add refill/outright cylinders from the Home tab.</ThemedText>
            <TouchableOpacity onPress={() => router.replace('/(agent)/(tabs)/home' as any)} style={styles.primaryBtn}>
              <ThemedText style={styles.primaryText}>Go to Home</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          lines.map((l) => (
            <View key={l.product_sku} style={styles.lineCard}>
              <View style={styles.lineTop}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.lineName}>{l.name}</ThemedText>
                  <ThemedText style={styles.lineMeta}>
                    {l.product_sku} • KES {l.unit_price_kes} each
                  </ThemedText>
                  <ThemedText style={styles.lineMeta}>{l.available} available</ThemedText>
                </View>
                <QuantityStepper value={l.qty} min={1} max={Math.max(1, l.available)} onChange={(v) => setQty(l.product_sku, v)} />
              </View>
              <View style={styles.lineBottom}>
                <ThemedText style={styles.lineTotalLabel}>Line total</ThemedText>
                <ThemedText style={styles.lineTotal}>KES {l.qty * l.unit_price_kes}</ThemedText>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.footerLabel}>Order total</ThemedText>
          <ThemedText style={styles.footerTotal}>KES {totalKes}</ThemedText>
        </View>
        <TouchableOpacity
          disabled={!lines.length}
          onPress={() => router.push('/(agent)/billing' as any)}
          style={[styles.checkoutBtn, !lines.length ? styles.btnDisabled : undefined]}>
          <ThemedText style={styles.checkoutText}>Checkout</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  backText: { color: BRAND.text, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 28, color: BRAND.text },
  subtitle: { marginTop: 4, color: BRAND.muted, fontSize: 12 },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearText: { color: '#B91C1C', fontWeight: '800' },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  empty: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  emptyTitle: { fontWeight: '900', color: BRAND.text, fontSize: 16 },
  emptyHint: { color: BRAND.muted, fontSize: 12, lineHeight: 18 },
  primaryBtn: { marginTop: 6, backgroundColor: BRAND.orange, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '900' },
  lineCard: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 18, padding: 14, backgroundColor: '#fff', gap: 10 },
  lineTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  lineName: { fontWeight: '900', color: BRAND.text },
  lineMeta: { color: BRAND.muted, fontSize: 12, marginTop: 2 },
  lineBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineTotalLabel: { color: BRAND.muted, fontWeight: '700', fontSize: 12 },
  lineTotal: { color: BRAND.orange, fontWeight: '900' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLabel: { color: BRAND.muted, fontSize: 12 },
  footerTotal: { color: BRAND.text, fontWeight: '900', fontSize: 20, marginTop: 2 },
  checkoutBtn: { backgroundColor: BRAND.blue, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16 },
  checkoutText: { color: '#fff', fontWeight: '900' },
  btnDisabled: { opacity: 0.55 },
});

