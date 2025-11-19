const flyers = [
  { id: "PickMe Anticipate Flyer", image: "https://lh3.googleusercontent.com/d/15zr4-7CRAIbp0jnOFrxiTtZ8Caz2nR-q", host: "PickMe Services", event: "Anticipate flyer", whatsapp: "233534742142", expiry: "2025-09-29" },
  { id: "Earn up to 4000", image: "https://lh3.googleusercontent.com/d/16BNcj4drcZvDyDXTIpYLqhh2uWrjIzBf", host: "PickMe Services", event: "Earn up to 4000", whatsapp: "", expiry: "2025-12-01", buttonText: "Download Now", buttonLink: "https://apl.bz/w@?l=en_US" },
  { id: "Turn motorbike into cash ", image: "https://lh3.googleusercontent.com/d/16AK1kPjoV-qQlZaEVPM7gA0YhpdzPrT9", host: "PickMe Services", event: "Turn Motorbike into cash", whatsapp: "", expiry: "2025-12-15", buttonText: "Register Now", buttonLink: "https://wa.me/233534742142?text=Hi%20PickMe%20Services%2C%20I%20saw%20your%20Advert%3A%20*Turn%20Motorbike%20into%20cash*%20on%20your%20website%2C%20and%20I%20want%20to%20Register."},
  { id: "Masqurade Tispsy night", image: "https://lh3.googleusercontent.com/d/15f6iEkGW4HUWPaCDHjfRizV2S6XnjOs5", host: "Deliver us from Evil", event: "Masquerrade Tipsy Night", whatsapp: "", expiry: "2025-11-17", buttonText: "Book Ticket", buttonLink: "tel:*920*51#" },
  { id: "All Black Affair", image: "https://lh3.googleusercontent.com/d/16H0IOn0jeJTaZ5WkLnijVvvyKa3UAG0J", host: "Manko Pub", event: "All Black Affair", whatsapp: "233534742142", expiry: "2025-10-30" },
  { id: "AgogoNaMeFri", image: "https://lh3.googleusercontent.com/d/16isBtAvObv4kgPDC3-qcF0pRXo8aAdxI", host: "WOO ENTERTAINMENT", event: "Agogo Na Me Fri, Season 26", whatsapp: "233534742142",  expiry: "2026-01-10" },
  { id: "September Watchnight", image: "https://lh3.googleusercontent.com/d/1F7G7Y0yLOL_xRqZBlRh6HStiZ36JxIFJ", host: "Impact Prayer Gathering", event: "September Watchnight", whatsapp: "233240011302", expiry: "2025-09-27" },
  { id: "Mercy Agyarebea?", image: "https://lh3.googleusercontent.com/d/11CuR65YlCwRC0V6xctmDV9VW-WsmOUJL", host: "PickMe Services", event: "One Week Observation", whatsapp: "", expiry: "2025-09-25" },
  { id: "Chasing Pragia?", image: "https://lh3.googleusercontent.com/d/15zqD8v9zv_lzU6tQcNPP7kszFsKraS7l", host: "PickMe Services", event: "Still Chasing Pragia on Roadside", whatsapp: "233534742142", expiry: "2025-12-31", buttonText: "Download Now", buttonLink: "https://apl.bz/w@?l=en_US" }
];

function getExpiryDate(flyer) {
  if (flyer.expiry) return new Date(flyer.expiry);
  if (!flyer.plan || !flyer.added) return null;
  const addedDate = new Date(flyer.added);
  switch (flyer.plan.toLowerCase()) {
    case "monthly": addedDate.setMonth(addedDate.getMonth() + 1); break;
    case "quarterly": addedDate.setMonth(addedDate.getMonth() + 3); break;
    case "semi-annual":
    case "semi-annually": addedDate.setMonth(addedDate.getMonth() + 6); break;
    case "annual":
    case "annually": addedDate.setFullYear(addedDate.getFullYear() + 1); break;
  }
  return addedDate;
}

const today = new Date();
let activeFlyers = flyers.filter(f => {
  const expiry = getExpiryDate(f);
  return !expiry || today <= expiry;
});

activeFlyers = activeFlyers
  .map(f => ({ f, r: Math.random() }))
  .sort((a,b) => a.r - b.r)
  .map(x => x.f);

const flyerEl = document.getElementById("flyer");
const flyerBg = document.getElementById("flyerBg");
const contactBtn = document.getElementById("contactBtn");
const closeAdBtn = document.getElementById("closeAdBtn");
const advertLink = document.getElementById("advertLink");
const buttonContainer = contactBtn.parentElement;
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentIndex = 0;
let startX = 0;

function showFlyer(index) {
  const flyer = activeFlyers[index];
  if (!flyer) return;
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
        const message = `Hi ${encodeURIComponent(flyer.host)}, I saw your Advert: *${encodeURIComponent(flyer.event)}* on PickMe Services and I want to make inquiries.`;
        const whatsappLink = `https://wa.me/${flyer.whatsapp}?text=${message}`;
        window.open(whatsappLink, "_blank");
      };
    } else {
      contactBtn.style.display = "none";
    }

    flyerEl.onload = () => {
      flyerEl.style.opacity = 1;
      buttonContainer.style.opacity = 1;
    };
  }, 300);
}

prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + activeFlyers.length) % activeFlyers.length;
  showFlyer(currentIndex);
};

nextBtn.onclick = () => {
  currentIndex = (currentIndex + 1) % activeFlyers.length;
  showFlyer(currentIndex);
};

flyerEl.addEventListener("touchstart", e => startX = e.touches[0].clientX);
flyerEl.addEventListener("touchend", e => {
  let endX = e.changedTouches[0].clientX;
  if (endX - startX > 50) prevBtn.onclick();
  else if (startX - endX > 50) nextBtn.onclick();
});

if (activeFlyers.length > 0) {
  showFlyer(currentIndex);
} else {
  flyerEl.style.display = "none";
  buttonContainer.style.display = "none";
  flyerBg.style.background = "#000";
}

closeAdBtn.onclick = () => { window.location.href = '/homepage.html'; };
advertLink.onclick = () => { window.location.href = '#'; };
