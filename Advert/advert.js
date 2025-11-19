/* ============================================================
   ADVERT PAGE – FULL LOGIC
   - Loads adverts from Firestore
   - If none exist, inserts sample adverts (all 9)
   - Displays them with random selection
=============================================================== */

/* =====================
   1) FIREBASE SETUP
====================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBxLGdn1ldnQqcQgvJOGIRyiRqzAGwGck",
  authDomain: "pickmeservicesonline.firebaseapp.com",
  projectId: "pickmeservicesonline",
  storageBucket: "pickmeservicesonline.firebasestorage.app",
  messagingSenderId: "265031616239",
  appId: "1:265031616239:web:e2ef418704af5595aa7d1a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =============================
   2) ALL 9 SAMPLE ADVERTS
============================= */
const sampleAdverts = [
  {
    id: "PickMe Anticipate Flyer",
    image: "https://lh3.googleusercontent.com/d/15zr4-7CRAIbp0jnOFrxiTtZ8Caz2nR-q",
    host: "PickMe Services",
    event: "Anticipate flyer",
    whatsapp: "233534742142",
    expiry: "2025-09-29"
  },
  {
    id: "Earn up to 4000",
    image: "https://lh3.googleusercontent.com/d/16BNcj4drcZvDyDXTIpYLqhh2uWrjIzBf",
    host: "PickMe Services",
    event: "Earn up to 4000",
    whatsapp: "",
    expiry: "2025-12-01",
    buttonText: "Download Now",
    buttonLink: "https://apl.bz/w@?l=en_US"
  },
  {
    id: "Turn Motorbike into cash",
    image: "https://lh3.googleusercontent.com/d/16AK1kPjoV-qQlZaEVPM7gA0YhpdzPrT9",
    host: "PickMe Services",
    event: "Turn Motorbike into cash",
    whatsapp: "",
    expiry: "2025-12-15",
    buttonText: "Register Now",
    buttonLink: "https://wa.me/233534742142?text=Hi%20PickMe%20Services%2C%20I%20saw%20your%20Advert%3A%20Turn%20Motorbike%20into%20cash"
  },
  {
    id: "Masquerade Tipsy Night",
    image: "https://lh3.googleusercontent.com/d/15f6iEkGW4HUWPaCDHjfRizV2S6XnjOs5",
    host: "Deliver us from Evil",
    event: "Masquerade Tipsy Night",
    whatsapp: "",
    expiry: "2025-11-17",
    buttonText: "Book Ticket",
    buttonLink: "tel:*920*51#"
  },
  {
    id: "All Black Affair",
    image: "https://lh3.googleusercontent.com/d/16H0IOn0jeJTaZ5WkLnijVvvyKa3UAG0J",
    host: "Manko Pub",
    event: "All Black Affair",
    whatsapp: "233534742142",
    expiry: "2025-10-30"
  },
  {
    id: "Agogo Na Me Fri",
    image: "https://lh3.googleusercontent.com/d/16isBtAvObv4kgPDC3-qcF0pRXo8aAdxI",
    host: "WOO ENTERTAINMENT",
    event: "Agogo Na Me Fri, Season 26",
    whatsapp: "233534742142",
    expiry: "2026-01-10"
  },
  {
    id: "September Watchnight",
    image: "https://lh3.googleusercontent.com/d/1F7G7Y0yLOL_xRqZBlRh6HStiZ36JxIFJ",
    host: "Impact Prayer Gathering",
    event: "September Watchnight",
    whatsapp: "233240011302",
    expiry: "2025-09-27"
  },
  {
    id: "One Week Observation",
    image: "https://lh3.googleusercontent.com/d/11CuR65YlCwRC0V6xctmDV9VW-WsmOUJL",
    host: "PickMe Services",
    event: "One Week Observation",
    whatsapp: "",
    expiry: "2025-09-25"
  },
  {
    id: "Chasing Pragia",
    image: "https://lh3.googleusercontent.com/d/15zqD8v9zv_lzU6tQcNPP7kszFsKraS7l",
    host: "PickMe Services",
    event: "Still Chasing Pragia on Roadside",
    whatsapp: "233534742142",
    expiry: "2025-12-31",
    buttonText: "Download Now",
    buttonLink: "https://apl.bz/w@?l=en_US"
  }
];

/* =============================
   3) LOAD ADVERTS FROM FIRESTORE
============================== */
async function loadAdverts() {
  const snap = await getDocs(collection(db, "Adverts"));

  if (snap.empty) {
    console.log("No adverts found. Uploading default adverts...");

    // upload all 9 adverts
    for (const adv of sampleAdverts) {
      await setDoc(doc(db, "Adverts", adv.id), adv);
    }

    return sampleAdverts;
  }

  const adverts = [];
  snap.forEach(doc => adverts.push(doc.data()));
  return adverts;
}

/* =============================
   4) PAGE LOGIC
============================== */
function getExpiryDate(flyer) {
  if (flyer.expiry) return new Date(flyer.expiry);
  return null;
}

function randomize(list) {
  return list.map(x => ({ x, r: Math.random() }))
             .sort((a,b) => a.r - b.r)
             .map(x => x.x);
}

/* =============================
   5) DISPLAY FLYERS
============================== */
function displayFlyers(flyers) {
  const flyerEl = document.getElementById("flyer");
  const flyerBg = document.getElementById("flyerBg");
  const contactBtn = document.getElementById("contactBtn");
  const buttonContainer = document.querySelector(".button-container");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let currentIndex = 0;

  function showFlyer(i) {
    const flyer = flyers[i];
    flyerEl.style.opacity = 0;
    buttonContainer.style.opacity = 0;

    setTimeout(() => {
      flyerEl.src = flyer.image;
      flyerBg.style.backgroundImage = `url(${flyer.image})`;

      if (flyer.buttonText && flyer.buttonLink) {
        contactBtn.style.display = "inline-block";
        contactBtn.innerText = flyer.buttonText;
        contactBtn.onclick = () => window.open(flyer.buttonLink, "_blank");
      } else if (flyer.whatsapp) {
        contactBtn.style.display = "inline-block";
        contactBtn.innerText = "Contact Us";
        contactBtn.onclick = () => {
          const msg = encodeURIComponent(`Hi ${flyer.host}, I saw your Advert: *${flyer.event}* on PickMe Services.`);
          window.open(`https://wa.me/${flyer.whatsapp}?text=${msg}`, "_blank");
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

  prevBtn.onclick = () => {
    currentIndex = (currentIndex - 1 + flyers.length) % flyers.length;
    showFlyer(currentIndex);
  };

  nextBtn.onclick = () => {
    currentIndex = (currentIndex + 1) % flyers.length;
    showFlyer(currentIndex);
  };

  showFlyer(0);
}

/* =============================
   6) INIT PAGE
============================== */
async function init() {
  let adverts = await loadAdverts();

  // filter expired
  const today = new Date();
  adverts = adverts.filter(ad => {
    const exp = getExpiryDate(ad);
    return !exp || today <= exp;
  });

  // random order
  adverts = randomize(adverts);

  if (adverts.length === 0) {
    console.log("No active adverts.");
    return;
  }

  displayFlyers(adverts);
}

init();

/* =============================
   7) BUTTON LINKS
============================== */
document.getElementById("closeAdBtn").onclick = () => {
  window.location.href = "/homepage.html";
};

document.getElementById("advertLink").onclick = () => {
  alert("Advert submission form is coming soon.");
};
