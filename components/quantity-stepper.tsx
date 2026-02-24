import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const BRAND = {
  orange: '#F97316',
  blue: '#1D4ED8',
  border: '#E5E7EB',
  text: '#11181C',
  muted: '#6B7280',
} as const;

export function QuantityStepper({
  value,
  min = 0,
  max = 999,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  const decDisabled = value <= min;
  const incDisabled = value >= max;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={decDisabled}
        style={[styles.btn, decDisabled ? styles.btnDisabled : undefined]}>
        <ThemedText style={styles.btnText}>-</ThemedText>
      </TouchableOpacity>

      <View style={styles.valueBox}>
        <ThemedText style={styles.value}>{value}</ThemedText>
      </View>

      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={incDisabled}
        style={[styles.btn, incDisabled ? styles.btnDisabled : undefined]}>
        <ThemedText style={styles.btnText}>+</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontWeight: '900', color: BRAND.text, fontSize: 16 },
  valueBox: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
  },
  value: { fontWeight: '900', color: BRAND.orange },
});

