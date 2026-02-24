export type UserRole = 'ADMIN' | 'AGENT' | 'DRIVER' | 'CUSTOMER';

export type UserProfile = {
  id: number;
  username: string;
  full_name: string;
  id_number: string | null;
  phone: string;
  email: string | null;
  role: UserRole;
  region: string | null;
  location_name: string | null;
  shop_account_number?: string | null;
  shop_location?: string | null;
  phone_verified: boolean;
  must_change_password: boolean;
  must_change_password_reason: 'FIRST_LOGIN' | 'ADMIN_RESET' | null;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  role?: UserRole;
  phone?: string;
  user_id?: number;
};

export type AgentDashboardResponse = {
  stock: Array<{
    sku: string;
    name: string;
    price_kes: number;
    on_hand: number;
    reserved: number;
    available: number;
  }>;
  kpis: {
    sales_count: number;
    paid_total_kes: number;
    released_total_kes: number;
  };
};

export type SaleOrder = {
  id: number;
  created_at: string;
  qty: number;
  unit_price_kes: number;
  total_amount_kes: number;
  payment_method: 'MPESA' | 'POINTS';
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  release_status: 'PENDING' | 'RELEASED';
  product_sku: string;
};

export type AgentReportsResponse = {
  range: { start: string; end: string };
  summary: {
    total_sales: number;
    paid_sales: number;
    revenue_paid_kes: number;
    commission_balance_kes: number;
  };
  sales: Array<{
    id: number;
    created_at: string;
    product_sku: string;
    qty: number;
    total_amount_kes: number;
    payment_status: string;
    release_status: string;
    customer_phone: string;
  }>;
};

export type Order = {
  id: number;
  created_at: string;
  customer_phone: string;
  total_amount_kes: number;
  payment_method: 'MPESA' | 'POINTS';
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  release_status: 'PENDING' | 'COMPLETED';
  items: Array<{
    id: number;
    product_sku: string;
    product_name: string;
    qty: number;
    released_qty: number;
    unit_price_kes: number;
    line_total_kes: number;
  }>;
};

