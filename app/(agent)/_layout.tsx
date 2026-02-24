import { Stack } from 'expo-router';
import { CartProvider } from '@/lib/cart/CartProvider';

export default function AgentLayout() {
  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cart" options={{ presentation: 'card' }} />
        <Stack.Screen name="billing" options={{ presentation: 'card' }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
      </Stack>
    </CartProvider>
  );
}

