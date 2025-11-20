// =========================
//  FIREBASE IMPORTS
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
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

    // Random first index
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

// swipe back (you asked for this to return)
let startX = 0;
flyerEl.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});
flyerEl.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  if (endX - startX > 50) {
    // swipe right
    prevBtn.onclick();
  } else if (startX - endX > 50) {
    // swipe left
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
  // clear data
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

  // step 4
  adPlanSelect.value = "1_month";
  adVisibilitySelect.value = "low";
  updateSummary();
}

// show correct step
function updateStepView() {
  adSteps.forEach(step => {
    const s = Number(step.getAttribute("data-step"));
    step.classList.toggle("active", s === currentStep);
  });

  // back button
  adBackBtn.disabled = currentStep === 1;

  // next button text
  if (currentStep === TOTAL_STEPS) {
    adNextBtn.textContent = "Submit & Pay";
  } else {
    adNextBtn.textContent = "Continue";
  }

  // date row visibility based on type
  if (adFormData.adType === "event") {
    adDateRow.classList.remove("hidden");
  } else {
    adDateRow.classList.add("hidden");
  }
}

// validation per step
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

  if (stepNum === 4) {
    // everything already chosen
    return true;
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

  adSummaryText.textContent = `${planLabel} • ${visLabel} → GHS ${amount.toFixed(2)}`;
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
    adFlyerPreview.src = e.target.result;
    adFlyerPreviewWrapper.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

adFlyerRemoveBtn.addEventListener("click", () => {
  adFlyerInput.value = "";
  adFormData.flyerFile = null;
  adFlyerPreviewWrapper.classList.add("hidden");
  adFlyerPreview.src = "";
});

// plan / visibility change
adPlanSelect.addEventListener("change", updateSummary);
adVisibilitySelect.addEventListener("change", updateSummary);

// open form from "HERE"
advertLink.addEventListener("click", (e) => {
  e.preventDefault();
  openAdForm();
});

// nav buttons
adBackBtn.addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep--;
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
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `adverts/${fileName}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // 2) Determine expiry from plan
    const now = new Date();
    const expiry = new Date(now);
    switch (adFormData.plan) {
      case "1_month":
        expiry.setMonth(expiry.getMonth() + 1);
        break;
      case "3_months":
        expiry.setMonth(expiry.getMonth() + 3);
        break;
      case "6_months":
        expiry.setMonth(expiry.getMonth() + 6);
        break;
      case "12_months":
        expiry.setFullYear(expiry.getFullYear() + 1);
        break;
    }

    const amount = PRICING[adFormData.plan][adFormData.visibility];

    // 3) (PLACEHOLDER) HAPTEL PAYMENT
    // 👉 Here is where you will later call your backend or USSD/STK logic.
    //    For now we assume payment is successful so the project can run.
    //    You will replace this block with a real API call.
    console.log("Simulating Haptel payment for GHS", amount);
    // Example structure (you will implement the endpoint later):
    // await fetch("https://YOUR_BACKEND_URL/haptel/advert-payment", { ... });

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
      createdAt: new Date().toISOString(),
      expiry: expiry.toISOString().slice(0, 10),
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
    adNextBtn.textContent = "Submit & Pay";
  }
}

// ==========================
//  START
// ==========================
loadAdverts();
