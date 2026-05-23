  // js/home.js

  import {
    apiGetProduk,
    apiGetKategori,
    apiGetRekomendasi,
    apiAddWishlist,
    apiAddKeranjang,
    apiLogout
  } from "./api.js";

  import {
    renderRekomendasiCard
  } from "./rekomendasi.js";

  /**
   * ELEMENT
   */

  const produkContainer =
    document.getElementById(
      "produkContainer"
    );

  const rekomendasiContainer =
    document.getElementById(
      "rekomendasiContainer"
    );

  const kategoriSelect =
    document.getElementById(
      "kategoriSelect"
    );

  const sortSelect =
    document.getElementById(
      "sortSelect"
    );

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  const loadingContainer =
    document.getElementById(
      "loadingContainer"
    );

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );

  const hamburger =
    document.getElementById(
      "hamburger"
    );

  const navLinks =
    document.getElementById(
      "navLinks"
    );

  /**
   * CHECK LOGIN
   */

  const user =
    JSON.parse(
      localStorage.getItem("umkm_user")
    );

  if (!user) {
    window.location.href =
      "../../index.html";
  }

  /**
   * NAVBAR MOBILE
   */

  hamburger.addEventListener(
    "click",
    () => {
      navLinks.classList.toggle("show");
    }
  );

  /**
   * LOGOUT
   */

  logoutBtn.addEventListener(
    "click",
    () => {
      apiLogout();
    }
  );

  /**
   * LOADING
   */

  function setLoading(show){

    if(show){
      loadingContainer.classList.remove(
        "hidden"
      );
    }else{
      loadingContainer.classList.add(
        "hidden"
      );
    }
  }

  /**
   * TOAST
   */

  function showToast(message){

    const toast =
      document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    },3000);
  }

  /**
   * RENDER PRODUK
   */

  function renderProdukCard(item){

    return `
      <div class="produk-card">

        <img
    src="${item.gambar_url}"
    alt="${item.nama}"
    class="produk-image"
  />

        <div class="produk-content">

          <span class="badge">
            ${item.kategori}
          </span>

          <h3 class="produk-title">
            ${item.nama}
          </h3>

          <div class="produk-price">
            Rp ${Number(item.harga)
              .toLocaleString("id-ID")}
          </div>

          <div class="produk-meta">
            ⭐ ${item.rating || 4.5}
          </div>

          <div class="produk-actions">

            <button
              class="btn btn-secondary detail-btn"
              data-id="${item.id}"
            >
              Detail
            </button>

            <button
              class="btn btn-secondary wishlist-btn"
              data-id="${item.id}"
            >
              ❤
            </button>

            <button
              class="btn btn-primary cart-btn"
              data-id="${item.id}"
            >
              +
            </button>

          </div>

        </div>

      </div>
    `;
  }

  /**
   * LOAD PRODUK
   */

  async function loadProduk(){

  try{

    setLoading(true);

    const kategori =
      kategoriSelect.value;

    const sort =
      sortSelect.value;

    const q =
      searchInput.value.trim();

    const params = {};

    if(kategori){
      params.kategori = kategori;
    }

    if(sort){
      params.sort = sort;
    }

    if(q){
      params.q = q;
    }

    const data =
      await apiGetProduk(params);

    const produk =
      data.data || [];

    console.log("gambar_url contoh:", produk[0]?.gambar_url); // ← tambah ini

    if(!produk.length){

      produkContainer.innerHTML = `
        <div class="empty-state">
          Produk tidak ditemukan.
        </div>
      `;

      return;
    }

    produkContainer.innerHTML =
      produk.map(renderProdukCard)
      .join("");

  }catch(error){

    showToast(
      error.message
    );

  }finally{
    setLoading(false);
  }
}

  /**
   * LOAD REKOMENDASI
   */

  async function loadRekomendasi() {
    try {
      const data = await apiGetRekomendasi();

      // ✅ Ganti data.data → data.recommendations
      const items = data.recommendations || [];

      if (!items.length) {
        rekomendasiContainer.innerHTML = `
          <div class="empty-state">
            Belum ada rekomendasi. Coba beri rating beberapa produk dulu.
          </div>
        `;
        return;
      }

      rekomendasiContainer.innerHTML =
        items.map(renderRekomendasiCard).join("");

    } catch (error) {
      rekomendasiContainer.innerHTML = `
        <div class="empty-state">
          Gagal memuat rekomendasi.
        </div>
      `;
      console.error("Rekomendasi error:", error); // ← tambah ini biar gampang debug
    }
  }

  /**
   * LOAD KATEGORI
   */

  async function loadKategori(){

    try{

      const data =
        await apiGetKategori();

      const kategori =
        data.data || [];

      kategori.forEach(item => {

        kategoriSelect.innerHTML += `
          <option value="${item}">
            ${item}
          </option>
        `;
      });

    }catch(error){

      console.log(error);
    }
  }

  /**
   * EVENT PRODUK
   */

  document.addEventListener(
    "click",
    async (e) => {

      const wishlistBtn =
        e.target.closest(".wishlist-btn");

      const cartBtn =
        e.target.closest(".cart-btn");

      const detailBtn =
        e.target.closest(".detail-btn");

      if(wishlistBtn){

        const id =
          wishlistBtn.dataset.id;

        try{

          await apiAddWishlist(id);

          showToast(
            "Produk ditambahkan ke wishlist."
          );

        }catch(error){

          showToast(error.message);
        }
      }

      if(cartBtn){

        const id =
          cartBtn.dataset.id;

        try{

          await apiAddKeranjang(id);

          showToast(
            "Produk ditambahkan ke keranjang."
          );

        }catch(error){

          showToast(error.message);
        }
      }

      if(detailBtn){

        const id =
          detailBtn.dataset.id;

          window.location.href = `../detail/detail.html?id=${id}`;
      }
    }
  );

  /**
   * SEARCH REALTIME
   */

  let searchTimeout;

  searchInput.addEventListener(
    "input",
    () => {

      clearTimeout(searchTimeout);

      searchTimeout = setTimeout(() => {
        loadProduk();
      },400);
    }
  );

  /**
   * FILTER
   */

  kategoriSelect.addEventListener(
    "change",
    loadProduk
  );

  sortSelect.addEventListener(
    "change",
    loadProduk
  );

  /**
   * HERO BUTTON
   */

  document.getElementById(
    "exploreBtn"
  ).addEventListener(
    "click",
    () => {

      window.scrollTo({
        top:700,
        behavior:"smooth"
      });
    }
  );

  /**
   * INIT
   */

  async function init(){

    await loadKategori();

    await loadProduk();

    await loadRekomendasi();
  }

  init();