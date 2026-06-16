/**
 * زاد الملوك - المنطق البرمجي الأساسي للتطبيق
 * Vanilla JS Component-based structure with state management,
 * LocalStorage persistence, premium dark-mode skeleton screens,
 * advanced product variant selectors, unified drawer operations,
 * local search engine, form validations, and WhatsApp order routing.
 */

// ==========================================================================
// 1. State Management & Initial Configurations
// ==========================================================================
const AppState = {
    cart: [],
    customer: {
        name: "",
        phone: "",
        area: "",
        address: "",
        floor: "",
        notes: ""
    },
    activeCategory: ""
};

// Key configurations
const CART_STORAGE_KEY = "zad_menu_cart";
const CUSTOMER_STORAGE_KEY = "zad_menu_customer";

// Featured/Most Ordered items IDs (selected manually from data.js)
const FEATURED_ITEM_IDS = ["m15", "t13", "tr2"]; // وجبة الملوك، طاجن زاد الملوك، صنية الملوك

// Localized helper to select elements
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ==========================================================================
// 2. Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    loadSavedData();
    initAppStyles();
    simulateLoadingState();
    setupEventListeners();
});

// Load cart and customer from localStorage
function loadSavedData() {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
            AppState.cart = JSON.parse(storedCart);
        }
    } catch (e) {
        console.error("Error loading cart from storage", e);
    }

    try {
        const storedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY);
        if (storedCustomer) {
            AppState.customer = JSON.parse(storedCustomer);
            populateCheckoutForm();
        }
    } catch (e) {
        console.error("Error loading customer details from storage", e);
    }
}

// Populate checkout inputs with stored data
function populateCheckoutForm() {
    if ($("#customer-name")) $("#customer-name").value = AppState.customer.name || "";
    if ($("#customer-phone")) $("#customer-phone").value = AppState.customer.phone || "";
    if ($("#customer-area")) $("#customer-area").value = AppState.customer.area || "";
    if ($("#customer-address")) $("#customer-address").value = AppState.customer.address || "";
    if ($("#customer-floor")) $("#customer-floor").value = AppState.customer.floor || "";
    if ($("#order-notes")) $("#order-notes").value = AppState.customer.notes || "";
}

// Save customer details from form inputs
function saveCustomerDetails() {
    AppState.customer = {
        name: $("#customer-name").value.trim(),
        phone: $("#customer-phone").value.trim(),
        area: $("#customer-area").value.trim(),
        address: $("#customer-address").value.trim(),
        floor: $("#customer-floor").value.trim(),
        notes: $("#order-notes").value.trim()
    };
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(AppState.customer));
}

// Save cart to storage and update UI elements
function saveCartState() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(AppState.cart));
    updateCartUI();
}

// Pre-setup smooth scroll behavior adjustments
function initAppStyles() {
    document.documentElement.style.scrollBehavior = "smooth";
}

// Premium simulation loading screen to impress user with skeletons
function simulateLoadingState() {
    const skeletons = $("#loading-skeletons");
    const categoriesNav = $("#category-nav");
    const menuFeed = $("#menu-feed");
    const featuredSection = $("#featured-section");

    // Show Skeletons and hide content first
    skeletons.classList.remove("hidden");
    categoriesNav.classList.add("hidden");
    menuFeed.classList.add("hidden");
    featuredSection.classList.add("hidden");

    setTimeout(() => {
        skeletons.classList.add("hidden");
        categoriesNav.classList.remove("hidden");
        menuFeed.classList.remove("hidden");
        featuredSection.classList.remove("hidden");

        // Render UI
        renderCategoryNav();
        renderFeaturedSection();
        renderMenuFeed();
        updateCartUI();
        initCategoryScrollObserver();
    }, 850);
}

// ==========================================================================
// 3. UI Rendering Engine
// ==========================================================================

// Render horizontal category navigation bar
function renderCategoryNav() {
    const container = $("#category-container");
    if (!container) return;

    let html = "";
    MENU_DATA.categories.forEach((cat, index) => {
        const isActive = index === 0 ? "active" : "";
        if (index === 0) AppState.activeCategory = cat.id;
        html += `
            <button class="category-btn ${isActive}" data-category-id="${cat.id}" id="btn-nav-${cat.id}">
                ${cat.name}
            </button>
        `;
    });
    container.innerHTML = html;
}

// Render "Most Ordered" / Featured items section
function renderFeaturedSection() {
    const grid = $("#featured-grid");
    if (!grid) return;

    let html = "";
    // Loop categories to find targeted featured items
    MENU_DATA.categories.forEach(cat => {
        cat.items.forEach(item => {
            if (FEATURED_ITEM_IDS.includes(item.id)) {
                html += renderProductCard(item, cat.id);
            }
        });
    });

    grid.innerHTML = html;
}

// Render entire menu categorized list feed
function renderMenuFeed() {
    const feed = $("#menu-feed");
    if (!feed) return;

    let html = "";
    MENU_DATA.categories.forEach(cat => {
        const noteHtml = cat.note
            ? `<div class="category-note"><span class="category-note-icon">✦</span><span>${cat.note}</span></div>`
            : "";
        html += `
            <section id="${cat.id}" class="menu-section">
                <h2 class="section-title">${cat.name}</h2>
                ${noteHtml}
                <div class="product-grid">
                    ${cat.items.map(item => renderProductCard(item, cat.id)).join("")}
                </div>
            </section>
        `;
    });
    feed.innerHTML = html;
}

// Helper: HTML Template structure for a single Product Card
function renderProductCard(item, categoryId) {
    const hasVariants = !!item.variants;
    let initialPrice = item.price;
    let variantsDropdownHtml = "";
    let itemInCart = null;

    if (hasVariants) {
        // Find if any variant of this item is already in cart
        const firstVariant = item.variants[0];
        initialPrice = firstVariant.price;

        // Find if the first variant (or any variant) is currently in the cart
        itemInCart = AppState.cart.find(c => c.id === item.id);

        variantsDropdownHtml = `
            <div class="variant-chips" data-item-id="${item.id}">
                ${item.variants.map((v, i) => `
                    <button class="variant-chip ${i === 0 ? 'active' : ''}" 
                        data-item-id="${item.id}" 
                        data-variant-id="${v.id}" 
                        data-price="${v.price}">
                        ${v.name}
                    </button>
                `).join("")}
            </div>
        `;
    } else {
        // Check if basic item is in cart
        itemInCart = AppState.cart.find(c => c.id === item.id && !c.variantId);
    }

    const description = item.description ? `<p class="product-desc">${item.description}</p>` : "";

    // Controls UI selector depending on item in-cart state
    let actionControlsHtml = "";
    if (itemInCart && !hasVariants) {
        actionControlsHtml = `
            <div class="qty-controls" data-card-item-id="${item.id}">
                <button class="qty-btn btn-qty-minus" aria-label="تقليل الكمية">
                    <svg class="icon"><use href="#icon-minus"></use></svg>
                </button>
                <span class="qty-val">${itemInCart.quantity}</span>
                <button class="qty-btn btn-qty-plus" aria-label="زيادة الكمية">
                    <svg class="icon"><use href="#icon-plus"></use></svg>
                </button>
            </div>
        `;
    } else {
        actionControlsHtml = `
            <button class="btn quick-add-btn btn-add-to-cart" data-item-id="${item.id}" data-category-id="${categoryId}">
                <svg class="icon"><use href="#icon-plus"></use></svg>
                <span>إضافة</span>
            </button>
        `;
    }

    return `
        <div class="product-card" id="card-${item.id}" data-id="${item.id}" data-category="${categoryId}">
            <div class="product-info-wrapper">
                <div class="product-header-row">
                    <h3 class="product-title">${item.name}</h3>
                    <span class="product-price" id="price-display-${item.id}">${initialPrice} ج.م</span>
                </div>
                ${description}
            </div>
            <div class="product-action-row">
                ${variantsDropdownHtml}
                <div class="action-btn-container" id="actions-container-${item.id}">
                    ${actionControlsHtml}
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// 4. Cart Logic & Interactions
// ==========================================================================

// Handle adding an item to the cart
function addToCart(itemId, selectedVariantId = null) {
    const itemData = findItemInMenu(itemId);
    if (!itemData) return;

    let cartUniqueKey = itemId;
    let price = itemData.price;
    let variantName = "";

    if (itemData.variants) {
        // Must select variant
        const variantId = selectedVariantId || itemData.variants[0].id;
        const variant = itemData.variants.find(v => v.id === variantId);
        cartUniqueKey = `${itemId}-${variantId}`;
        price = variant.price;
        variantName = variant.name;
    }

    // Check if variant/item combination is already in cart
    const existingIndex = AppState.cart.findIndex(c => c.cartKey === cartUniqueKey);

    if (existingIndex > -1) {
        AppState.cart[existingIndex].quantity += 1;
    } else {
        AppState.cart.push({
            cartKey: cartUniqueKey,
            id: itemId,
            variantId: selectedVariantId,
            name: itemData.name,
            variantName: variantName,
            price: price,
            quantity: 1
        });
    }

    saveCartState();
    showToast(`تم إضافة ${itemData.name} ${variantName ? `(${variantName})` : ''} للسلة`);

    // Sync Card controls to quantities if it's a basic item
    if (!itemData.variants) {
        updateCardControls(itemId);
    }
}

// Update single product card UI action buttons (switch between "Add" and Qty Controls)
function updateCardControls(itemId) {
    const itemData = findItemInMenu(itemId);
    if (!itemData || itemData.variants) return; // Variants handle quantity state inside the cart drawer

    const container = $(`#actions-container-${itemId}`);
    if (!container) return;

    const itemInCart = AppState.cart.find(c => c.id === itemId);

    if (itemInCart) {
        container.innerHTML = `
            <div class="qty-controls" data-card-item-id="${itemId}">
                <button class="qty-btn btn-qty-minus" aria-label="تقليل الكمية">
                    <svg class="icon"><use href="#icon-minus"></use></svg>
                </button>
                <span class="qty-val">${itemInCart.quantity}</span>
                <button class="qty-btn btn-qty-plus" aria-label="زيادة الكمية">
                    <svg class="icon"><use href="#icon-plus"></use></svg>
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <button class="btn quick-add-btn btn-add-to-cart" data-item-id="${itemId}">
                <svg class="icon"><use href="#icon-plus"></use></svg>
                <span>إضافة</span>
            </button>
        `;
    }
}

// Modify cart quantities (+ / - / delete)
function updateItemQuantity(cartKey, delta) {
    const index = AppState.cart.findIndex(c => c.cartKey === cartKey);
    if (index === -1) return;

    const item = AppState.cart[index];
    item.quantity += delta;

    if (item.quantity <= 0) {
        AppState.cart.splice(index, 1);
        showToast(`تم إزالة ${item.name} من السلة`);
    }

    saveCartState();

    // Synchronize feed card controls
    if (!item.variantId) {
        updateCardControls(item.id);
    }
}

// Remove item entirely from cart
function removeFromCart(cartKey) {
    const index = AppState.cart.findIndex(c => c.cartKey === cartKey);
    if (index === -1) return;

    const item = AppState.cart[index];
    AppState.cart.splice(index, 1);
    saveCartState();
    showToast(`تم إزالة ${item.name} من السلة`);

    if (!item.variantId) {
        updateCardControls(item.id);
    }
}

// Calculate totals and synchronize elements across pages
function updateCartUI() {
    const cartCount = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update floating cart state
    const floatingCart = $("#floating-cart");
    const countBadge = $("#cart-count");
    const totalBadge = $("#cart-total-badge");

    if (cartCount > 0) {
        floatingCart.classList.remove("hidden");
        countBadge.textContent = cartCount;
        totalBadge.textContent = `${cartSubtotal} ج.م`;
    } else {
        floatingCart.classList.add("hidden");
    }

    // Update Cart Drawer values
    $("#cart-subtotal").textContent = `${cartSubtotal} ج.م`;
    $("#checkout-total").textContent = `${cartSubtotal} ج.م`;

    renderCartItemsDrawer();
}

// Render lists inside Cart bottom sheet
function renderCartItemsDrawer() {
    const container = $("#cart-items-container");
    const emptyView = $("#cart-empty-view");
    const footer = $("#cart-summary-footer");

    if (AppState.cart.length === 0) {
        container.innerHTML = "";
        emptyView.classList.remove("hidden");
        footer.classList.add("hidden");
        return;
    }

    emptyView.classList.add("hidden");
    footer.classList.remove("hidden");

    let html = `<div class="cart-items-list">`;
    AppState.cart.forEach(item => {
        const variantDisplay = item.variantName ? `<span class="cart-item-variant">حجم: ${item.variantName}</span>` : "";
        html += `
            <div class="cart-item" data-cart-key="${item.cartKey}">
                <div class="cart-item-details">
                    <p class="cart-item-title">${item.name}</p>
                    ${variantDisplay}
                    <p class="cart-item-price">${item.price * item.quantity} ج.م</p>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-controls">
                        <button class="qty-btn btn-drawer-qty-minus" data-cart-key="${item.cartKey}">
                            <svg class="icon"><use href="#icon-minus"></use></svg>
                        </button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn btn-drawer-qty-plus" data-cart-key="${item.cartKey}">
                            <svg class="icon"><use href="#icon-plus"></use></svg>
                        </button>
                    </div>
                    <button class="btn-remove btn-drawer-remove" data-cart-key="${item.cartKey}" aria-label="حذف من السلة">
                        <svg class="icon"><use href="#icon-trash"></use></svg>
                    </button>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

// Find item data structures in original menu array
function findItemInMenu(itemId) {
    for (let cat of MENU_DATA.categories) {
        const item = cat.items.find(i => i.id === itemId);
        if (item) return item;
    }
    return null;
}

// Clear all elements and reset
function resetCart() {
    AppState.cart = [];
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartUI();

    // Reset all product card quick adds in UI
    MENU_DATA.categories.forEach(cat => {
        cat.items.forEach(item => {
            updateCardControls(item.id);
        });
    });
}

// ==========================================================================
// 5. Drawer Transitions (Cart / Checkout Toggle)
// ==========================================================================
function openCartDrawer() {
    $("#cart-drawer-overlay").classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scroll
    toggleCartPages("items");
}

function closeCartDrawer() {
    $("#cart-drawer-overlay").classList.add("hidden");
    document.body.style.overflow = "";
}

function toggleCartPages(page) {
    const itemsPage = $("#cart-items-page");
    const checkoutPage = $("#checkout-page");

    if (page === "checkout") {
        itemsPage.classList.add("hidden");
        checkoutPage.classList.remove("hidden");
    } else {
        itemsPage.classList.remove("hidden");
        checkoutPage.classList.add("hidden");
    }
}

// ==========================================================================
// 6. Form Validations
// ==========================================================================
function validateCheckoutForm() {
    let isValid = true;

    const nameInput = $("#customer-name");
    const phoneInput = $("#customer-phone");
    const areaInput = $("#customer-area");
    const addressInput = $("#customer-address");

    // Clear previous invalid visual indicators
    $$(".form-group").forEach(el => el.classList.remove("invalid"));

    if (!nameInput.value.trim()) {
        nameInput.closest(".form-group").classList.add("invalid");
        isValid = false;
    }

    // Regular Expression Egyptian Mobile format (e.g. 010, 011, 012, 015 + 8 numbers)
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(phoneInput.value.trim())) {
        phoneInput.closest(".form-group").classList.add("invalid");
        isValid = false;
    }

    if (!areaInput.value.trim()) {
        areaInput.closest(".form-group").classList.add("invalid");
        isValid = false;
    }

    if (!addressInput.value.trim()) {
        addressInput.closest(".form-group").classList.add("invalid");
        isValid = false;
    }

    return isValid;
}

// ==========================================================================
// 7. Search Engine (Client-side Instant Filter)
// ==========================================================================
function handleSearch(query) {
    const cleanQuery = query.trim().toLowerCase();
    const sections = $$(".menu-section");
    const featuredSection = $("#featured-section");
    let hasMatches = false;

    if (!cleanQuery) {
        // If query is empty, show everything and restore titles
        sections.forEach(sec => {
            sec.classList.remove("hidden");
            sec.querySelectorAll(".product-card").forEach(card => card.classList.remove("hidden"));
        });
        featuredSection.classList.remove("hidden");
        $("#empty-state").classList.add("hidden");
        return;
    }

    // Hide featured section on search for simplified results
    featuredSection.classList.add("hidden");

    sections.forEach(sec => {
        let matchedInSection = 0;
        const cards = sec.querySelectorAll(".product-card");

        cards.forEach(card => {
            const itemId = card.getAttribute("data-id");
            const item = findItemInMenu(itemId);

            if (item) {
                const title = item.name.toLowerCase();
                const desc = (item.description || "").toLowerCase();

                if (title.includes(cleanQuery) || desc.includes(cleanQuery)) {
                    card.classList.remove("hidden");
                    matchedInSection++;
                    hasMatches = true;
                } else {
                    card.classList.add("hidden");
                }
            }
        });

        // Hide entire category header if no products matched
        if (matchedInSection > 0) {
            sec.classList.remove("hidden");
        } else {
            sec.classList.add("hidden");
        }
    });

    // Toggle Empty State view
    if (hasMatches) {
        $("#empty-state").classList.add("hidden");
    } else {
        $("#empty-state").classList.remove("hidden");
    }
}

// ==========================================================================
// 8. WhatsApp Message Compiler & Dispatcher
// ==========================================================================
function openWhatsAppSelectionModal() {
    $("#whatsapp-modal-overlay").classList.remove("hidden");
}

function closeWhatsAppSelectionModal() {
    $("#whatsapp-modal-overlay").classList.add("hidden");
}

function sendOrderToWhatsApp(targetPhone) {
    if (AppState.cart.length === 0) return;

    // 1. Gather form details
    const name = $("#customer-name").value.trim();
    const phone = $("#customer-phone").value.trim();
    const area = $("#customer-area").value.trim();
    const address = $("#customer-address").value.trim();
    const floor = $("#customer-floor").value.trim();
    const notes = $("#order-notes").value.trim();

    // 2. Format cart items list
    let itemsListText = "";
    AppState.cart.forEach(item => {
        const variantText = item.variantName ? ` [حجم: ${item.variantName}]` : "";
        itemsListText += `\u25AA\uFE0F ${item.quantity}x ${item.name}${variantText} - ${item.price * item.quantity} ج.م\n`;
    });

    const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 3. Construct premium order summary message
    let divider = "----------------------------------\n";
    let message = `\u{1F451} طلب جديد - زاد الملوك \u{1F451}\n`;
    message += divider;
    message += `\u{1F464} الاسم: ${name}\n`;
    message += `\u{1F4F1} رقم الهاتف: ${phone}\n`;
    message += `\u{1F4CD} المنطقة: ${area}\n`;
    message += `\u{1F3E0} العنوان: ${address}\n`;
    if (floor) {
        message += `\u{1F3E2} الدور/الشقة: ${floor}\n`;
    }
    if (notes) {
        message += `\u{1F4DD} ملاحظات: ${notes}\n`;
    }
    message += divider;
    message += `تفاصيل الطلب:\n${itemsListText}`;
    message += divider;
    message += `\u{1F4B0} إجمالي الحساب: ${subtotal} ج.م\n\n`;
    message += `شكراً لاختياركم زاد الملوك!`;

    // 4. Encode text
    const encodedText = encodeURIComponent(message);

    // Normalize Egyptian phone number by removing leading zero if present
    let cleanPhone = targetPhone.trim();
    if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1);
    }
    const whatsappUrl = `https://api.whatsapp.com/send?phone=20${cleanPhone}&text=${encodedText}`;

    // 5. Open WhatsApp Redirect Link
    window.open(whatsappUrl, "_blank");

    // 6. Reset systems and close flows
    closeWhatsAppSelectionModal();
    closeCartDrawer();
    resetCart();
    showToast("تم إرسال الطلب بنجاح! سيتم تحويلك للواتساب");
}

// ==========================================================================
// 9. Toast Notification Generator
// ==========================================================================
function showToast(message) {
    const container = $("#toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    // Automatically remove toast from DOM after animations finish (3 seconds)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ==========================================================================
// 10. Sticky Scroll Observer (High Premium Visual Feedback)
// ==========================================================================
function initCategoryScrollObserver() {
    const sections = $$(".menu-section");
    const navButtons = $$(".category-btn");

    window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY + 100;

        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;

            if (scrollPosition >= top && scrollPosition < top + height) {
                currentSectionId = sec.getAttribute("id");
            }
        });

        if (currentSectionId && AppState.activeCategory !== currentSectionId) {
            AppState.activeCategory = currentSectionId;

            navButtons.forEach(btn => {
                btn.classList.remove("active");
                if (btn.getAttribute("data-category-id") === currentSectionId) {
                    btn.classList.add("active");
                    // Scroll active pill into view inside sticky nav header
                    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                }
            });
        }

        // Back to top visibility check
        const backToTop = $("#back-to-top");
        if (window.scrollY > 300) {
            backToTop.classList.add("visible");
        } else {
            backToTop.classList.remove("visible");
        }
    });
}

// ==========================================================================
// 11. Event Handlers Configuration (Event Delegation & Native Binds)
// ==========================================================================
function setupEventListeners() {

    // Category scroll triggers
    document.addEventListener("click", (e) => {
        const catBtn = e.target.closest(".category-btn");
        if (catBtn) {
            const catId = catBtn.getAttribute("data-category-id");
            const targetSection = $(`#${catId}`);
            if (targetSection) {
                // Scroll main category section header smoothly into viewport
                window.scrollTo({
                    top: targetSection.offsetTop - 60,
                    behavior: "smooth"
                });
            }
        }
    });

    // Product cards clicks (Variant chips, Add to cart, Qty counters)
    document.addEventListener("click", (e) => {

        // 0. Variant chip selection
        const chip = e.target.closest(".variant-chip");
        if (chip) {
            const itemId = chip.getAttribute("data-item-id");
            const price = chip.getAttribute("data-price");

            // Deactivate siblings, activate clicked
            const allChips = document.querySelectorAll(`.variant-chip[data-item-id="${itemId}"]`);
            allChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            // Update card price display
            const priceDisplay = $(`#price-display-${itemId}`);
            if (priceDisplay) {
                priceDisplay.textContent = `${price} ج.م`;
            }
            return; // stop here, don't proceed to add-to-cart
        }

        // 1. Add to cart button
        const addBtn = e.target.closest(".btn-add-to-cart");
        if (addBtn) {
            const itemId = addBtn.getAttribute("data-item-id");
            const card = addBtn.closest(".product-card");

            let selectedVariantId = null;
            if (card) {
                // Read the active chip for variant selection
                const activeChip = card.querySelector(".variant-chip.active");
                if (activeChip) {
                    selectedVariantId = activeChip.getAttribute("data-variant-id");
                }
            }
            addToCart(itemId, selectedVariantId);
            return;
        }

        // 2. Incremental counter inside feed cards
        const qtyCard = e.target.closest(".qty-controls");
        if (qtyCard && !qtyCard.closest("#cart-drawer")) {
            const itemId = qtyCard.getAttribute("data-card-item-id");
            const cartKey = itemId; // Basic items unique key matches id

            if (e.target.closest(".btn-qty-plus")) {
                updateItemQuantity(cartKey, 1);
                updateCardControls(itemId);
            } else if (e.target.closest(".btn-qty-minus")) {
                updateItemQuantity(cartKey, -1);
                updateCardControls(itemId);
            }
            return;
        }

        // 3. Incremental counter inside Drawer
        const qtyDrawerMinus = e.target.closest(".btn-drawer-qty-minus");
        if (qtyDrawerMinus) {
            const cartKey = qtyDrawerMinus.getAttribute("data-cart-key");
            updateItemQuantity(cartKey, -1);
            return;
        }

        const qtyDrawerPlus = e.target.closest(".btn-drawer-qty-plus");
        if (qtyDrawerPlus) {
            const cartKey = qtyDrawerPlus.getAttribute("data-cart-key");
            updateItemQuantity(cartKey, 1);
            return;
        }

        // 4. Remove button inside Drawer
        const removeDrawerBtn = e.target.closest(".btn-drawer-remove");
        if (removeDrawerBtn) {
            const cartKey = removeDrawerBtn.getAttribute("data-cart-key");
            removeFromCart(cartKey);
            return;
        }
    });


    // Dynamic Client-side Menu search filter keys
    const searchInput = $("#menu-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            handleSearch(e.target.value);
        });
    }

    const clearSearchBtn = $("#clear-search-btn");
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
                handleSearch("");
            }
        });
    }

    // Drawer toggles
    const cartFab = $("#cart-fab");
    if (cartFab) cartFab.addEventListener("click", openCartDrawer);

    const closeCartBtn = $("#close-cart-btn");
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartDrawer);

    const startShoppingBtn = $("#start-shopping-btn");
    if (startShoppingBtn) startShoppingBtn.addEventListener("click", closeCartDrawer);

    const overlay = $("#cart-drawer-overlay");
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeCartDrawer();
        });
    }

    // Proceed to checkout
    const checkoutBtn = $("#proceed-to-checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            toggleCartPages("checkout");
        });
    }

    const backToItemsBtn = $("#back-to-items-btn");
    if (backToItemsBtn) {
        backToItemsBtn.addEventListener("click", () => {
            toggleCartPages("items");
        });
    }

    // Checkout Form Submit
    const form = $("#checkout-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (validateCheckoutForm()) {
                saveCustomerDetails();
                openWhatsAppSelectionModal();
            } else {
                showToast("يرجى ملء جميع الحقول المطلوبة بشكل صحيح");
            }
        });
    }

    // WhatsApp options selection modal
    const whatsappModal = $("#whatsapp-modal-overlay");
    if (whatsappModal) {
        whatsappModal.addEventListener("click", (e) => {
            if (e.target === whatsappModal) closeWhatsAppSelectionModal();
        });
    }

    const closeWhatsappModalBtn = $("#close-whatsapp-modal-btn");
    if (closeWhatsappModalBtn) {
        closeWhatsappModalBtn.addEventListener("click", closeWhatsAppSelectionModal);
    }

    const whatsappOptions = $$(".btn-whatsapp-option");
    whatsappOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            const targetPhone = opt.getAttribute("data-phone");
            sendOrderToWhatsApp(targetPhone);
        });
    });

    // Back to top scroll actions
    const backToTopBtn = $("#back-to-top");
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
}
