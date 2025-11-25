// ==================== GROCERY PAGE JS — PART 1/3 ====================
// This is the full rewrite. DO NOT REMOVE ANYTHING. 
// Paste this at the TOP of groceries.js before adding PART 2 and PART 3.

// ==================== FIREBASE IMPORTS ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection, doc, setDoc, getDoc, getDocs,
  serverTimestamp, onSnapshot, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// ==================== HEADER LOADER ====================
(async () => {
  try {
    const response = await fetch('/header.html');
    if (!response.ok) throw new Error('Failed to load header');
    let html = await response.text();

    const pageTitle = "Groceries";

    html = html.replace(
      /<h1[^>]*>.*?<\/h1>/i,
      `<h1 style="margin:0;font-weight:bold;color:#c12872;font-size:24px;position:absolute;left:50%;transform:translateX(-50%);">${pageTitle}</h1>`
    );

    const placeholder = document.getElementById('header-placeholder');
    if (placeholder) {
      placeholder.innerHTML = html;

      document.querySelectorAll('#header-placeholder script').forEach(oldScript => {
        const s = document.createElement('script');
        if (oldScript.src) s.src = oldScript.src;
        else s.textContent = oldScript.textContent;
        document.body.appendChild(s);
      });
    }
  } catch (err) {
    console.error(err);
  }
})();

// ==================== BODY INITIAL VISIBILITY ====================
document.documentElement.style.background = "#fff";
if (document.body) {
  document.body.classList.add("hide-initial");
}

// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyB2L649fIs0CS-fGDC0ybFeAO5Im5BEP_c",
  authDomain: "pickmeservicesonline.firebaseapp.com",
  projectId: "pickmeservicesonline",
  storageBucket: "pickmeservicesonline.firebasestorage.app",
  messagingSenderId: "265031616239",
  appId: "1:265031616239:web:e2ef418704af5595aa7d1a"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const storage = getStorage(app);

// ==================== CONSTANTS ====================
const ADMIN_CODE = "123456";
const SERVICE_FEE_DEFAULT  = 0;
const DELIVERY_FEE_DEFAULT = 0;

// ==================== FIRESTORE COLLECTIONS ====================
const linksCol   = collection(db, "Groceries", "Links", "items");
const numbersCol = collection(db, "Groceries", "Numbers", "items");
const pendingShopsItemsCol = collection(
  db, "Groceries", "Shops", "items", "_pendingShops", "items"
);

function shopCatalogCollection(slug){
  return collection(db, "Groceries", "Shops", "items", slug, "catalog");
}

// ==================== STATIC SHOP LIST ====================
const GROCERY_DATA = [
  {
    name: "E&G Supermarket",
    slogan: "Everything household & fresh",
    category: "Supermarkets",
    heroImage: "https://lh3.googleusercontent.com/d/1rfAPWnEAa4kpCEUyldYl5KEkjXE48QYV",
    samples: [
      "https://via.placeholder.com/1000x600?text=Rice+Bags",
      "https://via.placeholder.com/1000x600?text=Canned+Foods",
      "https://via.placeholder.com/1000x600?text=Beverages",
      "https://via.placeholder.com/1000x600?text=Toiletries"
    ],
    phone: "233201234567"
  },
  {
    name: "FreshMart Store",
    slogan: "Your daily essentials",
    category: "Stores",
    heroImage: "https://via.placeholder.com/1200x700?text=FreshMart+Store",
    samples: [
      "https://via.placeholder.com/1000x600?text=Cooking+Oil",
      "https://via.placeholder.com/1000x600?text=Bread+%26+Eggs",
      "https://via.placeholder.com/1000x600?text=Soap+%26+Detergents"
    ],
    phone: "233209876543"
  },
  {
    name: "Kumasi Central Market",
    slogan: "All your perishables",
    category: "Market",
    heroImage: "https://via.placeholder.com/1200x700?text=Kumasi+Market",
    samples: [
      "https://via.placeholder.com/1000x600?text=Tomatoes",
      "https://via.placeholder.com/1000x600?text=Plantain",
      "https://via.placeholder.com/1000x600?text=Yam",
      "https://via.placeholder.com/1000x600?text=Pepper"
    ],
    phone: "233551112223"
  }
];

// ==================== DOM ELEMENTS ====================
const cardsContainer  = document.getElementById("cardsContainer");
const searchInput     = document.getElementById("searchInput");
const tabs            = document.querySelectorAll(".tab");

const detailsPanel  = document.getElementById("detailsPanel");
const detailsBackBtn= document.getElementById("detailsBackBtn");
const detailsBanner = document.getElementById("detailsBanner");
const shopNameEl    = document.getElementById("shopName");
const shopSloganEl  = document.getElementById("shopSlogan");
const carouselEl    = document.getElementById("carousel");
const dotsEl        = document.getElementById("dots");
const openFormBtn   = document.getElementById("openFormBtn");

// ============= FORMS & MODALS =============
const formModal     = document.getElementById("formModal");
const itemsHolder   = document.getElementById("itemsHolder");
const addRowBtn     = document.getElementById("addRowBtn");
const customerNameInput = document.getElementById("customerName");
const customerPhoneInput= document.getElementById("customerPhone");
const submitBtn     = document.getElementById("submitBtn");
const cancelBtn     = document.getElementById("cancelBtn");
const formError     = document.getElementById("formError");

// CHOOSE MODE MODAL
const chooseModeModal    = document.getElementById("chooseModeModal");
const modeTypeBtn        = document.getElementById("modeTypeBtn");
const modeSelectBtn      = document.getElementById("modeSelectBtn");
const modeCancelBtn      = document.getElementById("modeCancelBtn");

// CATALOG MODAL
const catalogModal        = document.getElementById("catalogModal");
const catalogSearchInput  = document.getElementById("catalogSearch");
const catalogListEl       = document.getElementById("catalogList");
const catalogSelectedCount= document.getElementById("catalogSelectedCount");
const catalogCancelBtn    = document.getElementById("catalogCancelBtn");
const catalogDoneBtn      = document.getElementById("catalogDoneBtn");
// ==================== SHOP MODAL DOM ====================
const openShopBtn      = document.getElementById("openShopBtn");
const shopModal        = document.getElementById("shopModal");
const shopSubmitBtn    = document.getElementById("shopSubmitBtn");
const shopCancelBtn    = document.getElementById("shopCancelBtn");
const ownerNameInput   = document.getElementById("ownerName");
const ownerPhoneInput  = document.getElementById("ownerPhone");
const shopNameInput    = document.getElementById("shopNameInput");
const shopSloganInput  = document.getElementById("shopSloganInput");
const shopShortDesc    = document.getElementById("shopShortDesc");
const shopCategorySel  = document.getElementById("shopCategory");
const shopPlanSel      = document.getElementById("shopPlan");
const shopMainImage    = document.getElementById("shopMainImage");
const shopSampleImages = document.getElementById("shopSampleImages");
const shopError        = document.getElementById("shopError");

// ==================== WAITING MODAL DOM ====================
const waitingModal       = document.getElementById("waitingModal");
const waitingDots        = document.getElementById("waitingDots");
const waitingProgressBar = document.getElementById("waitingProgressBar");
const waitingCounter     = document.getElementById("waitingCounter");
const waitingBtn         = document.getElementById("waitingBtn");

// ==================== ADMIN & CUSTOMER PANELS (CONTAINERS) ====================
const adminPanel      = document.getElementById("adminPanel");
const customerPanel   = document.getElementById("customerPanel");

// ==================== STATE ====================
let currentShop = null;
let currentAdmin = null;
let buyersCountMap = {};  // shopSlug -> count of trusted buyers
let adminDocId = null;
let waitingDotsTimer = null;
let waitingUnsub = null;
let currentOrderId = null;

let currentCatalogItems = [];
let selectedCatalogIds = new Set();

// ==================== HELPERS ====================
function escapeHtml(s){
  return String(s || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
function escapeAttr(s){
  return String(s || "")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
function money(n){
  return Number(n || 0);
}

function slugify(name){
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
}

function shopKeyStorage(shop){
  return `pkm_grocery_items_${shop}`;
}

function serializeItems(){
  return [...itemsHolder.querySelectorAll(".item-card")].map(row => ({
    name: (row.querySelector(".item-name").value || "").trim(),
    qty:  parseInt(row.querySelector(".qty-input").value || "1", 10) || 1
  }));
}
function loadItemsForShop(shopName){
  itemsHolder.innerHTML = "";
  try {
    const raw = sessionStorage.getItem(shopKeyStorage(shopName));
    const arr = raw ? JSON.parse(raw) : [];
    if (arr.length){
      arr.forEach(it => addRow(it.name, String(it.qty)));
    }
  } catch {}
}
function saveItemsForShop(shopName){
  try {
    sessionStorage.setItem(
      shopKeyStorage(shopName),
      JSON.stringify(serializeItems())
    );
  } catch {}
}

function normalizeGhanaNumber(input){
  let s = String(input || "").trim().replace(/[\s\-]/g,"");
  if (!s) return null;

  if (s.startsWith("+233")) return { e164: s };
  if (s.startsWith("233"))  return { e164: "+" + s };
  if (/^0\d{9}$/.test(s))   return { e164: "+233" + s.slice(1) };
  if (/^\d{9}$/.test(s))    return { e164: "+233" + s };

  const d = s.replace(/\D/g,'');
  if (d.startsWith("233"))              return { e164: "+" + d };
  if (d.length === 10 && d.startsWith("0")) return { e164: "+233" + d.slice(1) };

  return null;
}

// ==================== TRUSTED BUYERS ====================
async function markTrustedBuyer(shopName, phoneE164){
  try {
    if (!shopName || !phoneE164) return;
    const slug   = slugify(shopName);
    const digits = phoneE164.replace(/[^\d]/g,"");
    const id     = `${slug}__${digits}`;
    await setDoc(doc(numbersCol, id), {
      whatsapp: phoneE164,
      timestamp: serverTimestamp()
    });
  } catch (e){
    console.error("markTrustedBuyer error", e);
  }
}

async function loadTrustedCounts(){
  try {
    const snap   = await getDocs(numbersCol);
    const counts = {};
    snap.forEach(d => {
      const id  = d.id || "";
      const idx = id.indexOf("__");
      if (idx === -1) return;
      const slug = id.slice(0, idx);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    buyersCountMap = counts;
  } catch (e){
    console.error("loadTrustedCounts error", e);
  }
}

// ==================== SHORT LINKS (Links/items) ====================
function makeId(){
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  ).toLowerCase();
}

async function putShort(payload){
  const id = makeId();
  try {
    await setDoc(doc(linksCol, id), {
      payload,
      createdAt: serverTimestamp()
    });
    return id;
  } catch (e){
    console.error("putShort error:", e);
    alert("Unable to save data. Please check your internet and try again.");
    throw e;
  }
}

async function getShort(id){
  try {
    const snap = await getDoc(doc(linksCol, id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.payload || null;
  } catch (e){
    console.error("getShort error:", e);
    return null;
  }
}

// ==================== SHOP CATALOG (per shop items) ====================
async function syncShopCatalog(shopName, items){
  try {
    if (!shopName) return;
    const slug  = slugify(shopName);
    const colRef = shopCatalogCollection(slug);

    const snap = await getDocs(colRef);
    const existing = {};
    snap.forEach(ds => {
      const d = ds.data();
      if (!d || !d.name) return;
      const key = d.name.trim().toLowerCase();
      existing[key] = true;
    });

    const writes = [];

    items.forEach(it => {
      const key = (it.name || "").trim().toLowerCase();
      if (!key) return;

      const wasSavedBefore = !!existing[key];
      const isAvailableNow = !!it.available;
      const hasPrice       = it.price != null;

      // first time: only save if available + price is set
      if (!wasSavedBefore && !(isAvailableNow && hasPrice)) return;

      const payload = {
        name: it.name,
        lastAvailable: isAvailableNow,
        updatedAt: serverTimestamp()
      };
      if (isAvailableNow && hasPrice){
        payload.lastPrice = money(it.price);
      }

      writes.push(
        setDoc(doc(colRef, key), payload, { merge: true })
      );
    });

    if (writes.length){
      await Promise.all(writes);
    }
  } catch (e){
    console.error("syncShopCatalog error", e);
  }
}

async function fetchShopCatalog(shopName){
  if (!shopName) return [];
  const slug  = slugify(shopName);
  const colRef = shopCatalogCollection(slug);
  const snap = await getDocs(colRef);
  const list = [];

  snap.forEach(ds => {
    const d = ds.data();
    if (!d || !d.name) return;
    list.push({
      id: ds.id,
      name: d.name,
      lastPrice: d.lastPrice ?? null,
      lastAvailable: d.lastAvailable ?? true
    });
  });

  list.sort((a,b)=>{
    if (a.lastAvailable !== b.lastAvailable){
      return a.lastAvailable ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return list;
}

// ==================== RENDER SHOP CARDS ====================
function renderCards(activeCategory = "All", term = ""){
  if (!cardsContainer) return;

  cardsContainer.innerHTML = "";
  const q = (term || "").trim().toLowerCase();

  const data = [...GROCERY_DATA].sort((a,b)=>{
    const sa = slugify(a.name);
    const sb = slugify(b.name);
    const ca = buyersCountMap[sa] || 0;
    const cb = buyersCountMap[sb] || 0;
    if (cb !== ca) return cb - ca;
    return a.name.localeCompare(b.name);
  });

  data.forEach(shop => {
    if (activeCategory !== "All" && shop.category !== activeCategory) return;
    if (q && !shop.name.toLowerCase().includes(q)) return;

    const buyers = buyersCountMap[slugify(shop.name)] ?? 0;

    const card = document.createElement("div");
    card.className = "card";
    card.style.backgroundImage = `url('${shop.heroImage}')`;

    const content = document.createElement("div");
    content.className = "card-content";
    content.innerHTML = `
      <div>
        <div class="card-title">${escapeHtml(shop.name)}</div>
        <div class="card-description">${escapeHtml(shop.slogan || "")}</div>
      </div>
      <div class="card-lower">
        <div class="card-meta">⭐ Trusted by ${buyers} buyers</div>
        <button class="btn-enter">Enter Shop</button>
      </div>
    `;

    const btn = content.querySelector(".btn-enter");
    btn.addEventListener("click", () => openShop(shop));

    card.appendChild(content);
    cardsContainer.appendChild(card);
  });

  if (!cardsContainer.children.length){
    cardsContainer.innerHTML =
      "<p style='grid-column:1/-1;text-align:center;color:#666;padding:20px;'>No shops available.</p>";
  }
}

// ==================== DETAILS PANEL & CAROUSEL ====================
function openShop(shop){
  currentShop = shop;
  if (detailsBanner) {
    detailsBanner.style.backgroundImage = `url('${shop.heroImage}')`;
  }
  if (shopNameEl)   shopNameEl.textContent   = shop.name;
  if (shopSloganEl) shopSloganEl.textContent = shop.slogan || "";

  buildCarousel(shop.samples || []);
  loadItemsForShop(shop.name);

  if (detailsPanel){
    detailsPanel.classList.add("show");
  }
}

if (detailsBackBtn && detailsPanel){
  detailsBackBtn.addEventListener("click", () => {
    detailsPanel.classList.remove("show");
  });
}

function buildCarousel(images){
  if (!carouselEl || !dotsEl) return;

  carouselEl.innerHTML = "";
  dotsEl.innerHTML = "";
  if (!images || !images.length) return;

  images.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `sample-${i+1}`;
    if (i === 0) img.classList.add("active");
    carouselEl.appendChild(img);

    const dot = document.createElement("div");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsEl.appendChild(dot);
  });

  const left = document.createElement("div");
  left.className = "nav left";
  left.innerHTML = "&#10094;";

  const right = document.createElement("div");
  right.className = "nav right";
  right.innerHTML = "&#10095;";

  carouselEl.append(left, right);

  let current = 0;
  const slides = carouselEl.querySelectorAll("img");

  function goTo(n){
    if (n === current) return;
    current = n;
    slides.forEach((img, idx) => {
      img.classList.toggle("active", idx === current);
      img.style.left   = idx === current ? "0" : (idx < current ? "-100%" : "100%");
      img.style.opacity= idx === current ? "1" : "0";
    });
    dotsEl.querySelectorAll(".dot").forEach((d, idx) => {
      d.classList.toggle("active", idx === current);
    });
  }

  left.addEventListener("click", () => {
    goTo((current - 1 + slides.length) % slides.length);
  });
  right.addEventListener("click", () => {
    goTo((current + 1) % slides.length);
  });

  let startX = 0;
  carouselEl.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });
  carouselEl.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 40) right.click();
    if (endX - startX > 40) left.click();
  });
}

// ==================== ITEMS FORM (TYPE MODE) ====================
let stickyFocusEl = null;

if (formModal){
  formModal.addEventListener("focusin", e => {
    if (e.target.matches('input[type="text"], input[type="number"], input[type="tel"]')){
      stickyFocusEl = e.target;
    }
  });
  formModal.addEventListener("mousedown", e => {
    if (e.target.closest("button")) e.preventDefault();
  });
}

function restoreFocusSoon(el = stickyFocusEl){
  setTimeout(() => {
    if (el && typeof el.focus === "function") el.focus();
  }, 0);
}

function renumberRows(){
  itemsHolder.querySelectorAll(".item-num").forEach((el, i) => {
    el.textContent = `${i+1}.`;
  });
}

function trashSVG(){
  return `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7H4V5h4V4a1 1 0 0 1 1-1zm2 0v1h2V3h-2z"/>
</svg>`;
}

function addRow(itemVal = "", qtyVal = "1"){
  const card = document.createElement("div");
  card.className = "item-card";
  card.innerHTML = `
    <div class="item-top">
      <div class="item-num"></div>
      <input class="item-name" type="text" placeholder="Enter item name" value="${escapeAttr(itemVal)}">
      <button class="item-del" title="Delete">${trashSVG()}</button>
    </div>
    <div class="item-qty">
      <div class="qty-label">Set quantity</div>
      <div class="qty-controls">
        <button class="qty-btn minus" type="button">−</button>
        <input class="qty-input" type="number" min="1" step="1" value="${escapeAttr(qtyVal)}">
        <button class="qty-btn plus" type="button">+</button>
      </div>
    </div>
  `;

  const delBtn = card.querySelector(".item-del");
  const minus  = card.querySelector(".minus");
  const plus   = card.querySelector(".plus");
  const qtyIn  = card.querySelector(".qty-input");
  const nameEl = card.querySelector(".item-name");

  const persist = () => {
    if (currentShop) saveItemsForShop(currentShop.name);
  };

  delBtn.addEventListener("click", () => {
    const nextFocus =
      card.nextElementSibling?.querySelector(".item-name") ||
      card.previousElementSibling?.querySelector(".item-name") ||
      stickyFocusEl;

    card.remove();
    renumberRows();
    persist();
    restoreFocusSoon(nextFocus);
  });

  minus.addEventListener("click", () => {
    let v = parseInt(qtyIn.value || "1", 10);
    if (!v || v < 1) v = 1;
    if (v > 1) v--;
    qtyIn.value = String(v);
    persist();
    restoreFocusSoon(qtyIn);
  });

  plus.addEventListener("click", () => {
    let v = parseInt(qtyIn.value || "1", 10);
    if (!v || v < 1) v = 1;
    v++;
    qtyIn.value = String(v);
    persist();
    restoreFocusSoon(qtyIn);
  });

  qtyIn.addEventListener("input", () => {
    qtyIn.value = qtyIn.value.replace(/[^\d]/g,"");
    persist();
  });
  qtyIn.addEventListener("blur", () => {
    let v = parseInt(qtyIn.value || "1", 10);
    if (!v || v < 1) v = 1;
    qtyIn.value = String(v);
    persist();
  });

  nameEl.addEventListener("input", persist);

  itemsHolder.appendChild(card);
  renumberRows();
  setTimeout(() => nameEl.focus(), 0);
  persist();
}

// Open / close item form
function openForm(){
  if (!currentShop){
    alert("Please open a shop first.");
    return;
  }
  if (!formModal) return;

  formError.textContent = "";
  formError.style.display = "none";

  if (!itemsHolder.children.length){
    addRow();
  }

  formModal.classList.add("show");
}
function closeForm(){
  if (formModal){
    formModal.classList.remove("show");
  }
}

if (addRowBtn){
  addRowBtn.addEventListener("click", () => {
    const last = itemsHolder.querySelector(".item-card:last-child .item-name");
    if (last && !last.value.trim()){
      last.focus();
      return;
    }
    addRow();
    const newest = itemsHolder.querySelector(".item-card:last-child .item-name");
    restoreFocusSoon(newest);
  });
}
if (cancelBtn){
  cancelBtn.addEventListener("click", () => closeForm());
}

// ==================== CHOOSE MODE MODAL (TYPE or SELECT) ====================
function openChooseMode(){
  if (!currentShop){
    alert("Please open a shop first.");
    return;
  }
  if (chooseModeModal){
    chooseModeModal.classList.add("show");
  }
}
function closeChooseMode(){
  if (chooseModeModal){
    chooseModeModal.classList.remove("show");
  }
}

if (openFormBtn){
  openFormBtn.addEventListener("click", () => openChooseMode());
}
if (modeCancelBtn){
  modeCancelBtn.addEventListener("click", () => closeChooseMode());
}
if (modeTypeBtn){
  modeTypeBtn.addEventListener("click", () => {
    closeChooseMode();
    openForm();
  });
}
if (modeSelectBtn){
  modeSelectBtn.addEventListener("click", async () => {
    closeChooseMode();
    await openCatalogModalForCurrentShop();
  });
}

// ==================== CATALOG MODAL ====================
function resetCatalogModal(){
  currentCatalogItems = [];
  selectedCatalogIds  = new Set();
  if (catalogSearchInput)   catalogSearchInput.value = "";
  if (catalogListEl)        catalogListEl.innerHTML = "";
  if (catalogSelectedCount) catalogSelectedCount.textContent = "0";
}

function closeCatalogModal(){
  if (catalogModal){
    catalogModal.classList.remove("show");
  }
  resetCatalogModal();
}

if (catalogCancelBtn){
  catalogCancelBtn.addEventListener("click", closeCatalogModal);
}

function updateCatalogSelectionUI(){
  if (catalogSelectedCount){
    catalogSelectedCount.textContent = String(selectedCatalogIds.size);
  }
  if (!catalogListEl) return;

  const cards = catalogListEl.querySelectorAll(".catalog-item-card");
  cards.forEach(card => {
    const id    = card.dataset.id;
    const check = card.querySelector(".check-box");
    if (selectedCatalogIds.has(id)){
      card.classList.add("selected");
      if (check) check.textContent = "✓";
    } else {
      card.classList.remove("selected");
      if (check) check.textContent = "";
    }
  });
}

function renderCatalogList(filterTerm = ""){
  if (!catalogListEl) return;
  const q = (filterTerm || "").trim().toLowerCase();
  catalogListEl.innerHTML = "";

  if (!currentCatalogItems.length){
    catalogListEl.innerHTML =
      `<p style="font-size:14px;color:#666;">No saved items yet for this shop. You can close this and choose <b>Type items yourself</b>.</p>`;
    return;
  }

  currentCatalogItems.forEach(item => {
    if (q && !item.name.toLowerCase().includes(q)) return;

    const card = document.createElement("div");
    card.className = "catalog-item-card";
    card.dataset.id = item.id;
    card.dataset.name = item.name;

    const metaPieces = [];
    if (item.lastPrice != null){
      metaPieces.push(`Last price: GH₵ ${money(item.lastPrice).toFixed(2).replace(/\.00$/,'')}`);
    }
    metaPieces.push(item.lastAvailable ? "Usually available" : "Recently unavailable");

    card.innerHTML = `
      <div class="check-box">${selectedCatalogIds.has(item.id) ? "✓" : ""}</div>
      <div class="info">
        <div class="catalog-item-name">${escapeHtml(item.name)}</div>
        <div class="catalog-item-meta">${metaPieces.join(" • ")}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      const id = item.id;
      if (selectedCatalogIds.has(id)){
        selectedCatalogIds.delete(id);
      } else {
        selectedCatalogIds.add(id);
      }
      updateCatalogSelectionUI();
    });

    catalogListEl.appendChild(card);
  });

  if (!catalogListEl.children.length){
    catalogListEl.innerHTML =
      `<p style="font-size:14px;color:#666;">No items match your search.</p>`;
  }
}

async function openCatalogModalForCurrentShop(){
  if (!currentShop || !catalogModal || !catalogListEl) return;

  catalogModal.classList.add("show");
  catalogListEl.innerHTML =
    `<p style="font-size:14px;color:#666;">Loading items for this shop...</p>`;

  if (catalogSelectedCount) catalogSelectedCount.textContent = "0";
  selectedCatalogIds = new Set();

  try {
    currentCatalogItems = await fetchShopCatalog(currentShop.name);
    renderCatalogList("");
  } catch (e){
    console.error("fetchShopCatalog error", e);
    catalogListEl.innerHTML =
      `<p style="font-size:14px;color:#b00020;">Unable to load shop items. You may close this and type items yourself.</p>`;
  }
}

if (catalogSearchInput){
  catalogSearchInput.addEventListener("input", () => {
    renderCatalogList(catalogSearchInput.value);
  });
}

if (catalogDoneBtn){
  catalogDoneBtn.addEventListener("click", () => {
    if (!selectedCatalogIds.size){
      alert("Please select at least one item, or cancel and choose 'Type items yourself'.");
      return;
    }

    const names = [];
    currentCatalogItems.forEach(it => {
      if (selectedCatalogIds.has(it.id)){
        names.push(it.name);
      }
    });

    closeCatalogModal();

    itemsHolder.innerHTML = "";
    renumberRows();
    names.forEach(name => addRow(name, "1"));
    if (formError){
      formError.style.display = "none";
      formError.textContent = "";
    }
    if (formModal){
      formModal.classList.add("show");
    }
  });
}
// ==================== SUBMIT ITEM LIST (ADMIN LINK CREATION) ====================
if (submitBtn){
  submitBtn.addEventListener("click", async () => {
    const rows = [...itemsHolder.querySelectorAll(".item-card")];
    const items = rows.map(row => {
      const name = (row.querySelector(".item-name").value || "").trim();
      let qty = parseInt(row.querySelector(".qty-input").value || "1", 10);
      if (!qty || qty < 1) qty = 1;
      return { name, qty };
    }).filter(x => x.name);

    const fullName = customerNameInput.value.trim();
    const phoneRaw = customerPhoneInput.value.trim();
    const norm = normalizeGhanaNumber(phoneRaw);

    // validation
    if (!items.length){
      formError.textContent = "Please add at least one item before submitting.";
      formError.style.display = "block";
      return;
    }
    if (!fullName){
      formError.textContent = "Please enter your full name.";
      formError.style.display = "block";
      customerNameInput.focus();
      return;
    }
    if (!norm){
      formError.textContent = "Please enter a valid phone number.";
      formError.style.display = "block";
      customerPhoneInput.focus();
      return;
    }
    formError.style.display = "none";

    const adminPayload = {
      type: "admin",
      shop: currentShop.name,
      shopPhone: currentShop.phone || "",
      customerName: fullName,
      customerPhone: norm.e164,
      items: items.map(({name,qty}) => ({ name, qty, available: true, price: null })),
      fees: { service: SERVICE_FEE_DEFAULT, delivery: DELIVERY_FEE_DEFAULT }
    };

    try {
      const adminId = await putShort(adminPayload);
      saveItemsForShop(currentShop.name);
      formModal.classList.remove("show");
      adminDocId = adminId;
      openWaitingModal(adminId);
    } catch (e){
      console.error(e);
      formError.textContent = "Something went wrong sending your list. Please try again.";
      formError.style.display = "block";
    }
  });
}

// ==================== WAITING MODAL ====================
function openWaitingModal(adminId){
  if (!waitingModal || !waitingDots || !waitingProgressBar) return;

  if (waitingUnsub) waitingUnsub();

  waitingModal.classList.add("show");
  waitingBtn.style.display = "none";
  waitingBtn.disabled = true;

  let d = 0;
  if (waitingDotsTimer) clearInterval(waitingDotsTimer);

  waitingDotsTimer = setInterval(() => {
    d = (d + 1) % 4;
    waitingDots.textContent = ".".repeat(d);
  }, 450);

  const adminDocRef = doc(linksCol, adminId);

  waitingUnsub = onSnapshot(adminDocRef, snap => {
    if (!snap.exists()) return;

    const data  = snap.data();
    const items = data.payload?.items || [];
    const total = items.length;

    let reviewed = 0;
    items.forEach(it => {
      if (it.available === false || it.price != null){
        reviewed++;
      }
    });

    const pct = total > 0 ? (reviewed / total) * 100 : 0;
    waitingProgressBar.style.width = pct + "%";
    waitingCounter.textContent = `${reviewed} of ${total} items reviewed`;

    if (reviewed === total && data.orderId){
      clearInterval(waitingDotsTimer);
      waitingDots.textContent = "";
      currentOrderId = data.orderId;

      waitingBtn.style.display = "inline-block";
      waitingBtn.disabled = false;
    }
  });
}

if (waitingBtn){
  waitingBtn.addEventListener("click", () => {
    if (!currentOrderId) return;
    const url = new URL(location.href);
    url.searchParams.set("order", currentOrderId);
    url.searchParams.delete("admin");
    window.location.href = url.toString();
  });
}

// ==================== ADD SHOP ====================
function openShopModal(){
  shopError.textContent = "";
  shopError.style.display = "none";
  shopModal.classList.add("show");
}
function closeShopModal(){
  shopModal.classList.remove("show");
}

if (openShopBtn) openShopBtn.addEventListener("click", openShopModal);
if (shopCancelBtn) shopCancelBtn.addEventListener("click", closeShopModal);

async function uploadFile(path, file){
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file);
  return await getDownloadURL(snap.ref);
}

if (shopSubmitBtn){
  shopSubmitBtn.addEventListener("click", async () => {
    const ownerName   = ownerNameInput.value.trim();
    const ownerPhone  = ownerPhoneInput.value.trim();
    const shopNameVal = shopNameInput.value.trim();
    const slogan      = shopSloganInput.value.trim();
    const desc        = shopShortDesc.value.trim();
    const category    = shopCategorySel.value;
    const planVal     = shopPlanSel.value;
    const mainImg     = shopMainImage.files[0];
    const sampleImgs  = Array.from(shopSampleImages.files);

    const ownerNorm = normalizeGhanaNumber(ownerPhone);
    const slug      = slugify(shopNameVal);

    if (!ownerName || !ownerNorm || !shopNameVal ||
        !category || !planVal ||
        !mainImg || !sampleImgs.length){
      shopError.textContent = "Please fill in all fields and choose images.";
      shopError.style.display = "block";
      return;
    }

    // Payment first
    const [planKey, priceStr] = planVal.split("_");
    const priceNum = Number(priceStr || 0);
    const planLabel = {
      "1m_50":"1 Month 50",
      "3m_100":"3 Months 100",
      "6m_200":"6 Months 200",
      "12m_300":"1 Year 300"
    }[planVal] || planVal;

    try {
      const payRes = await fetch(
        "https://us-central1-pickmeservicesonline.cloudfunctions.net/startPayment",
        {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            amount: priceNum,
            customerName: ownerName,
            customerPhone: ownerNorm.e164,
            shopName: shopNameVal,
            description: `Grocery Shop Subscription - ${planLabel}`,
            clientReference: `${slug}_${Date.now()}`,
            channel:"mtn-gh"
          })
        }
      );

      const payJson = await payRes.json();
      if (!payJson.ok){
        shopError.textContent = "Payment failed. Try again.";
        shopError.style.display = "block";
        return;
      }

      alert("Payment prompt sent. Approve on your phone.");

    } catch (e){
      shopError.textContent = "Unable to start payment.";
      shopError.style.display = "block";
      return;
    }

    try {
      const mainURL = await uploadFile(`groceries/shops/${slug}/main.jpg`, mainImg);
      const sampleURLs = [];
      for (let i=0; i<sampleImgs.length; i++){
        const url = await uploadFile(
          `groceries/shops/${slug}/sample_${i+1}.jpg`,
          sampleImgs[i]
        );
        sampleURLs.push(url);
      }

      await setDoc(doc(pendingShopsItemsCol, slug), {
        name: shopNameVal,
        slogan: slogan,
        desc: desc,
        ownerName: ownerName,
        ownerPhone: ownerNorm.e164,
        category: category,
        price: priceNum,
        subscription: planLabel,
        images: [mainURL, ...sampleURLs],
        createdAt: serverTimestamp()
      });

      alert("Your shop has been submitted successfully.");
      closeShopModal();

    } catch (e){
      console.error(e);
      shopError.textContent = "Upload failed.";
      shopError.style.display = "block";
    }
  });
}

// ==================== ADMIN PANEL ====================
function hideHome(){
  const els = [
    cardsContainer,
    document.querySelector(".add-shop-wrap"),
    document.querySelector(".search-bar"),
    document.querySelector(".tabs")
  ];
  els.forEach(el => el && (el.style.display = "none"));
  detailsPanel?.classList.remove("show");
}
function showHome(){
  const els = [
    cardsContainer,
    document.querySelector(".add-shop-wrap"),
    document.querySelector(".search-bar"),
    document.querySelector(".tabs")
  ];
  els.forEach(el => el && (el.style.display = ""));
}

if (closeAdminBtn){
  closeAdminBtn.addEventListener("click", () => {
    window.location.href = "/Groceries";
  });
}
if (adminCancelBtn){
  adminCancelBtn.addEventListener("click", () => {
    window.location.href = "/Groceries";
  });
}

if (adminDoneBtn){
  adminDoneBtn.addEventListener("click", async () => {
    const serviceFee  = money(feeServiceInput.value  || SERVICE_FEE_DEFAULT);
    const deliveryFee = money(feeDeliveryInput.value || DELIVERY_FEE_DEFAULT);

    const processedItems = currentAdmin.items.map(it => ({
      name: it.name,
      qty: Math.max(1, parseInt(it.qty||1)),
      available: !!it.available,
      price: it.available && it.price != null ? money(it.price) : null
    }));

    const anyAvailable = processedItems.some(it => it.available && it.price != null);
    if (!anyAvailable){
      alert("At least one item must be available with a price.");
      return;
    }

    const customerPayload = {
      type: "order",
      shop: currentAdmin.shop,
      shopPhone: currentAdmin.shopPhone || "",
      customerName: currentAdmin.customerName || "",
      customerPhone: currentAdmin.customerPhone || "",
      items: processedItems,
      fees: { service: serviceFee, delivery: deliveryFee }
    };

    try {
      await syncShopCatalog(currentAdmin.shop, processedItems);
      const id = await putShort(customerPayload);

      if (adminDocId){
        await updateDoc(doc(linksCol, adminDocId), { orderId: id });
      }

      alert("Customer link created.");
      window.location.href = "/Groceries";

    } catch (e){
      alert("Something went wrong.");
    }
  });
}

// ==================== CUSTOMER PANEL ====================
if (closeCustomerBtn){
  closeCustomerBtn.addEventListener("click", () => {
    window.location.href = "/Groceries";
  });
}
if (custCancelBtn){
  custCancelBtn.addEventListener("click", () => {
    window.location.href = "/Groceries";
  });
}

if (custPayBtn){
  custPayBtn.addEventListener("click", async () => {
    alert("Payment prompt feature is under maintenance.");
  });
}

// ==================== SEARCH + TABS ====================
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderCards(tab.dataset.cat, searchInput.value);
  });
});

searchInput.addEventListener("input", () => {
  const active = document.querySelector(".tab.active")?.dataset.cat || "All";
  renderCards(active, searchInput.value);
});

// ==================== ROUTER ====================
async function router(){
  const url = new URL(location.href);
  const adminId = url.searchParams.get("admin");
  const orderId = url.searchParams.get("order");

  if (adminId){
    const payload = await getShort(adminId);
    if (payload && payload.type === "admin"){
      const code = prompt("Enter admin code:");
      if (code === ADMIN_CODE){
        hideHome();
        currentAdmin = payload;
        adminDocId = adminId;
        // render items:
        const a = payload.items || [];
        a.forEach(it => it.available = !!it.available);
        openAdmin(payload);
      } else {
        alert("Wrong code.");
        window.location.href = "/Groceries";
      }
      return;
    }
  }

  if (orderId){
    const payload = await getShort(orderId);
    if (payload && payload.type === "order"){
      hideHome();
      openCustomer(payload);
      return;
    }
  }

  showHome();
}

// ==================== INIT ====================
(async () => {
  await loadTrustedCounts();
  renderCards("All", "");
  router();
})();
