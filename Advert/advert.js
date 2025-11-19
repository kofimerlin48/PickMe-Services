// =========================
//  FIREBASE IMPORTS
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================
//  FIREBASE CONFIG
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyBBxLGdn11dnQqcQ8vJOGR1RyjRqzAGwGck",
  authDomain: "pickmeservicesonline.firebaseapp.com",
  projectId: "pickmeservicesonline",
  storageBucket: "pickmeservicesonline.firebasestorage.app",
  messagingSenderId: "265031616239",
  appId: "1:265031616239:web:e2ef418704af5595aa7d1a"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================
//  UI ELEMENTS (MAIN PAGE)
// ==========================
const flyerEl       = document.getElementById("flyer");
const flyerBg       = document.getElementById("flyerBg");
const contactBtn    = document.getElementById("contactBtn");
const closeAdBtn    = document.getElementById("closeAdBtn");
const prevBtn       = document.getElementById("prevBtn");
const nextBtn       = document.getElementById("nextBtn");
const buttonContainer = contactBtn ? contactBtn.parentElement : null;

let flyers = [];
let currentIndex = 0;

// ==========================
//  LOAD ADVERTS FROM FIRESTORE
// ==========================
async function loadAdverts() {
  try {
    console.log("Reading: Adverts / items / AdvertsList");
    const snap = await getDocs(
      collection(db, "Adverts", "items", "AdvertsList")
    );

    flyers = [];
    snap.forEach(doc => {
      const data = doc.data();
      flyers.push(data);
    });

    console.log("Total adverts from Firestore:", flyers.length);

    // Remove expired
    const now = new Date();
    flyers = flyers.filter(f => {
      if (!f.expiry) return true;
      const expiry = new Date(f.expiry);
      return now <= expiry;
    });

    console.log("Remaining after expiry filter:", flyers.length);

    if (!flyers.length) {
      if (flyerEl) flyerEl.style.display = "none";
      if (buttonContainer) buttonContainer.style.display = "none";
      if (flyerBg) flyerBg.style.background = "#000";
      return;
    }

    // RANDOM ORDER (for all users)
    flyers = flyers
      .map(f => ({ f, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(x => x.f);

    // RANDOM START INDEX
    currentIndex = Math.floor(Math.random() * flyers.length);
    showFlyer(currentIndex);
  } catch (err) {
    console.error("Error loading adverts:", err);
  }
}

// ==========================
//  SHOW A SINGLE ADVERT
// ==========================
function showFlyer(i) {
  const flyer = flyers[i];
  if (!flyer || !flyerEl || !flyerBg || !buttonContainer) return;

  flyerEl.style.opacity = 0;
  buttonContainer.style.opacity = 0;

  setTimeout(() => {
    flyerEl.src = flyer.image;
    flyerBg.style.backgroundImage = `url(${flyer.image})`;

    // BUTTON LOGIC
    if (flyer.buttonText && flyer.buttonLink) {
      contactBtn.style.display = "inline-block";
      contactBtn.innerText = flyer.buttonText;
      contactBtn.onclick = () => window.open(flyer.buttonLink, "_blank");
    } else if (flyer.whatsapp) {
      contactBtn.style.display = "inline-block";
      contactBtn.innerText = "Contact Us";
      contactBtn.onclick = () => {
        const msg = `Hi ${flyer.host}, I saw your Advert: *${flyer.event}* on PickMe Services and I want to make enquiries.`;
        window.open(`https://wa.me/${flyer.whatsapp}?text=${encodeURIComponent(msg)}`);
      };
    } else {
      contactBtn.style.display = "none";
    }

    flyerEl.onload = () => {
      flyerEl.style.opacity = 1;
      buttonContainer.style.opacity = 1;
    };
  }, 200);
}

// ==========================
//  BUTTON CONTROLS
// ==========================
if (prevBtn) {
  prevBtn.onclick = () => {
    if (!flyers.length) return;
    currentIndex = (currentIndex - 1 + flyers.length) % flyers.length;
    showFlyer(currentIndex);
  };
}

if (nextBtn) {
  nextBtn.onclick = () => {
    if (!flyers.length) return;
    currentIndex = (currentIndex + 1) % flyers.length;
    showFlyer(currentIndex);
  };
}

if (closeAdBtn) {
  closeAdBtn.onclick = () => window.location.href = "/homepage.html";
}

// ==========================
//  SWIPE GESTURE (RESTORED)
// ==========================
let startX = 0;
if (flyerEl) {
  flyerEl.addEventListener("touchstart", e => {
    if (!e.touches || !e.touches.length) return;
    startX = e.touches[0].clientX;
  });

  flyerEl.addEventListener("touchend", e => {
    if (!e.changedTouches || !e.changedTouches.length) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (diff > 50 && prevBtn && typeof prevBtn.onclick === "function") {
      prevBtn.onclick();
    } else if (diff < -50 && nextBtn && typeof nextBtn.onclick === "function") {
      nextBtn.onclick();
    }
  });
}

// ==========================
//  ADVERT WIZARD (MULTI STEP)
// ==========================
const advertLink      = document.getElementById("advertLink");
const adWizardOverlay = document.getElementById("adWizardOverlay");
const adWizardBody    = document.getElementById("adWizardBody");
const adWizardStepLbl = document.getElementById("adWizardStepLabel");
const adWizardClose   = document.getElementById("adWizardClose");
const adWizardBack    = document.getElementById("adWizardBack");
const adWizardNext    = document.getElementById("adWizardNext");
const adWizardStatus  = document.getElementById("adWizardStatus");

// Form state we will build across steps
const adState = {
  type: "",          // "event" or "business"
  eventDate: "",
  title: "",
  host: "",
  whatsapp: "",
  plan: "",          // "1m", "3m", "6m", "12m"
  visibility: "",    // "low", "medium", "high"
  price: 0,
  notes: "",
  flyerFile: null
};

// Price table (temporary – later from admin panel)
const PRICE_TABLE = {
  "1m":  { low: 30,  medium: 40,  high: 50  },
  "3m":  { low: 80,  medium: 90,  high: 100 },
  "6m":  { low: 180, medium: 190, high: 200 },
  "12m": { low: 280, medium: 290, high: 300 }
};

let wizardStep = 0;  // 0..3
const TOTAL_STEPS = 4;

// Open / close
function openWizard() {
  if (!adWizardOverlay) return;
  adWizardOverlay.classList.remove("hidden");
  wizardStep = 0;
  renderWizardStep();
}

function closeWizard() {
  if (!adWizardOverlay) return;
  adWizardOverlay.classList.add("hidden");
  adWizardStatus.textContent = "";
}

// Attach open
if (advertLink) {
  advertLink.addEventListener("click", (e) => {
    e.preventDefault();
    openWizard();
  });
}

// Close controls
if (adWizardClose) {
  adWizardClose.addEventListener("click", () => closeWizard());
}
if (adWizardOverlay) {
  adWizardOverlay.addEventListener("click", (e) => {
    if (e.target === adWizardOverlay) closeWizard();
  });
}

// Back / Next
if (adWizardBack) {
  adWizardBack.addEventListener("click", () => {
    if (wizardStep > 0) {
      wizardStep--;
      adWizardStatus.textContent = "";
      renderWizardStep();
    }
  });
}
if (adWizardNext) {
  adWizardNext.addEventListener("click", () => {
    handleWizardNext();
  });
}

// Render each step
function renderWizardStep() {
  if (!adWizardBody || !adWizardStepLbl || !adWizardNext || !adWizardBack) return;

  adWizardBody.innerHTML = "";
  adWizardStatus.textContent = "";

  adWizardBack.style.visibility = wizardStep === 0 ? "hidden" : "visible";
  adWizardNext.textContent = wizardStep === TOTAL_STEPS - 1
    ? "Submit & pay"
    : "Continue";

  switch (wizardStep) {
    case 0:
      adWizardStepLbl.textContent = "Step 1 of 4 • Type & date";
      renderStepTypeAndDate();
      break;
    case 1:
      adWizardStepLbl.textContent = "Step 2 of 4 • Basic details";
      renderStepBasicDetails();
      break;
    case 2:
      adWizardStepLbl.textContent = "Step 3 of 4 • Plan & visibility";
      renderStepPlanVisibility();
      break;
    case 3:
      adWizardStepLbl.textContent = "Step 4 of 4 • Flyer & notes";
      renderStepFlyerNotes();
      break;
  }
}

// --- STEP 0: Type + optional date ---
function renderStepTypeAndDate() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <p>What kind of advert is this?</p>
    <div class="ad-type-grid">
      <div class="ad-type-card" data-type="event">
        <div class="ad-type-card-title">Event / has date</div>
        <div class="ad-type-card-sub">
          Funerals, parties, church programs, promos ending on a specific date.
        </div>
      </div>
      <div class="ad-type-card" data-type="business">
        <div class="ad-type-card-title">Ongoing / business advert</div>
        <div class="ad-type-card-sub">
          Shops, services, forever products with no fixed end date.
        </div>
      </div>
    </div>

    <label style="margin-top:10px;">
      Event date (only if your advert has a date)
    </label>
    <input type="date" id="adEventDateInput" value="${adState.eventDate || ""}">
    <p style="font-size:12px; opacity:0.8; margin-top:4px;">
      If your advert is a one-time event (e.g. funeral, show, promotion ending), choose <b>Event / has date</b> and select the date.
      Otherwise choose <b>Ongoing / business advert</b>.
    </p>
  `;

  adWizardBody.appendChild(wrap);

  // set selected card
  const cards = wrap.querySelectorAll(".ad-type-card");
  cards.forEach(card => {
    const t = card.getAttribute("data-type");
    if (t === adState.type) card.classList.add("selected");
    card.addEventListener("click", () => {
      adState.type = t;
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  const dateInput = wrap.querySelector("#adEventDateInput");
  if (dateInput) {
    dateInput.addEventListener("change", () => {
      adState.eventDate = dateInput.value || "";
    });
  }
}

// --- STEP 1: basic details ---
function renderStepBasicDetails() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <label>
      Advert title *
    </label>
    <input type="text" id="adTitleInput" value="${adState.title || ""}" placeholder="Eg. All Black Affair, Big Sales Promo">

    <label>
      Host / Business name *
    </label>
    <input type="text" id="adHostInput" value="${adState.host || ""}" placeholder="Eg. Manko Pub, PickMe Services">

    <label>
      WhatsApp / phone number *
    </label>
    <input type="tel" id="adWhatsappInput" value="${adState.whatsapp || ""}" placeholder="2335xxxxxxx">

    <p style="font-size:12px; opacity:0.8; margin-top:6px;">
      We'll use this number for enquiries and payment confirmation.
    </p>
  `;
  adWizardBody.appendChild(wrap);

  wrap.querySelector("#adTitleInput").addEventListener("input", e => {
    adState.title = e.target.value.trim();
  });
  wrap.querySelector("#adHostInput").addEventListener("input", e => {
    adState.host = e.target.value.trim();
  });
  wrap.querySelector("#adWhatsappInput").addEventListener("input", e => {
    adState.whatsapp = e.target.value.trim();
  });
}

// --- STEP 2: plan + visibility ---
function renderStepPlanVisibility() {
  const wrap = document.createElement("div");

  const plan = adState.plan || "";
  const vis  = adState.visibility || "";

  const currentPrice = computePrice(plan, vis);

  wrap.innerHTML = `
    <label>Subscription plan *</label>
    <select id="adPlanSelect">
      <option value="">Select plan</option>
      <option value="1m" ${plan === "1m" ? "selected" : ""}>1 month</option>
      <option value="3m" ${plan === "3m" ? "selected" : ""}>3 months</option>
      <option value="6m" ${plan === "6m" ? "selected" : ""}>6 months</option>
      <option value="12m" ${plan === "12m" ? "selected" : ""}>12 months</option>
    </select>

    <label style="margin-top:10px;">Visibility level *</label>
    <select id="adVisibilitySelect">
      <option value="">Select visibility</option>
      <option value="low" ${vis === "low" ? "selected" : ""}>Low visibility</option>
      <option value="medium" ${vis === "medium" ? "selected" : ""}>Medium visibility</option>
      <option value="high" ${vis === "high" ? "selected" : ""}>High visibility</option>
    </select>

    <div class="ad-price-hint" id="adPriceHint">
      ${currentPrice ? `Estimated price: <b>GHS ${currentPrice}</b>` : "Choose plan + visibility to see price."}
    </div>

    <p style="font-size:12px; margin-top:6px; opacity:0.8;">
      Price depends on <b>visibility</b>. Higher visibility means your advert shows more often across users.
    </p>
  `;
  adWizardBody.appendChild(wrap);

  const planSelect = wrap.querySelector("#adPlanSelect");
  const visSelect  = wrap.querySelector("#adVisibilitySelect");
  const priceHint  = wrap.querySelector("#adPriceHint");

  function updatePrice() {
    const p = planSelect.value;
    const v = visSelect.value;
    adState.plan = p;
    adState.visibility = v;
    const price = computePrice(p, v);
    adState.price = price;

    if (price && priceHint) {
      priceHint.innerHTML = `Estimated price: <b>GHS ${price}</b>`;
    } else if (priceHint) {
      priceHint.textContent = "Choose plan + visibility to see price.";
    }
  }

  planSelect.addEventListener("change", updatePrice);
  visSelect.addEventListener("change", updatePrice);
}

function computePrice(plan, vis) {
  if (!plan || !vis) return 0;
  const row = PRICE_TABLE[plan];
  if (!row) return 0;
  const value = row[vis];
  return value || 0;
}

// --- STEP 3: flyer + notes ---
function renderStepFlyerNotes() {
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <label>Flyer image (PNG / JPG) *</label>
    <input type="file" id="adFlyerInput" accept="image/*">

    <div id="adFlyerPreviewWrapper">
      <img id="adFlyerPreview" alt="Flyer preview"/>
      <button type="button" id="adFlyerRemoveBtn">Remove flyer</button>
    </div>

    <label style="margin-top:10px;">Extra notes (optional)</label>
    <textarea id="adNotesInput" placeholder="Any extra information for the admin...">${adState.notes || ""}</textarea>

    <p style="font-size:12px; opacity:0.8; margin-top:8px;">
      On the next step, we will trigger payment using the amount from your plan + visibility.
      After successful payment, your advert request will go to admin for review and approval.
    </p>
  `;

  adWizardBody.appendChild(wrap);

  const fileInput   = wrap.querySelector("#adFlyerInput");
  const previewImg  = wrap.querySelector("#adFlyerPreview");
  const removeBtn   = wrap.querySelector("#adFlyerRemoveBtn");
  const notesInput  = wrap.querySelector("#adNotesInput");

  // show existing file preview (if any) is not straightforward without blob,
  // so preview only when user selects again in this step.

  if (adState.flyerFile) {
    const url = URL.createObjectURL(adState.flyerFile);
    previewImg.src = url;
    previewImg.style.display = "block";
  } else {
    previewImg.style.display = "none";
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    adState.flyerFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewImg.style.display = "block";
  });

  removeBtn.addEventListener("click", () => {
    adState.flyerFile = null;
    fileInput.value = "";
    previewImg.style.display = "none";
  });

  notesInput.addEventListener("input", e => {
    adState.notes = e.target.value;
  });
}

// Handle Next / Submit
function handleWizardNext() {
  if (!adWizardNext || !adWizardStatus) return;

  // validate per step
  if (wizardStep === 0) {
    if (!adState.type) {
      adWizardStatus.textContent = "Please choose whether your advert is Event / has date or Ongoing / business.";
      return;
    }
    if (adState.type === "event" && !adState.eventDate) {
      adWizardStatus.textContent = "Please select the event date for your advert.";
      return;
    }
  } else if (wizardStep === 1) {
    if (!adState.title || !adState.host || !adState.whatsapp) {
      adWizardStatus.textContent = "Please fill in title, host and WhatsApp number.";
      return;
    }
  } else if (wizardStep === 2) {
    if (!adState.plan || !adState.visibility) {
      adWizardStatus.textContent = "Select a subscription plan and visibility level.";
      return;
    }
    if (!adState.price) {
      adWizardStatus.textContent = "Price could not be calculated. Please re-select plan and visibility.";
      return;
    }
  } else if (wizardStep === 3) {
    if (!adState.flyerFile) {
      adWizardStatus.textContent = "Please choose a flyer image.";
      return;
    }
  }

  if (wizardStep < TOTAL_STEPS - 1) {
    wizardStep++;
    adWizardStatus.textContent = "";
    renderWizardStep();
    return;
  }

  // FINAL SUBMIT STEP
  // (We are NOT calling Firebase or Haptel yet – just simulating.)
  adWizardNext.disabled = true;
  adWizardNext.textContent = "Preparing payment...";
  adWizardStatus.textContent = "";

  const payload = {
    ...adState,
    createdAt: new Date().toISOString()
  };

  console.log("Advert wizard final payload (preview only – no payment yet):", payload);

  // TODO LATER:
  // - Upload flyerFile to Firebase Storage
  // - Call Haptel payment with adState.price
  // - On success, write request to Firestore (AdvertsRequests / ...)
  // - Send SMS + deep link to admin

  setTimeout(() => {
    adWizardStatus.textContent =
      "Your details have been captured locally. Payment + admin review connection will be wired into this button.";
    adWizardNext.disabled = false;
    adWizardNext.textContent = "Submit & pay";
  }, 800);
}

// ==========================
//  START
// ==========================
loadAdverts();
