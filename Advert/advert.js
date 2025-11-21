// =========================
//  FIREBASE IMPORTS
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
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

let flyers = [];
let currentIndex = 0;

// pricing: plan + visibility
const PRICING = {
  "1_month":  { low: 30,  medium: 40,  high: 50  },
  "3_months": { low: 80,  medium: 90,  high: 100 },
  "6_months": { low: 180, medium: 190, high: 200 },
  "12_months":{ low: 280, medium: 290, high: 300 }
};

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

      // Ensure we always have a visibility value (default medium)
      const visibility = data.visibility || "medium";

      // Keep doc id so future features (like boost) can update
      flyers.push({
        id: doc.id,
        ...data,
        visibility
      });
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

    if (flyers.length === 0) {
      flyerEl.style.display = "none";
      buttonContainer.style.display = "none";
      flyerBg.style.background = "#000";
      return;
    }

    // ======================
    // Weighted Visibility Sorting (High 5, Medium 3, Low 1)
    // ======================

    // 1. Split adverts by visibility
    const highAds   = flyers.filter(f => f.visibility === "high");
    const mediumAds = flyers.filter(f => f.visibility === "medium");
    const lowAds    = flyers.filter(f => f.visibility === "low");

    // 2. Weighted pick for FIRST advert
    function pickWeighted() {
      const weightedPool = [];

      highAds.forEach(ad   => weightedPool.push(...Array(5).fill(ad)));
      mediumAds.forEach(ad => weightedPool.push(...Array(3).fill(ad)));
      lowAds.forEach(ad    => weightedPool.push(...Array(1).fill(ad)));

      if (weightedPool.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * weightedPool.length);
      return weightedPool[randomIndex];
    }

    const firstAdvert = pickWeighted() || flyers[0];

    // 3. Remove first advert from its group so it does not repeat
    const removeFromArray = (arr, obj) => {
      const index = arr.indexOf(obj);
      if (index !== -1) arr.splice(index, 1);
    };

    if (firstAdvert) {
      if (firstAdvert.visibility === "high")   removeFromArray(highAds, firstAdvert);
      if (firstAdvert.visibility === "medium") removeFromArray(mediumAds, firstAdvert);
      if (firstAdvert.visibility === "low")    removeFromArray(lowAds, firstAdvert);
    }

    // 4. Shuffle groups independently
    function shuffle(arr) {
      return arr
        .map(x => ({ x, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(o => o.x);
    }

    const shuffledHigh   = shuffle(highAds);
    const shuffledMedium = shuffle(mediumAds);
    const shuffledLow    = shuffle(lowAds);

    // 5. Final arranged list:
    //    firstAdvert (weighted), then all HIGH, then MEDIUM, then LOW
    flyers = [
      firstAdvert,
      ...shuffledHigh,
      ...shuffledMedium,
      ...shuffledLow
    ].filter(Boolean);

    console.log("Weighted-arranged flyers:", flyers);

    // Start at index 0 ALWAYS → firstAdvert
    currentIndex = 0;
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
  if (!flyer) return;

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
//  ARROWS + SWIPE
// ==========================
prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + flyers.length) % flyers.length;
  showFlyer(currentIndex);
};

nextBtn.onclick = () => {
  currentIndex = (currentIndex + 1) % flyers.length;
  showFlyer(currentIndex);
};

// swipe (kept exactly as you asked)
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

// open & close
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

  // footer should NOT show on step 1
  if (currentStep === 1) {
    adFormFooter.style.display = "none";
  } else {
    adFormFooter.style.display = "flex";
  }

  // back button
  adBackBtn.disabled = currentStep === 1;  // first step that shows back

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

  // update enabled/disabled state
  updateNextButtonState();
}

// enable/disable Continue based on requirements
function updateNextButtonState() {
  let enabled = false;

  if (currentStep === 1) {
    enabled = false;
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

// validation per step (still hard guards)
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
    // flyer already captured on change
  }

  if (stepNum === 4) {
    adFormData.plan = adPlanSelect.value;
    adFormData.visibility = adVisibilitySelect.value;
  }
}

// summary text
function updateSummary() {
  const planKey = adPlanSelect.value;
  const visKey = adVisibilitySelect.value;
  const amount = PRICING[planKey][visKey];

  const planLabel = {
    "1_month": "1 month",
    "3_months": "3 months",
    "6_months": "6 months",
    "12_months": "1 year"
  }[planKey];

  const visLabel = {
    low: "Low visibility",
    medium: "Medium visibility",
    high: "High visibility"
  }[visKey];

  adSummaryText.innerHTML =
    `${planLabel} • ${visLabel} → <span class="price">GHS ${amount.toFixed(2)}</span>`;
}

// update visibility dropdown text with prices for current plan
function updateVisibilityOptionsWithPrices() {
  const planKey = adPlanSelect.value;
  const prices = PRICING[planKey];

  Array.from(adVisibilitySelect.options).forEach(opt => {
    const val = opt.value;
    const labelMap = {
      low: "Low visibility",
      medium: "Medium visibility",
      high: "High visibility"
    };
    const price = prices[val];
    opt.textContent = `${labelMap[val]} – GHS ${price.toFixed(2)}`;
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
    // if they go back from step2, we go to step1, which hides footer
    currentStep = 1;
    updateStepView();
  }
});

adNextBtn.addEventListener("click", async () => {
  // validate current
  if (!validateStep(currentStep)) return;

  // store data
  collectStepData(currentStep);

  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    if (currentStep === 4) {
      updateVisibilityOptionsWithPrices();
      updateSummary();
    }
    updateStepView();
  } else {
    // final submit
    await submitAdvert();
  }
});

adFormCloseBtn.addEventListener("click", () => {
  closeAdForm();
});

// ==========================
//  SUBMIT ADVERT REQUEST
// ==========================
async function submitAdvert() {
  try {
    adNextBtn.disabled = true;
    adBackBtn.disabled = true;
    adNextBtn.textContent = "Processing...";

    // 1) Upload flyer to Firebase Storage
    const file = adFormData.flyerFile;
    if (!file) {
      alert("Please upload a flyer image.");
      return;
    }

    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `adverts/${fileName}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // 2) Determine subscription end from plan
    const now = new Date();
    const subscriptionEnd = new Date(now);
    switch (adFormData.plan) {
      case "1_month":
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
        break;
      case "3_months":
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 3);
        break;
      case "6_months":
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
        break;
      case "12_months":
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        break;
    }

    // 2b) If this is an event, use the EARLIER of event date or subscription end
    let effectiveExpiry = subscriptionEnd;
    if (adFormData.adType === "event" && adFormData.date) {
      const eventDate = new Date(adFormData.date);
      if (!isNaN(eventDate.getTime()) && eventDate < effectiveExpiry) {
        effectiveExpiry = eventDate;
      }
    }

    const amount = PRICING[adFormData.plan][adFormData.visibility];

    // 3) (PLACEHOLDER) HUBTEL PAYMENT
    console.log("Simulating Hubtel payment for GHS", amount);

    // 4) Create Firestore request for admin review
    await addDoc(collection(db, "Adverts", "Requests"), {
      type: adFormData.adType,
      host: adFormData.host,
      event: adFormData.title,
      whatsapp: adFormData.whatsapp,
      hasDate: adFormData.adType === "event",
      date: adFormData.adType === "event" ? adFormData.date : null,
      plan: adFormData.plan,
      visibility: adFormData.visibility,
      amount,
      image: imageUrl,
      createdAt: serverTimestamp(),           // matches your rules
      expiry: effectiveExpiry.toISOString().slice(0, 10),
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
//  START
// ==========================
updateVisibilityOptionsWithPrices();
updateSummary();
updateNextButtonState();
loadAdverts();
