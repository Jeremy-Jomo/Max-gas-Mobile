import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApi } from '@/lib/api/client';
import { ApiError } from '@/lib/api/http';
import { useCart } from '@/lib/cart/CartProvider';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#FFFFFF',
  text: '#11181C',
  muted: '#6B7280',
  border: '#E5E7EB',
} as const;

type PaymentMethod = 'MPESA' | 'POINTS';

export default function BillingScreen() {
  const router = useRouter();
  const { request } = useApi();
  const { lines, totalKes, clear } = useCart();

  const [method, setMethod] = useState<PaymentMethod>('MPESA');
  const [customerPhone, setCustomerPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const canPay = useMemo(() => lines.length > 0 && /^\+?\d{9,15}$/.test(customerPhone.trim()) && !busy, [busy, customerPhone, lines.length]);

  const placeOrder = async () => {
    setBusy(true);
    try {
      const order = await request<any>({
        path: '/api/orders/',
        method: 'POST',
        body: {
          customer_phone: customerPhone.trim(),
          payment_method: method,
          items: lines.map((l) => ({ product_sku: l.product_sku, qty: l.qty })),
        },
      });

      if (method === 'MPESA') {
        await request<any>({
          path: `/api/orders/${order.id}/pay/mpesa/`,
          method: 'POST',
          body: {},
        });
        Alert.alert('M-Pesa prompt sent', 'Ask the customer to enter their M-Pesa PIN. After payment, complete the order by scanning QR tokens in Pending.');
      } else {
        Alert.alert('Paid with points', 'Payment completed (if points were sufficient). Now scan QR tokens in Pending to complete and award points/commission.');
      }

      clear();
      router.replace('/(agent)/(tabs)/pending' as any);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Checkout failed.';
      Alert.alert('Checkout', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={BRAND.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            Billing
          </ThemedText>
          <ThemedText style={styles.subtitle}>Confirm items and payment method.</ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Order summary</ThemedText>
          {lines.map((l) => (
            <View key={l.product_sku} style={styles.row}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.rowTitle}>{l.name}</ThemedText>
                <ThemedText style={styles.rowMeta}>
                  {l.product_sku} • {l.qty} × KES {l.unit_price_kes}
                </ThemedText>
              </View>
              <ThemedText style={styles.rowAmount}>KES {l.qty * l.unit_price_kes}</ThemedText>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>KES {totalKes}</ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Pay with</ThemedText>
          <View style={styles.pills}>
            <Pill label="M-Pesa" active={method === 'MPESA'} onPress={() => setMethod('MPESA')} />
            <Pill label="Wallet points" active={method === 'POINTS'} onPress={() => setMethod('POINTS')} />
          </View>
          <ThemedText style={styles.hint}>
            {method === 'MPESA'
              ? 'Customer will receive an STK prompt on their phone.'
              : 'Customer points will be redeemed (if sufficient).'}
          </ThemedText>

          <ThemedText style={styles.inputLabel}>Customer phone</ThemedText>
          <TextInput
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="+2547XXXXXXXX"
            placeholderTextColor={BRAND.muted}
            keyboardType="phone-pad"
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity disabled={!canPay} onPress={placeOrder} style={[styles.payBtn, !canPay ? styles.btnDisabled : undefined]}>
            {busy ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.payText}>Confirm & Pay</ThemedText>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active ? styles.pillActive : undefined]}>
      <ThemedText style={[styles.pillText, active ? styles.pillTextActive : undefined]}>{label}</ThemedText>
    </TouchableOpacity>
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowTitle: { color: BRAND.text, fontWeight: '800' },
  rowMeta: { color: BRAND.muted, fontSize: 12, marginTop: 2 },
  rowAmount: { color: BRAND.orange, fontWeight: '900' },
  divider: { height: 1, backgroundColor: BRAND.border, marginTop: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: BRAND.muted, fontWeight: '700' },
  totalValue: { color: BRAND.text, fontWeight: '900', fontSize: 18 },
  pills: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, borderWidth: 1, borderColor: BRAND.border, borderRadius: 999, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  pillActive: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  pillText: { color: BRAND.muted, fontWeight: '900', fontSize: 12 },
  pillTextActive: { color: BRAND.blue },
  hint: { color: BRAND.muted, fontSize: 12, lineHeight: 18 },
  inputLabel: { color: BRAND.muted, fontSize: 12, marginTop: 4 },
  input: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', fontSize: 14 },
  payBtn: { marginTop: 6, backgroundColor: BRAND.orange, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: '900' },
  btnDisabled: { opacity: 0.55 },
});

