// === MOCK DATA ===
const MOCK_RESTAURANTS = [
  {
    id: "r1", name: "Burger & Co.", cuisine: "American • Fast Food", rating: 4.8, reviewCount: 342, deliveryFee: 15, image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
    menu: [
      { id: "m1", name: "The Classic Cheeseburger", description: "Angus beef patty, cheddar cheese.", price: 45, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80", optionGroups: [], packages: [ { id: "pkg_std_m1", name: "Standard", price: 45, description: "The classic burger experience.", optionGroups: [ { id: "opt1", name: "Choose a Side", required: true, maxSelection: 1, options: [ { id: "o1", name: "Fries", price: 0 }, { id: "o2", name: "Onion Rings", price: 5 }, { id: "o3", name: "Salad", price: 0 } ] }, { id: "opt2", name: "Add Extras", required: false, maxSelection: 3, options: [ { id: "o4", name: "Extra Cheese", price: 5 }, { id: "o5", name: "Bacon", price: 10 } ] } ] } ] },
      { id: "m2", name: "Crispy Chicken Sandwich", description: "Fried chicken breast, pickles.", price: 38, image: "https://images.unsplash.com/photo-1619250907409-943e8b4cf179?auto=format&fit=crop&w=800&q=80", optionGroups: [], packages: [ { id: "pkg_std_m2", name: "Standard", price: 38, description: "Sandwich only.", optionGroups: [] }, { id: "pkg_combo_m2", name: "Meal Combo", price: 55, description: "Sandwich + Fries + Drink.", optionGroups: [] } ] }
    ]
  },
  {
    id: "r2", name: "Sushi Zen", cuisine: "Japanese • Healthy", rating: 4.9, reviewCount: 520, deliveryFee: 25, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    menu: [
      { id: "m3", name: "Dragon Roll", description: "Eel, cucumber, topped with avocado.", price: 85, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80", optionGroups: [], packages: [ { id: "pkg_std_m3", name: "Standard Roll", price: 85, description: "8 pieces of Dragon Roll.", optionGroups: [ { id: "opt3", name: "Spiciness Level", required: true, maxSelection: 1, options: [ { id: "o6", name: "Mild", price: 0 }, { id: "o7", name: "Spicy", price: 0 } ] } ] } ] },
      { id: "m4", name: "Salmon Nigiri Box", description: "6 pieces of fresh salmon nigiri.", price: 60, image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80", optionGroups: [], packages: [ { id: "pkg_std_m4", name: "Standard Box", price: 60, description: "6 pieces.", optionGroups: [] }, { id: "pkg_lrg_m4", name: "Large Box", price: 110, description: "12 pieces.", optionGroups: [] } ] }
    ]
  },
  {
    id: "r3", name: "Mama's Pot", cuisine: "Local • Traditional", rating: 4.6, reviewCount: 128, deliveryFee: 10, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    menu: [
      { id: "m5", name: "Jollof Rice Special", description: "Choose a package or build your own bowl.", price: 50, image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f1a?auto=format&fit=crop&w=800&q=80", optionGroups: [], 
        packages: [ { id: "pkg1", name: "Mini Lunch Pack", price: 65, description: "Standard portion with 1 protein choice.", optionGroups: [ { id: "pg1", name: "Choose Protein", required: true, maxSelection: 1, options: [ { id: "p1", name: "Fried Fish", price: 0 }, { id: "p2", name: "Chicken", price: 0 } ] } ] }, { id: "pkg2", name: "Jumbo Feast", price: 85, description: "Large portion with 2 proteins and salad.", optionGroups: [ { id: "pg2", name: "Choose 2 Proteins", required: true, maxSelection: 2, options: [ { id: "p3", name: "Fried Fish", price: 0 }, { id: "p4", name: "Grilled Chicken", price: 0 }, { id: "p5", name: "Beef", price: 0 } ] }, { id: "pg3", name: "Add-ons", required: false, maxSelection: 1, options: [ { id: "p6", name: "Coleslaw", price: 0 }, { id: "p7", name: "Spaghetti", price: 0 } ] } ] } ],
        customBuilder: { basePrice: 20, unitName: "Bowl", addonGroups: [ { id: "ag1", name: "Proteins", options: [ { id: "ap1", name: "Fried Fish", price: 15 }, { id: "ap2", name: "Grilled Chicken", price: 20 }, { id: "ap3", name: "Goat Meat", price: 25 }, { id: "ap4", name: "Boiled Egg", price: 5 } ] }, { id: "ag2", name: "Extras", options: [ { id: "ex1", name: "Kelewele", price: 10 }, { id: "ex2", name: "Salad", price: 5 } ] } ] }
      }
    ]
  }
];

const SUBSCRIPTION_PLANS = [
    { id: '1_MONTH', label: '1 Month', price: 50, desc: 'Starter Plan' },
    { id: '3_MONTHS', label: '3 Months', price: 100, desc: 'Save 33%' },
    { id: '6_MONTHS', label: '6 Months', price: 150, desc: 'Most Popular' },
    { id: '1_YEAR', label: '1 Year', price: 200, desc: 'Best Value' },
];

// === STATE MANAGEMENT ===
const state = {
    cart: [],
    activeRestaurant: null,
    activeMeal: null,
    activePackage: null,
    mealQty: 1,
    selectedOptions: {}, // { groupId: [opt, opt] }
    buildBaseQty: 1,
    buildAddons: {},
    view: 'SELECTION', // SELECTION, PACKAGE, BUILDER
    checkoutItems: [],
    isGeneralCheckout: false,
    partner: { step: 1, mode: 'SELECT' }
};

// === FIREBASE SETUP ===
const firebaseConfig = {
    apiKey: "AIzaSyB2L649fIs0CS-fGDC0ybFeAO5Im5BEP_c",
    authDomain: "pickmeservicesonline.firebaseapp.com",
    projectId: "pickmeservicesonline",
    storageBucket: "pickmeservicesonline.firebasestorage.app",
    messagingSenderId: "265031616239",
    appId: "1:265031616239:web:e2ef418704af5595aa7d1a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === DOM ELEMENTS ===
const app = document.getElementById('app');
const views = {
    home: document.getElementById('view-home'),
    restaurant: document.getElementById('view-restaurant'),
    cart: document.getElementById('view-cart')
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderRestaurantGrid();
    updateGreeting();
    
    // Scroll Logic
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('scroll-helper');
        const icon = document.getElementById('scroll-icon');
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const current = window.scrollY;
        
        if (current > 100 && current < maxScroll - 10) {
            btn.classList.add('visible');
            if (current > (window.oldY || 0)) {
                // Down
                icon.setAttribute('data-lucide', 'arrow-down');
                btn.onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            } else {
                // Up
                icon.setAttribute('data-lucide', 'arrow-up');
                btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            lucide.createIcons();
        } else {
            btn.classList.remove('visible');
        }
        window.oldY = current;
    });
});

// === ROUTING ===
function setView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
    window.scrollTo(0, 0);
    
    if (viewName === 'home') state.activeRestaurant = null;
    if (viewName === 'cart') renderCart();
    
    // Cart Button Visibility
    const floatBtn = document.getElementById('float-cart-btn');
    const barBtn = document.getElementById('bottom-cart-bar');
    
    if (viewName === 'cart') {
        floatBtn.classList.add('hidden');
        barBtn.classList.add('hidden');
    } else {
        updateCartUI();
    }
}

// === HOME LOGIC ===
function updateGreeting() {
    const hr = new Date().getHours();
    const text = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    document.getElementById('greeting-text').innerHTML = `${text} 👋`;
}

function renderRestaurantGrid() {
    const grid = document.getElementById('restaurant-grid');
    grid.innerHTML = MOCK_RESTAURANTS.map(r => `
        <div class="rest-card" onclick="openRestaurant('${r.id}')">
            <div class="card-img-wrap">
                <img src="${r.image}" alt="${r.name}">
                <div class="rating-pill"><i data-lucide="star"></i> ${r.rating}</div>
            </div>
            <div class="card-content">
                <h3>${r.name}</h3>
                <span class="cuisine">${r.cuisine}</span>
                <div class="card-footer">
                    <span>${r.reviewCount} reviews</span>
                    <span><strong>Del: GHS ${r.deliveryFee}</strong></span>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// === RESTAURANT LOGIC ===
function openRestaurant(id) {
    const r = MOCK_RESTAURANTS.find(x => x.id === id);
    state.activeRestaurant = r;
    
    // Fill Info
    document.getElementById('sticky-rest-name').innerText = r.name;
    document.getElementById('rest-name').innerText = r.name;
    document.getElementById('rest-hero-img').src = r.image;
    document.getElementById('rest-cuisine').innerText = r.cuisine;
    document.getElementById('rest-rating').innerText = r.rating;
    document.getElementById('rest-fee').innerText = r.deliveryFee;
    
    // Render Menu
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = r.menu.map(m => `
        <div class="menu-item" onclick="openMealModal('${m.id}')">
            <img class="menu-img" src="${m.image}">
            <div class="menu-content">
                <div>
                    <h3>${m.name}</h3>
                    <p>${m.description}</p>
                </div>
                <span class="menu-price">GHS ${m.price}</span>
            </div>
        </div>
    `).join('');
    
    setView('restaurant');
    lucide.createIcons();
}

// === MEAL MODAL LOGIC ===
function openMealModal(mealId) {
    const m = state.activeRestaurant.menu.find(x => x.id === mealId);
    state.activeMeal = m;
    
    document.getElementById('modal-meal-img').src = m.image;
    document.getElementById('modal-meal-name').innerText = m.name;
    
    // Determine complexity
    const isComplex = (m.packages && m.packages.length > 0) || m.customBuilder;
    
    if (isComplex) {
        renderPackages(m);
        setMealView('SELECTION');
    } else {
        // Simple meal, treat as default package
        state.activePackage = null;
        renderConfig(null);
        setMealView('CONFIG');
    }
    
    document.getElementById('modal-meal').classList.remove('hidden');
    lucide.createIcons();
}

function closeMealModal() {
    document.getElementById('modal-meal').classList.add('hidden');
    resetMealState();
}

function resetMealState() {
    state.activeMeal = null;
    state.activePackage = null;
    state.mealQty = 1;
    state.selectedOptions = {};
    state.buildBaseQty = 1;
    state.buildAddons = {};
}

function setMealView(v) {
    state.view = v;
    const sel = document.getElementById('meal-view-selection');
    const cfg = document.getElementById('meal-view-config');
    const bld = document.getElementById('meal-view-builder');
    const foot = document.getElementById('meal-footer');
    const backBtn = document.getElementById('btn-modal-back');
    
    sel.classList.add('hidden');
    cfg.classList.add('hidden');
    bld.classList.add('hidden');
    foot.classList.add('hidden');
    backBtn.classList.add('hidden');
    
    if (v === 'SELECTION') {
        sel.classList.remove('hidden');
    } else if (v === 'CONFIG') {
        cfg.classList.remove('hidden');
        foot.classList.remove('hidden');
        if ((state.activeMeal.packages && state.activeMeal.packages.length > 0) || state.activeMeal.customBuilder) backBtn.classList.remove('hidden');
        updateTotal();
    } else if (v === 'BUILDER') {
        bld.classList.remove('hidden');
        foot.classList.remove('hidden');
        backBtn.classList.remove('hidden');
        renderBuilder();
        updateTotal();
    }
}

function renderPackages(meal) {
    const container = document.getElementById('package-slider');
    let html = '';
    
    // Packages
    if (meal.packages) {
        meal.packages.forEach((pkg, idx) => {
            html += `
            <div class="pkg-card pkg-gradient-${idx % 4}" onclick="selectPackage('${pkg.id}')">
                <div class="pkg-icon"><i data-lucide="chef-hat"></i></div>
                <h4>${pkg.name}</h4>
                <p>${pkg.description}</p>
                <div class="price">GHS ${pkg.price}</div>
            </div>`;
        });
    }
    
    // Builder
    if (meal.customBuilder) {
        html += `
        <div class="pkg-card build-card" onclick="setMealView('BUILDER')">
            <div class="build-bg"></div>
            <div class="pkg-icon"><i data-lucide="plus"></i></div>
            <h4 style="z-index:1">Build Your Own</h4>
            <p style="z-index:1">Customize everything.</p>
            <div class="btn-small" style="z-index:1">Start</div>
        </div>`;
    }
    
    container.innerHTML = html;
    lucide.createIcons();
}

function selectPackage(pkgId) {
    state.activePackage = state.activeMeal.packages.find(p => p.id === pkgId);
    state.selectedOptions = {};
    state.mealQty = 1;
    renderConfig(state.activePackage);
    setMealView('CONFIG');
}

function renderConfig(pkg) {
    const title = pkg ? pkg.name : state.activeMeal.name;
    const price = pkg ? pkg.price : state.activeMeal.price;
    const desc = pkg ? pkg.description : state.activeMeal.description;
    const optionGroups = pkg ? pkg.optionGroups : state.activeMeal.optionGroups;
    
    document.getElementById('config-title').innerText = title;
    document.getElementById('config-price').innerText = `GHS ${price}`;
    document.getElementById('config-desc').innerText = desc;
    
    const container = document.getElementById('config-options');
    container.innerHTML = '';
    
    if (optionGroups) {
        optionGroups.forEach(grp => {
            const grpDiv = document.createElement('div');
            grpDiv.innerHTML = `
                <div class="opt-group-title">
                    <h4>${grp.name}</h4>
                    <span class="badge-req">${grp.required ? 'Required' : 'Optional'}</span>
                </div>
            `;
            
            grp.options.forEach(opt => {
                const item = document.createElement('div');
                item.className = 'opt-item';
                item.id = `opt-${opt.id}`;
                item.onclick = () => toggleOption(grp.id, opt, grp.maxSelection);
                item.innerHTML = `
                    <div class="opt-left">
                        <div class="check-circle"><i data-lucide="check"></i></div>
                        <span class="opt-name">${opt.name}</span>
                    </div>
                    <span class="opt-price">${(!pkg && opt.price > 0) ? '+ '+opt.price : ''}</span>
                `;
                grpDiv.appendChild(item);
            });
            container.appendChild(grpDiv);
        });
    }
    lucide.createIcons();
}

function toggleOption(grpId, opt, max) {
    const current = state.selectedOptions[grpId] || [];
    const exists = current.find(o => o.id === opt.id);
    
    if (max === 1) {
        state.selectedOptions[grpId] = [opt];
        // Visual Update (Clear all in group, set this)
        // Ideally we re-render, but for vanilla performace, let's just toggle classes if simple
    } else {
        if (exists) state.selectedOptions[grpId] = current.filter(o => o.id !== opt.id);
        else if (current.length < max) state.selectedOptions[grpId] = [...current, opt];
    }
    // Re-render config to show checks
    renderConfig(state.activePackage); 
    // Re-apply selections
    Object.keys(state.selectedOptions).forEach(gid => {
        state.selectedOptions[gid].forEach(o => {
            const el = document.getElementById(`opt-${o.id}`);
            if (el) el.classList.add('selected');
        });
    });
    updateTotal();
}

// Builder Logic
function renderBuilder() {
    const cfg = state.activeMeal.customBuilder;
    document.getElementById('builder-unit-name').innerText = cfg.unitName;
    document.getElementById('builder-base-price').innerText = cfg.basePrice;
    document.getElementById('builder-qty-display').innerText = state.buildBaseQty;
    
    const container = document.getElementById('builder-addons');
    container.innerHTML = '';
    
    cfg.addonGroups.forEach(grp => {
        const div = document.createElement('div');
        div.innerHTML = `<h4 style="margin:1rem 0 0.5rem">${grp.name}</h4>`;
        
        grp.options.forEach(opt => {
            const count = (state.buildAddons[grp.id] || []).filter(o => o.id === opt.id).length;
            const item = document.createElement('div');
            item.className = `opt-item ${count > 0 ? 'selected' : ''}`;
            item.innerHTML = `
                <div>
                    <span class="opt-name">${opt.name}</span>
                    <div class="opt-price">GHS ${opt.price}</div>
                </div>
                <div class="flex-gap">
                    ${count > 0 ? `<button class="btn-icon" onclick="modBuildAddon('${grp.id}', '${opt.id}', -1, ${opt.price})"><i data-lucide="minus"></i></button>` : ''}
                    ${count > 0 ? `<span>${count}</span>` : ''}
                    <button class="btn-icon" style="background:${count>0?'var(--primary)':'#f3f4f6'};color:${count>0?'white':'black'}" onclick="modBuildAddon('${grp.id}', '${opt.id}', 1, ${opt.price}, '${opt.name}')"><i data-lucide="plus"></i></button>
                </div>
            `;
            div.appendChild(item);
        });
        container.appendChild(div);
    });
    lucide.createIcons();
}

function modBuildAddon(grpId, optId, delta, price, name) {
    const cur = state.buildAddons[grpId] || [];
    if (delta > 0) {
        state.buildAddons[grpId] = [...cur, {id: optId, price, name}];
    } else {
        const idx = cur.findIndex(x => x.id === optId);
        if (idx > -1) {
            const n = [...cur]; n.splice(idx, 1);
            state.buildAddons[grpId] = n;
        }
    }
    renderBuilder();
    updateTotal();
}

function updateBuilderBaseQty(delta) {
    state.buildBaseQty = Math.max(1, state.buildBaseQty + delta);
    renderBuilder();
    updateTotal();
}

function updateMealQty(delta) {
    state.mealQty = Math.max(1, state.mealQty + delta);
    document.getElementById('meal-qty-display').innerText = state.mealQty;
    updateTotal();
}

function updateTotal() {
    let total = 0;
    if (state.view === 'BUILDER') {
        total = state.activeMeal.customBuilder.basePrice * state.buildBaseQty;
        Object.values(state.buildAddons).forEach(g => g.forEach(o => total += o.price));
        document.getElementById('btn-add-text').innerText = 'Complete Build';
        // Hide qty control for builder
        document.getElementById('footer-qty-control').classList.add('hidden');
    } else {
        const base = state.activePackage ? state.activePackage.price : state.activeMeal.price;
        let opts = 0;
        Object.values(state.selectedOptions).forEach(g => g.forEach(o => opts += o.price));
        total = (base + opts) * state.mealQty;
        document.getElementById('btn-add-text').innerText = 'Add to Order';
        document.getElementById('footer-qty-control').classList.remove('hidden');
    }
    document.getElementById('btn-add-price').innerText = `GHS ${total.toFixed(2)}`;
}

function confirmAddToCart() {
    const m = state.activeMeal;
    let finalPrice = 0;
    
    // Calc Price again to store
    if (state.view === 'BUILDER') {
        finalPrice = m.customBuilder.basePrice * state.buildBaseQty;
        Object.values(state.buildAddons).forEach(g => g.forEach(o => finalPrice += o.price));
    } else {
        const base = state.activePackage ? state.activePackage.price : m.price;
        let opts = 0;
        Object.values(state.selectedOptions).forEach(g => g.forEach(o => opts += o.price));
        finalPrice = (base + opts) * state.mealQty;
    }

    const cartItem = {
        id: Date.now().toString(),
        restaurantId: state.activeRestaurant.id,
        restaurantName: state.activeRestaurant.name,
        meal: m,
        type: state.view, // PACKAGE, STANDARD, BUILDER
        quantity: state.view === 'BUILDER' ? 1 : state.mealQty,
        price: finalPrice,
        package: state.activePackage,
        options: state.selectedOptions,
        buildData: state.view === 'BUILDER' ? { base: state.buildBaseQty, addons: state.buildAddons } : null
    };
    
    state.cart.push(cartItem);
    showToast("Added to Cart");
    updateCartUI();
    closeMealModal();
}

// === CART LOGIC ===
function updateCartUI() {
    const count = state.cart.length;
    const total = state.cart.reduce((a, b) => a + b.price, 0);
    
    const floatBtn = document.getElementById('float-cart-btn');
    const badge = document.getElementById('cart-count-badge');
    const bar = document.getElementById('bottom-cart-bar');
    
    if (count > 0) {
        badge.classList.remove('hidden');
        badge.innerText = count;
        
        // Show bar if not in cart view
        if (state.view !== 'CART') {
            bar.classList.remove('hidden');
            document.getElementById('bar-count').innerText = `${count} items.`;
            document.getElementById('bar-total').innerText = `GHS ${total.toFixed(2)}`;
        }
    } else {
        badge.classList.add('hidden');
        bar.classList.add('hidden');
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-list');
    const empty = document.getElementById('cart-empty');
    const footer = document.getElementById('cart-footer');
    const clearBtn = document.getElementById('btn-clear-cart');
    
    if (state.cart.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        footer.classList.add('hidden');
        clearBtn.classList.add('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    footer.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    
    // Group by Restaurant
    const grouped = state.cart.reduce((a, b) => {
        if (!a[b.restaurantId]) a[b.restaurantId] = [];
        a[b.restaurantId].push(b);
        return a;
    }, {});
    
    let html = '';
    
    Object.keys(grouped).forEach(rid => {
        const items = grouped[rid];
        html += `<div class="cart-group">
            <div class="cart-group-header">
                <h3>${items[0].restaurantName}</h3>
                <button class="btn-pay-shop" onclick="initiateCheckout(false, '${rid}')">Pay this restaurant</button>
            </div>`;
            
        items.forEach(item => {
            let desc = '';
            if (item.type === 'PACKAGE') {
                desc = `${item.package.name}`;
                // Add options
            } else if (item.type === 'BUILDER') {
                const u = item.meal.customBuilder.unitName;
                const addons = [];
                Object.values(item.buildData.addons).forEach(g => g.forEach(o => addons.push(o.name)));
                desc = `${item.buildData.base} ${u} ${addons.length>0 ? '+ '+addons.join(', ') : ''}`;
            }
            
            html += `<div class="cart-item">
                <img src="${item.meal.image}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-row-top">
                        <span class="cart-title">${item.quantity}x ${item.meal.name}</span>
                        <span class="cart-price">GHS ${item.price.toFixed(2)}</span>
                    </div>
                    <div class="cart-desc">${desc}</div>
                    <button class="btn-remove" onclick="removeCartItem('${item.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            </div>`;
        });
        html += `</div>`;
    });
    
    container.innerHTML = html;
    
    const total = state.cart.reduce((a, b) => a + b.price, 0);
    document.getElementById('cart-total-display').innerText = total.toFixed(2);
    lucide.createIcons();
}

function removeCartItem(id) {
    state.cart = state.cart.filter(x => x.id !== id);
    renderCart();
    updateCartUI();
}

function promptClearCart() {
    document.getElementById('modal-clear-cart').classList.remove('hidden');
}

function clearCart() {
    state.cart = [];
    document.getElementById('modal-clear-cart').classList.add('hidden');
    renderCart();
    updateCartUI();
    showToast("Cart Cleared");
}

function goBackFromCart() {
    setView(state.activeRestaurant ? 'restaurant' : 'home');
}

// === CHECKOUT ===
function initiateCheckout(isGeneral, rid) {
    state.isGeneralCheckout = isGeneral;
    if (isGeneral) {
        state.checkoutItems = state.cart;
    } else {
        state.checkoutItems = state.cart.filter(x => x.restaurantId === rid);
    }
    
    // Calc Totals
    const subtotal = state.checkoutItems.reduce((a,b)=>a+b.price,0);
    // Calc Delivery (Sum of unique restaurant fees)
    const rids = [...new Set(state.checkoutItems.map(x=>x.restaurantId))];
    let delFee = 0;
    rids.forEach(id => {
        const r = MOCK_RESTAURANTS.find(x=>x.id===id);
        if(r) delFee += r.deliveryFee;
    });
    
    document.getElementById('sum-subtotal').innerText = `GHS ${subtotal.toFixed(2)}`;
    document.getElementById('sum-delivery').innerText = `GHS ${delFee.toFixed(2)}`;
    document.getElementById('sum-total').innerText = `GHS ${(subtotal + delFee + 2).toFixed(2)}`;
    
    // Reset Form
    document.getElementById('checkout-step-1').classList.remove('hidden');
    document.getElementById('checkout-step-2').classList.add('hidden');
    document.getElementById('btn-checkout-next').classList.remove('hidden');
    document.getElementById('btn-group-pay').classList.add('hidden');
    
    document.getElementById('modal-checkout').classList.remove('hidden');
}

function closeCheckoutModal() {
    document.getElementById('modal-checkout').classList.add('hidden');
}

function detectNetwork(val, mode) {
    const clean = val.replace(/\D/g,'');
    let name = '';
    if (clean.length >= 3) {
        const p = clean.substring(0,3);
        if (['024','054','055','059','025','053'].includes(p)) name = 'MTN MoMo';
        else if (['020','050'].includes(p)) name = 'Telecel Cash';
        else if (['027','057','026','056'].includes(p)) name = 'AT Money';
    }
    
    const badge = mode === 'checkout' ? document.getElementById('pay-network-badge') : null; // Add partner detection later if needed
    if (badge) {
        if(name) {
            badge.classList.remove('hidden');
            badge.querySelector('span').innerText = name;
            state.payNetwork = name === 'MTN MoMo' ? 'mtn-gh' : name === 'Telecel Cash' ? 'vodafone-gh' : 'tigo-gh';
        } else {
            badge.classList.add('hidden');
            state.payNetwork = '';
        }
    }
}

function checkoutNext() {
    const name = document.getElementById('pay-name').value;
    const momo = document.getElementById('pay-momo').value;
    const addr = document.getElementById('del-address').value;
    const cont = document.getElementById('del-contact').value;
    
    if(!name || momo.length < 10 || !addr || cont.length < 10 || !state.payNetwork) {
        alert("Please fill all details correctly.");
        return;
    }
    
    document.getElementById('conf-address').innerText = addr;
    document.getElementById('conf-contact').innerText = cont;
    document.getElementById('conf-payer').innerText = `${state.payNetwork} (${momo})`;
    
    document.getElementById('checkout-step-1').classList.add('hidden');
    document.getElementById('checkout-step-2').classList.remove('hidden');
    document.getElementById('btn-checkout-next').classList.add('hidden');
    document.getElementById('btn-group-pay').classList.remove('hidden');
}

function checkoutBack() {
    document.getElementById('checkout-step-1').classList.remove('hidden');
    document.getElementById('checkout-step-2').classList.add('hidden');
    document.getElementById('btn-checkout-next').classList.remove('hidden');
    document.getElementById('btn-group-pay').classList.add('hidden');
}

async function processPayment() {
    const btn = document.getElementById('btn-make-payment');
    btn.innerText = "Processing...";
    btn.disabled = true;
    
    const subtotal = state.checkoutItems.reduce((a,b)=>a+b.price,0);
    // Recalc Delivery
    const rids = [...new Set(state.checkoutItems.map(x=>x.restaurantId))];
    let delFee = 0;
    rids.forEach(id => { const r = MOCK_RESTAURANTS.find(x=>x.id===id); if(r) delFee += r.deliveryFee; });
    const total = subtotal + delFee + 2;
    
    const payload = {
        amount: total,
        customerName: document.getElementById('pay-name').value,
        customerPhone: document.getElementById('pay-momo').value,
        shopName: "PickMe Services",
        description: "Food Order",
        clientReference: `FOOD-${Date.now()}`,
        channel: state.payNetwork
    };
    
    // Format Phone
    let p = payload.customerPhone.replace(/\D/g,'');
    if(p.startsWith('0')) p = '+233'+p.substring(1);
    payload.customerPhone = p;
    
    try {
        const res = await fetch("https://us-central1-pickmeservicesonline.cloudfunctions.net/startPayment", {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            // Firestore Write
            const ordersCol = db.collection('Food').doc('Orders').collection('items');
            await ordersCol.add({
                orderId: payload.clientReference,
                items: state.checkoutItems,
                amount: total,
                details: payload,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Clear items
            const ids = new Set(state.checkoutItems.map(x=>x.id));
            state.cart = state.cart.filter(x=>!ids.has(x.id));
            updateCartUI();
            
            alert(`Payment prompt sent to ${p}.`);
            closeCheckoutModal();
            setView('home');
        } else {
            alert("Payment Failed. Try again.");
        }
    } catch(e) {
        console.error(e);
        alert("Connection Error.");
    } finally {
        btn.innerText = "Make Payment";
        btn.disabled = false;
    }
}

// === PARTNER ONBOARDING ===
function openPartnerModal() {
    document.getElementById('modal-partner').classList.remove('hidden');
    renderPartnerSelect();
}
function closePartnerModal() { document.getElementById('modal-partner').classList.add('hidden'); }

function renderPartnerSelect() {
    const c = document.getElementById('partner-content');
    c.innerHTML = `
        <div class="text-center" style="padding:2rem 0">
            <h3 style="font-size:1.5rem;font-weight:800;margin-bottom:0.5rem">Add your Restaurant</h3>
            <p style="color:var(--gray-500);margin-bottom:2rem">Partner with PickMe Services today.</p>
            <div class="partner-option" onclick="renderPartnerRegister()">
                <div class="partner-icon-box"><i data-lucide="store"></i></div>
                <div style="text-align:left"><h4>Add New Restaurant</h4><p style="font-size:0.8rem;color:var(--gray-500)">Join us to reach customers.</p></div>
            </div>
            <div class="partner-option" onclick="renderPartnerRenew()">
                <div class="partner-icon-box blue"><i data-lucide="refresh-cw"></i></div>
                <div style="text-align:left"><h4>Renew Subscription</h4><p style="font-size:0.8rem;color:var(--gray-500)">Extend your plan.</p></div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderPartnerRegister() {
    const c = document.getElementById('partner-content');
    c.innerHTML = `
        <div class="animate-fade-in">
            <div class="flex-align mb-4">
                <button class="btn-icon" onclick="renderPartnerSelect()"><i data-lucide="arrow-left"></i></button>
                <h3>Basic Details</h3>
            </div>
            <label>RESTAURANT NAME</label>
            <input id="pt-name" class="input-field" placeholder="e.g. Tasty Pot">
            <label>OWNER MOMO NUMBER</label>
            <input id="pt-phone" class="input-field" placeholder="e.g. 055..." maxlength="10">
            <label>COVER IMAGE</label>
            <div class="upload-box" onclick="document.getElementById('pt-file').click()">
                <div id="pt-img-prev" class="hidden"><img style="width:100%;height:100px;object-fit:cover;border-radius:0.5rem"></div>
                <div id="pt-upload-txt"><i data-lucide="upload"></i> Tap to upload</div>
                <input id="pt-file" type="file" class="hidden" accept="image/*" onchange="previewImg(this)">
            </div>
            <button class="btn-black full" onclick="renderPartnerMenu()">Next: Quick Menu</button>
        </div>
    `;
    lucide.createIcons();
    state.partnerItems = [];
}

function previewImg(input) {
    if(input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('pt-img-prev').classList.remove('hidden');
            document.getElementById('pt-img-prev').innerHTML = `<img src="${e.target.result}" style="width:100%;height:150px;object-fit:cover;border-radius:0.5rem">`;
            document.getElementById('pt-upload-txt').classList.add('hidden');
            state.partnerImg = e.target.result; // Store base64 (should compress in real app)
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function renderPartnerMenu() {
    const c = document.getElementById('partner-content');
    const itemsHtml = state.partnerItems.map(i => `<div class="menu-list-item"><span>${i.name}</span><span>GHS ${i.price}</span></div>`).join('');
    
    c.innerHTML = `
        <div class="animate-fade-in">
            <div class="flex-align mb-4">
                <button class="btn-icon" onclick="renderPartnerRegister()"><i data-lucide="arrow-left"></i></button>
                <h3>Add Menu Items</h3>
            </div>
            <div class="summary-card" style="background:white">
                <div class="flex-gap">
                    <input id="pt-item-name" class="input-field" placeholder="Item Name" style="margin-bottom:0">
                    <input id="pt-item-price" class="input-field" placeholder="Price" style="width:80px;margin-bottom:0">
                </div>
                <button class="btn-black full" style="margin-top:0.5rem" onclick="addPartnerItem()">Add Item</button>
            </div>
            <div id="pt-item-list">${itemsHtml}</div>
            <button class="btn-black full" style="margin-top:2rem" onclick="renderPartnerPlan()">Next: Choose Plan</button>
        </div>
    `;
    lucide.createIcons();
}

function addPartnerItem() {
    const n = document.getElementById('pt-item-name').value;
    const p = document.getElementById('pt-item-price').value;
    if(n && p) {
        state.partnerItems.push({name:n, price:p});
        renderPartnerMenu();
    }
}

function renderPartnerPlan() {
    const c = document.getElementById('partner-content');
    c.innerHTML = `
        <div class="animate-fade-in">
            <div class="flex-align mb-4">
                <button class="btn-icon" onclick="renderPartnerMenu()"><i data-lucide="arrow-left"></i></button>
                <h3>Select Plan</h3>
            </div>
            <div class="plan-grid">
                ${SUBSCRIPTION_PLANS.map(p => `
                    <div class="plan-card" onclick="selectPlan('${p.id}')" id="plan-${p.id}">
                        <div><h4>${p.label}</h4><span style="font-size:0.7rem;color:grey">${p.desc}</span></div>
                        <div class="text-primary font-bold">GHS ${p.price}</div>
                    </div>
                `).join('')}
            </div>
            <button id="btn-pay-partner" class="btn-primary full" style="margin-top:1.5rem" disabled onclick="processPartnerPay()">Pay & Submit</button>
        </div>
    `;
    lucide.createIcons();
}

function selectPlan(id) {
    state.selectedPlan = SUBSCRIPTION_PLANS.find(p=>p.id===id);
    document.querySelectorAll('.plan-card').forEach(e=>e.classList.remove('selected'));
    document.getElementById(`plan-${id}`).classList.add('selected');
    document.getElementById('btn-pay-partner').disabled = false;
    document.getElementById('btn-pay-partner').innerHTML = `Pay GHS ${state.selectedPlan.price}`;
}

async function processPartnerPay() {
    const btn = document.getElementById('btn-pay-partner');
    btn.innerText = "Processing...";
    btn.disabled = true;
    
    // Logic similar to checkout
    // ... (Simplified for brevity, assumes success)
    setTimeout(() => {
        alert("Payment initiated.");
        closePartnerModal();
    }, 2000);
}

function renderPartnerRenew() {
    const c = document.getElementById('partner-content');
    c.innerHTML = `<div class="text-center p-4"><h3>Renew Logic Here</h3><button class="btn-grey" onclick="renderPartnerSelect()">Back</button></div>`;
}

// === AI CHAT ===
function toggleAI() {
    const win = document.getElementById('ai-chat-window');
    const btn = document.getElementById('btn-ai-float');
    if (win.classList.contains('hidden')) {
        win.classList.remove('hidden');
        btn.classList.add('hidden');
    } else {
        win.classList.add('hidden');
        btn.classList.remove('hidden');
    }
}

// === UTILS ===
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}
