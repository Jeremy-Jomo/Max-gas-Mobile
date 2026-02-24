import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApi } from '@/lib/api/client';
import { ApiError } from '@/lib/api/http';
import type { Order } from '@/lib/api/types';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  bg: '#000000',
  text: '#FFFFFF',
  muted: '#D1D5DB',
} as const;

function extractUuid(text: string): string | null {
  const m = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return m ? m[0] : null;
}

export default function ScanScreen() {
  const { request } = useApi();
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = Number(params.orderId ?? 0);

  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [scannedOnce, setScannedOnce] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  const canScan = useMemo(() => !busy && !scannedOnce && orderId > 0, [busy, scannedOnce, orderId]);

  const release = useCallback(
    async (token: string) => {
      if (!orderId) return;
      setBusy(true);
      try {
        const updated = await request<Order>({
          path: '/api/orders/release/scan/',
          method: 'POST',
          body: { order_id: orderId, token_code: token },
        });
        setLatestOrder(updated);

        if (updated.release_status === 'COMPLETED') {
          Alert.alert('Success', 'Order completed. Points and commission have been awarded.');
          router.replace('/(agent)/(tabs)/pending' as any);
        } else {
          Alert.alert('Scanned', 'Token accepted. Scan the next cylinder token to complete the order.');
          setScannedOnce(false);
        }
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Release failed.';
        Alert.alert('Release failed', msg);
        setScannedOnce(false);
      } finally {
        setBusy(false);
      }
    },
    [orderId, request, router]
  );

  if (!permission) {
    return (
      <ThemedView style={styles.center} darkColor="#000" lightColor="#000">
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center} darkColor="#000" lightColor="#000">
        <ThemedText style={styles.permissionTitle}>Camera permission needed</ThemedText>
        <ThemedText style={styles.permissionText}>Allow camera access to scan the cylinder QR token.</ThemedText>
        <TouchableOpacity onPress={() => requestPermission()} style={styles.permissionBtn}>
          <ThemedText style={styles.permissionBtnText}>Grant permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} darkColor="#000" lightColor="#000">
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(ev) => {
          if (!canScan) return;
          const token = extractUuid(ev.data ?? '');
          if (!token) {
            Alert.alert('Invalid QR', 'Could not find a token code in this QR. Try again.');
            return;
          }
          setScannedOnce(true);
          release(token);
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>Back</ThemedText>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>Scan token</ThemedText>
            <ThemedText style={styles.subtitle}>
              Order #{orderId}
            </ThemedText>
            {latestOrder ? (
              <ThemedText style={styles.subtitle}>
                Remaining:{' '}
                {latestOrder.items.reduce((sum, it) => sum + Math.max(0, it.qty - it.released_qty), 0)}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <View style={styles.frame} />

        <View style={styles.bottomCard}>
          <ThemedText style={styles.bottomTitle}>Trouble scanning?</ThemedText>
          <ThemedText style={styles.bottomHint}>Paste/enter the token code (UUID) manually.</ThemedText>
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            placeholderTextColor={BRAND.muted}
            autoCapitalize="none"
            style={styles.input}
          />
          <TouchableOpacity
            disabled={busy || !extractUuid(manualCode)}
            onPress={() => {
              const token = extractUuid(manualCode);
              if (token) release(token);
            }}
            style={[styles.button, busy || !extractUuid(manualCode) ? styles.buttonDisabled : undefined]}>
            {busy ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Release</ThemedText>}
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, padding: 16, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10 },
  backBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backText: { color: BRAND.text, fontWeight: '800' },
  title: { color: BRAND.text, fontWeight: '900', fontSize: 18 },
  subtitle: { color: BRAND.muted, fontSize: 12, marginTop: 2 },
  frame: {
    alignSelf: 'center',
    width: '82%',
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  bottomCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  bottomTitle: { color: BRAND.text, fontWeight: '900' },
  bottomHint: { color: BRAND.muted, fontSize: 12, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: BRAND.text,
    backgroundColor: 'rgba(0,0,0,0.25)',
    fontSize: 13,
  },
  button: {
    backgroundColor: BRAND.blue,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionTitle: { color: BRAND.text, fontWeight: '900', fontSize: 18 },
  permissionText: { color: BRAND.muted, marginTop: 8, textAlign: 'center', lineHeight: 18 },
  permissionBtn: {
    marginTop: 14,
    backgroundColor: BRAND.orange,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  permissionBtnText: { color: '#fff', fontWeight: '900' },
});

