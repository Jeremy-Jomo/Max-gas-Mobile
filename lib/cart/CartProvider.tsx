import React, { createContext, useContext, useMemo, useReducer } from 'react';

export type CartLine = {
  product_sku: string;
  name: string;
  unit_price_kes: number;
  available: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
};

type CartAction =
  | { type: 'add'; line: Omit<CartLine, 'qty'>; qty?: number }
  | { type: 'setQty'; sku: string; qty: number }
  | { type: 'remove'; sku: string }
  | { type: 'clear' };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const qty = clamp(action.qty ?? 1, 1, Math.max(1, action.line.available));
      const idx = state.lines.findIndex((l) => l.product_sku === action.line.product_sku);
      if (idx >= 0) {
        const existing = state.lines[idx];
        const nextQty = clamp(existing.qty + qty, 1, Math.max(1, action.line.available));
        const next = [...state.lines];
        next[idx] = { ...existing, ...action.line, qty: nextQty };
        return { lines: next };
      }
      return { lines: [...state.lines, { ...action.line, qty }] };
    }
    case 'setQty': {
      const next = state.lines
        .map((l) => {
          if (l.product_sku !== action.sku) return l;
          const nextQty = clamp(action.qty, 0, Math.max(0, l.available));
          return { ...l, qty: nextQty };
        })
        .filter((l) => l.qty > 0);
      return { lines: next };
    }
    case 'remove':
      return { lines: state.lines.filter((l) => l.product_sku !== action.sku) };
    case 'clear':
      return { lines: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  lines: CartLine[];
  addToCart: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  totalKes: number;
  totalItems: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });

  const totalKes = useMemo(
    () => state.lines.reduce((sum, l) => sum + l.unit_price_kes * l.qty, 0),
    [state.lines]
  );
  const totalItems = useMemo(() => state.lines.reduce((sum, l) => sum + l.qty, 0), [state.lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      addToCart: (line, qty) => dispatch({ type: 'add', line, qty }),
      setQty: (sku, qty) => dispatch({ type: 'setQty', sku, qty }),
      remove: (sku) => dispatch({ type: 'remove', sku }),
      clear: () => dispatch({ type: 'clear' }),
      totalKes,
      totalItems,
    }),
    [state.lines, totalKes, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

