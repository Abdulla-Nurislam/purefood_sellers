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
