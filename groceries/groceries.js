// ========= FIREBASE + PAGE LOGIC =========
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

/* ===== DOM (we will assign after DOM is ready) ===== */
let cardsContainer, searchInput, tabs, homeHeader, homeSearch;

let detailsPanel, detailsBackBtn, detailsBanner, shopNameEl, shopSloganEl, carouselEl, dotsEl, openFormBtn;

let formModal, itemsHolder, addRowBtn, clearAllBtn, customerNameInput,
    customerPhoneInput, submitBtn, cancelBtn, formError;

let chooseModeModal, modeTypeBtn, modeSelectBtn, modeCancelBtn;

let catalogModal, catalogSearchInput, catalogListEl, catalogSelectedCount,
    catalogCloseBtn, catalogCancelBtn, catalogDoneBtn;

let openShopBtn, shopModal, shopCloseBtn, shopCancelBtn, shopSubmitBtn,
    ownerNameInput, ownerPhoneInput, shopNameInput, shopSloganInput,
    shopShortDesc, shopCategorySel, shopPlanSel, shopTownInput,
    shopPhoneInput, shopMainImage, shopSampleImages, shopError;

let waitingModal, waitingDots, waitingBtn;

let adminPanel, adminShop, adminAvail, adminUnavail, feeServiceInput,
    feeDeliveryInput, adminItemsTotal, adminGrandTotal, closeAdminBtn,
    adminCancelBtn, adminDoneBtn, adminShopActions;

let customerPanel, closeCustomerBtn, custShop, custAvail, custUnavail,
    custTotalsWrap, custPayBtn, custCancelBtn;

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
  if (!cardsContainer) return;
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
  if (!detailsPanel || !detailsBanner || !shopNameEl || !shopSloganEl) return;
  currentShop = shop;
  detailsBanner.style.backgroundImage = `url('${shop.heroImage}')`;
  shopNameEl.textContent = shop.name;
  shopSloganEl.textContent = shop.slogan || "";
  buildCarousel(shop.samples||[]);
  loadItemsForShop(shop.name);
  detailsPanel.classList.add("show");
}

function buildCarousel(images){
  if (!carouselEl || !dotsEl) return;
  carouselEl.innerHTML=""; 
  dotsEl.innerHTML="";
  if (!images || !images.length) return;
  images.forEach((src,i)=>{
    const img=document.createElement("img"); 
    img.src=src; 
    img.alt=`sample-${i+1}`;
    if(i===0) img.classList.add("active");
    carouselEl.appendChild(img);
    const dot=document.createElement("div"); 
    dot.className="dot"+(i===0?" active":"");
    dot.addEventListener("click",()=>goTo(i)); 
    dotsEl.appendChild(dot);
  });
  const left=document.createElement("div"); 
  left.className="nav left"; 
  left.innerHTML="&#10094;";
  const right=document.createElement("div"); 
  right.className="nav right"; 
  right.innerHTML="&#10095;";
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
  if (!formModal || !formError || !itemsHolder) return;
  formModal.classList.add("show");
  formError.style.display="none";
  if (!itemsHolder.children.length) addRow();
  const first=itemsHolder.querySelector(".item-card .item-name");
  if (first) setTimeout(()=>first.focus(),50);
}
function closeForm(){
  if (!formModal) return;
  formModal.classList.remove("show");
}

/* NEW: choose mode modal logic */
function openChooseMode(){
  if (!currentShop){
    alert("Please open a shop first.");
    return;
  }
  if (!chooseModeModal) return;
  chooseModeModal.classList.add("show");
}
function closeChooseMode(){
  if (!chooseModeModal) return;
  chooseModeModal.classList.remove("show");
}

let stickyFocusEl=null;

function restoreFocusSoon(el=stickyFocusEl){
  setTimeout(()=>{ if(el) el.focus(); },0);
}

function renumberRows(){
  if (!itemsHolder) return;
  itemsHolder.querySelectorAll(".item-num").forEach((el,i)=>el.textContent=`${i+1}.`);
}
function trashSVG(){ 
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7H4V5h4V4a1 1 0 0 1 1-1zm2 0v1h2V3h-2z"/></svg>`; 
}

function addRow(itemVal="", qtyVal="1"){
  if (!itemsHolder) return;
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
    let v=parseInt(qtyIn.value||"1",10); 
    if(!v||v<1) v=1; 
    if(v>1) v--; 
    qtyIn.value=String(v); 
    persist(); 
    restoreFocusSoon(qtyIn);
  });
  plus.addEventListener("click",()=>{
    let v=parseInt(qtyIn.value||"1",10); 
    if(!v||v<1) v=1; 
    v++; 
    qtyIn.value=String(v); 
    persist(); 
    restoreFocusSoon(qtyIn);
  });
  qtyIn.addEventListener("input",()=>{
    qtyIn.value = qtyIn.value.replace(/[^\d]/g,'');
    persist();
  });
  qtyIn.addEventListener("blur",()=>{
    let v=parseInt(qtyIn.value||"1",10); 
    if(!v||v<1) v=1; 
    qtyIn.value=String(v); 
    persist();
  });
  nameEl.addEventListener("input", persist);

  itemsHolder.appendChild(card); 
  renumberRows(); 
  setTimeout(()=>nameEl.focus(),0); 
  persist();
}

/* ===== Catalog modal logic ===== */
function resetCatalogModal(){
  currentCatalogItems = [];
  selectedCatalogIds = new Set();
  if (!catalogSearchInput || !catalogListEl || !catalogSelectedCount) return;
  catalogSearchInput.value = "";
  catalogListEl.innerHTML = "";
  catalogSelectedCount.textContent = "0";
}
function closeCatalogModal(){
  if (!catalogModal) return;
  catalogModal.classList.remove("show");
  resetCatalogModal();
}

function updateCatalogSelectionUI(){
  if (!catalogSelectedCount || !catalogListEl) return;
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
  if (!catalogListEl) return;
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
  if (!currentShop || !catalogModal || !catalogListEl || !catalogSelectedCount) return;
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

/* ===== Waiting modal logic ===== */
function openWaitingModal(adminId) {
  if (!waitingModal) return;
  if (waitingUnsub) waitingUnsub();

  waitingModal.classList.add("show");

  const dotsEl = document.getElementById("waitingDots");
  const bar = document.getElementById("waitingProgressBar");
  const counter = document.getElementById("waitingCounter");
  const btn = waitingBtn;
  const topMsg = document.getElementById("waitingTopMsg");

  if (!dotsEl || !bar || !counter || !btn || !topMsg) return;

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

/* ===== Submit item list: create admin link in Firestore (no link shown to user) ===== */
async function handleSubmitList(){
  if (!itemsHolder || !formError || !customerNameInput || !customerPhoneInput) return;

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
}

/* ===== Add Grocery Shop modal logic ===== */
function resetShopForm(){
  if (!ownerNameInput) return;
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
  if (!shopModal || !shopError) return;
  shopError.style.display="none";
  shopError.textContent="";
  shopModal.classList.add("show");
}
function closeShopModal(){
  if (!shopModal) return;
  shopModal.classList.remove("show");
}

async function uploadFile(path, file){
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file);
  return await getDownloadURL(snap.ref);
}

async function handleShopSubmit(){
  if (!shopError) return;

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

  // lock button width so it doesn't change as dots change
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
}

/* ===== Admin UI ===== */
function hideHome(){
  if (!homeHeader || !cardsContainer) return;
  homeHeader.style.display='none';
  const addWrap = document.querySelector(".add-shop-wrap");
  if (addWrap) addWrap.style.display='none';
  if (homeSearch) homeSearch.style.display='none';
  const tabsEl = document.getElementById('tabs');
  if (tabsEl) tabsEl.style.display='none';
  cardsContainer.style.display='none';
  if (detailsPanel) detailsPanel.classList.remove('show');
}
function showHome(){
  if (!homeHeader || !cardsContainer) return;
  homeHeader.style.display='';
  const addWrap = document.querySelector(".add-shop-wrap");
  if (addWrap) addWrap.style.display='';
  if (homeSearch) homeSearch.style.display='';
  const tabsEl = document.getElementById('tabs');
  if (tabsEl) tabsEl.style.display='';
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
  if (!adminAvail || !adminUnavail || !currentAdmin) return;
  adminAvail.innerHTML = "";
  adminUnavail.innerHTML = "";
  currentAdmin.items.forEach((rec, idx) => {
    const card = buildAdminCard(idx, rec);
    (rec.available ? adminAvail : adminUnavail).appendChild(card);
  });
}

function updateTotals() {
  if (!currentAdmin || !adminItemsTotal || !adminGrandTotal) return;
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
  if (!adminPanel || !adminShop || !adminShopActions) return;
  currentAdmin = JSON.parse(JSON.stringify(payload));
  adminShop.textContent = `Order · ${currentAdmin.shop || ''}`;

  adminShopActions.innerHTML='';
  if (currentAdmin.shopPhone){
    const a1=document.createElement('a'); 
    a1.href=`tel:${currentAdmin.shopPhone}`; 
    a1.className='call-btn'; 
    a1.innerHTML='📞 Call shop';
    const a2=document.createElement('a'); 
    a2.href=`https://wa.me/${currentAdmin.shopPhone}`; 
    a2.target='_blank'; 
    a2.className='wa-btn'; 
    a2.innerHTML='🟢 WhatsApp shop';
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
  window.location.href = "index.html";
}

/* Admin Done: create customer link in Firestore AND link it to the admin doc */
async function handleAdminDone(){
  if (!currentAdmin) return;
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
}

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
  if (!customerPanel || !custShop || !custAvail || !custUnavail || !custTotalsWrap || !custPayBtn) return;

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
        window.location.href = "index.html";
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

  const goHome = () => window.location.href = "index.html";
  if (closeCustomerBtn) closeCustomerBtn.onclick = goHome;
  if (custCancelBtn) custCancelBtn.onclick = goHome;
}

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

/* ===== Init after DOM is ready ===== */
document.addEventListener("DOMContentLoaded", () => {
  // Assign all DOM elements
  cardsContainer  = document.getElementById("cardsContainer");
  searchInput     = document.getElementById("searchInput");
  tabs            = document.querySelectorAll(".tab");
  homeHeader      = document.getElementById("homeHeader");
  homeSearch      = document.getElementById("homeSearch");

  detailsPanel    = document.getElementById("detailsPanel");
  detailsBackBtn  = document.getElementById("detailsBackBtn");
  detailsBanner   = document.getElementById("detailsBanner");
  shopNameEl      = document.getElementById("shopName");
  shopSloganEl    = document.getElementById("shopSlogan");
  carouselEl      = document.getElementById("carousel");
  dotsEl          = document.getElementById("dots");
  openFormBtn     = document.getElementById("openFormBtn");

  formModal       = document.getElementById("formModal");
  itemsHolder     = document.getElementById("itemsHolder");
  addRowBtn       = document.getElementById("addRowBtn");
  clearAllBtn     = document.getElementById("clearAllBtn");
  customerNameInput  = document.getElementById("customerName");
  customerPhoneInput = document.getElementById("customerPhone");
  submitBtn       = document.getElementById("submitBtn");
  cancelBtn       = document.getElementById("cancelBtn");
  formError       = document.getElementById("formError");

  chooseModeModal = document.getElementById("chooseModeModal");
  modeTypeBtn     = document.getElementById("modeTypeBtn");
  modeSelectBtn   = document.getElementById("modeSelectBtn");
  modeCancelBtn   = document.getElementById("modeCancelBtn");

  catalogModal        = document.getElementById("catalogModal");
  catalogSearchInput  = document.getElementById("catalogSearch");
  catalogListEl       = document.getElementById("catalogList");
  catalogSelectedCount= document.getElementById("catalogSelectedCount");
  catalogCloseBtn     = document.getElementById("catalogCloseBtn");
  catalogCancelBtn    = document.getElementById("catalogCancelBtn");
  catalogDoneBtn      = document.getElementById("catalogDoneBtn");

  openShopBtn      = document.getElementById("openShopBtn");
  shopModal        = document.getElementById("shopModal");
  shopCloseBtn     = document.getElementById("shopCloseBtn");
  shopCancelBtn    = document.getElementById("shopCancelBtn");
  shopSubmitBtn    = document.getElementById("shopSubmitBtn");
  ownerNameInput   = document.getElementById("ownerName");
  ownerPhoneInput  = document.getElementById("ownerPhone");
  shopNameInput    = document.getElementById("shopNameInput");
  shopSloganInput  = document.getElementById("shopSloganInput");
  shopShortDesc    = document.getElementById("shopShortDesc");
  shopCategorySel  = document.getElementById("shopCategory");
  shopPlanSel      = document.getElementById("shopPlan");
  shopTownInput    = document.getElementById("shopTown");
  shopPhoneInput   = document.getElementById("shopPhone");
  shopMainImage    = document.getElementById("shopMainImage");
  shopSampleImages = document.getElementById("shopSampleImages");
  shopError        = document.getElementById("shopError");

  waitingModal = document.getElementById("waitingModal");
  waitingDots  = document.getElementById("waitingDots");
  waitingBtn   = document.getElementById("waitingBtn");

  adminPanel      = document.getElementById("adminPanel");
  adminShop       = document.getElementById("adminShop");
  adminAvail      = document.getElementById("adminAvail");
  adminUnavail    = document.getElementById("adminUnavail");
  feeServiceInput = document.getElementById("feeServiceInput");
  feeDeliveryInput= document.getElementById("feeDeliveryInput");
  adminItemsTotal = document.getElementById("adminItemsTotal");
  adminGrandTotal = document.getElementById("adminGrandTotal");
  closeAdminBtn   = document.getElementById("closeAdminBtn");
  adminCancelBtn  = document.getElementById("adminCancel");
  adminDoneBtn    = document.getElementById("adminDone");
  adminShopActions= document.getElementById("adminShopActions");

  customerPanel   = document.getElementById("customerPanel");
  closeCustomerBtn= document.getElementById("closeCustomerBtn");
  custShop        = document.getElementById("custShop");
  custAvail       = document.getElementById("custAvail");
  custUnavail     = document.getElementById("custUnavail");
  custTotalsWrap  = document.querySelector(".cust-totals");
  custPayBtn      = document.getElementById("custPay");
  custCancelBtn   = document.getElementById("custCancel");

  // Wire up listeners SAFELY (only if elements exist)
  if (detailsBackBtn && detailsPanel){
    detailsBackBtn.addEventListener("click",()=>detailsPanel.classList.remove("show"));
  }

  if (openFormBtn){
    openFormBtn.addEventListener("click", openChooseMode);
  }
  if (cancelBtn){
    cancelBtn.addEventListener("click", closeForm);
  }

  if (modeCancelBtn){
    modeCancelBtn.addEventListener("click", closeChooseMode);
  }
  if (modeTypeBtn){
    modeTypeBtn.addEventListener("click", ()=>{
      closeChooseMode();
      openForm();
    });
  }
  if (modeSelectBtn){
    modeSelectBtn.addEventListener("click", async ()=>{
      closeChooseMode();
      await openCatalogModalForCurrentShop();
    });
  }

  if (formModal){
    formModal.addEventListener('focusin',e=>{
      if (e.target.matches('input[type="text"], input[type="number"], input[type="tel"]')) 
        stickyFocusEl=e.target;
    });
    formModal.addEventListener('mousedown',e=>{
      if (e.target.closest('button')) e.preventDefault();
    });
  }

  if (addRowBtn){
    addRowBtn.addEventListener("click",()=>{
      const last=itemsHolder.querySelector(".item-card:last-child .item-name");
      if (last && !last.value.trim()){ last.focus(); return; }
      addRow();
      const newest=itemsHolder.querySelector(".item-card:last-child .item-name");
      restoreFocusSoon(newest);
    });
  }

  if (clearAllBtn){
    clearAllBtn.addEventListener("click", ()=>{
      if (!currentShop || !itemsHolder) return;
      itemsHolder.innerHTML="";
      renumberRows();
      sessionStorage.removeItem(shopKeyStorage(currentShop.name));
    });
  }

  if (catalogCloseBtn){
    catalogCloseBtn.addEventListener("click", closeCatalogModal);
  }
  if (catalogCancelBtn){
    catalogCancelBtn.addEventListener("click", closeCatalogModal);
  }
  if (catalogSearchInput){
    catalogSearchInput.addEventListener("input", ()=>{
      renderCatalogList(catalogSearchInput.value);
    });
  }
  if (catalogDoneBtn){
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

      if (!itemsHolder || !formModal || !formError) return;

      itemsHolder.innerHTML = "";
      renumberRows();
      names.forEach(name=>{
        addRow(name, "1");
      });
      formError.style.display = "none";
      formModal.classList.add("show");
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

  if (openShopBtn){
    openShopBtn.addEventListener("click", openShopModal);
  }
  if (shopCloseBtn){
    shopCloseBtn.addEventListener("click", closeShopModal);
  }
  if (shopCancelBtn){
    shopCancelBtn.addEventListener("click", closeShopModal);
  }
  if (shopSubmitBtn){
    shopSubmitBtn.addEventListener("click", handleShopSubmit);
  }

  if (closeAdminBtn){
    closeAdminBtn.addEventListener('click', closeAdmin);
  }
  if (adminCancelBtn){
    adminCancelBtn.addEventListener('click', closeAdmin);
  }
  if (adminDoneBtn){
    adminDoneBtn.addEventListener("click", handleAdminDone);
  }

  if (submitBtn){
    submitBtn.addEventListener("click", handleSubmitList);
  }

  if (tabs && tabs.length){
    tabs.forEach(tab=>{
      tab.addEventListener("click",()=>{
        tabs.forEach(t=>t.classList.remove("active"));
        tab.classList.add("active");
        renderCards(tab.dataset.cat, searchInput.value);
      });
    });
  }
  if (searchInput){
    searchInput.addEventListener("input",()=>{
      const active = document.querySelector(".tab.active")?.dataset.cat || "All";
      renderCards(active, searchInput.value);
    });
  }

  // Initial load
  (async () => {
    await loadTrustedCounts();
    renderCards("All","");
    await router();
  })();
});
