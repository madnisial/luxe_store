// ==========================================
// 1. CLOUDFLARE CONFIGURATION & SECURITY
// ==========================================
const CLOUDFLARE_API_URL = "https://luxe-api.madnisialpro.workers.dev"; // TERA WORKER LINK

// ==========================================
// 2. STATE & GLOBAL CONFIGURATION
// ==========================================
let allProducts = [], cart = [], orders = [], notifs = [];
let currentCategory = "All";

let sysConfig = {
    id: 'SYSTEM_CONFIG', name: 'System', price: 0, cat: 'System', siteName: 'LUXE',
    offerBadge: 'Summer Vault Deal', 
    offerTitle: 'The Royal Emerald Collection', 
    offerDesc: 'FLAT 40% OFF! Experience the allure of meticulously handcrafted emeralds. A timeless investment for your unforgettable moments.',
    offerImg: 'https://images.unsplash.com/photo-1605100804763-247f6612d54e?q=80&w=1000',
    contactPhone: '+92 300 1234567', contactEmail: 'support@luxe.com', contactAddress: 'Faisalabad, Pakistan',
    socialFacebook: '', socialInstagram: '', socialWhatsapp: '', socialTiktok: '', socialYoutube: '',
    deliveryCharge: 0,
    discountPercent: 0,
    receiverEmail: 'madnisialpro@gmail.com',
    customSocials: [], 
    payEasypaisa: '', payJazzcash: '', bankName: '', bankNumber: '',
    customCategories: ['Payal'] // 🔥 CUSTOM CATEGORY ARRAY STARTING WITH "PAYAL"
};

const savedConfig = localStorage.getItem('luxe_sysConfig');
if (savedConfig) { try { sysConfig = JSON.parse(savedConfig); } catch(e) {} }

function initApp() {
    applySystemConfigToUI(); 
    loadCloudflareData().then(hideLoader).catch(hideLoader);
    reveal(); window.addEventListener('scroll', reveal); 
    setTimeout(hideLoader, 2500); 
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }

function hideLoader() {
    const loader = document.getElementById('loader-wrapper');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

function getSecureHeaders() { return { 'Content-Type': 'application/json', 'X-Admin-Token': sessionStorage.getItem('admin_session_token') || '' }; }

async function loadCloudflareData() {
    try {
        const prodRes = await fetch(`${CLOUDFLARE_API_URL}/products`, { cache: "no-store" });
        if (prodRes.ok) { 
            let fetchedProducts = await prodRes.json(); 
            const dbConfig = fetchedProducts.find(p => p.id === 'SYSTEM_CONFIG');
            if(dbConfig) { 
                sysConfig = { ...sysConfig, ...dbConfig }; 
                localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig));
            }
            
            allProducts = fetchedProducts.filter(p => p.id !== 'SYSTEM_CONFIG');
            
            applySystemConfigToUI();
            updateCategoriesUI();
            applyFilters(); renderAdminProducts(); 
        }
        if (sessionStorage.getItem('admin_session_token')) { loadCloudflareOrdersSecure(); }
    } catch(err) { console.log(err); }
}

async function loadCloudflareOrdersSecure() {
    try {
        const orderRes = await fetch(`${CLOUDFLARE_API_URL}/orders`, { cache: "no-store", headers: getSecureHeaders() });
        if (orderRes.status === 401) { logoutAdmin(); return; }
        if (orderRes.ok) { orders = (await orderRes.json()).reverse(); updateDetailsView(); updateReceiptsView(); }
    } catch(err) { console.log(err); }
}

function applySystemConfigToUI() {
    document.querySelectorAll('.dynamic-sitename').forEach(el => el.innerText = sysConfig.siteName);
    if(document.getElementById('offer-badge')) document.getElementById('offer-badge').innerText = sysConfig.offerBadge;
    if(document.getElementById('offer-title')) document.getElementById('offer-title').innerText = sysConfig.offerTitle;
    if(document.getElementById('offer-desc')) document.getElementById('offer-desc').innerText = sysConfig.offerDesc;
    if(document.getElementById('offer-bg')) document.getElementById('offer-bg').style.backgroundImage = `url(${sysConfig.offerImg})`;
    if(document.getElementById('contact-phone-disp')) document.getElementById('contact-phone-disp').innerText = sysConfig.contactPhone;
    if(document.getElementById('contact-email-disp')) document.getElementById('contact-email-disp').innerText = sysConfig.contactEmail;
    if(document.getElementById('contact-address-disp')) document.getElementById('contact-address-disp').innerText = sysConfig.contactAddress;

    const toggleSocial = (id, url) => { const el = document.getElementById(id); if(el) { if(url && url.trim() !== '') { el.href = url; el.style.display = 'flex'; } else { el.style.display = 'none'; } } };
    toggleSocial('link-facebook', sysConfig.socialFacebook); toggleSocial('link-instagram', sysConfig.socialInstagram); toggleSocial('link-tiktok', sysConfig.socialTiktok); toggleSocial('link-youtube', sysConfig.socialYoutube);

    let waUrl = sysConfig.socialWhatsapp;
    if (waUrl && waUrl.trim() !== '') { if (!waUrl.startsWith('http')) { let cleanNum = waUrl.replace(/[^0-9]/g, ''); if (cleanNum.startsWith('0')) { cleanNum = '92' + cleanNum.substr(1); } waUrl = 'https://wa.me/' + cleanNum; } toggleSocial('link-whatsapp', waUrl); } else { toggleSocial('link-whatsapp', ''); }

    if(document.getElementById('conf-site-name')) {
        document.getElementById('conf-site-name').value = sysConfig.siteName;
        document.getElementById('conf-offer-badge').value = sysConfig.offerBadge;
        document.getElementById('conf-offer-title').value = sysConfig.offerTitle;
        document.getElementById('conf-offer-desc').value = sysConfig.offerDesc;
        document.getElementById('conf-contact-phone').value = sysConfig.contactPhone;
        document.getElementById('conf-contact-email').value = sysConfig.contactEmail;
        document.getElementById('conf-contact-address').value = sysConfig.contactAddress;
        document.getElementById('conf-social-fb').value = sysConfig.socialFacebook || '';
        document.getElementById('conf-social-ig').value = sysConfig.socialInstagram || '';
        document.getElementById('conf-social-wa').value = sysConfig.socialWhatsapp || '';
        document.getElementById('conf-social-tt').value = sysConfig.socialTiktok || '';
        document.getElementById('conf-social-yt').value = sysConfig.socialYoutube || '';
        
        document.getElementById('conf-pay-ep').value = sysConfig.payEasypaisa || '';
        document.getElementById('conf-pay-jc').value = sysConfig.payJazzcash || '';
        document.getElementById('conf-bank-name').value = sysConfig.bankName || '';
        document.getElementById('conf-bank-number').value = sysConfig.bankNumber || '';

        document.getElementById('conf-delivery').value = sysConfig.deliveryCharge || 0;
        document.getElementById('conf-discount').value = sysConfig.discountPercent || 0;
        document.getElementById('conf-sys-email').value = sysConfig.receiverEmail || 'madnisialpro@gmail.com';
    }

    // 🔥 CUSTOM SOCIAL LINKS
    document.querySelectorAll('.dynamic-extra-social').forEach(el => el.remove()); 
    const footerContainer = document.getElementById('footer-social-links');
    if (footerContainer && sysConfig.customSocials) {
        sysConfig.customSocials.forEach(social => {
            const linkHtml = `<a href="${social.url}" target="_blank" class="dynamic-extra-social px-4 py-2 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500 text-white font-bold text-xs transition-all"><i class="fa-solid fa-link mr-2"></i> ${social.name}</a>`;
            footerContainer.insertAdjacentHTML('beforeend', linkHtml);
        });
    }
    if(window.renderAdminCustomSocials) renderAdminCustomSocials();

    // 🔥 CHECKOUT PAYMENT DROPDOWN
    const paySelect = document.getElementById('pay-method');
    if (paySelect) {
        let options = `<option value="" selected disabled>Select Payment Method</option><option value="Cash on Delivery">Cash on Delivery</option>`;
        if (sysConfig.payEasypaisa) options += `<option value="Easypaisa">Easypaisa</option>`;
        if (sysConfig.payJazzcash) options += `<option value="Jazz Cash">Jazz Cash</option>`;
        if (sysConfig.bankName && sysConfig.bankNumber) options += `<option value="Bank">${sysConfig.bankName}</option>`;
        paySelect.innerHTML = options;
    }
}

// 🔥 ADD CUSTOM CATEGORY FUNCTION
window.addCustomCategory = async function(e) {
    if(e) e.preventDefault();
    const input = document.getElementById('custom-cat-input');
    const newCat = input.value.trim();
    if(!newCat) return alert("Enter category name!");
    
    if(!sysConfig.customCategories) sysConfig.customCategories = ['Payal'];
    if(sysConfig.customCategories.includes(newCat)) return alert("Category already exists!");

    const btn = document.getElementById('add-cat-btn');
    const ogText = btn.innerHTML;
    btn.innerHTML = '...'; btn.disabled = true;

    sysConfig.customCategories.push(newCat);
    try {
        await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) });
        localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig));
        input.value = '';
        updateCategoriesUI();
        alert(`Category "${newCat}" added successfully!`);
    } catch(err) {
        alert("Error adding category.");
    } finally {
        btn.innerHTML = ogText; btn.disabled = false;
    }
}

// 🔥 DYNAMIC CATEGORIES FOR NAVBAR AND ADMIN SELECT
window.updateCategoriesUI = function() {
    // Yehi Defaults rahenge
    const defaults = ['Rings', 'Necklaces & Pendants', 'Bracelets', 'Ear-Rings', 'Watches'];
    let customCats = sysConfig.customCategories || [];

    // 1. Update Navbar
    const navContainer = document.getElementById('dynamic-nav-categories');
    if (navContainer) {
        let navHTML = '';
        defaults.forEach(c => navHTML += `<a href="#" onclick="filterByCategory('${c}')" class="block px-6 py-3 hover:bg-slate-50 hover:text-orange-600 transition-colors">${c}</a>`);
        customCats.forEach(c => navHTML += `<a href="#" onclick="filterByCategory('${c}')" class="block px-6 py-3 hover:bg-slate-50 hover:text-orange-600 transition-colors text-orange-700 font-bold">${c}</a>`);
        navHTML += `<div class="border-t border-slate-100 my-1"></div><a href="#" onclick="filterByCategory('All')" class="block px-6 py-3 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">View All Jewelry</a>`;
        navContainer.innerHTML = navHTML;
    }

    // 2. Update Admin Add Product Form Select
    const adminSelect = document.getElementById('new-p-cat');
    if (adminSelect) {
        let adminHTML = `<option value="" disabled selected>Select Category</option>`;
        defaults.forEach(c => adminHTML += `<option value="${c}">${c}</option>`);
        customCats.forEach(c => adminHTML += `<option value="${c}">${c}</option>`);
        adminSelect.innerHTML = adminHTML;
    }
};

// 🔥 ADD CUSTOM SOCIAL LINK (NAME & URL)
window.addCustomSocial = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]'); btn.innerHTML = 'Adding...'; btn.disabled = true;
    const name = document.getElementById('new-social-name').value;
    const url = document.getElementById('new-social-url').value;
    if(!sysConfig.customSocials) sysConfig.customSocials = [];
    sysConfig.customSocials.push({ id: Date.now(), name: name, url: url });
    try {
        await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) });
        localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig)); e.target.reset(); applySystemConfigToUI();
    } catch(err) { alert("Error adding link."); } finally { btn.innerHTML = 'Add Link'; btn.disabled = false; }
}

window.deleteCustomSocial = async function(id) {
    if(!confirm("Remove this link?")) return;
    sysConfig.customSocials = sysConfig.customSocials.filter(link => link.id !== id);
    try { await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) }); localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig)); applySystemConfigToUI(); } catch(err) {}
}

window.renderAdminCustomSocials = function() {
    const container = document.getElementById('admin-custom-socials-list'); if(!container) return;
    if(!sysConfig.customSocials || sysConfig.customSocials.length === 0) { container.innerHTML = `<p class="text-xs text-slate-400 font-bold text-center py-2">No extra links.</p>`; return; }
    container.innerHTML = sysConfig.customSocials.map(link => `<div class="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl shadow-sm"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-slate-50 text-slate-600 rounded flex items-center justify-center"><i class="fa-solid fa-link"></i></div><div><p class="text-xs font-bold text-slate-800">${link.name}</p><p class="text-[10px] text-slate-500 truncate w-32">${link.url}</p></div></div><button onclick="deleteCustomSocial(${link.id})" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-trash"></i></button></div>`).join('');
}

window.renderProducts = function(data) {
    const grid = document.getElementById('product-grid'); if(!grid) return;
    if(!data || data.length === 0) { grid.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-slate-500 font-bold">No items found.</p></div>`; return; }
    grid.innerHTML = data.map(p => `
        <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
            <div class="overflow-hidden rounded-xl mb-3 h-36 sm:h-44 md:h-48 bg-slate-50 relative">
                <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-2 left-2 bg-white/95 text-[8px] md:text-[9px] font-black text-slate-800 px-2 py-0.5 rounded-full shadow-sm">${p.cat}</div>
            </div>
            <div class="flex flex-col gap-0.5 mb-3 px-1"><h3 class="font-bold text-xs md:text-sm text-slate-800 line-clamp-1">${p.name}</h3><span class="text-slate-900 font-black text-sm md:text-base">Rs. ${p.price.toLocaleString()}</span></div>
            <button onclick="flyToCart(event, '${p.id}')" class="w-full bg-slate-900 text-white text-[10px] md:text-xs py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors">ADD TO BAG</button>
        </div>
    `).join('');
}

// 🔥 FILTERS (SEARCH, PRICE RANGE, SORTING)
window.applyFilters = function() { 
    let searchVal = document.getElementById('hero-search') ? document.getElementById('hero-search').value.toLowerCase() : ""; 
    let minPrice = parseFloat(document.getElementById('filter-min-price').value) || 0;
    let maxPrice = parseFloat(document.getElementById('filter-max-price').value) || Infinity;
    let sortLogic = document.getElementById('sort-logic').value;

    let filtered = [...allProducts]; 
    if (currentCategory !== "All") filtered = filtered.filter(p => p.cat === currentCategory); 
    if (searchVal) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal)); 
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);

    if (sortLogic === 'low') filtered.sort((a, b) => a.price - b.price);
    if (sortLogic === 'high') filtered.sort((a, b) => b.price - a.price);

    renderProducts(filtered); 
}

window.filterByCategory = function(cat) { currentCategory = cat; document.getElementById('current-category-label').innerText = cat === "All" ? "Showing All Jewelry" : `Category: ${cat}`; if(document.getElementById('hero-search')) document.getElementById('hero-search').value = ""; applyFilters(); document.getElementById('products').scrollIntoView(); }
window.filterItemsFromHero = function() { currentCategory = "All"; document.getElementById('current-category-label').innerText = "Search Results"; applyFilters(); }
window.reveal = function() { document.querySelectorAll(".reveal").forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight - 50) el.classList.add("active"); }); }

window.flyToCart = function(e, id) { const p = allProducts.find(x => String(x.id) === String(id)); if(p) { cart.push({...p, cartId: Date.now()}); document.querySelectorAll('.cart-count-badge').forEach(b => b.innerText = cart.length); pushNotif(`Added ${p.name}`); } }
window.openCart = function() { if(cart.length) { updateCartUI(); openModal('cart-modal'); } else { alert("Your bag is empty!"); } }

window.updateCartUI = function() {
    let sub = 0; document.getElementById('cart-items').innerHTML = cart.map(i => { sub += i.price; return `<div class="flex justify-between bg-slate-50 p-2 md:p-3 rounded-xl items-center gap-2"><div class="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0"><img src="${i.img}" class="w-full h-full object-cover"></div><div class="flex-1 min-w-0"><p class="font-bold text-[10px] md:text-xs text-slate-800 line-clamp-1">${i.name}</p><p class="text-orange-600 text-[10px] md:text-xs font-black">Rs. ${i.price.toLocaleString()}</p></div><button onclick="removeCart(${i.cartId})" class="text-slate-400 hover:text-red-500 text-sm p-1.5"><i class="fa-solid fa-trash-can"></i></button></div>`; }).join('');

    let discountPercent = Number(sysConfig.discountPercent) || 0;
    let delivery = Number(sysConfig.deliveryCharge) || 0;
    let discountAmount = Math.round(sub * (discountPercent / 100));
    let finalTotal = sub - discountAmount + delivery;

    document.getElementById('sub-total').innerText = "Rs. " + sub.toLocaleString();

    if (discountPercent > 0) { document.getElementById('discount-row').classList.remove('hidden'); document.getElementById('discount-row').classList.add('flex'); document.getElementById('discount-percent-badge').innerText = discountPercent; document.getElementById('discount-val').innerText = "- Rs. " + discountAmount.toLocaleString(); } 
    else { document.getElementById('discount-row').classList.add('hidden'); document.getElementById('discount-row').classList.remove('flex'); }

    if (delivery > 0) { document.getElementById('delivery-val').innerText = "+ Rs. " + delivery.toLocaleString(); document.getElementById('delivery-val').className = "text-slate-900"; } 
    else { document.getElementById('delivery-val').innerText = "Free"; document.getElementById('delivery-val').className = "text-green-600 font-black tracking-wide uppercase text-[10px]"; }

    document.getElementById('total-val').innerText = "Rs. " + finalTotal.toLocaleString();
    window.currentCheckoutMeta = { subtotal: sub, discountAmount, delivery, finalTotal };
}
window.removeCart = function(cid) { cart = cart.filter(i => i.cartId !== cid); updateCartUI(); document.querySelectorAll('.cart-count-badge').forEach(b => b.innerText = cart.length); if(!cart.length) closeModal('cart-modal'); }

// 🔥 DYNAMIC CHECKOUT PAYMENT TOGGLE
window.togglePaymentProof = function() {
    const methodId = document.getElementById('pay-method').value; 
    const proofContainer = document.getElementById('pay-proof-container'); 
    const detailsBox = document.getElementById('payment-details-box'); 
    const nameDisplay = document.getElementById('pay-method-name-display');
    const numDisplay = document.getElementById('pay-number-display');
    
    if(!methodId || methodId === "Cash on Delivery") { 
        proofContainer.classList.add('hidden'); proofContainer.style.maxHeight = '0px'; proofContainer.style.opacity = '0'; 
        detailsBox.classList.add('hidden'); detailsBox.style.maxHeight = '0px'; detailsBox.style.opacity = '0';
        return; 
    } 

    proofContainer.classList.remove('hidden'); detailsBox.classList.remove('hidden'); 
    setTimeout(() => { proofContainer.style.maxHeight = '200px'; proofContainer.style.opacity = '1'; detailsBox.style.maxHeight = '200px'; detailsBox.style.opacity = '1'; }, 10); 
    
    if (methodId === "Easypaisa") { nameDisplay.innerText = "Easypaisa"; numDisplay.innerText = sysConfig.payEasypaisa; }
    else if (methodId === "Jazz Cash") { nameDisplay.innerText = "Jazz Cash"; numDisplay.innerText = sysConfig.payJazzcash; }
    else if (methodId === "Bank") { nameDisplay.innerText = sysConfig.bankName; numDisplay.innerText = sysConfig.bankNumber; }
}

window.copyPaymentNumber = function() { const txt = document.getElementById('pay-number-display').innerText; navigator.clipboard.writeText(txt).then(() => { alert("Copied! ✅"); }); }

function compressImage(dataUrl) { return new Promise((resolve) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 500; let width = img.width, height = img.height; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.5)); }; img.src = dataUrl; }); }

// 🔥 SUBMIT ORDER DYNAMIC
window.submitOrder = async function() {
    const cName = document.getElementById('cust-name').value, cPhone = document.getElementById('cust-phone').value, cCity = document.getElementById('cust-city').value, cAddress = document.getElementById('cust-address').value;
    const methodId = document.getElementById('pay-method').value; if(!cName || !cPhone || !cCity || !cAddress || !methodId) { alert("Please complete shipping and payment selection."); return; }
    
    let pMethodName = "Cash on Delivery";
    if (methodId === "Easypaisa") pMethodName = "Easypaisa";
    else if (methodId === "Jazz Cash") pMethodName = "Jazz Cash";
    else if (methodId === "Bank") pMethodName = sysConfig.bankName;

    let paymentProofBase64 = null;
    if (methodId !== "Cash on Delivery") { 
        const fileInput = document.getElementById('pay-proof-img'); 
        if (fileInput.files.length === 0) { alert("Please upload payment screenshot."); return; } 
        paymentProofBase64 = await new Promise((resolve) => { const r = new FileReader(); r.onload = (e) => resolve(e.target.result); r.readAsDataURL(fileInput.files[0]); }); 
        paymentProofBase64 = await compressImage(paymentProofBase64); 
    }
    
    const btn = document.getElementById('confirm-order-btn'); btn.disabled = true; btn.innerText = 'Processing...';
    const orderId = 'LX-' + Math.floor(10000 + Math.random() * 89999);
    
    const order = { 
        id: orderId, customer: cName, phone: cPhone, city: cCity, address: cAddress, subtotal: window.currentCheckoutMeta.subtotal, discount: window.currentCheckoutMeta.discountAmount, delivery: window.currentCheckoutMeta.delivery, total: "Rs. " + window.currentCheckoutMeta.finalTotal.toLocaleString(), 
        items: [...cart], date: new Date().toLocaleString(), status: "Unpaid", paymentMethod: pMethodName, paymentProof: paymentProofBase64 
    };
    
    try { await fetch(`${CLOUDFLARE_API_URL}/orders`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(order) }); loadCloudflareData(); cart = []; document.querySelectorAll('.cart-count-badge').forEach(b => b.innerText = "0"); closeModal('cart-modal'); alert(`Order Confirmed!`); } catch (e) { alert("Network Error."); } finally { btn.innerText = 'CONFIRM ORDER'; btn.disabled = false; }
}

window.generateReceiptImageAndDownload = function(order) {
    document.getElementById('receipt-metadata').innerHTML = `<strong>ID:</strong> #${order.id}<br><strong>DATE:</strong> ${order.date}<br><strong>CLIENT:</strong> ${order.customer}<br><strong>PHONE:</strong> ${order.phone}<br><strong>LOC:</strong> ${order.address}, ${order.city}`;
    document.getElementById('receipt-items-list').innerHTML = order.items.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>- ${i.name}</span><span style="font-weight:bold;">Rs. ${i.price.toLocaleString()}</span></div>`).join('');
    
    let summaryHtml = '';
    if (order.subtotal !== undefined) {
        summaryHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px;"><span>Subtotal:</span><span style="font-weight:bold;">Rs. ${order.subtotal.toLocaleString()}</span></div>`;
        if (order.discount > 0) summaryHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px; color:#16a34a;"><span>Discount:</span><span style="font-weight:bold;">- Rs. ${order.discount.toLocaleString()}</span></div>`;
        summaryHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px;"><span>Delivery:</span><span style="font-weight:bold;">${order.delivery > 0 ? 'Rs. ' + order.delivery.toLocaleString() : 'Free'}</span></div>`;
    }
    document.getElementById('receipt-summary-breakdown').innerHTML = summaryHtml;

    document.getElementById('receipt-sum').innerText = order.total;
    const paidBadge = document.getElementById('receipt-paid-status');
    if (order.status === 'Paid') { paidBadge.style.display = 'inline-block'; } else { paidBadge.style.display = 'none'; }
    setTimeout(() => { html2canvas(document.getElementById('receipt-area'), { scale: 2, useCORS: true }).then(canvas => { const link = document.createElement('a'); link.download = `Receipt-${order.id}.png`; link.href = canvas.toDataURL('image/png'); link.click(); paidBadge.style.display = 'none'; }); }, 150);
}

window.submitContactForm = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('contact-f-btn');
    const ogText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'SENDING... <i class="fa-solid fa-spinner fa-spin ml-2"></i>';
    
    const name = document.getElementById('contact-f-name').value;
    const email = document.getElementById('contact-f-email').value;
    const message = document.getElementById('contact-f-msg').value;

    try {
        const res = await fetch(`${CLOUDFLARE_API_URL}/contact-msg`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message }) });
        const data = await res.json();
        if (res.ok) { alert("Message Sent! 💎 We have forwarded it directly to the admin."); document.getElementById('public-contact-form').reset(); } 
        else { alert("Failed to send message: " + data.error); }
    } catch (err) { alert("Network Error. Cannot reach server."); } 
    finally { btn.disabled = false; btn.innerHTML = ogText; }
}

window.pushNotif = function(msg) { notifs.unshift({ msg }); updateNotifUI(); }
window.updateNotifUI = function() { const feed = document.getElementById('notif-feed'); if(notifs.length === 0) { feed.innerHTML = `<p class="text-slate-400 text-sm italic text-center py-10">No alerts...</p>`; return; } document.getElementById('notif-dot').style.display = 'block'; feed.innerHTML = notifs.map(n => `<div class="bg-slate-50 p-3 rounded-xl border shadow-sm text-xs font-bold text-slate-700">${n.msg}</div>`).join(''); }
window.toggleNotif = function() { document.getElementById('notif-sidebar').classList.toggle('open'); document.getElementById('notif-dot').style.display = 'none'; }
window.toggleMobileMenu = function() { const menu = document.getElementById('mobile-menu'); menu.classList.toggle('hidden'); menu.classList.toggle('flex'); }

window.checkAdminAccess = function() { 
    const mm = document.getElementById('mobile-menu'); if (mm && mm.classList.contains('flex')) { toggleMobileMenu(); } 
    if (sessionStorage.getItem('admin_session_token')) { loadCloudflareOrdersSecure(); document.getElementById('admin-os').classList.remove('hidden'); document.getElementById('admin-os').classList.add('flex'); document.getElementById('main-site-content').style.display = 'none'; document.querySelector('nav').style.display = 'none'; switchSidebarTab('details'); return; }
    document.getElementById('otp-request-form').classList.remove('hidden'); document.getElementById('otp-verify-form').classList.add('hidden'); openModal('admin-lock'); 
}

window.requestAdminOTP = async function(e) {
    e.preventDefault(); const emailInput = document.getElementById('admin-email-input').value; const btn = document.getElementById('btn-req-otp'); btn.disabled = true; btn.innerText = 'Sending PIN...';
    try { const res = await fetch(`${CLOUDFLARE_API_URL}/send-otp`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: emailInput }) }); const data = await res.json();
        if (res.ok) { document.getElementById('otp-request-form').classList.add('hidden'); document.getElementById('otp-verify-form').classList.remove('hidden'); alert(`OTP successfully sent to the configured System Email! Please check the inbox.`); } else { alert(`❌ Access Denied: ${data.error}`); }
    } catch (e) { alert("Server connection failed."); } finally { btn.disabled = false; btn.innerText = 'SEND OTP'; }
}

window.verifyAdminOTP = async function(e) {
    e.preventDefault(); const otpInput = document.getElementById('admin-otp-input').value; const btn = document.getElementById('btn-ver-otp'); btn.disabled = true; btn.innerText = 'Verifying...';
    try { const res = await fetch(`${CLOUDFLARE_API_URL}/verify-otp`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ otp: otpInput }) }); const data = await res.json();
        if (res.ok && data.token) { sessionStorage.setItem('admin_session_token', data.token); closeModal('admin-lock'); document.getElementById('admin-os').classList.remove('hidden'); document.getElementById('admin-os').classList.add('flex'); document.getElementById('main-site-content').style.display = 'none'; document.querySelector('nav').style.display = 'none'; document.getElementById('admin-otp-input').value = ''; loadCloudflareOrdersSecure(); switchSidebarTab('details'); } else { alert(`❌ Invalid Code: ${data.error}`); }
    } catch (e) { alert("Verification request failed."); } finally { btn.disabled = false; btn.innerText = 'VERIFY & LOGIN'; }
}

window.logoutAdmin = function() { sessionStorage.removeItem('admin_session_token'); location.reload(); }
window.toggleAdminSidebar = function() { document.getElementById('admin-sidebar-container').classList.toggle('-translate-x-full'); }

window.switchSidebarTab = function(tabId) {
    document.querySelectorAll('.admin-view').forEach(view => { view.classList.add('hidden'); view.classList.remove('flex'); });
    const activeView = document.getElementById('view-' + tabId);
    if(activeView) { activeView.classList.remove('hidden'); if(tabId==='details' || tabId==='receipts' || tabId==='inventory' || tabId==='pricing' || tabId==='mail' || tabId==='social' || tabId==='payment' || tabId==='addprod') activeView.classList.add('flex'); }
    document.querySelectorAll('.sidebar-tab').forEach(btn => btn.classList.remove('bg-white/5', 'text-white', 'border-l-4', 'border-orange-500'));
    const activeBtn = document.getElementById('btn-tab-' + tabId); if(activeBtn) activeBtn.classList.add('bg-white/5', 'text-white', 'border-l-4', 'border-orange-500');
    if(window.innerWidth < 1024) { document.getElementById('admin-sidebar-container').classList.add('-translate-x-full'); }
}

window.saveSystemConfig = async function(e, section) {
    e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); const txt = btn.innerHTML; btn.innerHTML = 'Saving...'; btn.disabled = true;
    
    if (section === 'profile') { sysConfig.siteName = document.getElementById('conf-site-name').value; }
    else if (section === 'mail') { sysConfig.receiverEmail = document.getElementById('conf-sys-email').value; }
    else if (section === 'pricing') { sysConfig.deliveryCharge = Number(document.getElementById('conf-delivery').value) || 0; sysConfig.discountPercent = Number(document.getElementById('conf-discount').value) || 0; }
    else if (section === 'contact') { sysConfig.contactPhone = document.getElementById('conf-contact-phone').value; sysConfig.contactEmail = document.getElementById('conf-contact-email').value; sysConfig.contactAddress = document.getElementById('conf-contact-address').value; }
    else if (section === 'social') { sysConfig.socialFacebook = document.getElementById('conf-social-fb').value; sysConfig.socialInstagram = document.getElementById('conf-social-ig').value; sysConfig.socialWhatsapp = document.getElementById('conf-social-wa').value; sysConfig.socialTiktok = document.getElementById('conf-social-tt').value; sysConfig.socialYoutube = document.getElementById('conf-social-yt').value; }
    else if (section === 'payment') { 
        sysConfig.payEasypaisa = document.getElementById('conf-pay-ep').value; 
        sysConfig.payJazzcash = document.getElementById('conf-pay-jc').value; 
        sysConfig.bankName = document.getElementById('conf-bank-name').value; 
        sysConfig.bankNumber = document.getElementById('conf-bank-number').value; 
    }
    else if (section === 'offer') {
        sysConfig.offerBadge = document.getElementById('conf-offer-badge').value; sysConfig.offerTitle = document.getElementById('conf-offer-title').value; sysConfig.offerDesc = document.getElementById('conf-offer-desc').value;
        const fileInput = document.getElementById('conf-offer-img');
        if (fileInput.files.length > 0) {
            sysConfig.offerImg = await new Promise((resolve) => {
                const r = new FileReader(); r.onload = (ev) => { 
                    const img = new Image(); img.onload = () => { 
                        const MAX_WIDTH = 1600; let width = img.width; let height = img.height;
                        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
                        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); 
                        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); 
                        resolve(canvas.toDataURL('image/jpeg', 0.9)); 
                    }; img.src = ev.target.result; 
                }; r.readAsDataURL(fileInput.files[0]); 
            });
        }
    }
    
    try { await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(sysConfig) }); localStorage.setItem('luxe_sysConfig', JSON.stringify(sysConfig)); applySystemConfigToUI(); alert("Updated Successfully! ✅"); } 
    catch(err) { alert("Error saving configurations."); } 
    finally { btn.innerHTML = txt; btn.disabled = false; }
}

window.updateDetailsView = function() {
    const target = document.getElementById('details-log'); if(!target) return;
    if(orders.length === 0) { target.innerHTML = `<p class="text-slate-400 text-[10px] md:text-xs font-bold text-center py-6">No records.</p>`; return; }
    target.innerHTML = orders.map(o => `
        <div class="bg-slate-50 p-4 rounded-2xl border text-xs space-y-2">
            <div class="flex justify-between items-start flex-wrap gap-2">
                <div><span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ID: ${o.id}</span>
                    <h4 class="font-black text-sm text-slate-900 mt-2">Client: ${o.customer}</h4>
                    <p class="text-slate-500 font-bold"><i class="fa-solid fa-phone"></i> ${o.phone} | City: ${o.city}</p>
                    <p class="text-slate-400">Addr: ${o.address}</p>
                    <p class="text-slate-600 font-bold mt-1">Payment: ${o.paymentMethod || 'COD'}</p>
                </div>
                <div class="text-right"><p class="text-slate-400 font-medium">${o.date.split(',')[0]}</p>
                    ${o.status === 'Paid' ? `<span class="text-green-600 font-black bg-green-100 px-2 py-0.5 rounded-md inline-block mt-2">✔ PAID</span>` : `<button onclick="markOrderPaid('${o.id}')" class="bg-green-600 text-white font-black px-3 py-1 rounded-lg mt-2 shadow-sm">Mark Paid</button>`}
                </div>
            </div>
            <div class="border-t pt-2 flex gap-1.5 md:gap-2 justify-end">
                ${o.paymentProof ? `<button onclick="downloadPaymentProof('${o.id}')" class="bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-lg"><i class="fa-solid fa-image"></i> Proof</button>` : ''}
                <button onclick="downloadCustomerDetailsImage('${o.id}')" class="bg-slate-900 text-white font-bold px-2 py-1.5 rounded-lg"><i class="fa-solid fa-image"></i> Details</button>
                <button onclick="removeCustomerRecord('${o.id}')" class="text-rose-600 bg-white border px-2 py-1.5 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>
    `).join('');
}

window.updateReceiptsView = function() {
    const target = document.getElementById('receipts-log'); if(!target) return;
    if(orders.length === 0) { target.innerHTML = `<p class="text-slate-400 text-[10px] md:text-xs font-bold text-center py-6">No records.</p>`; return; }
    target.innerHTML = orders.map(o => `
        <div class="bg-slate-50 p-4 rounded-2xl border text-xs flex justify-between items-center flex-wrap gap-4">
            <div><span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">ID: ${o.id}</span>
                <span class="${o.status==='Paid'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded-full font-bold ml-1">${o.status==='Paid'?'PAID DONE':'UNPAID'}</span>
                <h4 class="font-bold text-slate-800 mt-1.5">Rec: ${o.customer}</h4><p class="text-slate-500 font-black">Tot: ${o.total}</p>
            </div><button onclick="downloadCustomerReceipt('${o.id}')" class="bg-purple-600 text-white px-3 py-1.5 rounded-xl font-bold"><i class="fa-solid fa-download"></i> Slip</button>
        </div>
    `).join('');
}

window.markOrderPaid = async function(id) { const idx = orders.findIndex(x => String(x.id) === String(id)); if(idx !== -1) { orders[idx].status = "Paid"; updateDetailsView(); updateReceiptsView(); try { await fetch(`${CLOUDFLARE_API_URL}/orders/${id}`, { method: 'DELETE', headers: getSecureHeaders() }); await fetch(`${CLOUDFLARE_API_URL}/orders`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(orders[idx]) }); } catch(e) {} } }
window.downloadCustomerReceipt = function(id) { const match = orders.find(x => String(x.id) === String(id)); if(match) { generateReceiptImageAndDownload(match); } }
window.downloadPaymentProof = function(id) { const o = orders.find(x => String(x.id) === String(id)); if(o && o.paymentProof) { const link = document.createElement('a'); link.href = o.paymentProof; link.download = `Proof-${o.id}.jpg`; link.click(); } }
window.removeCustomerRecord = async function(id) { if(confirm("Remove permanently?")) { orders = orders.filter(x => String(x.id) !== String(id)); updateDetailsView(); updateReceiptsView(); await fetch(`${CLOUDFLARE_API_URL}/orders/${id}`, { method: 'DELETE', headers: getSecureHeaders() }); } }
window.searchDetails = function() { const val = document.getElementById('search-details-n').value.toLowerCase(); updateDetailsView(orders.filter(o => o.phone.includes(val) || o.customer.toLowerCase().includes(val) || o.id.toLowerCase().includes(val))); }
window.searchReceipts = function() { const val = document.getElementById('search-receipts-id').value.toLowerCase(); updateReceiptsView(orders.filter(o => o.id.toLowerCase().includes(val))); }

window.downloadCustomerDetailsImage = function(id) {
    const o = orders.find(x => String(x.id) === String(id)); if(!o) return; let pricingBreakdown = '';
    if(o.subtotal !== undefined) { pricingBreakdown = `<p><strong>Subtotal:</strong> Rs. ${o.subtotal.toLocaleString()}</p>${o.discount > 0 ? `<p style="color:#16a34a;"><strong>Discount:</strong> - Rs. ${o.discount.toLocaleString()}</p>` : ''}<p><strong>Delivery:</strong> ${o.delivery > 0 ? 'Rs. ' + o.delivery.toLocaleString() : 'Free'}</p>`; }
    document.getElementById('details-export-content').innerHTML = `<p><strong>ID:</strong> ${o.id}</p><p><strong>Client:</strong> ${o.customer}</p><p><strong>Phone:</strong> ${o.phone}</p><p><strong>City:</strong> ${o.city}</p><p><strong>Address:</strong> ${o.address}</p><div style="margin:10px 0; border-top:1px dashed #cbd5e1; padding-top:10px;">${pricingBreakdown}</div><p style="font-size:18px; margin-top:10px;"><strong>Total:</strong> ${o.total}</p>`;
    setTimeout(() => { html2canvas(document.getElementById('details-export-area'), { scale: 2 }).then(canvas => { const link = document.createElement('a'); link.download = `Client-${o.id}.png`; link.href = canvas.toDataURL(); link.click(); }); }, 150);
}

// 🔥 ADD PRODUCT LOGIC 
window.addNewProduct = async function(e) { 
    e.preventDefault(); const btn = document.getElementById('add-btn-submit'); btn.disabled = true; const originalText = btn.innerHTML; btn.innerHTML = 'Publishing...';
    
    let finalCategory = document.getElementById('new-p-cat').value;
    if (!finalCategory) { alert("Please select a category!"); btn.disabled = false; btn.innerHTML = originalText; return; }

    const file = document.getElementById('new-p-img-file').files[0]; 
    if (!file) { alert("Please select an image first!"); btn.disabled = false; btn.innerHTML = originalText; return; }
    const reader = new FileReader(); 
    reader.onload = function(event) { 
        const img = new Image(); 
        img.onload = async function() { 
            try {
                const MAX_WIDTH = 800; let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
                const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); 
                ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); 
                const newProduct = { id: Date.now().toString(), name: document.getElementById('new-p-name').value, price: parseInt(document.getElementById('new-p-price').value), cat: finalCategory, img: canvas.toDataURL('image/jpeg', 0.8) }; 
                await fetch(`${CLOUDFLARE_API_URL}/products`, { method: 'POST', headers: getSecureHeaders(), body: JSON.stringify(newProduct) }); 
                loadCloudflareData(); document.getElementById('add-product-form').reset(); alert("Published Successfully! 💎 You can add another one now."); 
            } catch (err) { alert("Error publishing product."); } finally { btn.disabled = false; btn.innerHTML = originalText; }
        }; img.src = event.target.result; 
    }; reader.readAsDataURL(file); 
}

window.deleteProduct = async function(id) { if(confirm("Delete item?")) { await fetch(`${CLOUDFLARE_API_URL}/products/${id}`, { method: 'DELETE', headers: getSecureHeaders() }); loadCloudflareData(); } }
window.renderAdminProducts = function() { const log = document.getElementById('admin-product-log'); if(!log) return; log.innerHTML = allProducts.map(p => `<div class="bg-slate-50 p-2 md:p-3 rounded-xl flex justify-between items-center border text-[10px] md:text-xs font-bold"><div class="flex items-center gap-2 md:gap-3"><img src="${p.img}" class="w-8 h-8 md:w-10 md:h-10 object-cover rounded"><div><h4>${p.name}</h4><span class="text-orange-600">Rs. ${p.price}</span></div></div><button onclick="deleteProduct('${p.id}')" class="text-red-500 p-2"><i class="fa-solid fa-trash"></i></button></div>`).join(''); }

window.openModal = function(id) { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; document.body.style.overflow = 'auto'; }
