/**
 * FloraLux — Main Application Logic
 * Full functionality: Catalog, Filters, Search, Cart, Modals, Animations, Toast
 */

document.addEventListener('DOMContentLoaded', () => {
    // ─── State Management ───────────────────────────────────────────────
    let currentCategory = 'all';
    let currentSort = 'default';
    let searchQuery = '';
    let cart = [];

    // Load cart from localStorage
    try {
        const savedCart = localStorage.getItem('floralux_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
        cart = [];
    }

    // Check and migrate legacy localStorage data if from old version
    const storageVer = localStorage.getItem('floralux_version');
    if (storageVer !== 'kz_2.0') {
        try {
            localStorage.removeItem('floralux_cart');
            localStorage.removeItem('floralux_reviews');
            localStorage.setItem('floralux_version', 'kz_2.0');
        } catch(e) {}
        cart = [];
    }

    // ─── Helpers ────────────────────────────────────────────────────────
    function formatPrice(num) {
        if (typeof num !== 'number') num = Number(num) || 0;
        return num.toLocaleString('ru-RU') + ' ' + (SHOP_CONFIG.currency || '₸');
    }

    function getProductById(id) {
        return PRODUCTS.find(p => p.id === Number(id));
    }

    function getStarsHtml(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = (rating - fullStars) >= 0.5;
        let html = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                html += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalf) {
                html += '<i class="fas fa-star-half-alt"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }
        return html;
    }

    function getBadgeClass(badge) {
        if (!badge) return '';
        const b = badge.toLowerCase();
        if (b.includes('хит')) return 'badge-hit';
        if (b.includes('нов')) return 'badge-new';
        if (b.includes('скид')) return 'badge-sale';
        if (b.includes('премиум')) return 'badge-premium';
        if (b.includes('попул')) return 'badge-popular';
        return 'badge-hit';
    }

    // ─── Preloader ──────────────────────────────────────────────────────
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600);
        }, 800);
    }

    // ─── Populate Shop Config ───────────────────────────────────────────
    function initShopConfig() {
        // Phones
        const headerPhone = document.getElementById('headerPhone');
        const headerPhoneText = document.getElementById('headerPhoneText');
        if (headerPhone) headerPhone.href = `tel:${SHOP_CONFIG.phoneRaw}`;
        if (headerPhoneText) headerPhoneText.textContent = SHOP_CONFIG.phone;

        const heroCallBtn = document.getElementById('heroCallBtn');
        if (heroCallBtn) heroCallBtn.href = `tel:${SHOP_CONFIG.phoneRaw}`;

        const contactPhone = document.getElementById('contactPhone');
        if (contactPhone) {
            contactPhone.href = `tel:${SHOP_CONFIG.phoneRaw}`;
            contactPhone.textContent = SHOP_CONFIG.phone;
        }

        const footerPhone = document.getElementById('footerPhone');
        if (footerPhone) {
            footerPhone.href = `tel:${SHOP_CONFIG.phoneRaw}`;
            footerPhone.textContent = SHOP_CONFIG.phone;
        }

        // Email & Address & Hours
        const contactEmail = document.getElementById('contactEmail');
        if (contactEmail) {
            contactEmail.href = `mailto:${SHOP_CONFIG.email}`;
            contactEmail.textContent = SHOP_CONFIG.email;
        }
        const footerEmail = document.getElementById('footerEmail');
        if (footerEmail) {
            footerEmail.href = `mailto:${SHOP_CONFIG.email}`;
            footerEmail.textContent = SHOP_CONFIG.email;
        }

        const contactAddress = document.getElementById('contactAddress');
        if (contactAddress) contactAddress.textContent = SHOP_CONFIG.address;

        const footerAddress = document.getElementById('footerAddress');
        if (footerAddress) footerAddress.textContent = SHOP_CONFIG.address;

        const contactHours = document.getElementById('contactHours');
        if (contactHours) contactHours.textContent = SHOP_CONFIG.workingHours;

        const footerHours = document.getElementById('footerHours');
        if (footerHours) footerHours.textContent = SHOP_CONFIG.workingHours;

        // Delivery info block
        const deliveryInfoText = document.getElementById('deliveryInfoText');
        if (deliveryInfoText) {
            deliveryInfoText.textContent = `Доставка по Городу — ${formatPrice(SHOP_CONFIG.deliveryCost)}. Бесплатно при заказе от ${formatPrice(SHOP_CONFIG.freeDeliveryFrom)}. Минимальный заказ — ${formatPrice(SHOP_CONFIG.minOrder)}.`;
        }

        // Social Links
        const waUrl = `https://wa.me/${SHOP_CONFIG.whatsapp}`;
        const tgUrl = `https://t.me/${SHOP_CONFIG.telegram}`;
        const igUrl = `https://instagram.com/${SHOP_CONFIG.instagram}`;

        const socialWhatsapp = document.getElementById('socialWhatsapp');
        if (socialWhatsapp) socialWhatsapp.href = waUrl;

        const socialTelegram = document.getElementById('socialTelegram');
        if (socialTelegram) socialTelegram.href = tgUrl;

        const socialInstagram = document.getElementById('socialInstagram');
        if (socialInstagram) socialInstagram.href = igUrl;

        const ctaWhatsapp = document.getElementById('ctaWhatsapp');
        if (ctaWhatsapp) ctaWhatsapp.href = waUrl;

        const ctaTelegram = document.getElementById('ctaTelegram');
        if (ctaTelegram) ctaTelegram.href = tgUrl;

        const floatingWhatsapp = document.getElementById('floatingWhatsapp');
        if (floatingWhatsapp) floatingWhatsapp.href = waUrl;

        document.querySelectorAll('.footer-socials [data-social]').forEach(el => {
            const type = el.getAttribute('data-social');
            if (type === 'whatsapp') el.href = waUrl;
            if (type === 'telegram') el.href = tgUrl;
            if (type === 'instagram') el.href = igUrl;
        });

        // Footer Year
        const footerYear = document.getElementById('footerYear');
        if (footerYear) footerYear.textContent = new Date().getFullYear();

        // Footer Categories
        const footerCategories = document.getElementById('footerCategories');
        if (footerCategories && typeof CATEGORIES !== 'undefined') {
            footerCategories.innerHTML = CATEGORIES.filter(c => c.id !== 'all').map(c => `
                <li><a href="#catalog" data-cat-link="${c.id}">${c.name}</a></li>
            `).join('');

            footerCategories.querySelectorAll('[data-cat-link]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const catId = link.getAttribute('data-cat-link');
                    selectCategory(catId);
                    const catalogSec = document.getElementById('catalog');
                    if (catalogSec) {
                        const top = catalogSec.getBoundingClientRect().top + window.pageYOffset - 80;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                });
            });
        }
    }

    // ─── Hero Particles ─────────────────────────────────────────────────
    function createHeroParticles() {
        const container = document.getElementById('heroParticles');
        if (!container) return;
        const flowers = ['🌸', '🌺', '🌹', '🌷', '🌼', '💐', '✨', '🍃'];
        const count = 18;
        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const span = document.createElement('span');
            span.className = 'particle';
            span.textContent = flowers[Math.floor(Math.random() * flowers.length)];
            const left = Math.random() * 100;
            const bottom = Math.random() * 80;
            const duration = 12 + Math.random() * 18;
            const delay = Math.random() * 8;
            const size = 0.9 + Math.random() * 1.3;

            span.style.left = `${left}%`;
            span.style.bottom = `${bottom}%`;
            span.style.fontSize = `${size}rem`;
            span.style.setProperty('--dur', `${duration}s`);
            span.style.setProperty('--delay', `${delay}s`);
            container.appendChild(span);
        }
    }

    // ─── Toast Notifications ────────────────────────────────────────────
    function showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.setProperty('--duration', `${duration / 1000}s`);

        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-circle-exclamation';
        if (type === 'info') icon = 'fa-circle-info';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Закрыть">&times;</button>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        let removeTimeout;

        function remove() {
            clearTimeout(removeTimeout);
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }

        closeBtn.addEventListener('click', remove);
        removeTimeout = setTimeout(remove, duration);
    }

    // ─── Catalog Rendering ──────────────────────────────────────────────
    const productsGrid = document.getElementById('productsGrid');
    const catalogCategory = document.getElementById('catalogCategory');
    const catalogSort = document.getElementById('catalogSort');
    const catalogEmpty = document.getElementById('catalogEmpty');

    function renderFilters() {
        if (!catalogCategory || typeof CATEGORIES === 'undefined') return;

        catalogCategory.innerHTML = CATEGORIES.map(c => {
            const count = (typeof PRODUCTS !== 'undefined') ? (
                c.id === 'all'
                    ? PRODUCTS.length
                    : PRODUCTS.filter(p => p.category === c.id).length
            ) : 0;
            const isSelected = c.id === currentCategory ? 'selected' : '';
            return `<option value="${c.id}" ${isSelected}>${c.icon} ${c.name} (${count})</option>`;
        }).join('');
    }

    if (catalogCategory) {
        catalogCategory.addEventListener('change', (e) => {
            selectCategory(e.target.value);
        });
    }

    function selectCategory(catId) {
        currentCategory = catId;
        if (catalogCategory && catalogCategory.value !== catId) {
            catalogCategory.value = catId;
        }
        renderProducts();
    }

    function renderProducts() {
        if (!productsGrid || typeof PRODUCTS === 'undefined') return;

        let filtered = PRODUCTS.filter(p => {
            const matchesCat = (currentCategory === 'all' || p.category === currentCategory);
            const matchesSearch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });

        // Sorting
        if (currentSort === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        } else if (currentSort === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        }

        if (filtered.length === 0) {
            productsGrid.style.display = 'none';
            if (catalogEmpty) catalogEmpty.style.display = 'block';
            return;
        }

        productsGrid.style.display = 'grid';
        if (catalogEmpty) catalogEmpty.style.display = 'none';

        productsGrid.innerHTML = filtered.map(p => {
            const badgeClass = getBadgeClass(p.badge);
            const badgeHtml = p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : '';
            const oldPriceHtml = p.oldPrice ? `<span class="price-old">${formatPrice(p.oldPrice)}</span>` : '';
            const starsHtml = getStarsHtml(p.rating);

            return `
                <div class="product-card" data-id="${p.id}">
                    <div class="product-image">
                        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.parentElement.classList.add('no-image');">
                        ${badgeHtml}
                        <button class="product-quick-view" data-quickview="${p.id}" aria-label="Быстрый просмотр" title="Быстрый просмотр">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${p.name}</h3>
                        <div class="product-rating">
                            ${starsHtml} <span>(${p.rating})</span>
                        </div>
                        <div class="product-price">
                            <span class="price-current">${formatPrice(p.price)}</span>
                            ${oldPriceHtml}
                        </div>
                        <p class="product-desc">${p.description}</p>
                        <button class="btn btn-primary btn-block add-to-cart-btn" data-add="${p.id}">
                            <i class="fas fa-cart-plus"></i> В корзину
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach event listeners to product cards
        productsGrid.querySelectorAll('[data-add]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.getAttribute('data-add'));
                addToCart(id, 1);
            });
        });

        productsGrid.querySelectorAll('[data-quickview]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.getAttribute('data-quickview'));
                openQuickView(id);
            });
        });
    }

    if (catalogSort) {
        catalogSort.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    // ─── Reviews & Cross-Device Sync ──────────────────────────────────
    let reviewsList = [];

    // Load initial reviews from LocalStorage or data.js
    try {
        const savedReviews = localStorage.getItem('floralux_reviews');
        if (savedReviews) {
            reviewsList = JSON.parse(savedReviews);
        } else if (typeof REVIEWS !== 'undefined') {
            reviewsList = [...REVIEWS];
        }
    } catch (e) {
        reviewsList = typeof REVIEWS !== 'undefined' ? [...REVIEWS] : [];
    }

    // Cloud Database (Google Firebase Firestore)
    // Synchronizes reviews across all devices and phones in real-time
    let firestoreDb = null;
    if (typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.enabled && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY') {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            firestoreDb = firebase.firestore();

            // Real-time synchronization listener
            firestoreDb.collection('reviews').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
                const cloudReviews = [];
                snapshot.forEach(doc => {
                    cloudReviews.push({ id: doc.id, ...doc.data() });
                });
                if (cloudReviews.length > 0) {
                    reviewsList = cloudReviews;
                    try {
                        localStorage.setItem('floralux_reviews', JSON.stringify(reviewsList));
                    } catch (err) {}
                    renderReviews();
                }
            }, (error) => {
                console.warn('Firebase Firestore sync info:', error.message);
            });
        } catch (e) {
            console.warn('Firebase init:', e.message);
        }
    }

    function renderReviews() {
        const grid = document.getElementById('reviewsGrid');
        if (!grid) return;

        if (!reviewsList || reviewsList.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-light);">
                    <i class="fas fa-comment-dots" style="font-size: 2.5rem; margin-bottom: 14px; display: block; color: var(--border);"></i>
                    <p>Пока нет отзывов. Будьте первым, кто оставит отзыв!</p>
                </div>`;
            return;
        }

        grid.innerHTML = reviewsList.map((r, i) => {
            const stars = getStarsHtml(r.rating || 5);
            const authorName = r.name || 'Покупатель';
            const parts = authorName.trim().split(/\s+/);
            const initials = parts.map(p => p[0]).slice(0, 2).join('').toUpperCase() || '🌸';
            const cityPart = r.city ? `${r.city} · ` : '';
            const date = r.date || 'Недавно';

            // Escape HTML to prevent XSS
            const safeText = r.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeName = authorName.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // New reviews get a highlight animation
            const isNew = (Date.now() - (r.createdAt || 0)) < 10000;
            const newClass = isNew ? ' review-card--new' : '';

            return `
                <div class="review-card${newClass}" data-animate="fade-up" data-delay="${Math.min(i * 80, 400)}">
                    <div class="review-stars">${stars}</div>
                    <p class="review-text">&laquo;${safeText}&raquo;</p>
                    <div class="review-author">
                        <div class="review-avatar">${initials}</div>
                        <div>
                            <strong>${safeName}</strong>
                            <span>${cityPart}${date}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Trigger animation on newly rendered cards
        grid.querySelectorAll('[data-animate]').forEach(el => {
            el.classList.add('animated');
        });
    }

    // Leave review modal & star picker
    const leaveReviewBtn = document.getElementById('leaveReviewBtn');
    const reviewModal = document.getElementById('reviewModal');
    const reviewForm = document.getElementById('reviewForm');
    const starRatingSelect = document.getElementById('starRatingSelect');
    const reviewRatingInput = document.getElementById('reviewRating');

    if (leaveReviewBtn) {
        leaveReviewBtn.addEventListener('click', () => {
            openModal(reviewModal);
        });
    }

    // Star rating picker interactivity
    if (starRatingSelect) {
        const starBtns = starRatingSelect.querySelectorAll('.star-btn');

        function updateStars(val, isHover = false) {
            starBtns.forEach(btn => {
                const r = Number(btn.getAttribute('data-rating'));
                if (isHover) {
                    btn.classList.toggle('hover', r <= val);
                } else {
                    btn.classList.toggle('active', r <= val);
                }
            });
        }

        starBtns.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                const val = Number(btn.getAttribute('data-rating'));
                updateStars(val, true);
            });

            btn.addEventListener('click', () => {
                const val = Number(btn.getAttribute('data-rating'));
                if (reviewRatingInput) reviewRatingInput.value = val;
                updateStars(val, false);
            });
        });

        starRatingSelect.addEventListener('mouseleave', () => {
            starBtns.forEach(b => b.classList.remove('hover'));
            const currentVal = reviewRatingInput ? Number(reviewRatingInput.value) : 5;
            updateStars(currentVal, false);
        });
    }

    // Submit new review
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('reviewName').value.trim();
            const cityVal = document.getElementById('reviewCity').value.trim();
            const city = cityVal || 'Алматы';
            const text = document.getElementById('reviewText').value.trim();
            const rating = reviewRatingInput ? Number(reviewRatingInput.value) : 5;

            if (!name || !text) {
                showToast('Пожалуйста, заполните имя и текст отзыва', 'error');
                return;
            }
            if (name.length < 2) {
                showToast('Имя слишком короткое', 'error');
                return;
            }
            if (text.length < 10) {
                showToast('Напишите чуть подробнее — минимум 10 символов', 'error');
                return;
            }

            const today = new Date();
            const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
            const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

            const newReview = {
                id: 'r_' + Date.now(),
                name,
                city,
                rating,
                text,
                date: formattedDate,
                createdAt: Date.now()
            };

            // 1. Add to local list and re-render immediately
            reviewsList.unshift(newReview);
            try {
                localStorage.setItem('floralux_reviews', JSON.stringify(reviewsList));
            } catch (err) {}
            renderReviews();

            // 2. Close modal & reset form
            closeModal(reviewModal);
            reviewForm.reset();
            if (reviewRatingInput) reviewRatingInput.value = 5;
            if (starRatingSelect) {
                starRatingSelect.querySelectorAll('.star-btn').forEach((b, idx) => {
                    b.classList.toggle('active', idx < 5);
                    b.classList.remove('hover');
                });
            }

            showToast('Спасибо за отзыв! Он уже на странице 🌸', 'success');

            // 3. Try server API (background, non-blocking)
            try {
                await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newReview)
                });
            } catch (apiErr) {
                // no server — that's ok, already saved locally
            }

            // 4. Try Firebase (background, non-blocking)
            if (firestoreDb) {
                try {
                    await firestoreDb.collection('reviews').add({
                        ...newReview,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (cloudErr) {
                    console.warn('Firebase review save:', cloudErr);
                }
            }
        });
    }

    // ─── Cart Logic ─────────────────────────────────────────────────────
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartToggle = document.getElementById('cartToggle');
    const cartClose = document.getElementById('cartClose');
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const cartDeliveryNote = document.getElementById('cartDeliveryNote');
    const cartClear = document.getElementById('cartClear');
    const cartEmptyBtn = document.getElementById('cartEmptyBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    function saveCart() {
        try {
            localStorage.setItem('floralux_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
        updateCartUI();
    }

    function addToCart(productId, qty = 1) {
        const product = getProductById(productId);
        if (!product) return;

        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({ id: productId, quantity: qty });
        }

        saveCart();

        // Animate badge
        if (cartCount) {
            cartCount.classList.remove('bump');
            void cartCount.offsetWidth; // Trigger reflow
            cartCount.classList.add('bump');
        }

        showToast(`«${product.name}» добавлен в корзину!`, 'success');
    }

    function updateCartQuantity(productId, delta) {
        const item = cart.find(i => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        saveCart();
    }

    function removeFromCart(productId) {
        const product = getProductById(productId);
        cart = cart.filter(i => i.id !== productId);
        saveCart();
        if (product) {
            showToast(`«${product.name}» удалён из корзины`, 'info');
        }
    }

    function clearCart() {
        if (cart.length === 0) return;
        cart = [];
        saveCart();
        showToast('Корзина очищена', 'info');
    }

    function getCartTotal() {
        return cart.reduce((sum, item) => {
            const product = getProductById(item.id);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    function getCartCount() {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }

    function updateCartUI() {
        const totalCount = getCartCount();
        const totalPrice = getCartTotal();

        if (cartCount) cartCount.textContent = totalCount;

        if (cart.length === 0) {
            if (cartEmpty) cartEmpty.style.display = 'block';
            if (cartItems) cartItems.innerHTML = '';
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        }

        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'block';

        if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);

        // Delivery Note
        if (cartDeliveryNote) {
            const freeFrom = SHOP_CONFIG.freeDeliveryFrom || 5000;
            const diff = freeFrom - totalPrice;
            if (diff <= 0) {
                cartDeliveryNote.classList.remove('warn');
                cartDeliveryNote.innerHTML = '<i class="fas fa-gift"></i> Поздравляем! Доставка для вас <strong>бесплатная</strong>!';
            } else {
                cartDeliveryNote.classList.add('warn');
                cartDeliveryNote.innerHTML = `До бесплатной доставки не хватает <strong>${formatPrice(diff)}</strong>`;
            }
        }

        // Render Cart Items
        if (cartItems) {
            cartItems.innerHTML = cart.map(item => {
                const product = getProductById(item.id);
                if (!product) return '';

                return `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-img">
                            <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none';">
                        </div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${product.name}</div>
                            <div class="cart-item-price">${formatPrice(product.price)}</div>
                            <div class="cart-item-controls">
                                <button class="qty-btn" data-minus="${item.id}" aria-label="Уменьшить">−</button>
                                <span class="cart-item-qty">${item.quantity}</span>
                                <button class="qty-btn" data-plus="${item.id}" aria-label="Увеличить">+</button>
                                <button class="cart-item-remove" data-remove="${item.id}" aria-label="Удалить">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Controls listeners
            cartItems.querySelectorAll('[data-minus]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.getAttribute('data-minus'));
                    updateCartQuantity(id, -1);
                });
            });

            cartItems.querySelectorAll('[data-plus]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.getAttribute('data-plus'));
                    updateCartQuantity(id, 1);
                });
            });

            cartItems.querySelectorAll('[data-remove]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.getAttribute('data-remove'));
                    removeFromCart(id);
                });
            });
        }
    }

    function openCart() {
        if (cartSidebar) cartSidebar.classList.add('active');
        if (cartOverlay) cartOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    function closeCart() {
        if (cartSidebar) cartSidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    if (cartToggle) cartToggle.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (cartClear) cartClear.addEventListener('click', clearCart);

    if (cartEmptyBtn) {
        cartEmptyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeCart();
            const cat = document.getElementById('catalog');
            if (cat) {
                const top = cat.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    }

    // ─── Quick View Modal ───────────────────────────────────────────────
    const quickViewModal = document.getElementById('quickViewModal');
    const quickViewContent = document.getElementById('quickViewContent');

    function openQuickView(productId) {
        const product = getProductById(productId);
        if (!product || !quickViewContent || !quickViewModal) return;

        let qvQty = 1;
        const stars = getStarsHtml(product.rating);
        const oldPriceHtml = product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : '';

        quickViewContent.innerHTML = `
            <div class="quick-view-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none';">
            </div>
            <div class="quick-view-info">
                <h2>${product.name}</h2>
                <div class="product-rating">
                    ${stars} <span>(${product.rating})</span>
                </div>
                <div class="product-price">
                    <span class="price-current">${formatPrice(product.price)}</span>
                    ${oldPriceHtml}
                </div>
                <p class="quick-view-desc">${product.description}</p>
                <div class="quick-view-qty">
                    <span>Количество:</span>
                    <button class="qty-btn" id="qvMinus" aria-label="Меньше">−</button>
                    <span class="cart-item-qty" id="qvQtyDisplay">${qvQty}</span>
                    <button class="qty-btn" id="qvPlus" aria-label="Больше">+</button>
                </div>
                <button class="btn btn-primary btn-lg btn-block" id="qvAddToCart">
                    <i class="fas fa-cart-plus"></i> Добавить в корзину
                </button>
            </div>
        `;

        const qvMinus = document.getElementById('qvMinus');
        const qvPlus = document.getElementById('qvPlus');
        const qvDisplay = document.getElementById('qvQtyDisplay');
        const qvAddBtn = document.getElementById('qvAddToCart');

        if (qvMinus && qvPlus && qvDisplay) {
            qvMinus.addEventListener('click', () => {
                if (qvQty > 1) {
                    qvQty--;
                    qvDisplay.textContent = qvQty;
                }
            });
            qvPlus.addEventListener('click', () => {
                qvQty++;
                qvDisplay.textContent = qvQty;
            });
        }

        if (qvAddBtn) {
            qvAddBtn.addEventListener('click', () => {
                addToCart(product.id, qvQty);
                closeModal(quickViewModal);
            });
        }

        openModal(quickViewModal);
    }

    // ─── Order Modal & Checkout ─────────────────────────────────────────
    const orderModal = document.getElementById('orderModal');
    const orderForm = document.getElementById('orderForm');
    const orderSummary = document.getElementById('orderSummary');
    const orderDate = document.getElementById('orderDate');
    const successModal = document.getElementById('successModal');
    const successOrderId = document.getElementById('successOrderId');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const total = getCartTotal();
            const minOrder = SHOP_CONFIG.minOrder || 1500;

            if (total < minOrder) {
                showToast(`Минимальная сумма заказа: ${formatPrice(minOrder)}`, 'error');
                return;
            }

            closeCart();
            openOrderModal();
        });
    }

    function openOrderModal() {
        if (!orderModal) return;

        // Set min date to today
        if (orderDate) {
            const today = new Date().toISOString().split('T')[0];
            orderDate.min = today;
            if (!orderDate.value) orderDate.value = today;
        }

        // Render Order Summary
        if (orderSummary) {
            const subtotal = getCartTotal();
            const isFreeDelivery = subtotal >= (SHOP_CONFIG.freeDeliveryFrom || 5000);
            const deliveryCost = isFreeDelivery ? 0 : (SHOP_CONFIG.deliveryCost || 500);
            const grandTotal = subtotal + deliveryCost;

            let itemsHtml = cart.map(item => {
                const product = getProductById(item.id);
                if (!product) return '';
                return `
                    <div class="order-summary-item">
                        <span>${product.name} × ${item.quantity}</span>
                        <span>${formatPrice(product.price * item.quantity)}</span>
                    </div>
                `;
            }).join('');

            orderSummary.innerHTML = `
                <h4>Ваш заказ:</h4>
                ${itemsHtml}
                <div class="order-summary-item">
                    <span>Сумма товаров:</span>
                    <span>${formatPrice(subtotal)}</span>
                </div>
                <div class="order-summary-item">
                    <span>Доставка:</span>
                    <span>${isFreeDelivery ? 'Бесплатно' : formatPrice(deliveryCost)}</span>
                </div>
                <div class="order-summary-item total">
                    <span>К оплате:</span>
                    <span>${formatPrice(grandTotal)}</span>
                </div>
            `;
        }

        openModal(orderModal);
    }

    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('orderName').value.trim();
            const phone = document.getElementById('orderPhone').value.trim();

            if (!name || !phone) {
                showToast('Пожалуйста, заполните обязательные поля', 'error');
                return;
            }

            const subtotal = getCartTotal();
            const isFreeDelivery = subtotal >= (SHOP_CONFIG.freeDeliveryFrom || 5000);
            const deliveryCost = isFreeDelivery ? 0 : (SHOP_CONFIG.deliveryCost || 500);
            const grandTotal = subtotal + deliveryCost;

            // Generate order number
            let orderNum = 'FL-' + Math.floor(100000 + Math.random() * 900000);

            const orderData = {
                customer_name: name,
                customer_phone: phone,
                customer_email: document.getElementById('orderEmail') ? document.getElementById('orderEmail').value.trim() : '',
                delivery_address: document.getElementById('orderAddress') ? document.getElementById('orderAddress').value.trim() : '',
                delivery_date: document.getElementById('orderDate') ? document.getElementById('orderDate').value : '',
                delivery_time: document.getElementById('orderTime') ? document.getElementById('orderTime').value : '',
                payment_method: document.querySelector('input[name="payment"]:checked') ? document.querySelector('input[name="payment"]:checked').value : 'card',
                note: document.getElementById('orderNote') ? document.getElementById('orderNote').value.trim() : '',
                is_anonymous: document.getElementById('orderAnonymous') ? document.getElementById('orderAnonymous').checked : false,
                items: cart.map(item => {
                    const p = getProductById(item.id);
                    return {
                        id: item.id,
                        name: p ? p.name : 'Букет',
                        price: p ? p.price : 0,
                        quantity: item.quantity
                    };
                }),
                total_amount: grandTotal,
                delivery_cost: deliveryCost
            };

            // Post to SQLite backend if running on server
            if (window.location.protocol.startsWith('http')) {
                try {
                    const res = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });
                    const data = await res.json();
                    if (data && data.orderId) {
                        orderNum = data.orderId;
                    }
                } catch (err) {
                    console.warn('Order server sync error:', err);
                }
            }

            closeModal(orderModal);
            orderForm.reset();

            // Clear cart
            cart = [];
            saveCart();

            // Show success modal
            if (successOrderId) {
                successOrderId.textContent = `Номер вашего заказа: #${orderNum}`;
            }
            if (successModal) {
                openModal(successModal);
            }

            showToast(`Заказ #${orderNum} успешно оформлен!`, 'success');
        });
    }

    // ─── Modal Helpers ──────────────────────────────────────────────────
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        // Only remove no-scroll if no other modal or cart is active
        const anyModalActive = document.querySelector('.modal-overlay.active');
        const cartActive = cartSidebar && cartSidebar.classList.contains('active');
        if (!anyModalActive && !cartActive) {
            document.body.classList.remove('no-scroll');
        }
    }

    // Close buttons handler
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-close');
            const targetModal = document.getElementById(targetId);
            if (targetModal) closeModal(targetModal);
        });
    });

    // Close modal on background overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // Escape key closes modals and cart
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m));
            closeCart();
            closeSearch();
        }
    });

    // ─── Search Bar ─────────────────────────────────────────────────────
    const searchToggle = document.getElementById('searchToggle');
    const searchBar = document.getElementById('searchBar');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');

    function openSearch() {
        if (searchBar) {
            searchBar.classList.add('active');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 200);
            }
        }
    }

    function closeSearch() {
        if (searchBar) {
            searchBar.classList.remove('active');
            if (searchInput) {
                searchInput.value = '';
                searchQuery = '';
                renderProducts();
            }
        }
    }

    if (searchToggle) {
        searchToggle.addEventListener('click', () => {
            if (searchBar && searchBar.classList.contains('active')) {
                closeSearch();
            } else {
                openSearch();
            }
        });
    }

    if (searchClose) searchClose.addEventListener('click', closeSearch);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderProducts();

            // Auto-scroll to catalog if user is searching
            if (searchQuery.length >= 2) {
                const cat = document.getElementById('catalog');
                if (cat) {
                    const rect = cat.getBoundingClientRect();
                    if (rect.top > window.innerHeight || rect.bottom < 0) {
                        const top = rect.top + window.pageYOffset - 80;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                }
            }
        });
    }

    // ─── Contact Form ───────────────────────────────────────────────────
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('cfName').value.trim();
            showToast(`Спасибо, ${name}! Мы свяжемся с вами в течение 15 минут.`, 'success');
            contactForm.reset();
        });
    }

    // ─── Header & Navigation & Scroll Spy ───────────────────────────────
    const header = document.getElementById('header');
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    const backToTop = document.getElementById('backToTop');

    // Header scroll background
    window.addEventListener('scroll', () => {
        const scY = window.pageYOffset;
        if (header) {
            header.classList.toggle('scrolled', scY > 80);
        }
        if (backToTop) {
            backToTop.classList.toggle('visible', scY > 600);
        }
    }, { passive: true });

    // Back to top click
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobile menu toggle
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Close menu on nav item click
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });

        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('active') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    }

    // Smooth scroll for all hash links with header offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 70;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active Navigation Scroll Spy
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    function updateActiveNav() {
        const scrollY = window.pageYOffset;
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 120;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // ─── Scroll Animations (IntersectionObserver) ───────────────────────
    const animateElements = document.querySelectorAll('[data-animate]');
    if ('IntersectionObserver' in window) {
        const animObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-delay') || 0;
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                    }, Number(delay));
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        animateElements.forEach(el => animObserver.observe(el));
    } else {
        animateElements.forEach(el => el.classList.add('animated'));
    }

    // ─── Stats Number Counter Animation ─────────────────────────────────
    const statsSection = document.querySelector('.about-stats');
    const statCounters = document.querySelectorAll('[data-count]');

    if (statsSection && statCounters.length > 0 && 'IntersectionObserver' in window) {
        let animated = false;
        const statsObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    statCounters.forEach(counter => {
                        const target = Number(counter.getAttribute('data-count'));
                        const isPercent = counter.classList.contains('stat-percent');
                        const duration = 1800;
                        const startTime = performance.now();

                        function updateCount(currentTime) {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            // Ease out quartic
                            const easeOut = 1 - Math.pow(1 - progress, 4);
                            const current = Math.floor(easeOut * target);

                            if (isPercent) {
                                counter.textContent = `${current}%`;
                            } else {
                                counter.textContent = current.toLocaleString('ru-RU');
                            }

                            if (progress < 1) {
                                requestAnimationFrame(updateCount);
                            } else {
                                if (isPercent) {
                                    counter.textContent = `${target}%`;
                                } else {
                                    counter.textContent = target.toLocaleString('ru-RU') + (target >= 1000 ? '+' : '');
                                }
                            }
                        }

                        requestAnimationFrame(updateCount);
                    });
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        statsObserver.observe(statsSection);
    }

    // ─── Sync with SQLite Backend Server ────────────────────────────────
    async function syncFromBackendServer() {
        if (!window.location.protocol.startsWith('http')) return;
        try {
            const [cfgRes, catRes, prodRes, revRes] = await Promise.all([
                fetch('/api/config').then(r => r.json()).catch(() => null),
                fetch('/api/categories').then(r => r.json()).catch(() => null),
                fetch('/api/products').then(r => r.json()).catch(() => null),
                fetch('/api/reviews').then(r => r.json()).catch(() => null)
            ]);

            if (cfgRes && Object.keys(cfgRes).length > 0) {
                if (cfgRes.shop_name) SHOP_CONFIG.name = cfgRes.shop_name;
                if (cfgRes.phone) SHOP_CONFIG.phone = cfgRes.phone;
                if (cfgRes.phone_raw) SHOP_CONFIG.phoneRaw = cfgRes.phone_raw;
                if (cfgRes.email) SHOP_CONFIG.email = cfgRes.email;
                if (cfgRes.address) SHOP_CONFIG.address = cfgRes.address;
                if (cfgRes.working_hours) SHOP_CONFIG.workingHours = cfgRes.working_hours;
                if (cfgRes.delivery_cost) SHOP_CONFIG.deliveryCost = Number(cfgRes.delivery_cost);
                if (cfgRes.free_delivery_from) SHOP_CONFIG.freeDeliveryFrom = Number(cfgRes.free_delivery_from);
                if (cfgRes.min_order) SHOP_CONFIG.minOrder = Number(cfgRes.min_order);
                if (cfgRes.whatsapp) SHOP_CONFIG.whatsapp = cfgRes.whatsapp;
                initShopConfig();
            }

            if (catRes && Array.isArray(catRes) && catRes.length > 0) {
                CATEGORIES.length = 0;
                catRes.forEach(c => CATEGORIES.push({ id: c.id, name: c.name, icon: c.icon }));
                renderFilters();
            }

            if (prodRes && Array.isArray(prodRes) && prodRes.length > 0) {
                PRODUCTS.length = 0;
                prodRes.forEach(p => {
                    PRODUCTS.push({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        oldPrice: p.old_price,
                        category: p.category,
                        image: p.image,
                        description: p.description,
                        badge: p.badge,
                        rating: p.rating
                    });
                });
                renderProducts();
                renderFilters();
            }

            if (revRes && Array.isArray(revRes) && revRes.length > 0) {
                const serverReviews = revRes.map(r => ({
                    id: r.id,
                    name: r.name,
                    city: r.city,
                    rating: r.rating,
                    text: r.text,
                    date: r.date_str,
                    createdAt: r.created_at || 0
                }));
                // Merge: keep local-only reviews that aren't on server yet
                const serverIds = new Set(serverReviews.map(r => String(r.id)));
                const localOnly = reviewsList.filter(r => r.id && !serverIds.has(String(r.id)));
                reviewsList = [...localOnly, ...serverReviews];
                try {
                    localStorage.setItem('floralux_reviews', JSON.stringify(reviewsList));
                } catch(e) {}
                renderReviews();
            }
        } catch (e) {
            console.warn('Backend server sync info:', e);
        }
    }

    // ─── Grid Toggle (1-col / 2-col on mobile) ───────────────────────────
    const gridBtn1 = document.getElementById('gridBtn1');
    const gridBtn2 = document.getElementById('gridBtn2');
    const gridEl = document.getElementById('productsGrid');
    if (gridBtn1 && gridBtn2 && gridEl) {
        const savedGrid = localStorage.getItem('floralux_grid') || '2';
        if (savedGrid === '2') {
            gridEl.classList.add('grid-2col');
            gridEl.classList.remove('grid-1col');
            gridBtn2.classList.add('active');
            gridBtn1.classList.remove('active');
        } else {
            gridEl.classList.add('grid-1col');
            gridEl.classList.remove('grid-2col');
            gridBtn1.classList.add('active');
            gridBtn2.classList.remove('active');
        }
        gridBtn1.addEventListener('click', () => {
            gridEl.classList.remove('grid-2col');
            gridEl.classList.add('grid-1col');
            gridBtn1.classList.add('active');
            gridBtn2.classList.remove('active');
            localStorage.setItem('floralux_grid', '1');
        });
        gridBtn2.addEventListener('click', () => {
            gridEl.classList.add('grid-2col');
            gridEl.classList.remove('grid-1col');
            gridBtn2.classList.add('active');
            gridBtn1.classList.remove('active');
            localStorage.setItem('floralux_grid', '2');
        });
    }

    // ─── PWA Installation & "Add to Home Screen" ────────────────────────
    let deferredPrompt = null;
    const pwaBanner = document.getElementById('pwaInstallBanner');
    const pwaInstallBtn = document.getElementById('pwaInstallBtn');
    const pwaCloseBtn = document.getElementById('pwaCloseBtn');

    // Register Service Worker
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // Android/Chrome beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!sessionStorage.getItem('floralux_pwa_dismissed') && pwaBanner) {
            setTimeout(() => {
                pwaBanner.style.display = 'flex';
            }, 3000);
        }
    });

    // Detect iOS
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIos && !isInStandaloneMode && !sessionStorage.getItem('floralux_pwa_dismissed') && pwaBanner) {
        setTimeout(() => {
            pwaBanner.style.display = 'flex';
        }, 3500);
    }

    if (pwaInstallBtn) {
        pwaInstallBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                deferredPrompt = null;
                if (pwaBanner) pwaBanner.style.display = 'none';
            } else if (isIos) {
                alert("Чтобы установить приложение на iPhone:\n1. Нажмите значок «Поделиться» внизу экрана (квадрат со стрелкой ⎋)\n2. Прокрутите и выберите «На экран «Домой» ➕»\n\nИконка магазина появится на экране вашего смартфона!");
                if (pwaBanner) pwaBanner.style.display = 'none';
            } else {
                alert("Чтобы добавить сайт на экран телефона:\nНажмите меню браузера (три точки ⋮) и выберите «Установить приложение» или «Добавить на главный экран».");
                if (pwaBanner) pwaBanner.style.display = 'none';
            }
        });
    }

    if (pwaCloseBtn) {
        pwaCloseBtn.addEventListener('click', () => {
            if (pwaBanner) pwaBanner.style.display = 'none';
            sessionStorage.setItem('floralux_pwa_dismissed', 'true');
        });
    }

    // ─── Initial App Boot ───────────────────────────────────────────────
    initShopConfig();
    createHeroParticles();
    renderFilters();
    renderProducts();
    renderReviews();
    updateCartUI();
    syncFromBackendServer();
});
