import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('products').insert({
    name: "Test",
    price: 100,
    seller_id: 'dummy' // might fail RLS, but we'll see the error
  }).select().single();
  
  console.log("Error:", error);
}
run();
