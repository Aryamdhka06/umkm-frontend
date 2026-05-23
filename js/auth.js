/**
 * auth.js — UMKM Kerajinan
 * Split-panel Login / Register logic
 */

import { apiLogin, apiRegister } from "./api.js";
const HOME = "frontend/pages/home/index.html";

// ── AUTO REDIRECT ──
if (localStorage.getItem("umkm_user")) window.location.replace(HOME);

// ── PANEL REFS ──
const loginPanel    = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");
const rpLogin       = document.getElementById("rpLogin");
const rpRegister    = document.getElementById("rpRegister");

// ── PANEL SWITCH ──
function showLogin() {
  if (!loginPanel.classList.contains("hidden")) return;
  registerPanel.classList.add("hidden");
  rpRegister.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  rpLogin.classList.remove("hidden");
  loginPanel.style.animation = "none";
  rpLogin.style.animation = "none";
  requestAnimationFrame(() => {
    loginPanel.style.animation = "";
    rpLogin.style.animation = "";
  });
  clearAll();
}

function showRegister() {
  if (!registerPanel.classList.contains("hidden")) return;
  loginPanel.classList.add("hidden");
  rpLogin.classList.add("hidden");
  registerPanel.classList.remove("hidden");
  rpRegister.classList.remove("hidden");
  registerPanel.style.animation = "none";
  rpRegister.style.animation = "none";
  requestAnimationFrame(() => {
    registerPanel.style.animation = "";
    rpRegister.style.animation = "";
  });
  clearAll();
}

document.getElementById("goRegister").addEventListener("click", showRegister);
document.getElementById("goLogin").addEventListener("click", showLogin);

// ── EYE TOGGLE ──
document.querySelectorAll(".btn-eye").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const hide  = input.type === "password";
    input.type  = hide ? "text" : "password";
    btn.querySelector("i").className = hide ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  });
});

// ── REMEMBER ME ──
const loginEmailInput = document.getElementById("loginEmail");
const rememberCb      = document.getElementById("rememberMe");
const saved           = localStorage.getItem("remember_email");
if (saved && loginEmailInput) {
  loginEmailInput.value = saved;
  if (rememberCb) rememberCb.checked = true;
}

// ── PASSWORD STRENGTH ──
const regPwInput = document.getElementById("regPassword");
const pwFill     = document.getElementById("pwFill");
const pwLabel    = document.getElementById("pwLabel");

if (regPwInput) {
  regPwInput.addEventListener("input", () => {
    const s = calcStrength(regPwInput.value);
    const levels = [
      { w:"0%",   bg:"transparent",                             label:"Kekuatan password", color:"var(--text-muted)" },
      { w:"28%",  bg:"#E05C5C",                                 label:"Lemah",             color:"#E05C5C" },
      { w:"55%",  bg:"#E8943A",                                 label:"Sedang",            color:"#E8943A" },
      { w:"80%",  bg:"#E8C43A",                                 label:"Kuat",              color:"#E8C43A" },
      { w:"100%", bg:"linear-gradient(90deg,#5CC98A,#E8B84B)",  label:"Sangat Kuat",       color:"#5CC98A" },
    ];
    const lv = levels[s];
    pwFill.style.width      = lv.w;
    pwFill.style.background = lv.bg;
    pwLabel.textContent     = lv.label;
    pwLabel.style.color     = lv.color;
  });
}

function calcStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

// ── HELPERS ──
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function setError(id, has) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("error", has);
}

function clearAll() {
  document.querySelectorAll("input").forEach(el => el.classList.remove("error"));
  document.querySelectorAll(".form-msg").forEach(el => {
    el.style.display = "none";
    el.innerHTML = "";
    el.className = "form-msg";
  });
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `form-msg ${type}`;
  const icon = type === "error" ? "fa-circle-exclamation" : "fa-circle-check";
  el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${text}</span>`;
  el.style.display = "flex";
}

function showToast(msg, type = "info") {
  const stack = document.getElementById("toastStack");
  const t     = document.createElement("div");
  const icons = { success:"fa-circle-check", error:"fa-circle-xmark", info:"fa-circle-info" };
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
  stack.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 380); }, 3500);
}

function setLoading(btnId, on) {
  const btn    = document.getElementById(btnId);
  const text   = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled         = on;
  text.style.display   = on ? "none" : "flex";
  loader.style.display = on ? "flex" : "none";
}

// ── CLEAR ERROR ON TYPE ──
["loginEmail","loginPassword","regNama","regEmail","regPassword","regConfirm"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => setError(id, false));
});

// ══════════════════════════════
//  LOGIN
// ══════════════════════════════
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  let ok = true;
  if (!email)    { setError("loginEmail", true);    ok = false; }
  if (!password) { setError("loginPassword", true); ok = false; }
  if (!ok) { showMsg("loginMsg", "error", "Email dan password wajib diisi."); return; }
  if (!validateEmail(email)) { setError("loginEmail", true); showMsg("loginMsg", "error", "Format email tidak valid."); return; }
  if (password.length < 6)   { setError("loginPassword", true); showMsg("loginMsg", "error", "Password minimal 6 karakter."); return; }

  setLoading("loginBtn", true);
  try {
    const res = await apiLogin(email, password);
    if (res.success) {
      if (rememberCb?.checked) localStorage.setItem("remember_email", email);
      else localStorage.removeItem("remember_email");
      showMsg("loginMsg", "success", `Selamat datang, ${res.user?.nama || ""}! Mengalihkan…`);
      showToast("Login berhasil! Selamat datang.", "success");
      setTimeout(() => window.location.replace(HOME), 950);
    } else {
      showMsg("loginMsg", "error", res.message || "Login gagal. Coba lagi.");
      setError("loginEmail", true);
      setError("loginPassword", true);
    }
  } catch (err) {
    showMsg("loginMsg", "error", err.message || "Gagal terhubung ke server.");
    showToast(err.message || "Server tidak merespons.", "error");
  } finally {
    setLoading("loginBtn", false);
  }
});

// ══════════════════════════════
//  REGISTER
// ══════════════════════════════
document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const nama     = document.getElementById("regNama").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm  = document.getElementById("regConfirm").value;

  let ok = true;
  if (!nama)     { setError("regNama", true);     ok = false; }
  if (!email)    { setError("regEmail", true);    ok = false; }
  if (!password) { setError("regPassword", true); ok = false; }
  if (!confirm)  { setError("regConfirm", true);  ok = false; }
  if (!ok) { showMsg("registerMsg", "error", "Semua field wajib diisi."); return; }

  if (nama.length < 2)            { setError("regNama", true);     showMsg("registerMsg", "error", "Nama minimal 2 karakter."); return; }
  if (!validateEmail(email))      { setError("regEmail", true);    showMsg("registerMsg", "error", "Format email tidak valid."); return; }
  if (password.length < 8)        { setError("regPassword", true); showMsg("registerMsg", "error", "Password minimal 8 karakter."); return; }
  if (calcStrength(password) < 2) { showToast("Password terlalu lemah — tambahkan angka atau huruf kapital.", "info"); return; }
  if (password !== confirm)       { setError("regConfirm", true);  showMsg("registerMsg", "error", "Konfirmasi password tidak cocok."); return; }

  setLoading("registerBtn", true);
  try {
    const res = await apiRegister(nama, email, password);
    if (res.success) {
      showMsg("registerMsg", "success", "Akun berhasil dibuat! Mengalihkan…");
      showToast("Registrasi berhasil! Selamat bergabung.", "success");
      setTimeout(() => window.location.replace(HOME), 950);
    } else {
      showMsg("registerMsg", "error", res.message || "Registrasi gagal. Coba lagi.");
    }
  } catch (err) {
    showMsg("registerMsg", "error", err.message || "Gagal terhubung ke server.");
    showToast(err.message || "Server tidak merespons.", "error");
  } finally {
    setLoading("registerBtn", false);
  }
});