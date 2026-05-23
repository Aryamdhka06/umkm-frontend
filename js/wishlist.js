/**
 * js/wishlist.js
 * Wishlist page logic — UMKM Kerajinan
 */

import {
  apiGetWishlist,
  apiRemoveWishlist,
  apiAddKeranjang,
} from "./api.js";


// ══════════════════════════════════════
// STATE
// ══════════════════════════════════════

let wishlistData  = [];   // master list
let displayData   = [];   // sorted view
let currentSort   = "default";


// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

const getUser = () => JSON.parse(localStorage.getItem("umkm_user") || "null");

const formatRupiah = (n) =>
  "Rp " + Number(n).toLocaleString("id-ID");

function renderStars(nilai) {
  const n = Math.min(5, Math.max(0, Math.round(Number(nilai || 0))));
  return Array.from({ length: 5 }, (_, i) =>
    `<i class="fa-${i < n ? "solid" : "regular"} fa-star${i >= n ? " dim" : ""}"></i>`
  ).join("");
}


// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════

function showToast(msg, type = "info") {
  const icons = {
    success: "fa-circle-check",
    error:   "fa-circle-xmark",
    info:    "fa-circle-info",
  };
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon"><i class="fa-solid ${icons[type]}"></i></span>
    <span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = "0.3s";
    el.style.opacity    = "0";
    el.style.transform  = "translateX(40px)";
    setTimeout(() => el.remove(), 320);
  }, 3000);
}


// ══════════════════════════════════════
// CONFIRM DIALOG
// ══════════════════════════════════════

function showConfirm(title, sub, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";
  overlay.innerHTML = `
    <div class="dialog-box">
      <div class="dialog-icon"><i class="fa-solid fa-trash-can"></i></div>
      <h3 class="dialog-title">${title}</h3>
      <p class="dialog-sub">${sub}</p>
      <div class="dialog-actions">
        <button class="dialog-cancel">Batal</button>
        <button class="dialog-confirm">Hapus</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector(".dialog-cancel").onclick  = () => overlay.remove();
  overlay.querySelector(".dialog-confirm").onclick = () => { overlay.remove(); onConfirm(); };
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}


// ══════════════════════════════════════
// SKELETON LOADING
// ══════════════════════════════════════

function showSkeletons(count = 6) {
  const grid = document.getElementById("wishlistGrid");
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton sk-img"></div>
      <div class="skeleton sk-line sk-w80" style="margin-top:14px"></div>
      <div class="skeleton sk-line sk-w55"></div>
      <div class="skeleton sk-line sk-w40"></div>
      <div class="skeleton sk-btn"></div>
    </div>`).join("");
}


// ══════════════════════════════════════
// SORT
// ══════════════════════════════════════

function applySort(sort) {
  currentSort = sort;
  const list = [...wishlistData];

  if (sort === "price-asc")  list.sort((a,b) => (a.produk?.harga||0) - (b.produk?.harga||0));
  if (sort === "price-desc") list.sort((a,b) => (b.produk?.harga||0) - (a.produk?.harga||0));
  if (sort === "rating")     list.sort((a,b) => (b.produk?.rating||0) - (a.produk?.rating||0));

  displayData = list;
  renderGrid();
}


// ══════════════════════════════════════
// RENDER GRID
// ══════════════════════════════════════

function renderGrid() {
  const grid     = document.getElementById("wishlistGrid");
  const empty    = document.getElementById("emptyState");
  const toolbar  = document.getElementById("toolbar");
  const countEl  = document.getElementById("wishlistCount");

  countEl.textContent = wishlistData.length;

  if (!displayData.length) {
    grid.innerHTML = "";
    empty.style.display   = "flex";
    toolbar.style.display = "none";
    return;
  }

  empty.style.display   = "none";
  toolbar.style.display = "flex";
  grid.innerHTML = "";

  displayData.forEach((item, idx) => {
    const p = item.produk || item;
    const card = buildCard(p, item.id || item.produk_id, idx);
    grid.appendChild(card);
  });
}


// ══════════════════════════════════════
// BUILD CARD
// ══════════════════════════════════════

function buildCard(produk, wishlistId, idx) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.id = wishlistId;
  card.style.animationDelay = `${idx * 0.06}s`;

const imgHtml = produk.gambar_url
  ? `<img
       src="https://web-production-aa9b5.up.railway.app/static/uploads/${produk.gambar_url}"
       alt="${produk.nama}"
     >`
  : `<div class="card-img-placeholder">
       <i class="fa-solid fa-image"></i>
     </div>`;

  card.innerHTML = `
    <div class="card-img-wrap" data-produk-id="${produk.id}">
      ${imgHtml}
      <span class="card-cat">${produk.kategori || "Kerajinan"}</span>
      <button class="btn-remove-float" title="Hapus dari wishlist">
        <i class="fa-solid fa-heart-crack"></i>
      </button>
    </div>

    <div class="card-body">
      <h3 class="card-name" data-produk-id="${produk.id}">${produk.nama || "Produk"}</h3>
      <div class="card-rating">
        <span class="stars">${renderStars(produk.rating)}</span>
        <span class="rating-val">${produk.rating ? Number(produk.rating).toFixed(1) : "—"}</span>
      </div>
      <p class="card-price">${formatRupiah(produk.harga || 0)}</p>
    </div>

    <div class="card-footer">
      <button class="btn-cart" data-produk-id="${produk.id}">
        <i class="fa-solid fa-bag-shopping"></i> Keranjang
      </button>
      <button class="btn-detail" data-produk-id="${produk.id}">
        <i class="fa-solid fa-eye"></i> Detail
      </button>
    </div>
  `;

  // ── Listeners ──

  // Image / name → detail
  card.querySelector(".card-img-wrap").addEventListener("click", (e) => {
    if (e.target.closest(".btn-remove-float")) return;
    goDetail(produk.id);
  });
  card.querySelector(".card-name").addEventListener("click", () => goDetail(produk.id));

  // Detail button
  card.querySelector(".btn-detail").addEventListener("click", () => goDetail(produk.id));

  // Remove
  card.querySelector(".btn-remove-float").addEventListener("click", () => {
    showConfirm(
      "Hapus dari Wishlist?",
      `<strong>${produk.nama}</strong> akan dihapus dari wishlist Anda.`,
      () => removeWishlist(wishlistId, card)
    );
  });

  // Add to cart
  card.querySelector(".btn-cart").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    await addToKeranjang(produk.id, btn);
  });

  return card;
}


// ══════════════════════════════════════
// ACTIONS
// ══════════════════════════════════════

function goDetail(produkId) {
  window.location.href = `../detail/detail.html?id=${produkId}`;
}

async function removeWishlist(wishlistId, card) {
  card.classList.add("removing");

  try {
    await apiRemoveWishlist(wishlistId);

    // Remove from state
    wishlistData = wishlistData.filter(
      (w) => (w.id || w.produk_id) !== wishlistId
    );
    displayData = displayData.filter(
      (w) => (w.id || w.produk_id) !== wishlistId
    );

    setTimeout(() => {
      card.remove();
      updateCountBadge();
      // show empty if needed
      if (!wishlistData.length) {
        document.getElementById("emptyState").style.display = "flex";
        document.getElementById("toolbar").style.display    = "none";
        document.getElementById("wishlistCount").textContent = 0;
      }
    }, 400);

    showToast("Produk dihapus dari wishlist", "success");

  } catch (err) {
    card.classList.remove("removing");
    showToast(err.message || "Gagal menghapus wishlist", "error");
  }
}

async function addToKeranjang(produkId, btn) {
  const original = btn.innerHTML;
  btn.disabled  = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menambahkan...`;

  try {
    await apiAddKeranjang(produkId, 1);
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Ditambahkan!`;
    btn.style.color = "var(--green)";
    showToast("Produk ditambahkan ke keranjang", "success");

    setTimeout(() => {
      btn.disabled   = false;
      btn.innerHTML  = original;
      btn.style.color = "";
    }, 2200);

  } catch (err) {
    btn.disabled  = false;
    btn.innerHTML = original;
    showToast(err.message || "Gagal menambah ke keranjang", "error");
  }
}

async function clearAll() {
  showConfirm(
    "Hapus Semua Wishlist?",
    "Semua produk di wishlist Anda akan dihapus. Tindakan ini tidak dapat diurungkan.",
    async () => {
      const ids = [...wishlistData.map((w) => w.id || w.produk_id)];
      let failed = 0;

      for (const id of ids) {
        try {
          await apiRemoveWishlist(id);
        } catch {
          failed++;
        }
      }

      wishlistData = [];
      displayData  = [];
      renderGrid();
      updateCountBadge();

      if (!failed) showToast("Semua wishlist berhasil dihapus", "success");
      else showToast(`${failed} item gagal dihapus`, "error");
    }
  );
}

function updateCountBadge() {
  document.getElementById("wishlistCount").textContent = wishlistData.length;
}


// ══════════════════════════════════════
// LOAD WISHLIST
// ══════════════════════════════════════

async function loadWishlist() {
  showSkeletons(6);
  document.getElementById("emptyState").style.display = "none";

  try {
    const res = await apiGetWishlist();
    wishlistData = res.data || res.wishlist || [];
    displayData  = [...wishlistData];
    renderGrid();

  } catch (err) {
    document.getElementById("wishlistGrid").innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--text-muted)">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:36px;color:var(--gold);opacity:.4;margin-bottom:12px;display:block"></i>
        <p>${err.message || "Gagal memuat wishlist. Coba lagi nanti."}</p>
      </div>`;
    showToast("Gagal memuat wishlist", "error");
  }
}


// ══════════════════════════════════════
// NAVBAR
// ══════════════════════════════════════

function initNavbar() {
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 10);
  });

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("umkm_user");
  window.location.href = "../../index.html";
});

  const hamburger = document.getElementById("navHamburger");
  const navLinks  = document.getElementById("navLinks");
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });
}


// ══════════════════════════════════════
// SORT TOOLBAR
// ══════════════════════════════════════

function initToolbar() {
  document.querySelectorAll(".toolbar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".toolbar-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applySort(btn.dataset.sort);
    });
  });

  document.getElementById("btnClearAll").addEventListener("click", clearAll);
}


// ══════════════════════════════════════
// BOOT
// ══════════════════════════════════════

async function boot() {
  const user = getUser();
  if (!user) {
    window.location.href = "../../login.html";
    return;
  }

  initNavbar();
  initToolbar();
  await loadWishlist();
}

document.addEventListener("DOMContentLoaded", boot);