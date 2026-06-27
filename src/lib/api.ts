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
  // Ensure the seller exists in the `sellers` table to satisfy the foreign key constraint
  if (product.seller_id) {
    const { data: sellerExists } = await supabase
      .from('sellers')
      .select('id')
      .eq('id', product.seller_id)
      .maybeSingle();

    if (!sellerExists) {
      console.log('Seller profile not found in DB. Creating minimal record to satisfy foreign key...');
      const { error: sellerInsertError } = await supabase
        .from('sellers')
        .insert({
          id: product.seller_id,
          company_name: '',
          description: '',
          rating: 0,
          review_count: 0,
          product_count: 0,
          verified: false,
          categories: [],
          location: 'Казахстан',
        });
        
      if (sellerInsertError) {
        console.error('Failed to create placeholder seller:', sellerInsertError);
      }
    }
  }

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

// ---- Update Seller Profile ----

export async function updateSellerProfile(sellerId: string, updates: {
  company_name?: string;
  location?: string;
  categories?: string[];
}) {
  const { data, error } = await supabase
    .from('sellers')
    .upsert({ id: sellerId, ...updates })
    .select()
    .single();

  if (error) {
    console.error('Error updating seller profile:', error);
    throw new Error(error.message);
  }
  return data;
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
      company_name: seller.company_name,
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

// ---- Теги из БД ----

// Загружает список доступных тегов из таблицы product_tags
export async function fetchProductTags(): Promise<string[]> {
  const FALLBACK = ['\u042d\u043a\u043e', '\u041d\u0430\u0442\u0443\u0440\u0430\u043b\u044c\u043d\u043e\u0435', '\u0411\u0435\u0437 \u0441\u0430\u0445\u0430\u0440\u0430', '\u0411\u0435\u0437 \u0413\u041c\u041e', '\u041e\u0440\u0433\u0430\u043d\u0438\u043a', '\u0425\u0430\u043b\u044f\u043b\u044c', '\u0424\u0435\u0440\u043c\u0435\u0440\u0441\u043a\u043e\u0435', '\u0411\u0435\u0437 \u043b\u0430\u043a\u0442\u043e\u0437\u044b', '\u0412\u0435\u0433\u0430\u043d', '\u041c\u0435\u0441\u0442\u043d\u044b\u0439 \u043f\u0440\u043e\u0434\u0443\u043a\u0442'];

  // Try with is_active filter first
  const { data, error } = await supabase
    .from('product_tags')
    .select('name')
    .eq('is_active', true)
    .order('name');

  if (!error && data && data.length > 0) {
    return data.map(t => t.name);
  }

  // If is_active column missing or table is empty, try without filter
  if (error?.code === '42703' || (error?.message && error.message.includes('is_active'))) {
    const { data: allData, error: allError } = await supabase
      .from('product_tags')
      .select('name')
      .order('name');

    if (!allError && allData && allData.length > 0) {
      return allData.map(t => t.name);
    }
  }

  if (error) {
    console.error('Error fetching product tags:', error);
  }

  // Return fallback set if table is unavailable or empty
  return FALLBACK;
}

// ---- Аналитика удержания из БД ----

export interface RetentionDataPoint {
  month: string;   // Название месяца (напр., "Янв")
  views: number;   // Количество просмотров товаров
  repeats: number; // Количество заказов (повторных покупок)
}

// Считает просмотры и заказы по месяцам за последние 6 месяцев
export async function fetchRetentionAnalytics(sellerId: string): Promise<RetentionDataPoint[]> {
  const now = new Date();
  // Генерируем массив из 6 прошлых месяцев (включая текущий)
  const months: Array<{ label: string; start: string; end: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const label = d.toLocaleString('ru-RU', { month: 'short' });
    months.push({ label: label.charAt(0).toUpperCase() + label.slice(1, 3), start, end });
  }

  const sixMonthsAgo = months[0].start;

  // Загружаем все просмотры и все заказы за весь период одним запросом
  const [viewsRes, ordersRes] = await Promise.all([
    supabase
      .from('product_views')
      .select('viewed_at')
      .eq('seller_id', sellerId)
      .gte('viewed_at', sixMonthsAgo),
    supabase
      .from('orders')
      .select('created_at')
      .eq('seller_id', sellerId)
      .gte('created_at', sixMonthsAgo),
  ]);

  if (viewsRes.error) console.error('Error fetching views for analytics:', viewsRes.error);
  if (ordersRes.error) console.error('Error fetching orders for analytics:', ordersRes.error);

  const views = viewsRes.data || [];
  const orders = ordersRes.data || [];

  // Группируем по месяцам
  return months.map(({ label, start, end }) => ({
    month: label,
    views: views.filter(v => v.viewed_at >= start && v.viewed_at <= end).length,
    repeats: orders.filter(o => o.created_at >= start && o.created_at <= end).length,
  }));
}

// ============================================================
// Reviews API (Seller side)
// ============================================================

export interface SellerReview {
  id: string;
  user_id: string | null;
  seller_id: string;
  order_id: string | null;
  product_id: string;
  rating: number;
  text_comment: string | null;
  tags: string[];
  images: string[];
  seller_reply: string | null;
  seller_reply_at: string | null;
  is_flagged: boolean;
  created_at: string;
  userName?: string;
  productName?: string;
}

export interface ReviewAnalyticsDashboard {
  averageRating: number;
  reviewCount: number;
  ratingTrend: { label: string; avg: number; count: number }[];
  topPositiveTags: { tag: string; count: number }[];
  topNegativeTags: { tag: string; count: number }[];
}

export async function fetchSellerReviews(
  sellerId: string,
  filters?: {
    rating?: number;          // filter by exact star count
    hasPhoto?: boolean;       // only reviews with images
    sortBy?: 'newest' | 'oldest' | 'lowest' | 'highest';
  }
): Promise<SellerReview[]> {
  let query = supabase
    .from('reviews')
    .select('*, users(name, phone), products(name)')
    .eq('seller_id', sellerId);

  if (filters?.rating) {
    query = query.eq('rating', filters.rating);
  }
  if (filters?.hasPhoto) {
    query = query.neq('images', '{}');
  }

  const sortMap = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    lowest: { column: 'rating', ascending: true },
    highest: { column: 'rating', ascending: false },
  };
  const sort = sortMap[filters?.sortBy || 'newest'];
  query = query.order(sort.column, { ascending: sort.ascending });

  const { data, error } = await query.limit(100);

  if (error) {
    console.error('[api] fetchSellerReviews error:', error.message);
    return [];
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    seller_id: r.seller_id,
    order_id: r.order_id,
    product_id: r.product_id,
    rating: r.rating,
    text_comment: r.text_comment,
    tags: r.tags || [],
    images: r.images || [],
    seller_reply: r.seller_reply,
    seller_reply_at: r.seller_reply_at,
    is_flagged: r.is_flagged,
    created_at: r.created_at,
    userName: r.users?.name || r.users?.phone || 'Покупатель',
    productName: r.products?.name || 'Товар',
  }));
}

export async function fetchSellerReviewAnalytics(
  sellerId: string,
  period: '7d' | '30d' | '6m' = '30d'
): Promise<ReviewAnalyticsDashboard> {
  const now = new Date();
  const periodMap = { '7d': 7, '30d': 30, '6m': 180 };
  const days = periodMap[period];
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // All reviews for this seller (ever)
  const { data: allReviews, error: allErr } = await supabase
    .from('reviews')
    .select('rating, tags, created_at')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: true });

  if (allErr) {
    console.error('[api] fetchSellerReviewAnalytics error:', allErr.message);
    return { averageRating: 0, reviewCount: 0, ratingTrend: [], topPositiveTags: [], topNegativeTags: [] };
  }

  const reviews = allReviews || [];
  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const reviewCount = reviews.length;

  // Build trend — group by label
  const buckets = period === '7d' ? 7 : period === '30d' ? 6 : 6;
  const bucketSize = period === '7d' ? 1 : period === '30d' ? 5 : 30;

  const trend: { label: string; avg: number; count: number }[] = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * bucketSize * 24 * 60 * 60 * 1000);
    const end   = new Date(now.getTime() - i * bucketSize * 24 * 60 * 60 * 1000);
    const bucket = reviews.filter((r: any) => {
      const d = new Date(r.created_at);
      return d >= start && d < end;
    });
    const label = period === '7d'
      ? start.toLocaleDateString('ru-RU', { weekday: 'short' })
      : period === '30d'
        ? `${start.getDate()} ${start.toLocaleString('ru-RU', { month: 'short' })}`
        : start.toLocaleString('ru-RU', { month: 'short' });
    const avg = bucket.length > 0
      ? Math.round((bucket.reduce((s: number, r: any) => s + r.rating, 0) / bucket.length) * 10) / 10
      : 0;
    trend.push({ label, avg, count: bucket.length });
  }

  // Tag clouds
  const positiveTags: Record<string, number> = {};
  const negativeTags: Record<string, number> = {};
  reviews.forEach((r: any) => {
    (r.tags || []).forEach((tag: string) => {
      if (r.rating >= 4) positiveTags[tag] = (positiveTags[tag] || 0) + 1;
      else negativeTags[tag] = (negativeTags[tag] || 0) + 1;
    });
  });

  const topPositiveTags = Object.entries(positiveTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const topNegativeTags = Object.entries(negativeTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return { averageRating, reviewCount, ratingTrend: trend, topPositiveTags, topNegativeTags };
}

export async function replyToReview(reviewId: string, replyText: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update({
      seller_reply: replyText,
      seller_reply_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    console.error('[api] replyToReview error:', error.message);
    return false;
  }
  return true;
}

export async function flagReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update({ is_flagged: true })
    .eq('id', reviewId);

  if (error) {
    console.error('[api] flagReview error:', error.message);
    return false;
  }
  return true;
}

