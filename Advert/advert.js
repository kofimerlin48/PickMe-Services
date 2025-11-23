// =========================
//  FIREBASE IMPORTS
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage(app);

// ==========================
//  HUBTEL (BACKEND URL)
// ==========================
const BACKEND_URL = "https://us-central1-pickmeservicesonline.cloudfunctions.net/startPayment";

// ==========================
//  PRICING + PLAN HELPERS
// ==========================
const PRICING = {
  "1_month":  { low: 30,  medium: 40,  high: 50  },
  "3_months": { low: 80,  medium: 90,  high: 100 },
  "6_months": { low: 180, medium: 190, high: 200 },
  "12_months":{ low: 280, medium: 290, high: 300 }
};

const PLAN_MONTHS = {
  "1_month": 1,
  "3_months": 3,
  "6_months": 6,
  "12_months": 12
};

const VIS_RANK = { low: 1, medium: 2, high: 3 };
const VIS_WEIGHT = { low: 1, medium: 2, high: 3 };

// ==========================
//  HELPERS
// ==========================
function getPlanLabel(planKey) {
  return {
    "1_month": "1 month",
    "3_months": "3 months",
    "6_months": "6 months",
    "12_months": "1 year"
  }[planKey] || planKey;
}

function getVisibilityLabel(visKey) {
  return {
    low: "Low visibility",
    medium: "Medium visibility",
    high: "High visibility"
  }[visKey] || visKey;
}

function getBaseAmount(planKey, visKey) {
  const plan = PRICING[planKey];
  if (!plan) return 0;
  return plan[visKey] ?? 0;
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ghana number normalizer (same logic as groceries page)
function normalizeGhanaNumber(input) {
  let s = String(input || "").trim().replace(/[\s\-]/g, "");
  if (!s) return null;

  if (s.startsWith("+233")) return { e164: s };
  if (s.startsWith("233")) return { e164: "+" + s };
  if (/^0\d{9}$/.test(s)) return { e164: "+233" + s.slice(1) };
  if (/^\d{9}$/.test(s)) return { e164: "+233" + s };

  const d = s.replace(/\D/g, "");
  if (d.startsWith("233")) return { e164: "+" + d };
  if (d.length === 10 && d.startsWith("0")) return { e164: "+233" + d.slice(1) };

  return null;
}

// ==========================
//  UI ELEMENTS (ADVERT VIEW)
// ==========================
const flyerEl = document.getElementById("flyer");
const flyerBg = document.getElementById("flyerBg");
const contactBtn = document.getElementById("contactBtn");
const closeAdBtn = document.getElementById("closeAdBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const advertLink = document.getElementById("advertLink");
const buttonContainer = contactBtn.parentElement;
const boostBtn = document.getElementById("boostBtn");

let flyers = [];
let currentIndex = 0;
let firstLoadDone = false;

// Track which adverts we have already counted in this session
const countedImpressions = new Set();

// ==========================
//  UI ELEMENTS (FORM WIZARD)
// ==========================
const adFormOverlay       = document.getElementById("adFormOverlay");
const adFormCloseBtn      = document.getElementById("adFormCloseBtn");
const adBackBtn           = document.getElementById("adBackBtn");
const adNextBtn           = document.getElementById("adNextBtn");
const adFormFooter        = document.querySelector(".ad-form-footer");
const adSteps             = document.querySelectorAll(".ad-step");

// step 1
const adTypeCards         = document.querySelectorAll(".ad-type-card");
const adTypeInputs        = document.querySelectorAll('input[name="adType"]');

// step 2
const adHostInput         = document.getElementById("adHost");
const adTitleInput        = document.getElementById("adTitle");
const adWhatsappInput     = document.getElementById("adWhatsapp");
const adDateRow           = document.getElementById("adDateRow");
const adDateInput         = document.getElementById("adDate");

// step 3
const adFlyerInput        = document.getElementById("adFlyerInput");
const adFlyerChooseBtn    = document.getElementById("adFlyerChooseBtn");
const adFlyerPreviewWrapper = document.getElementById("adFlyerPreviewWrapper");
const adFlyerPreview      = document.getElementById("adFlyerPreview");
const adFlyerRemoveBtn    = document.getElementById("adFlyerRemoveBtn");

// step 4
const adPlanSelect        = document.getElementById("adPlan");
const adVisibilitySelect  = document.getElementById("adVisibility");
const adSummaryText       = document.getElementById("adSummaryText");

let currentStep = 1;
const TOTAL_STEPS = 4;

let adFormData = {
  adType: null,      // "event" or "business"
  host: "",
  title: "",
  whatsapp: "",
  date: "",
  plan: "1_month",
  visibility: "low",
  flyerFile: null
};

// ==========================
//  UI ELEMENTS (BOOST MODAL)
// ==========================
const boostOverlay                = document.getElementById("boostOverlay");
const boostCloseBtn               = document.getElementById("boostCloseBtn");
const boostTitleEl                = document.getElementById("boostTitle");
const boostHostEl                 = document.getElementById("boostHost");
const boostCurrentPlanText        = document.getElementById("boostCurrentPlanText");
const boostCurrentVisibilityText  = document.getElementById("boostCurrentVisibilityText");
const boostPlanSelect             = document.getElementById("boostPlan");
const boostVisibilitySelect       = document.getElementById("boostVisibility");
const boostSummaryText            = document.getElementById("boostSummaryText");
const boostCancelBtn              = document.getElementById("boostCancelBtn");
const boostPayBtn                 = document.getElementById("boostPayBtn");

let currentBoostAd = null;

// ==========================
//  IMPRESSION TRACKING
// ==========================
async function recordImpression(ad) {
  try {
    if (!ad || !ad.id) return;
    const adRef = doc(db, "Adverts", "items", "AdvertsList", ad.id);
    await updateDoc(adRef, {
      impressions: increment(1),
      lastShownAt: serverTimestamp()
    });
  } catch (e) {
    console.error("recordImpression error", e);
  }
}

// ==========================
//  LOAD ADVERTS FROM FIRESTORE
//  + GLOBAL FAIRNESS (OPTION B)
// ==========================
async function loadAdverts() {
  try {
    console.log("Reading: Adverts / items / AdvertsList");
    const snap = await getDocs(
      collection(db, "Adverts", "items", "AdvertsList")
    );

    const now = new Date();
    const temp = [];

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const ad = {
        id: docSnap.id,
        ...data
      };

      // defaults if missing
      if (!ad.visibility) ad.visibility = "medium";
      if (!ad.plan) ad.plan = "1_month";

      // FILTER BY EXPIRY + EVENT DATE
      let show = true;

      let expiryDate = null;
      if (ad.expiry) {
        expiryDate = new Date(ad.expiry);
      }

      let eventDate = null;
      if (ad.hasDate && ad.date) {
        eventDate = new Date(ad.date);
      }

      let cutoff = null;
      if (expiryDate && eventDate) {
        cutoff = (expiryDate < eventDate) ? expiryDate : eventDate;
      } else if (expiryDate) {
        cutoff = expiryDate;
      } else if (eventDate) {
        cutoff = eventDate;
      }

      if (cutoff && now > cutoff) {
        show = false;
      }

      if (!show) return;

      // ensure impressions field exists
      const impressions = (typeof ad.impressions === "number")
        ? ad.impressions
        : 0;

      const weight = VIS_WEIGHT[ad.visibility] || 2;
      const score = impressions / weight; // fairness score

      temp.push({
        ...ad,
        impressions,
        weight,
        score
      });
    });

    flyers = temp;

    console.log("Remaining after expiry/event filter:", flyers.length);

    if (flyers.length === 0) {
      flyerEl.style.display = "none";
      buttonContainer.style.display = "none";
      boostBtn.style.display = "none";
      flyerBg.style.background = "#000";
      return;
    }

    // ======================
    // GLOBAL FAIRNESS ORDERING
    // lowest score (impressions / weight) first
    // tie-break randomly
    // ======================
    flyers = flyers
      .map(ad => ({
        ...ad,
        _rand: Math.random()
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        // tie-breaker random
        return a._rand - b._rand;
      });

    // drop helper field
    flyers = flyers.map(({ _rand, ...rest }) => rest);

    currentIndex = 0;

    // Preload the first advert for instant display, then show
    preloadImage(flyers[0].image).then(() => {
      showFlyer(currentIndex);
    });

    // Show boost button once adverts exist
    boostBtn.style.display = "inline-flex";

  } catch (err) {
    console.error("Error loading adverts:", err);
  }
}

// Preload image helper
function preloadImage(url) {
  return new Promise(resolve => {
    if (!url) return resolve();
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  });
}

// ==========================
//  SHOW A SINGLE ADVERT
// ==========================
function showFlyer(i) {
  const flyer = flyers[i];
  if (!flyer) return;

  const isFirst = !firstLoadDone;
  const adId = flyer.id;

  // For second+ adverts: fade out current
  if (!isFirst) {
    flyerEl.style.opacity = 0;
    buttonContainer.style.opacity = 0;
    boostBtn.classList.remove("visible");
  }

  // Clear old onload handler to avoid stacking
  flyerEl.onload = null;

  // Set image + background
  flyerEl.src = flyer.image;
  flyerBg.style.backgroundImage = `url(${flyer.image})`;

  // Preload next flyer (nice but not forced)
  const nextIndex = (i + 1) % flyers.length;
  if (flyers[nextIndex] && flyers[nextIndex].image) {
    const preloadImg = new Image();
    preloadImg.src = flyers[nextIndex].image;
  }

  // BUTTON LOGIC
  if (flyer.buttonText && flyer.buttonLink) {
    contactBtn.style.display = "inline-block";
    contactBtn.innerText = flyer.buttonText;
    contactBtn.onclick = () => window.open(flyer.buttonLink, "_blank");
  } else if (flyer.whatsapp) {
    contactBtn.style.display = "inline-block";
    contactBtn.innerText = "Contact Us";
    contactBtn.onclick = () => {
      const msg = `Hi ${flyer.host || ""}, I saw your Advert: *${flyer.event || flyer.title || ""}* on PickMe Services and I want to make enquiries.`;
      window.open(`https://wa.me/${flyer.whatsapp}?text=${encodeURIComponent(msg)}`);
    };
  } else {
    contactBtn.style.display = "none";
  }

  // BOOST LOGIC
  boostBtn.onclick = () => openBoostModal(flyer);

  // Fade + impression logic
  flyerEl.onload = () => {
    // FIRST IMAGE: show instantly (no fancy delay)
    if (isFirst) {
      flyerEl.style.opacity = 1;
      buttonContainer.style.opacity = 1;
      boostBtn.classList.add("visible");
      firstLoadDone = true;
    } else {
      // OTHERS: fade in (CSS handles animation)
      flyerEl.style.opacity = 1;
      buttonContainer.style.opacity = 1;
      boostBtn.classList.add("visible");
    }

    // Record impression ONCE per advert per page session
    if (adId && !countedImpressions.has(adId)) {
      countedImpressions.add(adId);
      recordImpression(flyer);
    }
  };
}

// ==========================
//  ARROWS + SWIPE
// ==========================
prevBtn.onclick = () => {
  if (!flyers.length) return;
  currentIndex = (currentIndex - 1 + flyers.length) % flyers.length;
  showFlyer(currentIndex);
};

nextBtn.onclick = () => {
  if (!flyers.length) return;
  currentIndex = (currentIndex + 1) % flyers.length;
  showFlyer(currentIndex);
};

// swipe
let startX = 0;
flyerEl.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});
flyerEl.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  if (endX - startX > 50) {
    prevBtn.onclick();
  } else if (startX - endX > 50) {
    nextBtn.onclick();
  }
});

closeAdBtn.onclick = () => window.location.href = "/homepage.html";

// ==========================
//  FULL PAGE FORM WIZARD
// ==========================
function openAdForm() {
  currentStep = 1;
  resetAdForm();
  updateStepView();
  adFormOverlay.classList.add("active");
}

function closeAdForm() {
  adFormOverlay.classList.remove("active");
}

// reset fields
function resetAdForm() {
  adFormData = {
    adType: null,
    host: "",
    title: "",
    whatsapp: "",
    date: "",
    plan: "1_month",
    visibility: "low",
    flyerFile: null
  };

  // type
  adTypeInputs.forEach(i => i.checked = false);
  adTypeCards.forEach(c => c.classList.remove("selected"));

  // text fields
  adHostInput.value = "";
  adTitleInput.value = "";
  adWhatsappInput.value = "";
  adDateInput.value = "";
  adDateRow.classList.remove("hidden");

  // flyer
  adFlyerInput.value = "";
  adFlyerPreviewWrapper.classList.add("hidden");
  adFlyerPreview.src = "";
  adFlyerChooseBtn.style.display = "inline-block";
  adFlyerPreviewWrapper.style.removeProperty("--flyer-preview-url");

  // step 4
  adPlanSelect.value = "1_month";
  adVisibilitySelect.value = "low";
  updateVisibilityOptionsWithPrices();
  updateSummary();
  updateNextButtonState();
}

// show correct step
function updateStepView() {
  adSteps.forEach(step => {
    const s = Number(step.getAttribute("data-step"));
    step.classList.toggle("active", s === currentStep);
  });

  // footer hidden on step 1
  if (currentStep === 1) {
    adFormFooter.style.display = "none";
  } else {
    adFormFooter.style.display = "flex";
  }

  // back button
  adBackBtn.disabled = currentStep === 1;

  // next button text
  if (currentStep === TOTAL_STEPS) {
    adNextBtn.textContent = "Submit & pay";
  } else {
    adNextBtn.textContent = "Continue";
  }

  // date row visibility based on type
  if (adFormData.adType === "event") {
    adDateRow.classList.remove("hidden");
  } else {
    adDateRow.classList.add("hidden");
  }

  updateNextButtonState();
}

// enable/disable Continue based on requirements
function updateNextButtonState() {
  let enabled = false;

  if (currentStep === 1) {
    enabled = false; // footer hidden anyway
  } else if (currentStep === 2) {
    const hostOk = adHostInput.value.trim().length > 0;
    const titleOk = adTitleInput.value.trim().length > 0;
    const phoneOk = adWhatsappInput.value.trim().length > 0;
    const dateOk = adFormData.adType === "event"
      ? !!adDateInput.value
      : true;
    enabled = hostOk && titleOk && phoneOk && dateOk;
  } else if (currentStep === 3) {
    enabled = !!adFormData.flyerFile;
  } else if (currentStep === 4) {
    enabled = true;
  }

  if (enabled) {
    adNextBtn.classList.remove("disabled");
    adNextBtn.disabled = false;
  } else {
    adNextBtn.classList.add("disabled");
    adNextBtn.disabled = true;
  }
}

// validation per step (hard guards)
function validateStep(stepNum) {
  if (stepNum === 1) {
    if (!adFormData.adType) {
      alert("Please choose what your advert is about.");
      return false;
    }
  }

  if (stepNum === 2) {
    if (!adHostInput.value.trim()) {
      alert("Please enter the host / organiser name.");
      return false;
    }
    if (!adTitleInput.value.trim()) {
      alert("Please enter the advert title.");
      return false;
    }
    if (!adWhatsappInput.value.trim()) {
      alert("Please enter a WhatsApp / phone number.");
      return false;
    }
    if (adFormData.adType === "event" && !adDateInput.value) {
      alert("Please choose an event date.");
      return false;
    }
  }

  if (stepNum === 3) {
    if (!adFormData.flyerFile) {
      alert("Please upload a flyer image.");
      return false;
    }
  }

  return true;
}

// collect data for current step before moving on
function collectStepData(stepNum) {
  if (stepNum === 1) {
    const selected = Array.from(adTypeInputs).find(i => i.checked);
    adFormData.adType = selected ? selected.value : null;
  }

  if (stepNum === 2) {
    adFormData.host = adHostInput.value.trim();
    adFormData.title = adTitleInput.value.trim();
    adFormData.whatsapp = adWhatsappInput.value.trim();
    adFormData.date = adDateInput.value || "";
  }

  if (stepNum === 3) {
    // flyer already captured
  }

  if (stepNum === 4) {
    adFormData.plan = adPlanSelect.value;
    adFormData.visibility = adVisibilitySelect.value;
  }
}

// summary text for create form
function updateSummary() {
  const planKey = adPlanSelect.value;
  const visKey = adVisibilitySelect.value;
  const amount = getBaseAmount(planKey, visKey);

  const planLabel = getPlanLabel(planKey);
  const visLabel = getVisibilityLabel(visKey);

  adSummaryText.innerHTML =
    `${planLabel} • ${visLabel} → <span class="price">GHS ${amount.toFixed(2)}</span>`;
}

// update visibility dropdown text with prices for current plan
function updateVisibilityOptionsWithPrices() {
  const planKey = adPlanSelect.value;
  const prices = PRICING[planKey];

  Array.from(adVisibilitySelect.options).forEach(opt => {
    const val = opt.value;
    const label = getVisibilityLabel(val);
    const price = prices[val];
    opt.textContent = `${label} – GHS ${price.toFixed(2)}`;
  });
}

// when type card clicked
adTypeCards.forEach(card => {
  card.addEventListener("click", () => {
    const input = card.querySelector('input[name="adType"]');
    if (!input) return;

    input.checked = true;
    adFormData.adType = input.value;

    adTypeCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    // show/hide date row
    if (input.value === "event") {
      adDateRow.classList.remove("hidden");
    } else {
      adDateRow.classList.add("hidden");
    }

    // as soon as they choose a type, move to step 2
    collectStepData(1);
    currentStep = 2;
    updateStepView();
  });
});

// flyer choose & preview
adFlyerChooseBtn.addEventListener("click", () => {
  adFlyerInput.click();
});

adFlyerInput.addEventListener("change", () => {
  const file = adFlyerInput.files[0];
  if (!file) return;

  adFormData.flyerFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    const url = e.target.result;
    adFlyerPreview.src = url;
    adFlyerPreviewWrapper.classList.remove("hidden");

    // blurred background like main advert page
    adFlyerPreviewWrapper.style.setProperty(
      "--flyer-preview-url",
      `url(${url})`
    );
  };
  reader.readAsDataURL(file);

  // hide choose button once a flyer is selected
  adFlyerChooseBtn.style.display = "none";

  updateNextButtonState();
});

adFlyerRemoveBtn.addEventListener("click", () => {
  adFlyerInput.value = "";
  adFormData.flyerFile = null;
  adFlyerPreviewWrapper.classList.add("hidden");
  adFlyerPreview.src = "";
  adFlyerPreviewWrapper.style.removeProperty("--flyer-preview-url");

  // show choose button again
  adFlyerChooseBtn.style.display = "inline-block";

  updateNextButtonState();
});

// plan / visibility change
adPlanSelect.addEventListener("change", () => {
  updateVisibilityOptionsWithPrices();
  updateSummary();
});
adVisibilitySelect.addEventListener("change", () => {
  updateSummary();
});

// keep Continue state in sync on text changes
[adHostInput, adTitleInput, adWhatsappInput, adDateInput].forEach(input => {
  input.addEventListener("input", updateNextButtonState);
});

// open form from "HERE"
advertLink.addEventListener("click", (e) => {
  e.preventDefault();
  openAdForm();
});

// nav buttons
adBackBtn.addEventListener("click", () => {
  if (currentStep > 2) {
    currentStep--;
    updateStepView();
  } else if (currentStep === 2) {
    currentStep = 1;
    updateStepView();
  }
});

adNextBtn.addEventListener("click", async () => {
  if (!validateStep(currentStep)) return;

  collectStepData(currentStep);

  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    if (currentStep === 4) {
      updateVisibilityOptionsWithPrices();
      updateSummary();
    }
    updateStepView();
  } else {
    await submitAdvert();
  }
});

adFormCloseBtn.addEventListener("click", () => {
  closeAdForm();
});

// ==========================
//  SUBMIT ADVERT REQUEST (CREATE)
//  + REAL HUBTEL PAYMENT
// ==========================
async function submitAdvert() {
  try {
    adNextBtn.disabled = true;
    adBackBtn.disabled = true;
    adNextBtn.textContent = "Processing...";

    // Validate flyer again
    const file = adFormData.flyerFile;
    if (!file) {
      alert("Please upload a flyer image.");
      return;
    }

    // Normalize phone for payment
    const norm = normalizeGhanaNumber(adFormData.whatsapp);
    if (!norm) {
      alert("Please enter a valid Ghana number (0..., 233..., or +233...).");
      return;
    }

    const now = new Date();
    const baseExpiry = addMonths(now, PLAN_MONTHS[adFormData.plan] || 1);
    const amount = getBaseAmount(adFormData.plan, adFormData.visibility);

    const planLabel = getPlanLabel(adFormData.plan);
    const visLabel = getVisibilityLabel(adFormData.visibility);
    const refBase = slugify(adFormData.title || adFormData.host || "advert");

    // ===== START HUBTEL PAYMENT (same backend as groceries) =====
    try {
      const payRes = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          customerName: adFormData.host,
          customerPhone: norm.e164,
          shopName: adFormData.title || adFormData.host,
          description: `Advert Subscription - ${planLabel} • ${visLabel}`,
          clientReference: `${refBase}_${Date.now()}`,
          channel: "mtn-gh"
        })
      });

      const payJson = await payRes.json();

      if (!payJson.ok) {
        alert("Payment failed: " + (payJson.message || "Please try again."));
        return;
      }

      alert("Payment prompt sent! Please approve on your phone.");
    } catch (e) {
      console.error("Payment error:", e);
      alert("Unable to start payment. Check your internet and try again.");
      return;
    }
    // ===== END HUBTEL PAYMENT =====

    // 1) Upload flyer to Firebase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `adverts/${fileName}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // 2) Create Firestore request for admin review
    await addDoc(collection(db, "Adverts", "Requests"), {
      type: adFormData.adType,
      host: adFormData.host,
      event: adFormData.title,
      whatsapp: adFormData.whatsapp,
      whatsappE164: norm.e164,
      hasDate: adFormData.adType === "event",
      date: adFormData.adType === "event" ? adFormData.date : null,
      plan: adFormData.plan,
      visibility: adFormData.visibility,
      amount,
      image: imageUrl,
      createdAt: serverTimestamp(),
      expiry: baseExpiry.toISOString().slice(0, 10),
      status: "pending_approval",
      source: "AdvertPageForm"
    });

    alert("Your advert request has been submitted. We will review and notify you.");
    closeAdForm();

  } catch (err) {
    console.error("Error submitting advert request:", err);
    alert("Sorry, something went wrong. Please try again.");
  } finally {
    adNextBtn.disabled = false;
    adBackBtn.disabled = false;
    adNextBtn.textContent = "Submit & pay";
    updateNextButtonState();
  }
}

// ==========================
//  BOOST MODAL LOGIC
// ==========================
function openBoostModal(ad) {
  currentBoostAd = ad;

  const title = ad.event || ad.title || "Advert";
  const host = ad.host || "";

  const currentPlan = ad.plan || "1_month";
  const currentVis  = ad.visibility || "medium";

  const currentAmount = getBaseAmount(currentPlan, currentVis);

  boostTitleEl.textContent = title;
  boostHostEl.textContent = host ? `by ${host}` : "";

  boostCurrentPlanText.textContent =
    `Duration: ${getPlanLabel(currentPlan)} (Base: GHS ${currentAmount.toFixed(2)})`;
  boostCurrentVisibilityText.textContent =
    `Visibility: ${getVisibilityLabel(currentVis)}`;

  // set selects, disable lower options
  Array.from(boostPlanSelect.options).forEach(opt => {
    const val = opt.value;
    const rank = PLAN_MONTHS[val] || 0;
    const curRank = PLAN_MONTHS[currentPlan] || 0;
    opt.disabled = rank < curRank; // cannot go down
  });
  boostPlanSelect.value = currentPlan;

  Array.from(boostVisibilitySelect.options).forEach(opt => {
    const val = opt.value;
    const rank = VIS_RANK[val] || 0;
    const curRank = VIS_RANK[currentVis] || 0;
    opt.disabled = rank < curRank; // cannot go down
  });
  boostVisibilitySelect.value = currentVis;

  updateBoostSummary();

  boostOverlay.classList.add("active");
}

function closeBoostModal() {
  boostOverlay.classList.remove("active");
  currentBoostAd = null;
}

function updateBoostSummary() {
  if (!currentBoostAd) return;

  const currentPlan = currentBoostAd.plan || "1_month";
  const currentVis  = currentBoostAd.visibility || "medium";
  const currentAmount = getBaseAmount(currentPlan, currentVis);

  const newPlan = boostPlanSelect.value;
  const newVis  = boostVisibilitySelect.value;
  const newAmount = getBaseAmount(newPlan, newVis);

  const planLabelCurrent = getPlanLabel(currentPlan);
  const visLabelCurrent  = getVisibilityLabel(currentVis);
  const planLabelNew     = getPlanLabel(newPlan);
  const visLabelNew      = getVisibilityLabel(newVis);

  const topUp = newAmount - currentAmount;

  if (topUp <= 0) {
    boostSummaryText.innerHTML =
      `You are already on <strong>${planLabelCurrent}</strong> • <strong>${visLabelCurrent}</strong>.<br>` +
      `No extra payment needed.`;
    boostPayBtn.classList.add("disabled");
    boostPayBtn.disabled = true;
  } else {
    boostSummaryText.innerHTML =
      `Current: ${planLabelCurrent} • ${visLabelCurrent} → GHS ${currentAmount.toFixed(2)}<br>` +
      `New: ${planLabelNew} • ${visLabelNew} → <span class="price">GHS ${newAmount.toFixed(2)}</span><br>` +
      `Top-up to pay now: <span class="price">GHS ${topUp.toFixed(2)}</span>`;
    boostPayBtn.classList.remove("disabled");
    boostPayBtn.disabled = false;
  }
}

boostPlanSelect.addEventListener("change", updateBoostSummary);
boostVisibilitySelect.addEventListener("change", updateBoostSummary);

boostCloseBtn.addEventListener("click", closeBoostModal);
boostCancelBtn.addEventListener("click", closeBoostModal);

// ==========================
//  BOOST PAY + UPDATE (REAL PAYMENT)
// ==========================
boostPayBtn.addEventListener("click", async () => {
  if (!currentBoostAd) return;

  const currentPlan = currentBoostAd.plan || "1_month";
  const currentVis  = currentBoostAd.visibility || "medium";
  const currentAmount = getBaseAmount(currentPlan, currentVis);

  const newPlan = boostPlanSelect.value;
  const newVis  = boostVisibilitySelect.value;
  const newAmount = getBaseAmount(newPlan, newVis);
  const topUp = newAmount - currentAmount;

  if (topUp <= 0) {
    alert("No upgrade selected.");
    return;
  }

  // Phone number for the person boosting (host's number)
  const norm = normalizeGhanaNumber(currentBoostAd.whatsapp);
  if (!norm) {
    alert("This advert has an invalid phone number saved. Please contact PickMe to update it before boosting.");
    return;
  }

  try {
    boostPayBtn.disabled = true;
    boostCancelBtn.disabled = true;
    boostPayBtn.textContent = "Processing...";

    const planLabelNew = getPlanLabel(newPlan);
    const visLabelNew  = getVisibilityLabel(newVis);
    const refBase = slugify(currentBoostAd.event || currentBoostAd.title || "advert");

    // ===== HUBTEL PAYMENT – BOOST =====
    try {
      const payRes = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: topUp,
          customerName: currentBoostAd.host || "",
          customerPhone: norm.e164,
          shopName: currentBoostAd.event || currentBoostAd.title || "",
          description: `Advert Boost - ${planLabelNew} • ${visLabelNew}`,
          clientReference: `${refBase}_boost_${Date.now()}`,
          channel: "mtn-gh"
        })
      });

      const payJson = await payRes.json();

      if (!payJson.ok) {
        alert("Payment failed: " + (payJson.message || "Please try again."));
        return;
      }

      alert("Payment prompt sent! Please approve on your phone.");
    } catch (e) {
      console.error("Boost payment error:", e);
      alert("Unable to start payment. Check your internet and try again.");
      return;
    }
    // ===== END HUBTEL BOOST PAYMENT =====

    // ===== UPDATE FIRESTORE ADVERT DOC =====
    const adId = currentBoostAd.id;
    if (!adId) {
      console.warn("Advert has no id; cannot update in Firestore.");
    } else {
      const curMonths = PLAN_MONTHS[currentPlan] || 0;
      const newMonths = PLAN_MONTHS[newPlan] || curMonths;

      let existingExpiry = null;
      if (currentBoostAd.expiry) {
        existingExpiry = new Date(currentBoostAd.expiry);
      }

      let baseDate;
      if (existingExpiry && existingExpiry > new Date()) {
        baseDate = existingExpiry;
      } else {
        baseDate = new Date();
      }

      const extraMonths = Math.max(newMonths - curMonths, 0);
      const newExpiry = extraMonths > 0
        ? addMonths(baseDate, extraMonths)
        : baseDate;

      const adRef = doc(db, "Adverts", "items", "AdvertsList", adId);
      await updateDoc(adRef, {
        plan: newPlan,
        visibility: newVis,
        amount: newAmount,
        expiry: newExpiry.toISOString().slice(0, 10),
        boostedAt: serverTimestamp()
      });

      alert("Advert boosted successfully.");
    }

    closeBoostModal();
    await loadAdverts(); // reload ordering with updated plan/visibility

  } catch (err) {
    console.error("Error boosting advert:", err);
    alert("Sorry, something went wrong while boosting. Please try again.");
  } finally {
    boostPayBtn.disabled = false;
    boostCancelBtn.disabled = false;
    boostPayBtn.textContent = "Pay & boost";
  }
});

// ==========================
//  START
// ==========================
updateVisibilityOptionsWithPrices();
updateSummary();
updateNextButtonState();
loadAdverts();
