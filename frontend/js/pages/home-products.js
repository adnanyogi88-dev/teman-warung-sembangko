import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "/shared/config/supabase.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const grid = document.getElementById("homeProductsGrid");
const status = document.getElementById("homeProductsStatus");

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function renderProduct(item) {
  const image = item.image_url
    ? '<img class="home-product-image" src="' + escapeHtml(item.image_url) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">'
    : '<div class="home-product-image home-product-no-image" aria-label="Foto belum tersedia">Foto belum tersedia</div>';
  const stock = Number(item.stock) > 0
    ? '<span class="home-product-stock">Stok tersedia</span>'
    : '<span class="home-product-stock is-empty">Stok perlu dikonfirmasi</span>';
  const description = escapeHtml(item.description || "").slice(0, 150);
  return '<article class="card home-product-card">' +
    '<a class="home-product-media" href="' + escapeHtml(item.destination_url) + '" target="_blank" rel="noopener noreferrer">' + image + '</a>' +
    '<div class="home-product-copy"><span class="home-product-type">' + (item.item_type === "service" ? "Jasa" : "Produk") + '</span>' +
    '<h3>' + escapeHtml(item.title) + '</h3><p>' + description + '</p>' + stock +
    '<a class="home-product-link" href="' + escapeHtml(item.destination_url) + '" target="_blank" rel="noopener noreferrer">Lihat produk →</a></div></article>';
}

async function loadLatestProducts() {
  try {
    const { data, error } = await supabase
      .from("affiliate_catalog_items")
      .select("id,item_type,title,description,stock,image_url,destination_url,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw error;
    if (!data?.length) {
      status.textContent = "Belum ada produk aktif. Produk yang diaktifkan dari dashboard Admin akan tampil di sini.";
      return;
    }
    grid.innerHTML = data.map(renderProduct).join("");
    status.textContent = data.length + " produk terbaru";
  } catch (error) {
    console.error("[TWS homepage products]", error);
    status.textContent = "Katalog produk sedang tidak dapat dimuat. Silakan kunjungi halaman Produk.";
  }
}

loadLatestProducts();
