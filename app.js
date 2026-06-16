// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAqUIzN6RLceFzQRkOKlBtbDMYOs4tl46Y",
    authDomain: "luxe-6c50d.firebaseapp.com",
    databaseURL: "https://luxe-6c50d-default-rtdb.firebaseio.com",
    projectId: "luxe-6c50d",
    storageBucket: "luxe-6c50d.firebasestorage.app",
    messagingSenderId: "383280427630",
    appId: "1:383280427630:web:01c7b77580f303a1ff6c7f",
    measurementId: "G-DJ9505ZCNG"
};

let db = null, auth = null, useFirebase = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database(); auth = firebase.auth(); useFirebase = true;
    console.log("🔥 Firebase Connected!");
} catch(e) { console.log("⚠️ Firebase Error: ", e.message); }

// ==========================================
// 2. STATE & DATA INITIALIZATION
// ==========================================
const placeholderImgs = [
    "https://images.unsplash.com/photo-1596755094514-f87e32f85e98?q=80&w=600",
    "https://images.unsplash.com/photo-1624378439575-d1ead6bb17f2?q=80&w=600",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600",
    "https://images.unsplash.com/photo-1628151515664-92d6e326be8e?q=80&w=600",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600",
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600",
    "https://images.unsplash.com/photo-1601593346740-925612772716?q=80&w=600"
];

const expandedCategories = ["Men Shirts", "Men Pants", "Men Trousers", "Men Shoes", "Women Shirts", "Women Pants", "Women Trousers", "Women Shoes", "Watches", "Belts", "Handfrees", "Ear Buds", "Glasses", "Gorilla Glass", "Mobile Covers"];

let allProducts = [], cart = [], orders = [], notifs = [];
let currentCategory = "All", currentUser = null; 

window.onload = () => { 
    if(useFirebase) {
        auth.onAuthStateChanged((user) => {
            currentUser = user; updateAuthUI();
            if(user) fetchCustomerOrders(user.email);
        });

        db.ref('products').on('value', snapshot => {
            const data = snapshot.val();
            if(data) allProducts = Object.keys(data).map(key => ({...data[key], dbKey: key}));
            else seedDefaultProducts();
            applyFilters(); renderAdminProducts(); 
        });

        db.ref('orders').on('value', snapshot => {
            const data = snapshot.val();
            if(data) {
                orders = Object.keys(data).map(key => ({...data[key], dbKey: key})).reverse();
                updateAdminOrders(); if(currentUser) fetchCustomerOrders(currentUser.email); 
            }
        });
    }
    reveal(); window.addEventListener('scroll', reveal); 
    setTimeout(() => { document.getElementById('loader-wrapper').style.opacity = '0'; setTimeout(() => document.getElementById('loader-wrapper').style.display = 'none', 600); }, 800); 
};

function seedDefaultProducts() {
    allProducts = Array.from({ length: 30 }, (_, i) => {
        let cat = expandedCategories[i % expandedCategories.length];
        return { id: Date.now() + i, name: `Premium ${cat} Model ${i+1}`, price: 1500 + (Math.floor(Math.random() * 80) * 100), img: placeholderImgs[i % placeholderImgs.length], cat: cat };
    });
    if(useFirebase) allProducts.forEach(p => db.ref('products').push(p));
}

// ==========================================
// 3. UI & PRODUCT RENDERING
// ==========================================
function reveal() {
    document.querySelectorAll(".reveal").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 50) el.classList.add("active");
    });
}

function renderProducts(data) {
    const grid = document.getElementById('product-grid');
    if(data.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20"><i class="fa-solid fa-box-open text-4xl text-slate-300 mb-4"></i><p class="text-slate-500 font-bold">No products found.</p></div>`;
        return;
    }
    grid.innerHTML = data.map(p => `
        <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 group reveal active">
            <div class="overflow-hidden rounded-[1.5rem] mb-5 h-56 bg-slate-50 relative">
                <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur text-[9px] font-black text-slate-800 px-3 py-1 rounded-full shadow-sm">${p.cat}</div>
            </div>
            <div class="flex flex-col gap-1 mb-5">
                <h3 class="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors">${p.name}</h3>
                <span class="text-slate-900 font-black text-lg">Rs. ${p.price.toLocaleString()}</span>
            </div>
            <button onclick="flyToCart(event, ${p.id})" class="w-full bg-slate-50 border border-slate-100 text-slate-900 py-3.5 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:border-slate-900"><i class="fa-solid fa-cart-plus"></i> ADD TO BAG</button>
        </div>
    `).join('');
}

function filterByCategory(cat) {
    currentCategory = cat;
    document.getElementById('current-category-label').innerText = cat === "All" ? "Showing All Accessories & Clothing" : `Category: ${cat}`;
    document.getElementById('hero-search').value = ""; applyFilters(); document.getElementById('products').scrollIntoView();
}

function filterItemsFromHero() {
    currentCategory = "All"; document.getElementById('current-category-label').innerText = "Search Results"; applyFilters();
}

function applyFilters() {
    let searchVal = document.getElementById('hero-search') ? document.getElementById('hero-search').value.toLowerCase() : "";
    let sort = document.getElementById('sort-logic').value;
    let filtered = [...allProducts];
    if (currentCategory !== "All") filtered = filtered.filter(p => p.cat === currentCategory);
    if (searchVal) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal) || p.cat.toLowerCase().includes(searchVal));
    if(sort === 'low') filtered.sort((a,b) => a.price - b.price);
    if(sort === 'high') filtered.sort((a,b) => b.price - a.price);
    renderProducts(filtered);
}

// Hamburger Menu Toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden'); menu.classList.toggle('flex');
    if(!menu.classList.contains('hidden')) { document.body.style.overflow = 'hidden'; } 
    else { document.body.style.overflow = 'auto'; }
}

// ==========================================
// 4. USER AUTHENTICATION & LOGIN UI
// ==========================================
function toggleAuth() {
    const container = document.getElementById('auth-container');
    container.classList.toggle('sign-in'); container.classList.toggle('sign-up');
}
function openAuthModal() {
    if(currentUser) return; 
    document.getElementById('authModal').style.display = 'flex'; document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none'; document.body.style.overflow = 'auto';
}

document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault(); if(!useFirebase) return alert("Firebase not connected!");
    const name = document.getElementById('reg-name').value; const email = document.getElementById('reg-email').value; const pass = document.getElementById('reg-pass').value;
    auth.createUserWithEmailAndPassword(email, pass).then(cred => cred.user.updateProfile({ displayName: name })).then(() => { alert("Account created successfully!"); closeAuthModal(); }).catch(err => alert("Error: " + err.message));
});

document.getElementById('signin-form').addEventListener('submit', (e) => {
    e.preventDefault(); if(!useFirebase) return alert("Firebase not connected!");
    const email = document.getElementById('log-email').value; const pass = document.getElementById('log-pass').value;
    auth.signInWithEmailAndPassword(email, pass).then(() => { alert("Logged in successfully!"); closeAuthModal(); }).catch(err => alert("Error: " + err.message));
});

function logoutUser() {
    if(confirm("Are you sure you want to logout?")) {
        auth.signOut().then(() => { alert("Logged out."); document.getElementById('my-orders-section').classList.add('hidden'); });
    }
}

function updateAuthUI() {
    const loginBtnDesk = document.getElementById('nav-login-btn-desk');
    const userProfileDesk = document.getElementById('nav-user-profile-desk');
    const userNameDesk = document.getElementById('nav-user-name-desk');
    
    const loginBtnMob = document.getElementById('nav-login-btn-mob');
    const userProfileMob = document.getElementById('nav-user-profile-mob');
    const userNameMob = document.getElementById('nav-user-name-mob');
    
    const orderLinks = document.querySelectorAll('.user-only');

    if(currentUser) {
        if(loginBtnDesk) loginBtnDesk.classList.add('hidden'); 
        if(userProfileDesk) userProfileDesk.classList.remove('hidden');
        if(userNameDesk) userNameDesk.innerText = `Hi, ${currentUser.displayName || 'User'}`;
        
        if(loginBtnMob) loginBtnMob.classList.add('hidden'); 
        if(userProfileMob) userProfileMob.classList.remove('hidden');
        if(userNameMob) userNameMob.innerText = `Hi, ${currentUser.displayName || 'User'}`;
        
        orderLinks.forEach(l => l.classList.remove('hidden'));
    } else {
        if(loginBtnDesk) loginBtnDesk.classList.remove('hidden'); 
        if(userProfileDesk) userProfileDesk.classList.add('hidden');
        
        if(loginBtnMob) loginBtnMob.classList.remove('hidden'); 
        if(userProfileMob) userProfileMob.classList.add('hidden');
        
        orderLinks.forEach(l => l.classList.add('hidden'));
    }
}

function showMyOrders() {
    if(!currentUser) return openAuthModal();
    document.getElementById('my-orders-section').classList.remove('hidden');
    document.getElementById('my-orders-section').scrollIntoView();
}

function fetchCustomerOrders(email) {
    const customerOrders = orders.filter(o => o.email === email);
    const list = document.getElementById('customer-orders-list');
    if(customerOrders.length === 0) { list.innerHTML = `<div class="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm text-center"><p class="text-slate-500 font-bold">You haven't placed any orders yet.</p></div>`; return; }
    list.innerHTML = customerOrders.map(o => `
        <div class="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">${o.status}</span>
                    <h4 class="font-black text-lg text-slate-900">Order #${o.id}</h4>
                </div>
                <p class="text-sm font-bold text-slate-400"><i class="fa-regular fa-clock"></i> ${o.date}</p>
            </div>
            <div class="md:text-right"><p class="font-black text-2xl text-slate-900 mb-2">${o.total}</p></div>
        </div>
    `).join('');
}

// ==========================================
// 5. CART & CHECKOUT LOGIC
// ==========================================
function flyToCart(e, id) {
    const p = allProducts.find(x => x.id === id);
    cart.push({...p, cartId: Date.now()});
    document.querySelectorAll('.cart-count-badge').forEach(badge => badge.innerText = cart.length);
    pushNotif(`Added <span class="text-orange-600">${p.name}</span> to bag`);
}

function openCart() { 
    if(cart.length) { updateCartUI(); openModal('cart-modal'); }
    else { pushNotif("Your shopping bag is empty!"); toggleNotif(); }
}

function updateCartUI() {
    let sub = 0;
    document.getElementById('cart-items').innerHTML = cart.map(i => {
        sub += i.price;
        return `<div class="flex justify-between bg-slate-50 p-4 rounded-2xl items-center gap-4">
            <div class="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0"><img src="${i.img}" class="w-full h-full object-cover"></div>
            <div class="flex-1"><p class="font-bold text-sm text-slate-800 line-clamp-1">${i.name}</p><p class="text-orange-600 text-sm font-black">Rs. ${i.price.toLocaleString()}</p></div>
            <button onclick="removeCart(${i.cartId})" class="w-10 h-10 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm"><i class="fa-solid fa-trash-can"></i></button>
        </div>`;
    }).join('');
    
    document.getElementById('sub-total').innerText = "Rs. " + sub.toLocaleString();
    document.getElementById('total-val').innerText = "Rs. " + sub.toLocaleString();
}

function removeCart(cid) { 
    cart = cart.filter(i => i.cartId !== cid); updateCartUI(); 
    document.querySelectorAll('.cart-count-badge').forEach(badge => badge.innerText = cart.length);
    if(!cart.length) closeModal('cart-modal'); 
}

async function submitOrder() {
    const n = document.getElementById('cust-name').value; const p = document.getElementById('cust-phone').value; const city = document.getElementById('cust-city').value; const address = document.getElementById('cust-address').value;
    if(!n || !p || !city || !address) return alert("Please fill all shipping details correctly.");
    
    const order = { 
        id: 'LX-'+Math.floor(Math.random()*99999), customer: n, phone: p, city: city, address: address,
        email: currentUser ? currentUser.email : "Guest", items: [...cart], total: document.getElementById('total-val').innerText, 
        date: new Date().toLocaleString(), status: "Processing" 
    };
    
    if(useFirebase) db.ref('orders').push(order);
    await getReceipt(order);
    cart = []; document.querySelectorAll('.cart-count-badge').forEach(badge => badge.innerText = "0"); closeModal('cart-modal');
}

async function getReceipt(o) {
    const body = document.getElementById('receipt-body');
    body.innerHTML = `<strong>ORDER NO:</strong> #${o.id}<br><strong>CUSTOMER:</strong> ${o.customer}<br><strong>PHONE:</strong> ${o.phone}<br>`;
    document.getElementById('receipt-sum').innerText = "AMOUNT PAID: " + o.total;
    const area = document.getElementById('receipt-area'); area.style.left = "0";
    const canvas = await html2canvas(area);
    const link = document.createElement('a'); link.download = `Luxe-Receipt-${o.id}.png`; link.href = canvas.toDataURL(); link.click();
    area.style.left = "-9999px";
}

function pushNotif(msg) {
    notifs.unshift({ msg, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    document.getElementById('notif-dot').style.display = 'block'; updateNotifUI();
}
function updateNotifUI() { document.getElementById('notif-feed').innerHTML = notifs.map(n => `<div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p class="text-sm font-medium text-slate-600">${n.msg}</p></div>`).join(''); }
function toggleNotif() { document.getElementById('notif-sidebar').classList.toggle('open'); document.getElementById('notif-dot').style.display = 'none'; }


// ==========================================
// 6. 🛡️ ADMIN SECURE ACCESS (PASSWORD ONLY)
// ==========================================
const STRICT_ADMIN_PASS = "LuxeStoreAdmin123@"; 

function toggleVisibility(inputId, iconId) {
    const input = document.getElementById(inputId); const icon = document.getElementById(iconId);
    if (input.type === "password") { input.type = "text"; icon.classList.replace("fa-eye", "fa-eye-slash"); } 
    else { input.type = "password"; icon.classList.replace("fa-eye-slash", "fa-eye"); }
}

function checkAdminAccess() {
    const isTrusted = localStorage.getItem('luxe_trusted_admin');
    if (isTrusted === 'true') { grantAdminAccess(); } 
    else { openModal('admin-lock'); }
}

function verifyAdminPassword(e) {
    e.preventDefault();
    const inputPass = document.getElementById('admin-pass-only').value;
    
    if(inputPass === STRICT_ADMIN_PASS) {
        localStorage.setItem('luxe_trusted_admin', 'true');
        closeModal('admin-lock');
        document.getElementById('admin-pass-only').value = "";
        grantAdminAccess();
    } else {
        alert("❌ Incorrect Admin Password! Access Denied.");
    }
}

function grantAdminAccess() {
    document.getElementById('admin-os').classList.remove('hidden');
    document.getElementById('main-site-content').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
    if(document.querySelector('footer')) document.querySelector('footer').style.display = 'none';
    document.querySelector('.notif-trigger').style.display = 'none';
    updateAdminOrders(); renderAdminProducts();
}

function logoutAdmin() { location.reload(); }

function switchAdminTab(tab) {
    document.getElementById('view-orders').classList.add('hidden');
    document.getElementById('view-products').classList.add('hidden');
    document.getElementById('view-' + tab).classList.remove('hidden');
}

function updateAdminOrders() {
    const log = document.getElementById('order-log');
    if(orders.length === 0) { log.innerHTML = `<div class="text-center py-10 text-slate-400">No orders found.</div>`; return; }
    log.innerHTML = orders.map(o => `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 class="font-black text-slate-900">Order #${o.id} - ${o.customer}</h4><p class="text-sm font-bold text-slate-700">${o.total}</p></div>`).join('');
}

// --- 🚀 INSTANT AUTO-COMPRESSION PRODUCT ADD ENGINE ---
function addNewProduct(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...';
    submitBtn.disabled = true;

    const name = document.getElementById('new-p-name').value;
    const price = parseInt(document.getElementById('new-p-price').value);
    const cat = document.getElementById('new-p-cat').value;
    const file = document.getElementById('new-p-img-file').files[0];

    if(!file) { alert("Pehle PC/Gallery se photo select karo!"); submitBtn.innerHTML = 'Publish Product'; submitBtn.disabled = false; return; }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 500; 
            let width = img.width, height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
            
            const fastBase64Image = canvas.toDataURL('image/jpeg', 0.6);
            const newProduct = { id: Date.now(), name: name, price: price, cat: cat, img: fastBase64Image };
            
            if(useFirebase) {
                db.ref('products').push(newProduct).then(() => {
                    alert(`Success! "${name}" instantly add ho gaya.`);
                    e.target.reset();
                }).finally(() => { submitBtn.innerHTML = 'Publish Product'; submitBtn.disabled = false; });
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file); 
}

function renderAdminProducts() {
    const log = document.getElementById('admin-product-log');
    document.getElementById('stat-posts').innerText = allProducts.length;
    if(allProducts.length === 0) { log.innerHTML = `<div>No products.</div>`; return; }
    
    log.innerHTML = allProducts.map(p => `
        <div class="bg-slate-50 p-4 rounded-xl flex justify-between items-center mb-2">
            <div class="flex items-center gap-3">
                <img src="${p.img}" class="w-10 h-10 object-cover rounded">
                <div><h4 class="font-bold text-slate-800 text-sm">${p.name}</h4><p class="text-xs text-slate-500">Rs. ${p.price}</p></div>
            </div>
            <button onclick="deleteProduct('', '${p.dbKey}')" class="text-red-500 hover:text-red-700 text-sm font-bold"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function deleteProduct(id, dbKey) {
    if(confirm("Permanently delete kar dein?") && useFirebase && dbKey) {
        db.ref('products/' + dbKey).remove();
    }
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; document.body.style.overflow = 'auto'; }