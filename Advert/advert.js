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

// =========================
//  UI ELEMENTS
// =========================
const flyerEl = document.getElementById("flyer");
const flyerBg = document.getElementById("flyerBg");
const contactBtn = document.getElementById("contactBtn");
const closeAdBtn = document.getElementById("closeAdBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const buttonContainer = contactBtn.parentElement;

let flyers = [];
let currentIndex = 0;


// =========================
//  LOAD FROM FIRESTORE
// =========================
async function loadAdverts() {

  console.log("🔍 Trying to read: Adverts / items / AdvertsList");

  try {
    const colRef = collection(db, "Adverts", "items", "AdvertsList");
    const snap = await getDocs(colRef);

    console.log("📦 Firestore docs found:", snap.size);

    flyers = [];

    snap.forEach(doc => {
      console.log("📄 Loaded advert:", doc.id, doc.data());
      flyers.push(doc.data());
    });

    // remove expired adverts
    flyers = flyers.filter(f => {
      if (!f.expiry) return true;
      const d = new Date(f.expiry);
      return !isNaN(d) && new Date() <= d;
    });

    console.log("📌 Remaining after expiry filter:", flyers.length);

    if (flyers.length === 0) {
      console.warn("⚠️ NO ADVERTS TO DISPLAY");
      flyerEl.style.display = "none";
      buttonContainer.style.display = "none";
      flyerBg.style.background = "#000";
      return;
    }

    showFlyer(0);

  } catch (err) {
    console.error("❌ ERROR loading adverts:", err);
  }
}


// =========================
//  DISPLAY FLYER
// =========================
function showFlyer(i) {
  const flyer = flyers[i];
  if (!flyer) return;

  flyerEl.style.opacity = 0;
  buttonContainer.style.opacity = 0;

  setTimeout(() => {
    flyerEl.src = flyer.image;
    flyerBg.style.backgroundImage = `url(${flyer.image})`;

    // contact button logic
    if (flyer.buttonText && flyer.buttonLink) {
      contactBtn.style.display = "inline-block";
      contactBtn.innerText = flyer.buttonText;
      contactBtn.onclick = () => window.open(flyer.buttonLink, "_blank");

    } else if (flyer.whatsapp) {
      contactBtn.style.display = "inline-block";
      contactBtn.innerText = "Contact Us";
      contactBtn.onclick = () => {
        const msg = `Hi ${flyer.host}, I saw your advert: ${flyer.event}`;
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


// =========================
//  BUTTON CONTROLS
// =========================
prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + flyers.length) % flyers.length;
  showFlyer(currentIndex);
};

nextBtn.onclick = () => {
  currentIndex = (currentIndex + 1) % flyers.length;
  showFlyer(currentIndex);
};

closeAdBtn.onclick = () => window.location.href = "/homepage.html";


// =========================
//  START
// =========================
loadAdverts();
