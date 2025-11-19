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
//  UI ELEMENTS
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
    const snap = await getDocs(
      collection(db, "Adverts", "items", "AdvertsList")
    );

    flyers = [];

    snap.forEach(doc => {
      flyers.push(doc.data());
    });

    // Remove expired
    const now = new Date();
    flyers = flyers.filter(f => {
      if (!f.expiry) return true;
      const expiry = new Date(f.expiry);
      return now <= expiry;
    });

    if (flyers.length === 0) {
      flyerEl.style.display = "none";
      buttonContainer.style.display = "none";
      flyerBg.style.background = "#000";
      return;
    }

    // Random order for all users
    flyers = flyers
      .map(f => ({ f, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(x => x.f);

    // Random start index (each device sees different first flyer)
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
//  BUTTON CONTROLS
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

// ==========================
//  SWIPE CONTROLS
// ==========================
let startX = 0;

flyerEl.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

flyerEl.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;

  if (diff > 50) prevBtn.onclick();
  else if (diff < -50) nextBtn.onclick();
});

// ==========================
//  START
// ==========================
loadAdverts();
