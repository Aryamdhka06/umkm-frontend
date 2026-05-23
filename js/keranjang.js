/**
 * keranjang.js
 * Logic halaman Keranjang Belanja UMKM Kerajinan
 *
 * Disesuaikan dengan response backend:
 * GET /keranjang/ → { success, data: [ { produk_id, nama, harga, gambar_url, stok, jumlah, subtotal } ], total_harga }
 * PATCH /keranjang/<produk_id>
 * DELETE /keranjang/<produk_id>?user_id=
 * DELETE /keranjang/?user_id=
 */

import {
  apiLogout,
  apiGetKeranjang,
  apiUpdateKeranjang,
  apiRemoveKeranjang,
  apiKosongkanKeranjang,
} from "./api.js";

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────

let cartItems = [];       // array flat dari data.data backend
let pendingConfirm = null;

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  guardAuth();
  initNavbar();
  initLogout();
  initHamburger();
  initDialog();
  loadCart();
});

function guardAuth() {
  const user = JSON.parse(localStorage.getItem("umkm_user") || "null");
  if (!user) window.location.href = "../../index.html";
}

// ─────────────────────────────────────────
// NAVBAR SCROLL
// ─────────────────────────────────────────

function initNavbar() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────

function initLogout() {
  document.getElementById("btnLogout").addEventListener("click", apiLogout);
}

// ─────────────────────────────────────────
// HAMBURGER
// ─────────────────────────────────────────

function initHamburger() {
  const btn   = document.getElementById("hamburger");
  const links = document.getElementById("navLinks");
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    links.classList.toggle("open");
  });
}

// ─────────────────────────────────────────
// DIALOG KONFIRMASI
// ─────────────────────────────────────────

function initDialog() {
  document.getElementById("dialogCancel").addEventListener("click", closeDialog);
  document.getElementById("dialogConfirm").addEventListener("click", () => {
    if (typeof pendingConfirm === "function") pendingConfirm();
    closeDialog();
  });
  document.getElementById("dialogOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDialog();
  });
}

function openDialog({ title, sub, onConfirm }) {
  document.getElementById("dialogTitle").textContent = title;
  document.getElementById("dialogSub").textContent   = sub;
  pendingConfirm = onConfirm;
  document.getElementById("dialogOverlay").style.display = "flex";
}

function closeDialog() {
  document.getElementById("dialogOverlay").style.display = "none";
  pendingConfirm = null;
}

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────

function showToast(message, type = "info") {
  const icons = {
    success: "fa-circle-check",
    error:   "fa-circle-exclamation",
    info:    "fa-bell",
  };
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="toast-icon fa-solid ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.4s, transform 0.4s";
    toast.style.opacity    = "0";
    toast.style.transform  = "translateX(40px)";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─────────────────────────────────────────
// FORMAT RUPIAH
// ─────────────────────────────────────────

function formatRupiah(angka) {
  return "Rp " + Number(angka).toLocaleString("id-ID");
}

// ─────────────────────────────────────────
// LOAD CART
// ─────────────────────────────────────────

async function loadCart() {
  try {
    const resp = await apiGetKeranjang();

    // Backend return: { success: true, data: [...], total_harga: 0 }
    cartItems = resp.data || [];

    renderCart();
  } catch (err) {
    showToast("Gagal memuat keranjang: " + err.message, "error");
    renderEmptyState();
  }
}

// ─────────────────────────────────────────
// RENDER CART
// ─────────────────────────────────────────

function renderCart() {
  const list = document.getElementById("cartItemsList");

  if (!cartItems.length) {
    renderEmptyState();
    return;
  }

  document.getElementById("btnClearAll").style.display = "flex";
  document.getElementById("btnClearAll").onclick = confirmClearAll;

  list.innerHTML = cartItems.map((item, idx) => buildItemHTML(item, idx)).join("");

  updateSummary();
  updateNavBadge();
  attachItemEvents();

  const n = cartItems.length;
  document.getElementById("headerSubText").textContent =
    n === 1 ? "1 jenis produk di keranjang Anda"
            : `${n} jenis produk di keranjang Anda`;
  document.getElementById("totalItemsBadge").textContent = n;
  document.getElementById("btnCheckout").disabled = false;
}

// ─────────────────────────────────────────
// BUILD ITEM HTML
//
// Struktur item dari backend (flat, tidak nested):
// {
//   produk_id, nama, harga, gambar_url,
//   stok, jumlah, subtotal
// }
// Identifier untuk PATCH/DELETE = produk_id
// ─────────────────────────────────────────

function buildItemHTML(item, idx) {
  const produkId = item.produk_id;
  const nama     = item.nama     || "Produk";
  const harga    = item.harga    || 0;
  const stok     = item.stok     ?? 99;
  const jumlah   = item.jumlah   || 1;
  const subtotal = item.subtotal ?? harga * jumlah;
const gambar = item.gambar_url
  ? `https://web-production-aa9b5.up.railway.app/static/uploads/${item.gambar_url}`
  : "";

const imgHTML = `
  <img
    src="${gambar}"
    alt="${nama}"
    class="produk-image"
    loading="lazy"
  />
`;

  const stockClass = stok === 0 ? "out" : stok <= 5 ? "low" : "";
  const stockText  = stok === 0 ? "Stok habis"
                   : stok <= 5  ? `Sisa ${stok} item`
                   : `Stok: ${stok}`;

  const minDisabled = jumlah <= 1    ? "disabled" : "";
  const maxDisabled = jumlah >= stok ? "disabled" : "";

  return `
    <div class="cart-item"
         data-produk-id="${produkId}"
         data-harga="${harga}"
         data-stok="${stok}"
         style="animation-delay:${idx * 0.06}s">

      <div class="item-img-wrap"
           onclick="window.location.href='detail.html?id=${produkId}'">
        ${imgHTML}
      </div>

      <div class="item-info">
        <span class="item-name"
              onclick="window.location.href='detail.html?id=${produkId}'">${nama}</span>
        <span class="item-price">${formatRupiah(harga)}</span>
        <span class="item-stock">
          <span class="stock-dot ${stockClass}"></span>
          ${stockText}
        </span>
      </div>

      <div class="item-controls">
        <div class="qty-group">
          <button class="qty-btn btn-minus" ${minDisabled} title="Kurangi">
            <i class="fa-solid fa-minus" style="font-size:10px"></i>
          </button>
          <span class="qty-value">${jumlah}</span>
          <button class="qty-btn btn-plus" ${maxDisabled} title="Tambah">
            <i class="fa-solid fa-plus" style="font-size:10px"></i>
          </button>
        </div>

        <div>
          <span class="subtotal-label">Subtotal</span>
          <span class="item-subtotal">${formatRupiah(subtotal)}</span>
        </div>

        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
          <button class="btn-detail-item"
                  onclick="window.location.href='detail.html?id=${produkId}'">
            <i class="fa-regular fa-eye"></i> Detail
          </button>
          <button class="btn-remove-item">
            <i class="fa-solid fa-trash-can"></i> Hapus
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// ATTACH EVENTS
// ─────────────────────────────────────────

function attachItemEvents() {
  document.querySelectorAll(".cart-item").forEach((row) => {
    // Gunakan produk_id sebagai identifier (bukan id/keranjang_id)
    const produkId = row.dataset.produkId;
    const harga    = Number(row.dataset.harga);
    const stok     = Number(row.dataset.stok);

    const qtyVal  = row.querySelector(".qty-value");
    const btnMin  = row.querySelector(".btn-minus");
    const btnPlus = row.querySelector(".btn-plus");
    const btnDel  = row.querySelector(".btn-remove-item");

    btnMin.addEventListener("click", () => {
      const cur = parseInt(qtyVal.textContent);
      if (cur <= 1) return;
      updateQty(row, produkId, harga, stok, cur - 1, btnMin);
    });

    btnPlus.addEventListener("click", () => {
      const cur = parseInt(qtyVal.textContent);
      if (cur >= stok) return;
      updateQty(row, produkId, harga, stok, cur + 1, btnPlus);
    });

    btnDel.addEventListener("click", () => {
      confirmRemoveItem(produkId, row);
    });
  });
}

// ─────────────────────────────────────────
// UPDATE QUANTITY
// PATCH /api/keranjang/<produk_id>
// ─────────────────────────────────────────

async function updateQty(row, produkId, harga, stok, newJumlah, clickedBtn) {
  const qtyVal  = row.querySelector(".qty-value");
  const btnMin  = row.querySelector(".btn-minus");
  const btnPlus = row.querySelector(".btn-plus");
  const subEl   = row.querySelector(".item-subtotal");

  clickedBtn.classList.add("spin");
  setTimeout(() => clickedBtn.classList.remove("spin"), 200);

  // Optimistic UI
  const prevJumlah = parseInt(qtyVal.textContent);
  qtyVal.textContent = newJumlah;
  qtyVal.classList.add("updating");
  subEl.textContent  = formatRupiah(harga * newJumlah);
  btnMin.disabled    = newJumlah <= 1;
  btnPlus.disabled   = newJumlah >= stok;

  // Sync state array
  const item = cartItems.find((i) => String(i.produk_id) === String(produkId));
  if (item) {
    item.jumlah   = newJumlah;
    item.subtotal = harga * newJumlah;
  }

  updateSummary();
  updateNavBadge();

  try {
    await apiUpdateKeranjang(produkId, newJumlah);
    showToast("Jumlah item diperbarui", "success");
  } catch (err) {
    showToast("Gagal memperbarui: " + err.message, "error");
    // Rollback
    if (item) {
      item.jumlah   = prevJumlah;
      item.subtotal = harga * prevJumlah;
    }
    qtyVal.textContent = prevJumlah;
    subEl.textContent  = formatRupiah(harga * prevJumlah);
    btnMin.disabled    = prevJumlah <= 1;
    btnPlus.disabled   = prevJumlah >= stok;
    updateSummary();
    updateNavBadge();
  } finally {
    qtyVal.classList.remove("updating");
  }
}

// ─────────────────────────────────────────
// REMOVE ITEM
// DELETE /api/keranjang/<produk_id>?user_id=
// ─────────────────────────────────────────

function confirmRemoveItem(produkId, row) {
  const nama = row.querySelector(".item-name")?.textContent || "produk ini";
  openDialog({
    title: "Hapus Item?",
    sub:   `"${nama}" akan dihapus dari keranjang.`,
    onConfirm: () => doRemoveItem(produkId, row),
  });
}

async function doRemoveItem(produkId, row) {
  row.classList.add("removing");
  try {
    await apiRemoveKeranjang(produkId);
    cartItems = cartItems.filter((i) => String(i.produk_id) !== String(produkId));

    setTimeout(() => {
      row.remove();
      updateSummary();
      updateNavBadge();

      const n = cartItems.length;
      document.getElementById("totalItemsBadge").textContent = n;
      document.getElementById("headerSubText").textContent =
        n === 0 ? "Keranjang Anda kosong"
        : n === 1 ? "1 jenis produk di keranjang Anda"
        : `${n} jenis produk di keranjang Anda`;

      if (!n) renderEmptyState();
      showToast("Item berhasil dihapus", "success");
    }, 380);
  } catch (err) {
    row.classList.remove("removing");
    showToast("Gagal menghapus item: " + err.message, "error");
  }
}

// ─────────────────────────────────────────
// CLEAR ALL
// DELETE /api/keranjang/?user_id=
// ─────────────────────────────────────────

function confirmClearAll() {
  openDialog({
    title: "Kosongkan Keranjang?",
    sub:   "Semua item akan dihapus dari keranjang. Tindakan ini tidak dapat dibatalkan.",
    onConfirm: doClearAll,
  });
}

async function doClearAll() {
  try {
    await apiKosongkanKeranjang();
    cartItems = [];
    showToast("Keranjang berhasil dikosongkan", "info");
    renderEmptyState();
    updateNavBadge();
  } catch (err) {
    showToast("Gagal mengosongkan keranjang: " + err.message, "error");
  }
}

// ─────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────

function renderEmptyState() {
  const layout = document.getElementById("cartLayout");

  document.getElementById("cartSummary").style.display = "none";
  document.getElementById("itemsPanel").style.display  = "none";
  document.getElementById("btnClearAll").style.display = "none";
  document.getElementById("btnCheckout").disabled      = true;

  document.getElementById("headerSubText").textContent   = "Keranjang Anda masih kosong";
  document.getElementById("totalItemsBadge").textContent = "0";

  const old = document.getElementById("emptyState");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id        = "emptyState";
  div.className = "empty-state";
  div.innerHTML = `
    <div class="empty-orb"></div>
    <div class="empty-icon"><i class="fa-solid fa-cart-shopping"></i></div>
    <h2 class="empty-title">Keranjang Kosong</h2>
    <p class="empty-sub">
      Belum ada produk di keranjang Anda.<br>
      Yuk, temukan kerajinan tangan istimewa untuk Anda!
    </p>
    <a href="produk.html" class="btn-shop">
      <i class="fa-solid fa-store"></i> Mulai Belanja Sekarang
    </a>
  `;
  layout.appendChild(div);
}

// ─────────────────────────────────────────
// UPDATE SUMMARY
// Pakai field dari item flat: item.harga, item.jumlah
// ─────────────────────────────────────────

function updateSummary() {
  const totalItem  = cartItems.reduce((s, i) => s + (i.jumlah || 1), 0);
  const totalHarga = cartItems.reduce((s, i) => s + (i.harga || 0) * (i.jumlah || 1), 0);

  document.getElementById("summaryTotalItem").textContent = `${totalItem} item`;
  document.getElementById("summarySubtotal").textContent  = formatRupiah(totalHarga);
  document.getElementById("summaryTotal").textContent     = formatRupiah(totalHarga);
  document.getElementById("btnCheckout").disabled         = totalItem === 0;
}

// ─────────────────────────────────────────
// NAV BADGE
// ─────────────────────────────────────────

function updateNavBadge() {
  const total = cartItems.reduce((s, i) => s + (i.jumlah || 1), 0);
  const badge = document.getElementById("navCartBadge");
  if (total > 0) {
    badge.style.display = "flex";
    badge.textContent   = total > 99 ? "99+" : total;
  } else {
    badge.style.display = "none";
  }
}