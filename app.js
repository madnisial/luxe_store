// ==========================================
// 1. CLOUDFLARE CONFIGURATION
// ==========================================
const CLOUDFLARE_API_URL = "https://luxe-api.madnisialpro.workers.dev";

// ==========================================
// 2. STATE INITIALIZATION
// ==========================================
const expandedCategories = ["Men Shirts", "Men Pants", "Men Trousers", "Men Shoes", "Women Shirts", "Women Pants", "Women Trousers", "Women Shoes", "Watches", "Belts", "Handfrees", "Ear Buds", "Glasses", "Gorilla Glass", "Mobile Covers"];
let allProducts = [], cart = [], orders = [], notifs = [];
let currentCategory = "All";

window.onload = () => { 
    loadCloudflareData();
    reveal(); 
    window.addEventListener('scroll', reveal); 
    setTimeout(() => { document.getElementById('loader-wrapper').style.opacity = '0'; setTimeout(() => document.getElementById('loader-wrapper').style.display = 'none', 600); }, 800); 
};

// --- 🌐 DATA FETCHING ENGINE ---
async function loadCloudflareData() {
    try {
        const prodRes = await fetch(`${CLOUDFLARE_API_URL}/products`);
        allProducts = await prodRes.json();
        applyFilters();
        renderAdminProducts();
        const orderRes = await fetch(`${CLOUDFLARE_API_URL}/orders`);
        orders = (await orderRes.json()).reverse();
        updateAdminOrders();
    } catch(err) { console.log("Cloudflare Error:", err); }
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
    if(!data || data.length === 0) { grid.innerHTML = `<div class="col-span-full text-center py-20"><p class="text-slate-500 font-bold">No products found.</p></div>`; return; }
    grid.innerHTML = data.map(p => `
        <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 group reveal active">
            <div class="overflow-hidden rounded-[1.5rem] mb-5 h-56 bg-slate-50 relative">
                <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur text-[9px] font-black text-slate-800 px-3 py-1 rounded-full shadow-sm">${p.cat}</div>
            </div>
            <div class="flex flex-col gap-1 mb-5">
                <h3 class="font-bold text-sm text-slate-800">${p.name}</h3>
                <span class="text-slate-900 font-black text-lg">Rs. ${p.price.toLocaleString()}</span>
            </div>
            <button onclick="flyToCart(event, ${p.id})" class="w-full bg-slate-50 border border-slate-100 text-slate-900 py-3.5 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all active:scale-95"><i class="fa-solid fa-cart-plus"></i> ADD TO BAG</button>
        </div>
    `).join('');
}

function applyFilters() {
    let searchVal = document.getElementById('hero-search') ? document.getElementById('hero-search').value.toLowerCase() : "";
    let filtered = [...allProducts];
    if (currentCategory !== "All") filtered = filtered.filter(p => p.cat === currentCategory);
    if (searchVal) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal));
    renderProducts(filtered);
}

// ==========================================
// 4. CART & ORDER LOGIC
// ==========================================
function flyToCart(e, id) {
    const p = allProducts.find(x => x.id === id);
    cart.push({...p, cartId: Date.now()});
    alert("Added to bag!");
}

async function submitOrder() {
    const order = { 
        id: 'LX-'+Math.floor(Math.random()*99999), 
        customer: document.getElementById('cust-name').value, 
        total: document.getElementById('total-val').innerText,
        items: [...cart], date: new Date().toLocaleString(), status: "Processing" 
    };
    await fetch(`${CLOUDFLARE_API_URL}/orders`, { method: 'POST', body: JSON.stringify(order) });
    loadCloudflareData(); cart = []; closeModal('cart-modal'); alert("Order placed!");
}

// ==========================================
// 5. ADMIN PANEL & PRODUCT MGMT
// ==========================================
async function addNewProduct(e) {
    e.preventDefault();
    const file = document.getElementById('new-p-img-file').files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
        const newProduct = { 
            id: Date.now(), name: document.getElementById('new-p-name').value, 
            price: parseInt(document.getElementById('new-p-price').value), 
            cat: document.getElementById('new-p-cat').value, img: event.target.result 
        };
        await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', body: JSON.stringify(newProduct) });
        loadCloudflareData(); alert("Product added!");
    };
    reader.readAsDataURL(file);
}

async function deleteProduct(id) {
    await fetch(`${CLOUDFLARE_API_URL}/products/${id}`, { method: 'DELETE' });
    loadCloudflareData();
}

function renderAdminProducts() {
    const log = document.getElementById('admin-product-log');
    if(!log) return;
    log.innerHTML = allProducts.map(p => `
        <div class="bg-slate-50 p-4 rounded-xl flex justify-between items-center mb-2">
            <div><h4 class="font-bold text-sm">${p.name}</h4></div>
            <button onclick="deleteProduct('${p.id}')" class="text-red-500 font-bold">Delete</button>
        </div>
    `).join('');
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function updateAdminOrders() { /* ...logic... */ }