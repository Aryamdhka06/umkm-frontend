const BASE_IMG = "https://web-production-aa9b5.up.railway.app/static/uploads/";

export function renderRekomendasiCard(item) {
  const gambar = item.gambar_url.startsWith("http")
    ? item.gambar_url
    : BASE_IMG + item.gambar_url;

  return `
    <div class="produk-card">
      <img
        src="${gambar}"
        class="produk-image"
        alt="${item.nama}"
      />
      <div class="produk-content">
        <span class="badge">AI Recommendation</span>
        <h3 class="produk-title">${item.nama}</h3>
        <div class="produk-price">
          Rp ${Number(item.harga).toLocaleString("id-ID")}
        </div>
        <div class="produk-meta">
          ⭐ ${item.predicted_rating ?? 0}
          • Similarity: ${item.similarity_score ?? 0}
        </div>
        <div class="produk-actions">
          <button
            class="btn btn-primary detail-btn"
            data-id="${item.produk_id}"
          >
            Detail
          </button>
        </div>
      </div>
    </div>
  `;
}