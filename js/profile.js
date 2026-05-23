/**
 * js/profile.js
 * Profile page logic — UMKM Kerajinan
 */

import {
  apiFetch,
  apiLogout,
  apiGetWishlist,
  apiGetKeranjang,
  apiGetMyRatings,
  apiGetRekomendasi,
} from "./api.js";


// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

const getUser = () => JSON.parse(localStorage.getItem("umkm_user") || "null");

const formatRupiah = (n) =>
  "Rp " + Number(n).toLocaleString("id-ID");

const formatDate = (str) => {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
};

function renderStars(nilai) {
  const n = Math.round(Number(nilai));
  return Array.from({ length: 5 }, (_, i) =>
    `<i class="fa-${i < n ? "solid" : "regular"} fa-star ${i >= n ? "empty" : ""}"></i>`
  ).join("");
}

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════

function showToast(msg, type = "info") {
  const icons = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon"><i class="fa-solid ${icons[type]}"></i></span>
    <span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(40px)";
    el.style.transition = "0.3s";
    setTimeout(() => el.remove(), 320);
  }, 3200);
}


// ══════════════════════════════════════
// NAVBAR
// ══════════════════════════════════════

function initNavbar() {
  // Sticky shadow
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 10);
  });

  // Logout
document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("umkm_user");
  window.location.href = "../../index.html";
});

  // Mobile hamburger
  const hamburger = document.getElementById("navHamburger");
  const navLinks  = document.getElementById("navLinks");
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}


// ══════════════════════════════════════
// PROFILE INFO
// ══════════════════════════════════════

async function loadProfile() {
  const user = getUser();

  // Fill from localStorage immediately
  if (user) {
    document.getElementById("profileName").textContent  = user.nama  || user.name || "Pengguna";
    document.getElementById("profileEmail").textContent = user.email || "—";
    document.getElementById("profileJoin").innerHTML =
      `<i class="fa-regular fa-calendar"></i> Bergabung ${formatDate(user.created_at || user.join_date)}`;
  }

  // Try fetching fresh from /auth/me
  try {
    const res = await apiFetch("/auth/me", {
      headers: user ? { "x-user-id": user.id } : {},
    });
    const u = res.user || res;
    document.getElementById("profileName").textContent  = u.nama  || u.name  || "Pengguna";
    document.getElementById("profileEmail").textContent = u.email || "—";
    document.getElementById("profileJoin").innerHTML =
      `<i class="fa-regular fa-calendar"></i> Bergabung ${formatDate(u.created_at || u.join_date)}`;
  } catch {
    // Use cached data silently
  }

  // Show profile card
  document.getElementById("profileSkeleton").classList.add("hidden");
  document.getElementById("profileInfo").classList.remove("hidden");
}


// ══════════════════════════════════════
// STATISTIK
// ══════════════════════════════════════

function setStatValue(elId, value) {
  const el = document.getElementById(elId);
  // Animate count-up
  const target = Number(value);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 20));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 40);
}


// ══════════════════════════════════════
// ACTIVITY ITEM BUILDER
// ══════════════════════════════════════

function buildActivityItem({ id, gambar, nama, meta, badge }) {
  const item = document.createElement("div");
  item.className = "activity-item";
  item.onclick = () => (window.location.href = `detail.html?id=${id}`);
  item.innerHTML = `
    <div class="activity-img">
  ${gambar
    ? `<img
         src="https://web-production-aa9b5.up.railway.app/static/uploads/${gambar}"
         alt="${nama}"
         onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-image\\'></i>'"
       >`
    : `<i class="fa-solid fa-image"></i>`}
</div>
    <div class="activity-info">
      <p class="activity-name">${nama}</p>
      <p class="activity-meta">${meta}</p>
    </div>
    <span class="activity-badge">${badge}</span>
  `;
  return item;
}

function showEmpty(containerId, msg) {
  const el = document.getElementById(containerId);
  el.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-box-open"></i>
      <p>${msg}</p>
    </div>`;
}

function showPanelError(containerId, msg) {
  const el = document.getElementById(containerId);
  el.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <p>${msg}</p>
    </div>`;
}


// ══════════════════════════════════════
// RENDER PANELS
// ══════════════════════════════════════

async function loadWishlist() {
  try {
    const res = await apiGetWishlist();
    const list = res.data || res.wishlist || [];

    setStatValue("statWishlist", list.length);

    const panel = document.getElementById("panelWishlist");
    panel.innerHTML = "";

    if (!list.length) {
      showEmpty("panelWishlist", "Belum ada produk di wishlist");
      return;
    }

    list.slice(0, 4).forEach((item) => {
      const produk = item.produk || item;
      panel.appendChild(buildActivityItem({
        id:     produk.id,
        gambar: produk.gambar,
        nama:   produk.nama,
        meta:   formatRupiah(produk.harga),
        badge:  `<i class="fa-solid fa-heart"></i>`,
      }));
    });

  } catch (err) {
    setStatValue("statWishlist", 0);
    showPanelError("panelWishlist", "Gagal memuat wishlist");
    showToast("Gagal memuat data wishlist", "error");
  }
}


async function loadKeranjang() {
  try {
    const res = await apiGetKeranjang();
    const list = res.data || res.keranjang || [];

    setStatValue("statKeranjang", list.length);

    const panel = document.getElementById("panelKeranjang");
    panel.innerHTML = "";

    if (!list.length) {
      showEmpty("panelKeranjang", "Keranjang masih kosong");
      return;
    }

    list.slice(0, 4).forEach((item) => {
      const produk = item.produk || item;
      panel.appendChild(buildActivityItem({
        id:     produk.id,
        gambar: produk.gambar,
        nama:   produk.nama,
        meta:   `${item.jumlah || 1} item`,
        badge:  `× ${item.jumlah || 1}`,
      }));
    });

  } catch (err) {
    setStatValue("statKeranjang", 0);
    showPanelError("panelKeranjang", "Gagal memuat keranjang");
    showToast("Gagal memuat data keranjang", "error");
  }
}


async function loadRatings() {
  try {
    const res = await apiGetMyRatings();
    const list = res.data || res.ratings || [];

    setStatValue("statRating", list.length);

    const panel = document.getElementById("panelRating");
    panel.innerHTML = "";

    if (!list.length) {
      showEmpty("panelRating", "Belum ada produk yang dirating");
      return;
    }

    list.slice(0, 4).forEach((item) => {
      const produk = item.produk || item;
      panel.appendChild(buildActivityItem({
        id:     produk.id || item.produk_id,
        gambar: produk.gambar,
        nama:   produk.nama || "Produk",
        meta:   `Rating: ${item.nilai}/5`,
        badge:  `<span class="stars">${renderStars(item.nilai)}</span>`,
      }));
    });

  } catch (err) {
    setStatValue("statRating", 0);
    showPanelError("panelRating", "Gagal memuat data rating");
    showToast("Gagal memuat data rating", "error");
  }
}


// ══════════════════════════════════════
// RENDER REKOMENDASI
// ══════════════════════════════════════

async function loadRekomendasi() {
  const grid = document.getElementById("rekomendasiGrid");

  try {
    const res  = await apiGetRekomendasi();
    const list = res.data || res.rekomendasi || [];

    setStatValue("statRekomendasi", list.length);

    grid.innerHTML = "";

    if (!list.length) {
      grid.innerHTML = `
        <div class="rekom-empty">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <p>Belum ada rekomendasi. Coba beri rating pada beberapa produk!</p>
        </div>`;
      return;
    }

    list.forEach((item, i) => {
      const produk    = item.produk || item;
      const predicted = item.predicted_rating ?? item.prediksi ?? null;
      const sim       = item.similarity        ?? item.similaritas ?? null;

      const card = document.createElement("div");
      card.className = "rekom-card glass-card";
      card.style.animationDelay = `${i * 0.08}s`;
      card.style.animation = "fadeSlideUp 0.5s both";

      card.innerHTML = `
        <div class="rekom-img" style="overflow:hidden">
          ${produk.gambar
            ? `<img src="${produk.gambar}" alt="${produk.nama}" onerror="this.style.display='none'">`
            : `<i class="fa-solid fa-box-open"></i>`}
        </div>
        <div class="rekom-body">
          <span class="rekom-cat">${produk.kategori || "Kerajinan"}</span>
          <h3 class="rekom-name">${produk.nama || "Produk"}</h3>
          <p class="rekom-price">${formatRupiah(produk.harga || 0)}</p>
          <div class="rekom-metrics">
            ${predicted !== null
              ? `<span class="metric-chip">
                   <i class="fa-solid fa-star"></i> Prediksi ${Number(predicted).toFixed(1)}
                 </span>`
              : ""}
            ${sim !== null
              ? `<span class="metric-chip">
                   <i class="fa-solid fa-chart-simple"></i> Sim ${(Number(sim) * 100).toFixed(0)}%
                 </span>`
              : ""}
            ${produk.rating
              ? `<span class="metric-chip">
                   <i class="fa-solid fa-users"></i> ${Number(produk.rating).toFixed(1)}/5
                 </span>`
              : ""}
          </div>
        </div>
        <div class="rekom-footer">
          <button class="btn-detail" data-id="${produk.id}">
            Lihat Detail <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      `;

      // Click card or button → detail
      card.addEventListener("click", () => {
        window.location.href = `detail.html?id=${produk.id}`;
      });

      grid.appendChild(card);
    });

  } catch (err) {
    setStatValue("statRekomendasi", 0);
    grid.innerHTML = `
      <div class="rekom-empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Gagal memuat rekomendasi. Coba lagi nanti.</p>
      </div>`;
    showToast("Gagal memuat rekomendasi", "error");
  }
}


// ══════════════════════════════════════
// AUTH GUARD & BOOT
// ══════════════════════════════════════

async function boot() {
  const user = getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  initNavbar();

  // Fire all fetches in parallel
  await Promise.all([
    loadProfile(),
    loadWishlist(),
    loadKeranjang(),
    loadRatings(),
    loadRekomendasi(),
  ]);
}

document.addEventListener("DOMContentLoaded", boot);