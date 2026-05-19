import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: "Test",
      price: 100,
      description: "Test description",
      category_id: "dairy",
      seller_id: "fe47cce3-f8bb-40cf-b2da-fc7b9366e6c7", // mock a valid UUID
      image_url: "https://example.com/image.png",
      badges: ['Проверенный состав'],
      is_active: false
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
run();
