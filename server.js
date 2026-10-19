/**
 * FloraLux — Complete Backend Server with Built-in SQLite Database
 * 
 * Features:
 * - Native SQLite database (database/shop.db) — openable in DB Browser for SQLite
 * - Auto-initialization with pre-populated products, categories, reviews, settings
 * - REST API for client website and Admin Panel
 * - Telegram Bot instant notifications for new orders
 * - Built with zero external dependencies (Node.js 22+)
 */

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const os = require('node:os');

const PORT = process.env.PORT || 8080;
const DB_DIR = path.join(__dirname, 'database');
const DB_PATH = path.join(DB_DIR, 'shop.db');
const IMAGES_DIR = path.join(__dirname, 'images');

// Ensure database and images directory
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ─── Initialize SQLite Database ─────────────────────────────────────
const db = new DatabaseSync(DB_PATH);

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        old_price INTEGER,
        category TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT,
        badge TEXT,
        rating REAL DEFAULT 5.0,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        delivery_address TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        delivery_time TEXT,
        payment_method TEXT,
        note TEXT,
        is_anonymous INTEGER DEFAULT 0,
        items_json TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        delivery_cost INTEGER DEFAULT 0,
        status TEXT DEFAULT 'новый',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT,
        rating INTEGER DEFAULT 5,
        text TEXT NOT NULL,
        date_str TEXT NOT NULL,
        status TEXT DEFAULT 'одобрен',
        created_at TEXT NOT NULL
    );
`);

// Helper for settings
function getSetting(key, defaultValue = '') {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
}

function setSetting(key, value) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
}

// Pre-populate if empty
function seedDatabase() {
    const checkProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (checkProducts.count === 0) {
        console.log('🌱 Инициализация базы данных начальными товарами и настройками...');

        // Settings (Kazakhstan)
        const defaultSettings = {
            shop_name: 'FloraLux',
            slogan: 'Жақындарыңызға арналған гүлдер • Цветы для важных моментов',
            phone: '+7 (777) 123-45-67',
            phone_raw: '+77771234567',
            email: 'info@floralux.kz',
            address: 'г. Алматы, пр. Достык, д. 42',
            working_hours: 'Күн сайын / Ежедневно: 08:00 — 23:00',
            whatsapp: '77771234567',
            telegram: 'floralux_kz',
            instagram: 'floralux.kz',
            delivery_cost: '1500',
            free_delivery_from: '20000',
            min_order: '5000',
            currency: '₸',
            admin_password: 'admin',
            tg_bot_token: '',
            tg_chat_id: '',
            tg_notifications_enabled: '0'
        };

        for (const [k, v] of Object.entries(defaultSettings)) {
            setSetting(k, v);
        }

        // Categories
        const categories = [
            { id: 'all', name: 'Барлығы / Все', icon: '🌺', sort_order: 1 },
            { id: 'bouquets', name: 'Букеттер / Букеты', icon: '💐', sort_order: 2 },
            { id: 'roses', name: 'Раушандар / Розы', icon: '🌹', sort_order: 3 },
            { id: 'tulips', name: 'Қызғалдақтар / Тюльпаны', icon: '🌷', sort_order: 4 },
            { id: 'wedding', name: 'Үйлену той / Свадебные', icon: '💍', sort_order: 5 },
            { id: 'compositions', name: 'Композициялар', icon: '🎍', sort_order: 6 },
            { id: 'gifts', name: 'Сыйлықтар / Подарки', icon: '🎁', sort_order: 7 }
        ];

        const insertCat = db.prepare('INSERT OR REPLACE INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)');
        for (const c of categories) {
            insertCat.run(c.id, c.name, c.icon, c.sort_order);
        }

        // Products (Prices in Tenge ₸)
        const products = [
            { id: 1, name: 'Нежность', price: 18500, old_price: 22000, category: 'roses', image: 'images/product-1.jpg', description: 'Восхитительный букет из 15 нежно-розовых роз премиум-класса. Тщательно отобранные флористами бутоны.', badge: 'Хит продаж', rating: 4.9 },
            { id: 2, name: 'Алые паруса', price: 25000, old_price: null, category: 'roses', image: 'images/product-2.jpg', description: 'Роскошный букет из 25 отборных алых роз Голландии — классика для признания в любви.', badge: 'Новинка', rating: 5.0 },
            { id: 3, name: 'Весенний рассвет', price: 14000, old_price: 16500, category: 'tulips', image: 'images/product-3.jpg', description: 'Яркий букет из 25 разноцветных голландских тюльпанов. Подарите весеннее настроение!', badge: 'Скидка', rating: 4.7 },
            { id: 4, name: 'Облако нежности', price: 28000, old_price: null, category: 'bouquets', image: 'images/product-4.jpg', description: 'Воздушный букет из белых пионов, эустомы и гипсофилы. Лёгкость в каждом лепестке.', badge: null, rating: 4.8 },
            { id: 5, name: 'Солнечный день', price: 16000, old_price: null, category: 'bouquets', image: 'images/product-5.jpg', description: 'Солнечный и жизнерадостный букет из подсолнухов, роз и солидаго.', badge: null, rating: 4.6 },
            { id: 6, name: 'Королевский пион', price: 32000, old_price: 36000, category: 'bouquets', image: 'images/product-6.jpg', description: 'Премиальный букет из 11 крупных бордовых и розовых пионов «Сара Бернар».', badge: 'Хит продаж', rating: 5.0 },
            { id: 7, name: 'Дыхание любви', price: 39000, old_price: 45000, category: 'wedding', image: 'images/product-7.jpg', description: 'Изысканный свадебный букет невесты из роз и фрезий. Бутоньерка в подарок!', badge: 'Новинка', rating: 4.9 },
            { id: 8, name: 'Белоснежная сказка', price: 34000, old_price: null, category: 'wedding', image: 'images/product-8.jpg', description: 'Нежнейший свадебный букет из белых пионовидных роз и ранункулюсов.', badge: null, rating: 4.8 },
            { id: 9, name: 'Цветочная шкатулка', price: 21000, old_price: 24500, category: 'compositions', image: 'images/product-9.jpg', description: 'Элегантная композиция в шляпной коробке. Цветы в флористической губке с водой.', badge: 'Хит продаж', rating: 4.9 },
            { id: 10, name: 'Лесная сказка', price: 19000, old_price: null, category: 'compositions', image: 'images/product-10.jpg', description: 'Стильная композиция в плетёной корзине: кустовые розы, хлопок, лаванда.', badge: null, rating: 4.7 },
            { id: 11, name: 'Весеннее чудо', price: 12500, old_price: null, category: 'tulips', image: 'images/product-11.jpg', description: 'Классический букет из 15 розовых тюльпанов в дизайнерской матовой бумаге.', badge: null, rating: 4.8 },
            { id: 12, name: 'Набор «С любовью»', price: 29500, old_price: 34000, category: 'gifts', image: 'images/product-12.jpg', description: 'Романтический набор: 9 роз в коробке, плюшевый мишка и шоколадные конфеты.', badge: 'Хит продаж', rating: 4.9 }
        ];

        const insertProd = db.prepare(`
            INSERT INTO products (id, name, price, old_price, category, image, description, badge, rating, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);
        for (const p of products) {
            insertProd.run(p.id, p.name, p.price, p.old_price, p.category, p.image, p.description, p.badge, p.rating);
        }

        // Reviews (Kazakhstan)
        const reviews = [
            { name: 'Айгерим С.', city: 'Алматы', rating: 5, text: 'Заказывала букет «Нежность» маме на юбилей — она была в полном восторге! Цветы свежайшие, простояли почти две недели. Рахмет үлкен!', date_str: '15 қазан 2026' },
            { name: 'Данияр М.', city: 'Астана', rating: 5, text: 'Уже в третий раз заказываю здесь цветы для супруги. Сервис на высоте, фото перед отправкой прислали в WhatsApp. Оплата через Kaspi очень удобная. Рекомендую!', date_str: '10 қазан 2026' },
            { name: 'Динара К.', city: 'Шымкент', rating: 5, text: 'Свадебный букет получился просто сказочным! Флористы учли все детали под цвет платья. Спасибо огромное вашей команде!', date_str: '5 қазан 2026' },
            { name: 'Бауыржан Т.', city: 'Караганда', rating: 5, text: 'Отличный цветочный магазин! Большой выбор, быстрая доставка и вежливый курьер. Заказывал доставку-сюрпризом, всё организовали идеально!', date_str: '1 қазан 2026' }
        ];

        const insertRev = db.prepare(`
            INSERT INTO reviews (name, city, rating, text, date_str, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'одобрен', datetime('now'))
        `);
        for (const r of reviews) {
            insertRev.run(r.name, r.city, r.rating, r.text, r.date_str);
        }

        console.log('✅ База данных успешно инициализирована и заполнена!');
    }
}

seedDatabase();

// ─── Telegram Bot Notification Service ──────────────────────────────
function sendTelegramMessage(text) {
    const token = getSetting('tg_bot_token');
    const chatId = getSetting('tg_chat_id');
    const enabled = getSetting('tg_notifications_enabled') === '1';

    if (!token || !chatId || !enabled) {
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        const postData = JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        });

        const req = https.request(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.ok === true);
                } catch (e) {
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error('Telegram API Error:', err.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// ─── HTTP Utilities ─────────────────────────────────────────────────
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 10 * 1024 * 1024) { // 10MB limit
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                resolve(body);
            }
        });
    });
}

function sendJson(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function checkAdminAuth(req) {
    const authHeader = req.headers['authorization'];
    const currentPass = getSetting('admin_password', 'admin');
    if (!authHeader) return false;
    const token = authHeader.replace(/^Bearer\s+/i, '');
    return token === currentPass;
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff'
};

// ─── Server Request Handler ─────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = reqUrl.pathname;

    try {
        // ─── API Routes ─────────────────────────────────────────────

        // GET /api/config — Public shop settings
        if (req.method === 'GET' && pathname === '/api/config') {
            const rows = db.prepare('SELECT key, value FROM settings').all();
            const config = {};
            for (const r of rows) {
                // Don't leak admin password or telegram token to public client
                if (r.key === 'admin_password' || r.key === 'tg_bot_token') continue;
                config[r.key] = r.value;
            }
            return sendJson(res, config);
        }

        // GET /api/admin/config — Full config for Admin Panel
        if (req.method === 'GET' && pathname === '/api/admin/config') {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const rows = db.prepare('SELECT key, value FROM settings').all();
            const config = {};
            for (const r of rows) config[r.key] = r.value;
            return sendJson(res, config);
        }

        // POST /api/admin/config — Save settings from Admin Panel
        if (req.method === 'POST' && pathname === '/api/admin/config') {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const body = await parseBody(req);
            for (const [k, v] of Object.entries(body)) {
                setSetting(k, v);
            }
            return sendJson(res, { success: true });
        }

        // POST /api/admin/login — Admin Authentication
        if (req.method === 'POST' && pathname === '/api/admin/login') {
            const body = await parseBody(req);
            const savedPass = getSetting('admin_password', 'admin');
            if (body.password === savedPass) {
                return sendJson(res, { success: true, token: savedPass });
            } else {
                return sendJson(res, { success: false, error: 'Неверный пароль' }, 401);
            }
        }

        // POST /api/admin/test-telegram — Test Telegram Bot Message
        if (req.method === 'POST' && pathname === '/api/admin/test-telegram') {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const body = await parseBody(req);
            if (body.bot_token) setSetting('tg_bot_token', body.bot_token);
            if (body.chat_id) setSetting('tg_chat_id', body.chat_id);
            setSetting('tg_notifications_enabled', '1');

            const testMsg = `🌸 <b>FloraLux: Тестовое уведомление!</b>\n\nБот успешно подключен к вашему сайту цветов! Сюда будут мгновенно приходить все новые заказы покупателей.`;
            const ok = await sendTelegramMessage(testMsg);
            return sendJson(res, { success: ok, message: ok ? 'Сообщение успешно отправлено в Telegram!' : 'Ошибка отправки в Telegram. Проверьте Bot Token и Chat ID.' });
        }

        // GET /api/categories — List categories
        if (req.method === 'GET' && pathname === '/api/categories') {
            const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
            return sendJson(res, categories);
        }

        // GET /api/products — List products
        if (req.method === 'GET' && pathname === '/api/products') {
            const showAll = reqUrl.searchParams.get('all') === '1' && checkAdminAuth(req);
            const query = showAll
                ? 'SELECT * FROM products ORDER BY id DESC'
                : 'SELECT * FROM products WHERE is_active = 1 ORDER BY id ASC';
            const products = db.prepare(query).all();
            return sendJson(res, products);
        }

        // POST /api/products — Create or Update product (Admin)
        if (req.method === 'POST' && pathname === '/api/products') {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const body = await parseBody(req);
            const { id, name, price, old_price, category, image, description, badge, rating, is_active } = body;

            if (id) {
                // Update
                db.prepare(`
                    UPDATE products
                    SET name = ?, price = ?, old_price = ?, category = ?, image = ?, description = ?, badge = ?, rating = ?, is_active = ?
                    WHERE id = ?
                `).run(name, Number(price), old_price ? Number(old_price) : null, category, image, description, badge || null, Number(rating) || 5.0, is_active !== undefined ? Number(is_active) : 1, id);
                return sendJson(res, { success: true, id });
            } else {
                // Create
                const resInsert = db.prepare(`
                    INSERT INTO products (name, price, old_price, category, image, description, badge, rating, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(name, Number(price), old_price ? Number(old_price) : null, category, image || 'images/product-placeholder.jpg', description || '', badge || null, Number(rating) || 5.0, 1);
                return sendJson(res, { success: true, id: resInsert.lastInsertRowid });
            }
        }

        // DELETE /api/products/:id — Delete product (Admin)
        if (req.method === 'DELETE' && pathname.startsWith('/api/products/')) {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const id = Number(pathname.split('/').pop());
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
            return sendJson(res, { success: true });
        }

        // GET /api/orders — List all orders (Admin)
        if (req.method === 'GET' && pathname === '/api/orders') {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
            const formatted = orders.map(o => {
                try { o.items = JSON.parse(o.items_json); } catch (e) { o.items = []; }
                return o;
            });
            return sendJson(res, formatted);
        }

        // POST /api/orders — Customer creates order from website checkout
        if (req.method === 'POST' && pathname === '/api/orders') {
            const body = await parseBody(req);
            const orderId = 'FL-' + Math.floor(100000 + Math.random() * 900000);
            const now = new Date().toISOString();

            db.prepare(`
                INSERT INTO orders (id, customer_name, customer_phone, customer_email, delivery_address, delivery_date, delivery_time, payment_method, note, is_anonymous, items_json, total_amount, delivery_cost, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'новый', ?)
            `).run(
                orderId,
                body.customer_name || 'Покупатель',
                body.customer_phone || '',
                body.customer_email || '',
                body.delivery_address || '',
                body.delivery_date || '',
                body.delivery_time || '',
                body.payment_method || 'card',
                body.note || '',
                body.is_anonymous ? 1 : 0,
                JSON.stringify(body.items || []),
                Number(body.total_amount) || 0,
                Number(body.delivery_cost) || 0,
                now
            );

            // Send instant Telegram notification to shop owner
            const itemsList = (body.items || []).map(i => `• ${i.name} × ${i.quantity} — ${(i.price * i.quantity).toLocaleString('ru-RU')} ₸`).join('\n');
            const paymentName = {
                'kaspi': '🔴 Kaspi QR / Kaspi Gold',
                'card': '💳 Картой онлайн (Visa / Mastercard)',
                'cash': '💵 Наличными курьеру'
            }[body.payment_method] || body.payment_method;

            const tgMessage = `🚨 <b>ЖАҢА ТАПСЫРЫС / НОВЫЙ ЗАКАЗ #${orderId}</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `👤 <b>Клиент:</b> ${body.customer_name}\n` +
                `📞 <b>Телефон:</b> <a href="tel:${body.customer_phone}">${body.customer_phone}</a>\n` +
                `📍 <b>Адрес:</b> ${body.delivery_address}\n` +
                `📅 <b>Дата и время:</b> ${body.delivery_date} (${body.delivery_time || 'Любое'})\n` +
                `💳 <b>Оплата:</b> ${paymentName}\n` +
                (body.is_anonymous ? `🕶 <b>Анонимная доставка:</b> ДА\n` : '') +
                (body.note ? `📝 <b>Комментарий:</b> <i>${body.note}</i>\n` : '') +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `💐 <b>Состав заказа:</b>\n${itemsList}\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `💰 <b>ИТОГО К ОПЛАТЕ:</b> <b>${(body.total_amount || 0).toLocaleString('ru-RU')} ₸</b> ` +
                (body.delivery_cost === 0 ? '(Доставка бесплатно)' : `(включая доставку ${body.delivery_cost} ₸)`);

            // Send asynchronously without blocking order response
            sendTelegramMessage(tgMessage).catch(console.error);

            return sendJson(res, { success: true, orderId });
        }

        // PATCH /api/orders/:id — Update order status (Admin)
        if (req.method === 'PATCH' && pathname.startsWith('/api/orders/')) {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const id = pathname.split('/').pop();
            const body = await parseBody(req);
            if (body.status) {
                db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(body.status, id);
            }
            return sendJson(res, { success: true });
        }

        // GET /api/reviews — List reviews
        if (req.method === 'GET' && pathname === '/api/reviews') {
            const showAll = reqUrl.searchParams.get('all') === '1' && checkAdminAuth(req);
            const query = showAll
                ? 'SELECT * FROM reviews ORDER BY id DESC'
                : "SELECT * FROM reviews WHERE status = 'одобрен' ORDER BY id DESC";
            const reviews = db.prepare(query).all();
            return sendJson(res, reviews);
        }

        // POST /api/reviews — Add customer review
        if (req.method === 'POST' && pathname === '/api/reviews') {
            const body = await parseBody(req);
            const today = new Date();
            const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
            const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

            const resRev = db.prepare(`
                INSERT INTO reviews (name, city, rating, text, date_str, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'одобрен', datetime('now'))
            `).run(
                body.name || 'Покупатель',
                body.city || 'Москва',
                Number(body.rating) || 5,
                body.text || '',
                dateStr
            );

            // Optional Telegram notify for review
            sendTelegramMessage(`⭐ <b>Новый отзыв на сайте!</b>\nОт: ${body.name} (${body.city})\nОценка: ${'⭐'.repeat(body.rating || 5)}\nТекст: «${body.text}»`).catch(() => {});

            return sendJson(res, { success: true, id: resRev.lastInsertRowid });
        }

        // DELETE /api/reviews/:id — Delete review (Admin)
        if (req.method === 'DELETE' && pathname.startsWith('/api/reviews/')) {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const id = Number(pathname.split('/').pop());
            db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
            return sendJson(res, { success: true });
        }

        // POST /api/upload — Upload photo for flowers (Admin)
        if (req.method === 'POST' && pathname === '/api/upload') {
            if (!checkAdminAuth(req)) return sendJson(res, { error: 'Не авторизован' }, 401);
            const body = await parseBody(req);
            if (!body.data || !body.filename) {
                return sendJson(res, { error: 'No image data' }, 400);
            }
            // Strip data:image/...;base64,
            const base64Data = body.data.replace(/^data:image\/\w+;base64,/, '');
            const ext = path.extname(body.filename) || '.jpg';
            const cleanName = 'flower-' + Date.now() + ext;
            const destPath = path.join(IMAGES_DIR, cleanName);

            fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
            return sendJson(res, { success: true, path: `images/${cleanName}` });
        }

        // ─── Static Files Server ────────────────────────────────────
        let filePath = pathname === '/' ? '/index.html' : pathname;
        if (filePath === '/admin') filePath = '/admin.html';

        const safePath = path.normalize(path.join(__dirname, filePath));
        if (!safePath.startsWith(__dirname)) {
            res.writeHead(403);
            return res.end('Access denied');
        }

        if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
            const ext = path.extname(safePath).toLowerCase();
            const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=3600'
            });
            return fs.createReadStream(safePath).pipe(res);
        }

        // Not found
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Страница не найдена');

    } catch (err) {
        console.error('Server error:', err);
        sendJson(res, { error: 'Internal Server Error', message: err.message }, 500);
    }
});

// ─── Start Server ───────────────────────────────────────────────────
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`\n[i] Сервер уже запущен на порту ${PORT}!`);
        console.log(`Витрина доступна по адресу: http://localhost:${PORT}`);
        console.log(`Панель администратора:    http://localhost:${PORT}/admin\n`);
        process.exit(0);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║   🌸 FloraLux — Сервер цветочного магазина с базой SQLite       ║
╚═══════════════════════════════════════════════════════════════════╝

  🌐 Витрина магазина:     http://localhost:${PORT}
  🔑 Панель администратора: http://localhost:${PORT}/admin
  📱 С телефона по Wi-Fi:   http://${getLocalIp()}:${PORT}
  📁 База данных SQLite:    ${DB_PATH}

  (Для открытия базы используйте бесплатную программу DB Browser for SQLite)
    `);
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}
