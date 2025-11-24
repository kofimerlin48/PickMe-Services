// groceries.js

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

/* ===== Firebase config ===== */
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

/* ===== Constants ===== */
const ADMIN_CODE = "123456"; // simple front-door for now
const SERVICE_FEE_DEFAULT  = 0;
const DELIVERY_FEE_DEFAULT = 0;

/* Collections that match your rules */
const linksCol   = collection(db, "Groceries", "Links", "items");
const numbersCol = collection(db, "Groceries", "Numbers", "items");
const pendingShopsItemsCol = collection(db, "Groceries", "Shops", "items", "_pendingShops", "items");

/* Per-shop catalog (for select-from-list) */
function shopCatalogCollection(slug){
  return collection(db, "Groceries", "Shops", "items", slug, "catalog");
}

/* ===== Hardcoded shops (as before) ===== */
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

/* ===== DOM ===== */
const cardsContainer  = document.getElementById("cardsContainer");
const searchInput     = document.getElementById("searchInput");
const tabs            = document.querySelectorAll(".tab");
const homeHeader      = document.getElementById("homeHeader");
const homeSearch      = document.getElementById("homeSearch");

const detailsPanel  = document.getElementById("detailsPanel");
const detailsBackBtn= document.getElementById("detailsBackBtn");
const detailsBanner = document.getElementById("detailsBanner");
const shopNameEl    = document.getElementById("shopName");
const shopSloganEl  = document.getElementById("shopSlogan");
const carouselEl    = document.getElementById("carousel");
const dotsEl        = document.getElementById("dots");
const openFormBtn   = document.getElementById("openFormBtn");

const formModal     = document.getElementById("formModal");
const itemsHolder   = document.getElementById("itemsHolder");
const addRowBtn     = document.getElementById("addRowBtn");
const clearAllBtn   = document.getElementById("clearAllBtn");
const customerNameInput = document.getElementById("customerName");
const customerPhoneInput= document.getElementById("customerPhone");
const submitBtn     = document.getElementById("submitBtn");
const cancelBtn     = document.getElementById("cancelBtn");
const formError     = document.getElementById("formError");

/* NEW: mode choose + catalog modals */
const chooseModeModal    = document.getElementById("chooseModeModal");
const modeTypeBtn        = document.getElementById("modeTypeBtn");
const modeSelectBtn      = document.getElementById("modeSelectBtn");
const modeCancelBtn      = document.getElementById("modeCancelBtn");

const catalogModal        = document.getElementById("catalogModal");
const catalogSearchInput  = document.getElementById("catalogSearch");
const catalogListEl       = document.getElementById("catalogList");
const catalogSelectedCount= document.getElementById("catalogSelectedCount");
const catalogCloseBtn     = document.getElementById("catalogCloseBtn");
const catalogCancelBtn    = document.getElementById("catalogCancelBtn");
const catalogDoneBtn      = document.getElementById("catalogDoneBtn");

/* Add shop modal dom */
const openShopBtn      = document.getElementById("openShopBtn");
const shopModal        = document.getElementById("shopModal");
const shopCloseBtn     = document.getElementById("shopCloseBtn");
const shopCancelBtn    = document.getElementById("shopCancelBtn");
const shopSubmitBtn    = document.getElementById("shopSubmitBtn");
const ownerNameInput   = document.getElementById("ownerName");
const ownerPhoneInput  = document.getElementById("ownerPhone");
const shopNameInput    = document.getElementById("shopNameInput");
const shopSloganInput  = document.getElementById("shopSloganInput");
const shopShortDesc    = document.getElementById("shopShortDesc");
const shopCategorySel  = document.getElementById("shopCategory");
const shopPlanSel      = document.getElementById("shopPlan");
const shopTownInput    = document.getElementById("shopTown");
const shopPhoneInput   = document.getElementById("shopPhone");
const shopMainImage    = document.getElementById("shopMainImage");
const shopSampleImages = document.getElementById("shopSampleImages");
const shopError        = document.getElementById("shopError");

/* Waiting modal */
const waitingModal = document.getElementById("waitingModal");
const waitingMsg   = document.getElementById("waitingMsg");
const waitingDots  = document.getElementById("waitingDots");
const waitingBtn   = document.getElementById("waitingBtn");

/* Admin panel */
const adminPanel      = document.getElementById("adminPanel");
const adminShop       = document.getElementById("adminShop");
const adminAvail      = document.getElementById("adminAvail");
const adminUnavail    = document.getElementById("adminUnavail");
const feeServiceInput = document.getElementById("feeServiceInput");
const feeDeliveryInput= document.getElementById("feeDeliveryInput");
const adminItemsTotal = document.getElementById("adminItemsTotal");
const adminGrandTotal = document.getElementById("adminGrandTotal");
const closeAdminBtn   = document.getElementById("closeAdminBtn");
const adminCancelBtn  = document.getElementById("adminCancel");
const adminDoneBtn    = document.getElementById("adminDone");
const adminShopActions= document.getElementById("adminShopActions");

/* Customer panel */
const customerPanel   = document.getElementById("customerPanel");
const closeCustomerBtn= document.getElementById("closeCustomerBtn");
const custShop        = document.getElementById("custShop");
const custAvail       = document.getElementById("custAvail");
const custUnavail     = document.getElementById("custUnavail");
const custTotalsWrap  = document.querySelector(".cust-totals");
const custPayBtn      = document.getElementById("custPay");
const custCancelBtn   = document.getElementById("custCancel");

/* ===== State ===== */
let currentShop = null;
let currentAdmin = null;
let buyersCountMap = {}; // shopSlug -> count
let adminDocId = null;   // id of admin link document (for waiting modal)
let shopSubmitDotsTimer = null;
let waitingDotsTimer = null;
let waitingUnsub = null;
let currentOrderId = null;

let currentCatalogItems = [];
let selectedCatalogIds = new Set();

/* ===== Helpers ===== */
function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function escapeAttr(s){ return String(s||"").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function money(n){ return Number(n||0); }

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shopKeyStorage(shop){ return `pkm_grocery_items_${shop}`; }

function serializeItems(){
  return [...itemsHolder.querySelectorAll(".item-card")].map(r=>({
    name:(r.querySelector(".item-name").value||"").trim(),
    qty: parseInt(r.querySelector(".qty-input").value||"1",10)||1
  }));
}
function loadItemsForShop(shop){
  itemsHolder.innerHTML="";
  try{
    const raw = sessionStorage.getItem(shopKeyStorage(shop));
    const arr = raw? JSON.parse(raw): [];
    if (arr.length) arr.forEach(it=>addRow(it.name, String(it.qty)));
  }catch{}
}
function saveItemsForShop(shop){
  try{ sessionStorage.setItem(shopKeyStorage(shop), JSON.stringify(serializeItems())); }catch{}
}

function normalizeGhanaNumber(input){
  let s=String(input).trim().replace(/[\s\-]/g,'');
  if (s.startsWith('+233')) return { e164:s };
  if (s.startsWith('233'))  return { e164:'+'+s };
  if (/^0\d{9}$/.test(s))   return { e164:'+233'+s.slice(1) };
  if (/^\d{9}$/.test(s))    return { e164:'+233'+s };
  const d=s.replace(/\D/g,'');
  if (d.startsWith('233')) return { e164:'+'+d };
  if (d.length===10 && d.startsWith('0')) return { e164:'+233'+d.slice(1) };
  return null;
}

/* ====== Trusted buyers: stored in Groceries/Numbers/items ====== */
async function markTrustedBuyer(shopName, phoneE164) {
  try {
    if (!shopName || !phoneE164) return;
    const slug = slugify(shopName);
    const digits = phoneE164.replace(/[^\d]/g, "");
    const id = `${slug}__${digits}`;
    await setDoc(
      doc(numbersCol, id),
      {
        whatsapp: phoneE164,
        timestamp: serverTimestamp()
      }
    );
  } catch (e) {
    console.error("markTrustedBuyer error", e);
  }
}

async function loadTrustedCounts() {
  try {
    const snap = await getDocs(numbersCol);
    const counts = {};
    snap.forEach(d => {
      const id = d.id || "";
      const idx = id.indexOf("__");
      if (idx === -1) return;
      const slug = id.slice(0, idx);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    buyersCountMap = counts;
  } catch(e) {
    console.error("loadTrustedCounts error", e);
  }
}

/* ====== Short links in Firestore (Links/items) ====== */
function makeId() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toLowerCase();
}
async function putShort(payload) {
  const id = makeId();
  try {
    await setDoc(doc(linksCol, id), {
      payload,
      createdAt: serverTimestamp()
    });
    return id;
  } catch(e) {
    console.error("putShort error:", e);
    alert("Unable to save data. Please check your internet and try again.");
    throw e;
  }
}
async function getShort(id) {
  try {
    const snap = await getDoc(doc(linksCol, id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.payload || null;
  } catch(e) {
    console.error("getShort error:", e);
    return null;
  }
}

/* ====== Shop catalog helpers (per shop items for select-from-list) ====== */
async function syncShopCatalog(shopName, items){
  try{
    if (!shopName) return;
    const slug = slugify(shopName);
    const colRef = shopCatalogCollection(slug);

    // Step 1: Load EXISTING items
    const snap = await getDocs(colRef);
    const existing = {};
    snap.forEach(ds => {
      const d = ds.data();
      if (!d || !d.name) return;
      const key = d.name.trim().toLowerCase();
      existing[key] = true;   // Mark as already saved before
    });

    // Step 2: Process ONLY correct items according to rules
    const writes = [];

    items.forEach(it => {
      const key = (it.name || "").trim().toLowerCase();
      if (!key) return;

      const wasSavedBefore = !!existing[key];
      const isAvailableNow = !!it.available;
      const hasPrice = it.price != null;

      // RULE 1: First-time item must be available with price
      if (!wasSavedBefore && !(isAvailableNow && hasPrice)) {
        // do NOT save
        return;
      }

      // RULE 2: If saved before, keep updating lastAvailable & lastPrice
      const payload = {
        name: it.name,
        lastAvailable: isAvailableNow,
        updatedAt: serverTimestamp()
      };

      if (isAvailableNow && hasPrice){
        payload.lastPrice = money(it.price);
      }

      const docRef = doc(colRef, key);
      writes.push(setDoc(docRef, payload, { merge:true }));
    });

    if (writes.length > 0) {
      await Promise.all(writes);
    }

  } catch(e){
    console.error("syncShopCatalog FIX error", e);
  }
}

async function fetchShopCatalog(shopName){
  if (!shopName) return [];
  const slug = slugify(shopName);
  const colRef = shopCatalogCollection(slug);
  const snap = await getDocs(colRef);
  const list = [];
  snap.forEach(ds=>{
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
    // Available first, then alphabetical
    if (a.lastAvailable !== b.lastAvailable){
      return a.lastAvailable ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  return list;
}

/* ====== Cards ====== */
function renderCards(activeCategory="All", term=""){
  cardsContainer.innerHTML = "";
  const q = (term||"").trim().toLowerCase();

  const data = [...GROCERY_DATA]
    .sort((a,b)=>{
      const sa = slugify(a.name);
      const sb = slugify(b.name);
      const ca = buyersCountMap[sa] || 0;
      const cb = buyersCountMap[sb] || 0;
      if (cb!==ca) return cb-ca;
      return a.name.localeCompare(b.name);
    });

  data.forEach(shop=>{
    if (activeCategory!=="All" && shop.category!==activeCategory) return;
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
        <div class="card-description">${escapeHtml(shop.slogan||"")}</div>
      </div>
      <div class="card-lower">
        <div class="card-meta">⭐ Trusted by ${buyers} buyers</div>
        <button class="btn-enter">Enter Shop</button>
      </div>
    `;
    content.querySelector(".btn-enter").addEventListener("click",()=>openShop(shop));
    card.appendChild(content);
    cardsContainer.appendChild(card);
  });

  if (!cardsContainer.children.length){
    cardsContainer.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#666;padding:20px;'>No shops available.</p>";
  }
}

/* ====== Details & Carousel ====== */
function openShop(shop){
  currentShop = shop;
  detailsBanner.style.backgroundImage = `url('${shop.heroImage}')`;
  shopNameEl.textContent = shop.name;
  shopSloganEl.textContent = shop.slogan || "";
  buildCarousel(shop.samples||[]);
  loadItemsForShop(shop.name);
  detailsPanel.classList.add("show");
}
detailsBackBtn.addEventListener("click",()=>detailsPanel.classList.remove("show"));

function buildCarousel(images){
  carouselEl.innerHTML=""; dotsEl.innerHTML="";
  if (!images || !images.length) return;
  images.forEach((src,i)=>{
    const img=document.createElement("img"); img.src=src; img.alt=`sample-${i+1}`;
    if(i===0) img.classList.add("active");
    carouselEl.appendChild(img);
    const dot=document.createElement("div"); dot.className="dot"+(i===0?" active":"");
    dot.addEventListener("click",()=>goTo(i)); dotsEl.appendChild(dot);
  });
  const left=document.createElement("div"); left.className="nav left"; left.innerHTML="&#10094;";
  const right=document.createElement("div"); right.className="nav right"; right.innerHTML="&#10095;";
  carouselEl.append(left,right);

  let current=0;
  const slides=carouselEl.querySelectorAll("img");

  function goTo(n){
    if (n===current) return;
    current = n;
    slides.forEach((img,idx)=>{
      img.classList.toggle("active", idx===current);
      img.style.left = idx===current ? "0" : (idx<current ? "-100%" : "100%");
      img.style.opacity = idx===current ? "1" : "0";
    });
    document.querySelectorAll("#dots .dot").forEach((d,idx)=>d.classList.toggle("active", idx===current));
  }
  left.addEventListener("click",()=>goTo((current-1+slides.length)%slides.length));
  right.addEventListener("click",()=>goTo((current+1)%slides.length));

  let startX=0;
  carouselEl.addEventListener("touchstart",e=>startX=e.touches[0].clientX);
  carouselEl.addEventListener("touchend",e=>{
    const endX=e.changedTouches[0].clientX;
    if (startX-endX>40) right.click();
    if (endX-startX>40) left.click();
  });
}

/* ===== Modal: Items list ===== */
function openForm(){
  if (!currentShop){
    alert("Please open a shop first.");
    return;
  }
  formModal.classList.add("show");
  formError.style.display="none";
  if (!itemsHolder.children.length) addRow();
  const first=itemsHolder.querySelector(".item-card .item-name");
  if (first) setTimeout(()=>first.focus(),50);
}
function closeForm(){
  formModal.classList.remove("show");
}

/* NEW: choose mode modal logic */
function openChooseMode(){
  if (!currentShop){
    alert("Please open a shop first.");
    return;
  }
  chooseModeModal.classList.add("show");
}
function closeChooseMode(){
  chooseModeModal.classList.remove("show");
}

openFormBtn.addEventListener("click", openChooseMode);
cancelBtn.addEventListener("click", closeForm);

modeCancelBtn.addEventListener("click", ()=>{
  closeChooseMode();
});
modeTypeBtn.addEventListener("click", ()=>{
  closeChooseMode();
  // open normal form (type manually)
  openForm();
});
modeSelectBtn.addEventListener("click", async ()=>{
  closeChooseMode();
  await openCatalogModalForCurrentShop();
});

let stickyFocusEl=null;
formModal.addEventListener('focusin',e=>{
  if (e.target.matches('input[type="text"], input[type="number"], input[type="tel"]')) stickyFocusEl=e.target;
});
formModal.addEventListener('mousedown',e=>{
  if (e.target.closest('button')) e.preventDefault();
});
function restoreFocusSoon(el=stickyFocusEl){ setTimeout(()=>{ if(el) el.focus(); },0); }

function renumberRows(){
  itemsHolder.querySelectorAll(".item-num").forEach((el,i)=>el.textContent=`${i+1}.`);
}
function trashSVG(){ return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7H4V5h4V4a1 1 0 0 1 1-1zm2 0v1h2V3h-2z"/></svg>`; }

function addRow(itemVal="", qtyVal="1"){
  const card=document.createElement("div");
  card.className="item-card";
  card.innerHTML=`
    <div class="item-top">
      <div class="item-num"></div>
      <input class="item-name" type="text" placeholder="Enter item name" value="${escapeAttr(itemVal)}"/>
      <button class="item-del" title="Delete">${trashSVG()}</button>
    </div>
    <div class="item-qty">
      <div class="qty-label">Set quantity</div>
      <div class="qty-controls">
        <button class="qty-btn minus" type="button">−</button>
        <input class="qty-input" type="number" inputmode="numeric" pattern="[0-9]*" min="1" step="1" value="${escapeAttr(qtyVal)}"/>
        <button class="qty-btn plus" type="button">+</button>
      </div>
    </div>
  `;
  const delBtn=card.querySelector(".item-del");
  const minus =card.querySelector(".minus");
  const plus  =card.querySelector(".plus");
  const qtyIn =card.querySelector(".qty-input");
  const nameEl=card.querySelector(".item-name");

  const persist=()=>{ if(currentShop) saveItemsForShop(currentShop.name); };

  delBtn.addEventListener("click",()=>{
    const nextFocus = nameEl.closest(".item-card")?.nextElementSibling?.querySelector(".item-name")
                   || nameEl.closest(".item-card")?.previousElementSibling?.querySelector(".item-name");
    card.remove(); renumberRows(); persist(); restoreFocusSoon(nextFocus||stickyFocusEl);
  });
  minus.addEventListener("click",()=>{
    let v=parseInt(qtyIn.value||"1",10); if(!v||v<1) v=1; if(v>1) v--; qtyIn.value=String(v); persist(); restoreFocusSoon(qtyIn);
  });
  plus .addEventListener("click",()=>{
    let v=parseInt(qtyIn.value||"1",10); if(!v||v<1) v=1; v++; qtyIn.value=String(v); persist(); restoreFocusSoon(qtyIn);
  });
  qtyIn.addEventListener("input",()=>{
    qtyIn.value = qtyIn.value.replace(/[^\d]/g,'');
    persist();
  });
  qtyIn.addEventListener("blur",()=>{
    let v=parseInt(qtyIn.value||"1",10); if(!v||v<1) v=1; qtyIn.value=String(v); persist();
  });
  nameEl.addEventListener("input", persist);

  itemsHolder.appendChild(card); renumberRows(); setTimeout(()=>nameEl.focus(),0); persist();
}
addRowBtn.addEventListener("click",()=>{
  const last=itemsHolder.querySelector(".item-card:last-child .item-name");
  if (last && !last.value.trim()){ last.focus(); return; }
  addRow();
  const newest=itemsHolder.querySelector(".item-card:last-child .item-name");
  restoreFocusSoon(newest);
});
clearAllBtn.addEventListener("click", ()=>{
  if (!currentShop) return;
  itemsHolder.innerHTML="";
  renumberRows();
  sessionStorage.removeItem(shopKeyStorage(currentShop.name));
});

/* ===== Catalog modal logic ===== */
function resetCatalogModal(){
  currentCatalogItems = [];
  selectedCatalogIds = new Set();
  catalogSearchInput.value = "";
  catalogListEl.innerHTML = "";
  catalogSelectedCount.textContent = "0";
}
function closeCatalogModal(){
  catalogModal.classList.remove("show");
  resetCatalogModal();
}
catalogCloseBtn.addEventListener("click", closeCatalogModal);
catalogCancelBtn.addEventListener("click", closeCatalogModal);

function updateCatalogSelectionUI(){
  catalogSelectedCount.textContent = String(selectedCatalogIds.size);
  const cards = catalogListEl.querySelectorAll(".catalog-item-card");
  cards.forEach(card=>{
    const id = card.dataset.id;
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

function renderCatalogList(filterTerm=""){
  const q = (filterTerm||"").trim().toLowerCase();
  catalogListEl.innerHTML = "";
  if (!currentCatalogItems.length){
    catalogListEl.innerHTML = `<p style="font-size:14px;color:#666;">No saved items yet for this shop. You can close this and choose <b>Type items yourself</b>.</p>`;
    return;
  }

  currentCatalogItems.forEach(item=>{
    if (q && !item.name.toLowerCase().includes(q)) return;
    const card = document.createElement("div");
    card.className = "catalog-item-card";
    card.dataset.id = item.id;
    card.dataset.name = item.name;

    if (selectedCatalogIds.has(item.id)){
      card.classList.add("selected");
    }

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

    card.addEventListener("click", ()=>{
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
    catalogListEl.innerHTML = `<p style="font-size:14px;color:#666;">No items match your search.</p>`;
  }
}

async function openCatalogModalForCurrentShop(){
  if (!currentShop) return;
  catalogModal.classList.add("show");
  catalogListEl.innerHTML = `<p style="font-size:14px;color:#666;">Loading items for this shop...</p>`;
  catalogSelectedCount.textContent = "0";
  selectedCatalogIds = new Set();
  try{
    currentCatalogItems = await fetchShopCatalog(currentShop.name);
    renderCatalogList("");
  }catch(e){
    console.error("fetchShopCatalog error", e);
    catalogListEl.innerHTML = `<p style="font-size:14px;color:#b00020;">Unable to load shop items. You may close this and type items yourself.</p>`;
  }
}
catalogSearchInput.addEventListener("input", ()=>{
  renderCatalogList(catalogSearchInput.value);
});

catalogDoneBtn.addEventListener("click", ()=>{
  if (!selectedCatalogIds.size){
    alert("Please select at least one item, or cancel and choose 'Type items yourself'.");
    return;
  }
  const names = [];
  currentCatalogItems.forEach(it=>{
    if (selectedCatalogIds.has(it.id)){
      names.push(it.name);
    }
  });

  closeCatalogModal();

  // Fill the existing form with selected items
  itemsHolder.innerHTML = "";
  renumberRows();
  names.forEach(name=>{
    addRow(name, "1");
  });
  formError.style.display = "none";
  formModal.classList.add("show");
});

/* ===== Waiting modal logic ===== */
function openWaitingModal(adminId) {
  if (waitingUnsub) waitingUnsub();

  waitingModal.classList.add("show");

  const dotsEl = document.getElementById("waitingDots");
  const bar = document.getElementById("waitingProgressBar");
  const counter = document.getElementById("waitingCounter");
  const btn = document.getElementById("waitingBtn");
  const topMsg = document.getElementById("waitingTopMsg");

  btn.style.display = "none";
  btn.disabled = true;

  // start dot animation
  let d = 0;
  if (waitingDotsTimer) clearInterval(waitingDotsTimer);
  waitingDotsTimer = setInterval(() => {
    d = (d + 1) % 4;
    dotsEl.textContent = ".".repeat(d);
  }, 450);

  const adminDocRef = doc(linksCol, adminId);

  waitingUnsub = onSnapshot(adminDocRef, snap => {
    if (!snap.exists()) return;

    const data = snap.data();
    const items = data.payload?.items || [];
    const total = items.length;

    // Count reviewed items (available flag OR price filled)
    let reviewed = 0;
    items.forEach(it => {
      if (it.available === false || it.price != null) reviewed++;
    });

    // update progress bar + counter
    const pct = total > 0 ? (reviewed / total) * 100 : 0;
    bar.style.width = pct + "%";
    counter.textContent = `${reviewed} of ${total} items reviewed`;

    // check if admin finished AND created orderId
    if (reviewed === total && data.orderId) {
      // stop dots
      if (waitingDotsTimer) clearInterval(waitingDotsTimer);
      dotsEl.textContent = "";

      // change to "Review Completed"
      topMsg.innerHTML = `<span style="color:#0a7d0a;font-weight:bold;">Review Completed</span>`;

      // show button
      currentOrderId = data.orderId;
      btn.style.display = "inline-block";
      btn.disabled = false;
    }

  }, err => console.error(err));
}

waitingBtn.addEventListener("click", () => {
  if (!currentOrderId) return;
  const url = new URL(location.href);
  url.searchParams.set("order", currentOrderId);
  url.searchParams.delete("admin");
  window.location.href = url.toString();
});

/* ===== Submit item list: create admin link in Firestore (no link shown to user) ===== */
submitBtn.addEventListener("click", async ()=>{
  const rows=[...itemsHolder.querySelectorAll(".item-card")];
  const items=rows.map(r=>{
    const name=(r.querySelector(".item-name").value||"").trim();
    let qty=parseInt(r.querySelector(".qty-input").value||"1",10);
    if(!qty||qty<1) qty=1;
    return { name, qty };
  }).filter(x=>x.name);

  const fullName = customerNameInput.value.trim();
  const phoneRaw = customerPhoneInput.value.trim();
  const norm = normalizeGhanaNumber(phoneRaw);

  if (!items.length){
    formError.textContent="Please add at least one item before submitting.";
    formError.style.display="block";
    return;
  }
  if (!fullName){
    formError.textContent="Please enter your full name.";
    formError.style.display="block";
    customerNameInput.focus();
    return;
  }
  if (!norm){
    formError.textContent="Please enter a valid phone number.";
    formError.style.display="block";
    customerPhoneInput.focus();
    return;
  }
  formError.style.display="none";

  const adminPayload = {
    type:"admin",
    shop: currentShop.name,
    shopPhone: currentShop.phone || "",
    customerName: fullName,
    customerPhone: norm.e164,
    items: items.map(({name,qty})=>({ name, qty, available:true, price:null })),
    fees: { service:SERVICE_FEE_DEFAULT, delivery:DELIVERY_FEE_DEFAULT }
  };

  try {
    const adminId = await putShort(adminPayload);
    saveItemsForShop(currentShop.name);
    formModal.classList.remove("show");
    openWaitingModal(adminId);
    adminDocId = adminId;
  } catch (e) {
    console.error(e);
    formError.textContent = "Something went wrong sending your list. Please try again.";
    formError.style.display="block";
  }
});

/* ===== Add Grocery Shop modal logic ===== */
function resetShopForm(){
  ownerNameInput.value = "";
  ownerPhoneInput.value = "";
  shopNameInput.value = "";
  shopSloganInput.value = "";
  shopShortDesc.value = "";
  shopCategorySel.value = "";
  shopPlanSel.value = "";
  shopTownInput.value = "";
  shopPhoneInput.value = "";
  shopMainImage.value = "";
  shopSampleImages.value = "";
}

function openShopModal(){
  shopError.style.display="none";
  shopError.textContent="";
  shopModal.classList.add("show");
}
function closeShopModal(){
  shopModal.classList.remove("show");
}
openShopBtn.addEventListener("click", openShopModal);
shopCloseBtn.addEventListener("click", closeShopModal);
shopCancelBtn.addEventListener("click", closeShopModal);

async function uploadFile(path, file){
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file);
  return await getDownloadURL(snap.ref);
}

shopSubmitBtn.addEventListener("click", async ()=>{
  const ownerName = ownerNameInput.value.trim();
  const ownerPhoneRaw = ownerPhoneInput.value.trim();
  const shopNameVal = shopNameInput.value.trim();
  const slogan = shopSloganInput.value.trim();
  const shortDescVal = shopShortDesc.value.trim();
  const category = shopCategorySel.value;
  const planVal  = shopPlanSel.value;
  const town     = shopTownInput.value.trim();
  const shopPhoneRaw = shopPhoneInput.value.trim();

  const ownerNorm = normalizeGhanaNumber(ownerPhoneRaw);
  const shopNorm  = normalizeGhanaNumber(shopPhoneRaw);

  const mainFile = shopMainImage.files[0] || null;
  const sampleFiles = Array.from(shopSampleImages.files || []);

  if (!ownerName || !ownerNorm || !shopNameVal || !category || !planVal || !town || !shopNorm || !mainFile) {
    shopError.textContent = "Please fill in all fields and choose images before submitting.";
    shopError.style.display = "block";
    return;
  }
  if (!sampleFiles.length){
    shopError.textContent = "Please upload at least one sample item picture.";
    shopError.style.display = "block";
    return;
  }
  if (sampleFiles.length > 5){
    shopError.textContent = "You can upload a maximum of 5 sample pictures.";
    shopError.style.display = "block";
    return;
  }

  // derive subscription info
  const [planKey, priceStr] = planVal.split("_");
  const priceNum = Number(priceStr || 0);
  let months = 0;
  if (planKey === "1m") months = 1;
  else if (planKey === "3m") months = 3;
  else if (planKey === "6m") months = 6;
  else if (planKey === "12m") months = 12;

  const planLabelMap = {
    "1m_50": "1 Month 50",
    "3m_100": "3 Months 100",
    "6m_200": "6 Months 200",
    "12m_300": "1 Year 300"
  };
  const planLabel = planLabelMap[planVal] || planVal;

  shopError.style.display="none";
  shopError.textContent="";

  const slug = slugify(shopNameVal);
  const originalText = shopSubmitBtn.textContent;
  const originalWidth = shopSubmitBtn.offsetWidth;
  shopSubmitBtn.disabled = true;

  // FIX: lock button width so it doesn't change as dots change
  shopSubmitBtn.style.width = originalWidth + "px";

  // animated dots on submit button
  if (shopSubmitDotsTimer) clearInterval(shopSubmitDotsTimer);
  let dot = 0;
  shopSubmitDotsTimer = setInterval(() => {
    dot = (dot + 1) % 4;
    shopSubmitBtn.textContent = "Submitting" + ".".repeat(dot);
  }, 400);

  try {
    // ===== PAYMENT TRIGGER BEFORE UPLOAD =====
    try {
      const payRes = await fetch("https://us-central1-pickmeservicesonline.cloudfunctions.net/startPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: priceNum,
          customerName: ownerName,
          customerPhone: ownerNorm.e164,
          shopName: shopNameVal,
          description: `Grocery Shop Subscription - ${planLabel}`,
          clientReference: `${slug}_${Date.now()}`,
          channel: "mtn-gh"
        })
      });

      const payJson = await payRes.json();

      if (!payJson.ok) {
        if (shopSubmitDotsTimer) clearInterval(shopSubmitDotsTimer);
        shopSubmitBtn.disabled = false;
        shopSubmitBtn.textContent = originalText;
        shopSubmitBtn.style.width = "";
        shopError.textContent = "Payment failed: " + (payJson.message || "Please try again.");
        shopError.style.display = "block";
        return;
      }

      alert("Payment prompt sent! Please approve on your phone.");
    } catch (e) {
      if (shopSubmitDotsTimer) clearInterval(shopSubmitDotsTimer);
      shopSubmitBtn.disabled = false;
      shopSubmitBtn.textContent = originalText;
      shopSubmitBtn.style.width = "";
      shopError.textContent = "Unable to start payment. Check your internet.";
      shopError.style.display = "block";
      return;
    }
    // ===== END PAYMENT TRIGGER =====
    
    // Upload images to Storage in parallel (faster)
    const mainPromise = uploadFile(`groceries/shops/${slug}/main.jpg`, mainFile);
    const samplePromises = sampleFiles.map((file, i) =>
      uploadFile(`groceries/shops/${slug}/sample_${i+1}.jpg`, file)
    );

    const mainUrl = await mainPromise;
    const sampleUrls = await Promise.all(samplePromises);

    // Save shop request with shop-name-based ID
    await setDoc(doc(pendingShopsItemsCol, slug), {
      name: shopNameVal,
      slogan: slogan,
      desc: shortDescVal || slogan || "",
      ownerName: ownerName,
      ownerPhone: ownerNorm.e164,
      phone: shopNorm.e164,
      town: town,
      category: category,
      price: priceNum,
      subscription: {
        code: planVal,
        label: planLabel,
        months: months
      },
      images: [mainUrl, ...sampleUrls],
      createdAt: serverTimestamp()
    });

    alert(
`Your shop request has been received.
Once payment is confirmed, we will review and publish your shop, then notify you by SMS.`
    );

    resetShopForm();
    closeShopModal();
  } catch(e) {
    console.error("submit shop error", e);
    shopError.textContent = "Something went wrong. Please check your internet and try again.";
    shopError.style.display = "block";
  } finally {
    if (shopSubmitDotsTimer) {
      clearInterval(shopSubmitDotsTimer);
      shopSubmitDotsTimer = null;
    }
    shopSubmitBtn.disabled = false;
    shopSubmitBtn.textContent = originalText;
    shopSubmitBtn.style.width = ""; // release width after done
  }
});

/* ===== Admin UI ===== */
function hideHome(){
  homeHeader.style.display='none';
  document.querySelector(".add-shop-wrap").style.display='none';
  homeSearch.style.display='none';
  document.getElementById('tabs').style.display='none';
  cardsContainer.style.display='none';
  detailsPanel.classList.remove('show');
}
function showHome(){
  homeHeader.style.display='';
  document.querySelector(".add-shop-wrap").style.display='';
  homeSearch.style.display='';
  document.getElementById('tabs').style.display='';
  cardsContainer.style.display='';
}

function buildAdminCard(idx, rec) {
  const wrap = document.createElement("div");
  wrap.className = "admin-item-card";
  wrap.dataset.index = idx;
  wrap.innerHTML = `
    <div class="admin-row1">
      <div class="admin-item-num">${idx + 1}.</div>
      <input class="admin-item-name" value="${escapeAttr(rec.name)}" readonly />
      <div class="admin-qty-pill">Qty: ${rec.qty}</div>
    </div>
    <div class="admin-row2">
      <button class="avail-toggle ${rec.available ? "on" : "off"}">
        ${rec.available ? "Available" : "Not available"}
      </button>
      ${
        rec.available
          ? `<input class="price-input" type="number" min="0" step="1" placeholder="Unit price (GH₵)" value="${rec.price ?? ""}">`
          : ``
      }
      <div class="subtotal">GH₵ <span class="subv">0</span></div>
    </div>
  `;

  const availBtn = wrap.querySelector(".avail-toggle");
  const priceIn = wrap.querySelector(".price-input");
  const subV = wrap.querySelector(".subv");

  const recalc = () => {
    const unit =
      rec.available && priceIn && priceIn.value !== ""
        ? money(priceIn.value)
        : 0;
    const sub = rec.available
      ? Math.max(1, parseInt(rec.qty || 1, 10)) * unit
      : 0;
    subV.textContent = sub.toFixed(2).replace(/\.00$/, "");
  };

  availBtn.addEventListener("click", () => {
    rec.available = !rec.available;
    if (!rec.available) {
      rec.price = null;
    }
    renderAdminLists();
    updateTotals();
  });

  if (priceIn) {
    priceIn.addEventListener("input", () => {
      rec.price = priceIn.value === "" ? null : money(priceIn.value);
      recalc();
      updateTotals();
    });
  }

  recalc();
  return wrap;
}

function renderAdminLists() {
  adminAvail.innerHTML = "";
  adminUnavail.innerHTML = "";
  currentAdmin.items.forEach((rec, idx) => {
    const card = buildAdminCard(idx, rec);
    (rec.available ? adminAvail : adminUnavail).appendChild(card);
  });
}

function updateTotals() {
  const availableItems = currentAdmin.items.filter(it => it.available && it.price != null);
  const itemsTotal = availableItems.reduce((sum, it) => {
    return sum + (Math.max(1, parseInt(it.qty || 1, 10)) * money(it.price));
  }, 0);

  const service  = availableItems.length > 0
    ? money(feeServiceInput.value || SERVICE_FEE_DEFAULT)
    : 0;
  const delivery = availableItems.length > 0
    ? money(feeDeliveryInput.value || DELIVERY_FEE_DEFAULT)
    : 0;

  adminItemsTotal.textContent = itemsTotal.toFixed(2).replace(/\.00$/,'');
  adminGrandTotal.textContent = (itemsTotal + service + delivery).toFixed(2).replace(/\.00$/,'');
}

function openAdmin(payload){
  currentAdmin = JSON.parse(JSON.stringify(payload));
  adminShop.textContent = `Order · ${currentAdmin.shop || ''}`;

  adminShopActions.innerHTML='';
  if (currentAdmin.shopPhone){
    const a1=document.createElement('a'); a1.href=`tel:${currentAdmin.shopPhone}`; a1.className='call-btn'; a1.innerHTML='📞 Call shop';
    const a2=document.createElement('a'); a2.href=`https://wa.me/${currentAdmin.shopPhone}`; a2.target='_blank'; a2.className='wa-btn'; a2.innerHTML='🟢 WhatsApp shop';
    adminShopActions.append(a1,a2);
  }

  renderAdminLists();

  feeServiceInput.value  = currentAdmin.fees?.service ?? SERVICE_FEE_DEFAULT;
  feeDeliveryInput.value = currentAdmin.fees?.delivery ?? DELIVERY_FEE_DEFAULT;
  feeServiceInput.oninput  = updateTotals;
  feeDeliveryInput.oninput = updateTotals;
  updateTotals();

  hideHome();
  adminPanel.style.display='block';
  adminPanel.setAttribute('aria-hidden','false');
}

function closeAdmin(){
  window.location.href = "groceries.html";
}
closeAdminBtn.addEventListener('click', closeAdmin);
adminCancelBtn.addEventListener('click', closeAdmin);

/* Admin Done: create customer link in Firestore AND link it to the admin doc */
adminDoneBtn.addEventListener('click', async ()=>{
  const serviceFee  = feeServiceInput.value==='' ? SERVICE_FEE_DEFAULT : +feeServiceInput.value;
  const deliveryFee = feeDeliveryInput.value==='' ? DELIVERY_FEE_DEFAULT : +feeDeliveryInput.value;

  const processedItems = currentAdmin.items.map(it=>({
    name: it.name,
    qty:  Math.max(1, parseInt(it.qty||1,10)),
    available: !!it.available,
    price: (it.available && it.price!=null) ? money(it.price) : null
  }));

  const anyAvailableWithPrice = processedItems.some(it => it.available && it.price != null);
  if (!anyAvailableWithPrice){
    alert("Please mark at least one item as available and set its price before finishing.");
    return;
  }

  const customerPayload = {
    type:'order',
    shop: currentAdmin.shop,
    shopPhone: currentAdmin.shopPhone || "",
    customerName: currentAdmin.customerName || "",
    customerPhone: currentAdmin.customerPhone || "",
    items: processedItems,
    fees: { service: serviceFee, delivery: deliveryFee }
  };

  try {
    // update per-shop catalog before creating customer link
    await syncShopCatalog(currentAdmin.shop, processedItems);

    const id = await putShort(customerPayload);
    const link = `${location.origin}${location.pathname}?order=${id}`;

    // connect this customer order link back to the admin doc
    if (adminDocId) {
      try {
        await updateDoc(doc(linksCol, adminDocId), { orderId: id });
      } catch (e) {
        console.error("Failed to attach orderId to admin doc", e);
      }
    }

    // For now, still show link to admin (you) for testing
    try {
      await navigator.clipboard.writeText(link);
      alert("Customer summary link copied to clipboard.\nYou can send it to the customer by SMS.");
    } catch {
      alert("Customer link:\n" + link);
    }
  } catch(e) {
    console.error("adminDone error", e);
    alert("Something went wrong creating customer summary.");
  }
});

/* ===== Customer UI ===== */
function addCustCard(container, idx, it){
  const available = !!it.available && it.price!=null;
  const unit = available ? money(it.price) : 0;
  const qty  = Math.max(1, parseInt(it.qty||1,10));
  const sub  = available ? (unit * qty) : 0;

  const card=document.createElement('div');
  card.className='cust-item-card';
  card.innerHTML=`
    <div class="cust-row1">
      <div class="cust-item-num">${idx}.</div>
      <div class="cust-item-name">${escapeHtml(it.name)}</div>
      <div class="cust-item-meta">Qty: ${qty}</div>
    </div>
    <div class="cust-row2">
      <div class="cust-badge ${available?'':'off'}">
        ${available?'Available':'Unavailable'}
      </div>
      ${
        available
        ? `<div class="cust-price-block">
             <div class="cust-price-line">
               <span class="unit">Unit: GH₵ ${unit.toFixed(2).replace(/\.00$/,'')}</span>
               <span>× ${qty}</span>
               <span class="sub">= GH₵ ${sub.toFixed(2).replace(/\.00$/,'')}</span>
             </div>
           </div>`
        : ``
      }
    </div>
  `;
  container.appendChild(card);
}

function openCustomer(data){
  custShop.textContent = `Order · ${data.shop || ''}`;
  custAvail.innerHTML=''; 
  custUnavail.innerHTML='';

  let itemsTotal = 0;
  let availableCount = 0;

  (data.items||[]).forEach((it,i)=>{
    if (it.available && it.price != null){
      availableCount++;
      const qty = Math.max(1, parseInt(it.qty||1,10));
      const sub = money(it.price) * qty;
      itemsTotal += sub;
      addCustCard(custAvail, i+1, it);
    } else {
      addCustCard(custUnavail, i+1, it);
    }
  });

  const service  = availableCount > 0 ? money(data.fees?.service ?? SERVICE_FEE_DEFAULT) : 0;
  const delivery = availableCount > 0 ? money(data.fees?.delivery ?? DELIVERY_FEE_DEFAULT) : 0;
  const grand = itemsTotal + service + delivery;

  custTotalsWrap.innerHTML = `
    <div class="line"><span>Items total</span><span>GH₵ ${itemsTotal.toFixed(2).replace(/\.00$/,'')}</span></div>
    <div class="line"><span>Service fee</span><span>GH₵ ${service.toFixed(2).replace(/\.00$/,'')}</span></div>
    <div class="line"><span>Delivery fee</span><span>GH₵ ${delivery.toFixed(2).replace(/\.00$/,'')}</span></div>
    <div class="line grand"><span>Grand total</span><span>GH₵ ${grand.toFixed(2).replace(/\.00$/,'')}</span></div>
  `;

  hideHome();
  customerPanel.style.display='block';
  customerPanel.setAttribute('aria-hidden','false');

  if (grand <= 0) {
    custPayBtn.style.display = 'none';
  } else {
    custPayBtn.style.display = 'inline-block';
  }

  custPayBtn.onclick = async () => {
    const BACKEND_URL = "https://us-central1-pickmeservicesonline.cloudfunctions.net/startPayment";

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: grand,
          customerName: data.customerName || "",
          customerPhone: data.customerPhone || "",
          shopName: data.shop || "",
          description: `Grocery order - ${data.shop || ""}`,
          clientReference: currentOrderId || Date.now().toString(36),
          channel: "mtn-gh"   // change later based on selected network
        })
      });

      const json = await res.json();

      if (json.ok) {
        alert(
          "We have sent a payment prompt to your phone.\n" +
          "Please check your Mobile Money and approve to finish the order."
        );
        window.location.href = "groceries.html";
      } else {
        alert(
          "We could not start the payment.\n" +
          (json.message || "Please try again or contact PickMe.")
        );
      }
    } catch (e) {
      console.error(e);
      alert("Network error starting payment. Please try again.");
    }
  };

  const goHome = () => window.location.href = "groceries.html";
  closeCustomerBtn.onclick = goHome;
  custCancelBtn.onclick = goHome;
}

/* ===== Tabs + search ===== */
tabs.forEach(tab=>{
  tab.addEventListener("click",()=>{
    tabs.forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    renderCards(tab.dataset.cat, searchInput.value);
  });
});
searchInput.addEventListener("input",()=>{
  const active = document.querySelector(".tab.active")?.dataset.cat || "All";
  renderCards(active, searchInput.value);
});

/* ===== Router ===== */
async function router() {
  const url = new URL(location.href);
  const adminId = url.searchParams.get("admin");
  const orderId = url.searchParams.get("order");

  document.body.classList.remove("ready");
  document.body.classList.add("hide-initial");

  try {
    if (adminId) {
      const payload = await getShort(adminId);
      if (payload && payload.type === "admin") {
        const code = prompt("Enter admin access code:");
        if (code === ADMIN_CODE) {
          hideHome();
          adminDocId = adminId;
          openAdmin(payload);
          document.body.classList.remove("hide-initial");
          document.body.classList.add("ready");
          return;
        } else {
          alert("Incorrect code. Access denied.");
          location.href = location.pathname;
          return;
        }
      }
    }

    if (orderId) {
      const payload = await getShort(orderId);
      if (payload && payload.type === "order") {
        hideHome();
        openCustomer(payload);
        document.body.classList.remove("hide-initial");
        document.body.classList.add("ready");
        return;
      }
    }

    showHome();
    document.body.classList.remove("hide-initial");
    document.body.classList.add("ready");
  } catch (err) {
    console.error("router error:", err);
    showHome();
    document.body.classList.remove("hide-initial");
    document.body.classList.add("ready");
  }
}

/* ===== Init ===== */
(async()=>{
  await loadTrustedCounts();
  renderCards("All","");
  router();
})();
