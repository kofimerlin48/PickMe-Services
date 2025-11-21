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
const buttonContainer = contactBtn.parentElement;

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

    if (flyers.length === 0) {
      flyerEl.style.display = "none";
      buttonContainer.style.display = "none";
      flyerBg.style.background = "#000";
      return;
    }

    // Random order
    flyers = flyers
      .map(f => ({ f, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(x => x.f);

    // Random start index
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
//  BUTTON CONTROLS (VIEW)
// ==========================
prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + flyers.length) % flyers.length;
  showFlyer(currentIndex);
};

nextBtn.onclick = () => {
  currentIndex = (currentIndex + 1) % flyers.length;
  showFlyer(currentIndex);
};

closeAdBtn.onclick = () => window.location.href = "/homepage.html";

// Swipe on mobile
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

// Start
loadAdverts();


// ======================================
//   FULL PAGE FORM LOGIC
// ======================================

// DOM refs
const advertLink = document.getElementById("advertLink");
const formOverlay = document.getElementById("advertFormOverlay");
const closeFormBtn = document.getElementById("closeFormBtn");
const formTitle = document.getElementById("formTitle");

const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const formError = document.getElementById("formError");

// Steps
const steps = Array.from(document.querySelectorAll(".form-step"));

// Step 1
const typeCards = Array.from(document.querySelectorAll(".type-card"));

// Step 2
const advertTitleInput = document.getElementById("advertTitle");
const advertDescInput = document.getElementById("advertDesc");
const advertDateInput = document.getElementById("advertDate");
const eventDateRow = document.getElementById("eventDateRow");

// Step 3
const chooseImageBtn = document.getElementById("chooseImageBtn");
const advertImageInput = document.getElementById("advertImageInput");
const imagePreviewWrapper = document.getElementById("imagePreviewWrapper");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewBg = document.getElementById("imagePreviewBg");
const removeImageBtn = document.getElementById("removeImageBtn");

// Step 4
const planSelect = document.getElementById("planSelect");
const visibilitySelect = document.getElementById("visibilitySelect");
const priceDisplay = document.getElementById("priceDisplay");

// Step 5 (summary)
const summaryType = document.getElementById("summaryType");
const summaryTitle = document.getElementById("summaryTitle");
const summaryDateRow = document.getElementById("summaryDateRow");
const summaryDate = document.getElementById("summaryDate");
const summaryPlan = document.getElementById("summaryPlan");
const summaryVisibility = document.getElementById("summaryVisibility");
const summaryAmount = document.getElementById("summaryAmount");

// State
let currentStep = 1;
let advertType = null;       // "event" or "business"
let selectedFile = null;
let uploading = false;

// Prices
const PRICE_TABLE = {
  "1m":  { label: "1 month",           prices: { low: 30,  medium: 40,  high: 50  } },
  "3m":  { label: "3 months",          prices: { low: 80,  medium: 90,  high: 100 } },
  "6m":  { label: "6 months",          prices: { low: 180, medium: 190, high: 200 } },
  "12m": { label: "12 months (1 yr)",  prices: { low: 280, medium: 290, high: 300 } }
};

function getCurrentAmount() {
  const plan = planSelect.value;
  const vis = visibilitySelect.value;
  if (!plan || !vis) return 0;
  const row = PRICE_TABLE[plan];
  if (!row) return 0;
  return row.prices[vis] || 0;
}

// =====================
//   FORM OPEN / CLOSE
// =====================
function openForm() {
  resetFormState();
  formOverlay.classList.remove("hidden");
}

function closeForm() {
  formOverlay.classList.add("hidden");
}

advertLink.addEventListener("click", (e) => {
  e.preventDefault();
  openForm();
});

closeFormBtn.addEventListener("click", () => {
  closeForm();
});

// Close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !formOverlay.classList.contains("hidden")) {
    closeForm();
  }
});

// =====================
//   STEP HANDLING
// =====================
function showStep(stepNumber) {
  currentStep = stepNumber;

  steps.forEach(step => {
    const s = Number(step.dataset.step);
    if (s === stepNumber) step.classList.remove("hidden");
    else step.classList.add("hidden");
  });

  // Header title (simple)
  formTitle.textContent = "Create Advert";

  // Show/hide Back + Continue
  if (stepNumber === 1) {
    backBtn.style.display = "none";
    nextBtn.style.display = "none";
  } else {
    backBtn.style.display = "inline-block";
    nextBtn.style.display = "inline-block";
  }

  updateContinueState();
}

function resetFormState() {
  advertType = null;
  selectedFile = null;
  uploading = false;
  // Clear selections
  typeCards.forEach(c => c.classList.remove("selected"));
  advertTitleInput.value = "";
  advertDescInput.value = "";
  advertDateInput.value = "";
  planSelect.value = "";
  // Reset visibility options
  visibilitySelect.innerHTML = `<option value="">Select visibility</option>`;
  priceDisplay.textContent = "GHS 0.00";

  // Hide image preview
  imagePreviewWrapper.classList.add("hidden");
  imagePreview.src = "";
  imagePreviewBg.style.backgroundImage = "";

  hideError();
  nextBtn.disabled = true;

  showStep(1);
}

// =====================
//   VALIDATION
// =====================
function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
}

function hideError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function isStepValid(stepNumber) {
  if (stepNumber === 1) {
    return !!advertType;
  }

  if (stepNumber === 2) {
    if (!advertTitleInput.value.trim()) return false;
    if (advertType === "event" && !advertDateInput.value) return false;
    return true;
  }

  if (stepNumber === 3) {
    return !!selectedFile;
  }

  if (stepNumber === 4) {
    if (!planSelect.value || !visibilitySelect.value) return false;
    if (getCurrentAmount() <= 0) return false;
    return true;
  }

  if (stepNumber === 5) {
    return true;
  }

  return false;
}

function updateContinueState() {
  hideError();
  if (currentStep === 1) {
    nextBtn.disabled = true;
    return;
  }
  const ok = isStepValid(currentStep);
  nextBtn.disabled = !ok;
}

// =====================
//   TYPE SELECTION
// =====================
typeCards.forEach(card => {
  card.addEventListener("click", () => {
    typeCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    advertType = card.dataset.type;   // "event" / "business"

    // Immediately move to step 2
    showStep(2);
  });
});

// =====================
//   STEP 2 (DETAILS)
// =====================
function updateDetailsUIForType() {
  if (advertType === "event") {
    eventDateRow.style.display = "flex";
  } else {
    eventDateRow.style.display = "none";
  }
}

advertTitleInput.addEventListener("input", updateContinueState);
advertDescInput.addEventListener("input", () => {}); // optional
advertDateInput.addEventListener("input", updateContinueState);

// =====================
//   STEP 3 (IMAGE)
// =====================
chooseImageBtn.addEventListener("click", () => {
  advertImageInput.click();
});

advertImageInput.addEventListener("change", () => {
  const file = advertImageInput.files[0];
  if (!file) return;

  selectedFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    const url = reader.result;
    imagePreview.src = url;
    imagePreviewBg.style.backgroundImage = `url(${url})`;
    imagePreviewWrapper.classList.remove("hidden");
    // Hide upload button once image is there
    chooseImageBtn.style.display = "none";
    updateContinueState();
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener("click", () => {
  selectedFile = null;
  advertImageInput.value = "";
  imagePreviewWrapper.classList.add("hidden");
  imagePreview.src = "";
  imagePreviewBg.style.backgroundImage = "";
  // Show upload button again
  chooseImageBtn.style.display = "inline-block";
  updateContinueState();
});

// =====================
//   STEP 4 (PLAN + VIS)
// =====================
function refreshVisibilityOptions() {
  const plan = planSelect.value;
  visibilitySelect.innerHTML = `<option value="">Select visibility</option>`;

  if (!plan || !PRICE_TABLE[plan]) {
    priceDisplay.textContent = "GHS 0.00";
    updateContinueState();
    return;
  }

  const row = PRICE_TABLE[plan].prices;

  const makeOption = (value, label, amount) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = `${label} – GHS ${amount}`;
    return opt;
  };

  visibilitySelect.appendChild(makeOption("low", "Low visibility", row.low));
  visibilitySelect.appendChild(makeOption("medium", "Medium visibility", row.medium));
  visibilitySelect.appendChild(makeOption("high", "High visibility", row.high));

  updatePriceLabel();
}

function updatePriceLabel() {
  const amount = getCurrentAmount();
  priceDisplay.textContent = `GHS ${amount.toFixed(2)}`;
}

planSelect.addEventListener("change", () => {
  refreshVisibilityOptions();
  updateContinueState();
});

visibilitySelect.addEventListener("change", () => {
  updatePriceLabel();
  updateContinueState();
});

// =====================
//   STEP 5 (SUMMARY)
// =====================
function fillSummary() {
  summaryType.textContent = advertType === "event" ? "Event advert" : "Business advert";
  summaryTitle.textContent = advertTitleInput.value.trim() || "—";

  if (advertType === "event") {
    summaryDateRow.style.display = "flex";
    summaryDate.textContent = advertDateInput.value || "—";
  } else {
    summaryDateRow.style.display = "none";
    summaryDate.textContent = "";
  }

  const plan = planSelect.value;
  const planRow = PRICE_TABLE[plan];
  summaryPlan.textContent = planRow ? planRow.label : "—";

  const visMap = {
    low: "Low visibility",
    medium: "Medium visibility",
    high: "High visibility"
  };
  summaryVisibility.textContent = visMap[visibilitySelect.value] || "—";

  const amount = getCurrentAmount();
  summaryAmount.textContent = `GHS ${amount.toFixed(2)}`;
}

// =====================
//   NAVIGATION
// =====================
backBtn.addEventListener("click", () => {
  hideError();
  if (currentStep <= 1) return;

  // If user goes back from step 2, we take them to step 1
  const prev = currentStep - 1;
  showStep(prev);
});

nextBtn.addEventListener("click", async () => {
  hideError();

  if (!isStepValid(currentStep)) {
    showError("Please complete the required fields.");
    return;
  }

  // Move between steps
  if (currentStep === 2) {
    updateDetailsUIForType();
    showStep(3);
    return;
  }

  if (currentStep === 3) {
    showStep(4);
    return;
  }

  if (currentStep === 4) {
    fillSummary();
    showStep(5);
    nextBtn.textContent = "Submit & Pay";
    return;
  }

  if (currentStep === 5) {
    // FINAL SUBMIT
    await handleFinalSubmit();
  }
});

// Reset button text when moving back from summary
function maybeResetButtonText() {
  if (currentStep < 5) {
    nextBtn.textContent = "Continue";
  }
}
backBtn.addEventListener("click", maybeResetButtonText);

// =====================
//   PAYMENT + SAVE
// =====================

// Simple fake payment for now (always success)
async function simulatePayment(amount) {
  // In future: integrate real Hubtel here
  console.log("Simulating payment for GHS", amount);
  return true;
}

async function uploadImageAndGetUrl() {
  if (!selectedFile) return null;

  const path = `Adverts/uploads/${Date.now()}_${selectedFile.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, selectedFile);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

async function handleFinalSubmit() {
  try {
    if (uploading) return;
    uploading = true;
    nextBtn.disabled = true;
    backBtn.disabled = true;
    nextBtn.textContent = "Processing...";

    hideError();

    const amount = getCurrentAmount();
    if (amount <= 0) {
      showError("Amount is invalid. Please go back and check your plan and visibility.");
      uploading = false;
      backBtn.disabled = false;
      updateContinueState();
      return;
    }

    // 1) Upload image
    const imageInfo = await uploadImageAndGetUrl();
    if (!imageInfo || !imageInfo.url) {
      showError("We could not upload your flyer. Please check your internet and try again.");
      uploading = false;
      backBtn.disabled = false;
      updateContinueState();
      return;
    }

    // 2) Simulate payment (replace with real Hubtel later)
    const paymentOk = await simulatePayment(amount);
    if (!paymentOk) {
      showError("Payment was not completed.");
      uploading = false;
      backBtn.disabled = false;
      updateContinueState();
      return;
    }

    // 3) Save request
    const planKey = planSelect.value;
    const visKey = visibilitySelect.value;

    const docData = {
      type: advertType,                          // "event" / "business"
      title: advertTitleInput.value.trim(),
      description: advertDescInput.value.trim() || "",
      eventDate: advertType === "event" ? advertDateInput.value : "",
      plan: planKey,
      visibility: visKey,
      amount: amount,
      imageUrl: imageInfo.url,
      imagePath: imageInfo.path,
      status: "pending",
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "Adverts", "Requests"), docData);

    // Done
    alert("Your advert request has been submitted successfully. Admin will review and approve it.");
    closeForm();

  } catch (err) {
    console.error("Error submitting advert request:", err);
    showError("Sorry, something went wrong. Please try again.");
  } finally {
    uploading = false;
    backBtn.disabled = false;
    nextBtn.textContent = "Submit & Pay";
    updateContinueState();
  }
}
