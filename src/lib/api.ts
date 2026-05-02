import { supabase } from './supabase';

// ============================================================
// Seller App API — функции для работы с Supabase
// ============================================================

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
    category: p.tags?.[0] || 'Без категории',
    price: `₽${p.price?.toLocaleString() || 0}`,
    stock: 100, // stock isn't in DB yet, default
    status: p.badges?.includes('Проверенный состав') ? 'Verified' : 'Pending',
    image: p.image_url,
    description: p.description,
  }));
}

// ---- Orders ----

export async function fetchSellerOrders(sellerId?: string): Promise<SellerOrder[]> {
  let query = supabase
    .from('orders')
    .select('*, order_items(count)')
    .order('created_at', { ascending: false });

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching seller orders:', error);
    return [];
  }

  return (data || []).map(o => ({
    id: o.id,
    client: 'Клиент',
    date: new Date(o.created_at).toLocaleDateString('ru-RU'),
    total: `₽${o.total?.toLocaleString() || 0}`,
    status: o.status || 'new',
    items: o.order_items?.[0]?.count || 0,
  }));
}

// ---- Dashboard Stats ----

export async function fetchDashboardStats(sellerId?: string) {
  let productsQuery = supabase.from('products').select('id', { count: 'exact', head: true });
  let ordersQuery = supabase.from('orders').select('id', { count: 'exact', head: true });

  if (sellerId) {
    productsQuery = productsQuery.eq('seller_id', sellerId);
    ordersQuery = ordersQuery.eq('seller_id', sellerId);
  }

  const [productsRes, ordersRes] = await Promise.all([
    productsQuery.then(r => r.count || 0),
    ordersQuery.then(r => r.count || 0),
  ]);

  return {
    totalProducts: productsRes,
    newOrders: ordersRes,
    totalSales: 0, // Will be computed when payments are tracked
    verificationStatus: 100,
  };
}

// ---- Add / Update / Delete Products ----

export async function addProduct(product: {
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category_id?: string;
  seller_id?: string;
  tags?: string[];
  badges?: string[];
}) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    return null;
  }
  return data;
}

export async function updateProduct(id: string, updates: Partial<{
  name: string;
  price: number;
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
    return null;
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
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('phone', phone)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching seller by phone:', error);
  }
  return data;
}

export async function registerSeller(seller: {
  phone: string;
  company_name: string;
  contact_name: string;
  categories: string[];
}) {
  const { data, error } = await supabase
    .from('sellers')
    .insert(seller)
    .select()
    .single();

  if (error) {
    console.error('Error registering seller:', error);
    return null;
  }
  return data;
}
