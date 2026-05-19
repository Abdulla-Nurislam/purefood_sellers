import { supabase } from './supabase';

// ============================================================
// Seller App API — функции для работы с Supabase
// ============================================================

// ---- Activity Types ----

export interface SellerActivity {
  id: string;
  title: string;
  type: 'order' | 'product' | 'payout' | 'review' | 'delivery';
  created_at: string;
}

export interface SellerProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: string;
  image: string;
  description?: string;
}

export interface SellerOrder {
  id: string;
  client: string;
  date: string;
  total: string;
  status: string;
  items: number;
}

// ---- Products ----

export async function fetchSellerProducts(sellerId?: string): Promise<SellerProduct[]> {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching seller products:', error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.tags?.[0] || p.category_id || 'Без категории',
    price: `₸${p.price?.toLocaleString() || 0}`,
    stock: p.stock ?? 100,
    status: p.is_active ? 'Verified' : 'Pending',
    image: p.image_url,
    description: p.description,
  }));
}

// ---- Orders ----

export async function fetchSellerOrders(sellerId?: string): Promise<SellerOrder[]> {
  let query = supabase
    .from('orders')
    .select('*, order_items(count), users(name, phone)')
    .order('created_at', { ascending: false });

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching seller orders:', error);
    return [];
  }

  return (data || []).map(o => {
    const userName = (o as any).users?.name || (o as any).users?.phone || 'Клиент';
    const now = new Date();
    const created = new Date(o.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let dateStr: string;
    if (diffDays === 0) {
      dateStr = `Сегодня, ${created.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      dateStr = `Вчера, ${created.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      dateStr = created.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return {
      id: o.id,
      client: userName,
      date: dateStr,
      total: `₸${o.total?.toLocaleString() || 0}`,
      status: o.status || 'new',
      items: o.order_items?.[0]?.count || 0,
    };
  });
}

// ---- Dashboard Stats ----

export async function fetchDashboardStats(sellerId?: string) {
  let productsQuery = supabase.from('products').select('id', { count: 'exact', head: true });
  let ordersQuery = supabase.from('orders').select('id', { count: 'exact', head: true });
  let newOrdersQuery = supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new');

  if (sellerId) {
    productsQuery = productsQuery.eq('seller_id', sellerId);
    ordersQuery = ordersQuery.eq('seller_id', sellerId);
    newOrdersQuery = newOrdersQuery.eq('seller_id', sellerId);
  }

  const [productsRes, ordersRes, newOrdersRes] = await Promise.all([
    productsQuery.then(r => r.count || 0),
    ordersQuery.then(r => r.count || 0),
    newOrdersQuery.then(r => r.count || 0),
  ]);

  // Compute total sales from delivered orders
  const totalSales = await fetchTotalSales(sellerId);

  return {
    totalProducts: productsRes,
    totalOrders: ordersRes,
    newOrders: newOrdersRes,
    totalSales,
    verificationStatus: 100,
  };
}

// ---- Total Sales ----

export async function fetchTotalSales(sellerId?: string): Promise<number> {
  let query = supabase
    .from('orders')
    .select('total')
    .in('status', ['delivered', 'shipped', 'processing']);

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  const { data, error } = await query;
  if (error || !data) return 0;
  return data.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
}

// ---- Activities ----

export async function fetchSellerActivities(sellerId: string): Promise<SellerActivity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
  return data || [];
}

export async function createSellerActivity(
  sellerId: string,
  title: string,
  type: 'order' | 'product' | 'payout' | 'review' | 'delivery'
) {
  const { error } = await supabase
    .from('activities')
    .insert({ seller_id: sellerId, title, type });

  if (error) {
    console.error('Error creating activity:', error);
  }
}

// ---- Order Details ----

export async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, price, image_url)), users(name, phone)')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }
  return true;
}

// ---- Add / Update / Delete Products ----

export async function addProduct(product: {
  name: string;
  price: number;
  stock?: number;
  composition?: string[];
  description?: string;
  image_url?: string;
  category_id?: string;
  seller_id?: string;
  tags?: string[];
  badges?: string[];
  is_active?: boolean;
  rating?: number;
  review_count?: number;
}) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateProduct(id: string, updates: Partial<{
  name: string;
  price: number;
  stock: number;
  description: string;
  image_url: string;
  category_id: string;
  tags: string[];
  badges: string[];
  is_active: boolean;
}>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }
  return true;
}

// ---- Auth ----

export async function getSellerByPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const fakeEmail = `${digits}@seller.purefood.kz`;
  const defaultPassword = "PureFoodSeller123!";

  // 1. Try to sign in to Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password: defaultPassword,
  });

  if (!authError && authData.user) {
    // Auth login succeeded — fetch profile from sellers table
    const { data: userData } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return userData || { id: authData.user.id, phone };
  }

  // 2. Fallback: try to find seller directly by phone in sellers table
  // This handles cases where Auth email was created with old broken regex
  const phoneVariants = [phone, `+${digits}`, `+7${digits.slice(1)}`];
  
  for (const phoneVariant of phoneVariants) {
    const { data: directLookup } = await supabase
      .from('sellers')
      .select('*')
      .eq('phone', phoneVariant)
      .single();
    
    if (directLookup) {
      return directLookup;
    }
  }

  // Also try with the formatted phone that was stored during registration
  const { data: fuzzyLookup } = await supabase
    .from('sellers')
    .select('*')
    .ilike('phone', `%${digits.slice(-10)}%`)
    .limit(1)
    .single();

  if (fuzzyLookup) {
    return fuzzyLookup;
  }

  return null;
}

export async function registerSeller(seller: {
  phone: string;
  company_name: string;
  contact_name: string;
  categories: string[];
}) {
  const digits = seller.phone.replace(/\D/g, '');
  const fakeEmail = `${digits}@seller.purefood.kz`;
  const defaultPassword = "PureFoodSeller123!";

  // 1. Sign up to Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: fakeEmail,
    password: defaultPassword,
  });

  if (authError) {
    console.error('Error registering auth user:', authError);
    return null;
  }

  const userId = authData.user?.id;
  if (!userId) return null;

  // 2. We use RLS-bypassing or assume RLS allows insert if auth.uid() == id
  const { data: userData, error: userError } = await supabase
    .from('sellers')
    .insert({
      id: userId,
      phone: seller.phone,
      company_name: seller.company_name,
      contact_name: seller.contact_name,
      categories: seller.categories
    })
    .select()
    .single();

  if (userError) {
    console.warn('Could not create profile in sellers table (probably RLS), but Auth succeeded:', userError);
    return { id: userId, phone: seller.phone, company_name: seller.company_name, contact_name: seller.contact_name, categories: seller.categories };
  }

  return userData;
}
