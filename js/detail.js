// js/detail.js

import {
  apiGetProdukDetail,
  apiAddWishlist,
  apiAddKeranjang,
  apiRate,
  apiLogout
} from "./api.js";

/* ─────────────────────────
   ELEMENTS
───────────────────────── */
const skeletonContainer  = document.getElementById("skeletonContainer");
const detailContent      = document.getElementById("detailContent");
const ratingSection      = document.getElementById("ratingSection");
const produkGambar       = document.getElementById("produkGambar");
const produkNama         = document.getElementById("produkNama");
const produkHarga        = document.getElementById("produkHarga");
const produkDeskripsi    = document.getElementById("produkDeskripsi");
const produkIdEl         = document.getElementById("produkId");
const badgeKategori      = document.getElementById("badgeKategori");
const stockBadge         = document.getElementById("stockBadge");
const starsDisplay       = document.getElementById("starsDisplay");
const ratingVal          = document.getElementById("ratingVal");
const ratingCount        = document.getElementById("ratingCount");
const breadcrumbKategori = document.getElementById("breadcrumbKategori");
const breadcrumbNama     = document.getElementById("breadcrumbNama");
const wishlistBtn        = document.getElementById("wishlistBtn");
const cartBtn            = document.getElementById("cartBtn");
const qtyMinus           = document.getElementById("qtyMinus");
const qtyPlus            = document.getElementById("qtyPlus");
const qtyValEl           = document.getElementById("qtyVal");
const starInputEl        = document.getElementById("starInput");
const submitRatingBtn    = document.getElementById("submitRatingBtn");
const logoutBtn          = document.getElementById("logoutBtn");
const hamburger          = document.getElementById("hamburger");
const navLinks           = document.getElementById("navLinks");
const toast              = document.getElementById("toast");

/* ─────────────────────────
   STATE
───────────────────────── */
let qty           = 1;
let selectedRating = 0;
let produkId      = null;

/* ─────────────────────────
   AUTH CHECK
───────────────────────── */
const user = JSON.parse(localStorage.getItem("umkm_user"));
if (!user) window.location.href = "login.html";

/* ─────────────────────────
   NAVBAR
───────────────────────── */
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});
logoutBtn.addEventListener("click", () => {
  apiLogout();
});

/* ─────────────────────────
   TOAST
───────────────────────── */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ─────────────────────────
   LOADING
───────────────────────── */
function setLoading(show) {
  if (show) {
    skeletonContainer.classList.remove("hidden");
    detailContent.classList.add("hidden");
    ratingSection.classList.add("hidden");
  } else {
    skeletonContainer.classList.add("hidden");
    detailContent.classList.remove("hidden");
    ratingSection.classList.remove("hidden");
  }
}

/* ─────────────────────────
   RENDER STARS (read-only)
───────────────────────── */
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  let html = "";
  for (let i = 0; i < full;  i++) html += `<i class="fa-solid fa-star"></i>`;
  if (half)                         html += `<i class="fa-solid fa-star-half-stroke"></i>`;
  for (let i = 0; i < empty; i++) html += `<i class="fa-regular fa-star"></i>`;
  starsDisplay.innerHTML = html;
}

/* ─────────────────────────
   RENDER PRODUK
───────────────────────── */
function renderProduk(item) {
  produkId = item.id;

  produkGambar.src           = item.gambar_url || "";
  produkGambar.alt           = item.nama;
  produkNama.textContent     = item.nama;
  produkHarga.textContent    = "Rp " + Number(item.harga).toLocaleString("id-ID");
  produkDeskripsi.textContent = item.deskripsi || "Deskripsi produk belum tersedia.";
  produkIdEl.textContent     = `SKU-${String(item.id).padStart(5, "0")}`;
  badgeKategori.textContent  = item.kategori || "";

  breadcrumbKategori.textContent = item.kategori || "Produk";
  breadcrumbNama.textContent     = item.nama;
  document.title = `${item.nama} — UMKM Kerajinan`;

  const stok = item.stok ?? 10;
  if (stok > 0) {
    stockBadge.textContent = `Stok: ${stok}`;
    stockBadge.className   = "stock-badge in-stock";
  } else {
    stockBadge.textContent = "Habis";
    stockBadge.className   = "stock-badge out-stock";
    cartBtn.disabled       = true;
    cartBtn.innerHTML      = `<i class="fa-solid fa-ban"></i> Stok Habis`;
  }

  const rating = Number(item.rating || 4.5);
  const count  = item.rating_count || item.jumlah_rating || "—";
  renderStars(rating);
  ratingVal.textContent   = rating.toFixed(1);
  ratingCount.textContent = `(${count} ulasan)`;
}

/* ─────────────────────────
   LOAD PRODUK
───────────────────────── */
async function loadProduk() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    showToast("ID produk tidak ditemukan.");
    setTimeout(() => window.location.href = "/frontend/index.html", 2000);
    return;
  }

  try {
    setLoading(true);
    const data = await apiGetProdukDetail(id);
    const item = data.data || data;
    renderProduk(item);
  } catch (error) {
    showToast(error.message || "Gagal memuat produk.");
  } finally {
    setLoading(false);
  }
}

/* ─────────────────────────
   QTY
───────────────────────── */
qtyMinus.addEventListener("click", () => {
  if (qty > 1) { qty--; qtyValEl.textContent = qty; }
});
qtyPlus.addEventListener("click", () => {
  qty++; qtyValEl.textContent = qty;
});

/* ─────────────────────────
   WISHLIST
───────────────────────── */
wishlistBtn.addEventListener("click", async () => {
  if (!produkId) return;
  try {
    await apiAddWishlist(produkId);
    wishlistBtn.classList.toggle("active");
    const isActive = wishlistBtn.classList.contains("active");
    wishlistBtn.innerHTML = isActive
      ? `<i class="fa-solid fa-heart"></i>`
      : `<i class="fa-regular fa-heart"></i>`;
    showToast(isActive ? "Ditambahkan ke wishlist." : "Dihapus dari wishlist.");
  } catch (error) {
    showToast(error.message);
  }
});

/* ─────────────────────────
   CART
───────────────────────── */
cartBtn.addEventListener("click", async () => {
  if (!produkId) return;
  try {
    cartBtn.disabled = true;
    await apiAddKeranjang(produkId, qty);
    showToast(`${qty} produk ditambahkan ke keranjang.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    cartBtn.disabled = false;
  }
});

/* ─────────────────────────
   STAR INPUT
───────────────────────── */
const starIcons = starInputEl.querySelectorAll("i");

starIcons.forEach(star => {
  star.addEventListener("mouseenter", () => {
    const val = parseInt(star.dataset.val);
    starIcons.forEach(s => {
      s.classList.toggle("hovered", parseInt(s.dataset.val) <= val);
    });
  });
  star.addEventListener("mouseleave", () => {
    starIcons.forEach(s => s.classList.remove("hovered"));
  });
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.dataset.val);
    starIcons.forEach(s => {
      const sv = parseInt(s.dataset.val);
      s.className = sv <= selectedRating
        ? "fa-solid fa-star selected"
        : "fa-regular fa-star";
    });
    submitRatingBtn.disabled = false;
  });
});

/* ─────────────────────────
   SUBMIT RATING
───────────────────────── */
submitRatingBtn.addEventListener("click", async () => {
  if (!produkId || !selectedRating) return;
  try {
    submitRatingBtn.disabled    = true;
    submitRatingBtn.textContent = "Mengirim...";
    await apiRate(produkId, selectedRating);
    showToast("Rating berhasil dikirim. Terima kasih!");
    submitRatingBtn.textContent = "✓ Rating Terkirim";
  } catch (error) {
    showToast(error.message || "Gagal mengirim rating.");
    submitRatingBtn.disabled    = false;
    submitRatingBtn.textContent = "Kirim Rating";
  }
});

/* ─────────────────────────
   INIT
───────────────────────── */
loadProduk();