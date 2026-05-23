/**
 * api.js
 * VERSI TANPA JWT
 * Frontend ↔ Flask API
 */

const BASE_URL = "https://web-production-aa9b5.up.railway.app/api";


// =====================================================
// HELPER
// =====================================================

// Ambil user login dari localStorage
const getUser = () => {
  return JSON.parse(
    localStorage.getItem("umkm_user") || "null"
  );
};

// Ambil user_id
const getUserId = () => {
  const user = getUser();
  return user ? user.id : null;
};


// =====================================================
// FETCH HELPER
// =====================================================

export async function apiFetch(endpoint, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json.message || "Terjadi kesalahan server."
    );
  }

  return json;
}


// =====================================================
// AUTH
// =====================================================

export async function apiLogin(
  email,
  password
){

  const data = await apiFetch(
    "/auth/login",
    {
      method:"POST",

      body:JSON.stringify({
        email,
        password
      })
    }
  );

  if(data.success){

    localStorage.setItem(
      "umkm_user",
      JSON.stringify(data.user)
    );
  }

  return data;
}


export async function apiRegister(nama, email, password) {

  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      nama,
      email,
      password,
    }),
  });

  if (data.success) {

    localStorage.setItem(
      "umkm_user",
      JSON.stringify(data.user)
    );
  }

  return data;
}


export function apiLogout() {

  localStorage.removeItem("umkm_user");

  window.location.href = "../../index.html";
}


// =====================================================
// PRODUK
// =====================================================

export async function apiGetProduk(params = {}) {

  const qs = new URLSearchParams(params).toString();

  return apiFetch(
    `/produk/${qs ? "?" + qs : ""}`
  );
}


export async function apiGetProdukDetail(produkId) {

  return apiFetch(`/produk/${produkId}`);
}


export async function apiGetKategori() {

  return apiFetch("/produk/kategori/list");
}


// =====================================================
// RATING
// =====================================================

export async function apiRate(produkId, nilai) {

  return apiFetch("/rating/", {
    method: "POST",

    body: JSON.stringify({
      user_id: getUserId(),
      produk_id: produkId,
      nilai,
    }),
  });
}


export async function apiGetMyRatings() {

  return apiFetch(
    `/rating/user?user_id=${getUserId()}`
  );
}


// =====================================================
// REKOMENDASI
// =====================================================

export async function apiGetRekomendasi() {

  return apiFetch(
    `/rekomendasi/?user_id=${getUserId()}`
  );
}


// =====================================================
// WISHLIST
// =====================================================

export async function apiGetWishlist() {

  return apiFetch(
    `/wishlist/?user_id=${getUserId()}`
  );
}


export async function apiAddWishlist(id) {

  return apiFetch("/wishlist/", {
    method: "POST",

    body: JSON.stringify({
      user_id: getUserId(),
      produk_id: id,
    }),
  });
}


export async function apiRemoveWishlist(id) {

  return apiFetch(
    `/wishlist/${id}?user_id=${getUserId()}`,
    {
      method: "DELETE",
    }
  );
}


// =====================================================
// KERANJANG
// =====================================================

export async function apiGetKeranjang() {

  return apiFetch(
    `/keranjang/?user_id=${getUserId()}`
  );
}


export async function apiAddKeranjang(id, jumlah = 1) {

  return apiFetch("/keranjang/", {
    method: "POST",

    body: JSON.stringify({
      user_id: getUserId(),
      produk_id: id,
      jumlah,
    }),
  });
}


export async function apiUpdateKeranjang(id, jumlah) {

  return apiFetch(`/keranjang/${id}`, {
    method: "PATCH",

    body: JSON.stringify({
      user_id: getUserId(),
      jumlah,
    }),
  });
}


export async function apiRemoveKeranjang(id) {

  return apiFetch(
    `/keranjang/${id}?user_id=${getUserId()}`,
    {
      method: "DELETE",
    }
  );
}


export async function apiKosongkanKeranjang() {

  return apiFetch(
    `/keranjang/?user_id=${getUserId()}`,
    {
      method: "DELETE",
    }
  );
}


