// ╔══════════════════════════════════════════════════════════════╗
// ║  🌸  НАСТРОЙКИ МАГАЗИНА (КАЗАХСТАН) — РЕДАКТИРУЙТЕ ЗДЕСЬ    ║
// ║                                                              ║
// ║  • Валюта: Тенге (₸)                                         ║
// ║  • Контакты: города Алматы, Астана, Шымкент и др.            ║
// ║  • Способы оплаты: Kaspi QR / Kaspi Gold / Наличные / Карта   ║
// ╚══════════════════════════════════════════════════════════════╝

// ─── Основные настройки магазина ─────────────────────────────────
const SHOP_CONFIG = {
    name: "FloraLux",                                            // Название магазина
    slogan: "Жақындарыңызға арналған гүлдер • Цветы для важных моментов", // Слоган
    phone: "+7 (777) 123-45-67",                                 // Телефон для звонков
    phoneRaw: "+77771234567",                                     // Телефон без пробелов (для ссылок tel:)
    email: "info@floralux.kz",                                   // Email магазина
    address: "г. Алматы, пр. Достык, д. 42",                     // Адрес (или г. Астана, ул. Достык...)
    workingHours: "Күн сайын / Ежедневно: 08:00 — 23:00",        // Время работы
    whatsapp: "77771234567",                                      // WhatsApp (номер только с 7, без +)
    telegram: "floralux_kz",                                     // Telegram (без @)
    instagram: "floralux.kz",                                    // Instagram (без @)
    deliveryCost: 1500,                                          // Стоимость доставки (в тенге)
    freeDeliveryFrom: 20000,                                     // Бесплатная доставка от (в тенге)
    minOrder: 5000,                                              // Минимальный заказ (в тенге)
    currency: "₸",                                               // Валюта (Тенге)
};

// ─── Настройки онлайн-базы отзывов (Firebase) ────────────────────
const FIREBASE_CONFIG = {
    enabled: false,
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// ─── Категории товаров ──────────────────────────────────────────
const CATEGORIES = [
    { id: "all",          name: "Барлығы / Все",     icon: "🌺" },
    { id: "bouquets",     name: "Букеттер / Букеты", icon: "💐" },
    { id: "roses",        name: "Раушандар / Розы",  icon: "🌹" },
    { id: "tulips",       name: "Қызғалдақтар / Тюльпаны", icon: "🌷" },
    { id: "wedding",      name: "Үйлену той / Свадебные", icon: "💍" },
    { id: "compositions", name: "Композициялар",     icon: "🎍" },
    { id: "gifts",        name: "Сыйлықтар / Подарки", icon: "🎁" },
];

// ─── Товары в тенге (₸) ──────────────────────────────────────────
const PRODUCTS = [
    {
        id: 1,
        name: "Нежность",
        price: 18500,
        oldPrice: 22000,
        category: "roses",
        image: "images/product-1.jpg",
        description: "15 нәзік қызғылт раушаннан жасалған керемет букет. Восхитительный букет из 15 нежно-розовых роз премиум-класса. Свежие бутоны прямо с плантаций.",
        badge: "Хит продаж",
        rating: 4.9,
    },
    {
        id: 2,
        name: "Алые паруса",
        price: 25000,
        oldPrice: null,
        category: "roses",
        image: "images/product-2.jpg",
        description: "Роскошный букет из 25 отборных алых роз Голландии — классика для признания в любви и юбилеев.",
        badge: "Новинка",
        rating: 5.0,
    },
    {
        id: 3,
        name: "Весенний рассвет",
        price: 14000,
        oldPrice: 16500,
        category: "tulips",
        image: "images/product-3.jpg",
        description: "25 түрлі-түсті қызғалдақтан жасалған жарқын букет. Яркий букет из 25 разноцветных голландских тюльпанов.",
        badge: "Скидка",
        rating: 4.7,
    },
    {
        id: 4,
        name: "Облако нежности",
        price: 28000,
        oldPrice: null,
        category: "bouquets",
        image: "images/product-4.jpg",
        description: "Воздушный букет из белых пионов, эустомы и гипсофилы. Лёгкость и изящество в каждом лепестке.",
        badge: null,
        rating: 4.8,
    },
    {
        id: 5,
        name: "Солнечный день",
        price: 16000,
        oldPrice: null,
        category: "bouquets",
        image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80",
        description: "Жарқын және көңілді күнбағыстар мен сары раушандар. Солнечный букет из подсолнухов и роз.",
        badge: null,
        rating: 4.6,
    },
    {
        id: 6,
        name: "Королевский пион",
        price: 32000,
        oldPrice: 36000,
        category: "bouquets",
        image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80",
        description: "Премиальный букет из 11 крупных бордовых и розовых пионов «Сара Бернар». Истинная роскошь.",
        badge: "Хит продаж",
        rating: 5.0,
    },
    {
        id: 7,
        name: "Дыхание любви",
        price: 39000,
        oldPrice: 45000,
        category: "wedding",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
        description: "Қалыңдыққа арналған керемет букет. Изысканный свадебный букет невесты из роз и фрезий. Бутоньерка в подарок!",
        badge: "Новинка",
        rating: 4.9,
    },
    {
        id: 8,
        name: "Белоснежная сказка",
        price: 34000,
        oldPrice: null,
        category: "wedding",
        image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80",
        description: "Нежнейший свадебный букет из белых пионовидных роз и ранункулюсов с шелковой лентой.",
        badge: null,
        rating: 4.8,
    },
    {
        id: 9,
        name: "Цветочная шкатулка",
        price: 21000,
        oldPrice: 24500,
        category: "compositions",
        image: "https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=800&q=80",
        description: "Элегантная композиция в шляпной коробке. Цветы находятся в специальном оазисе с водой и не требуют вазы.",
        badge: "Хит продаж",
        rating: 4.9,
    },
    {
        id: 10,
        name: "Лесная сказка",
        price: 19000,
        oldPrice: null,
        category: "compositions",
        image: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80",
        description: "Стильная композиция в плетёной корзине: пионовидные кустовые розы, лаванда и хлопок.",
        badge: null,
        rating: 4.7,
    },
    {
        id: 11,
        name: "Весеннее чудо",
        price: 12500,
        oldPrice: null,
        category: "tulips",
        image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=80",
        description: "Классический букет из 15 розовых тюльпанов в матовой дизайнерской бумаге.",
        badge: null,
        rating: 4.8,
    },
    {
        id: 12,
        name: "Набор «С любовью»",
        price: 29500,
        oldPrice: 34000,
        category: "gifts",
        image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
        description: "Романтический подарок: 9 красных роз в коробке, плюшевый мишка и шоколадные конфеты ручной работы.",
        badge: "Хит продаж",
        rating: 4.9,
    },
];

// ─── Отзывы клиентов (Казахстан) ─────────────────────────────────
const REVIEWS = [
    {
        name: "Айгерим С.",
        city: "Алматы",
        text: "Заказывала букет «Нежность» маме на юбилей — она была в полном восторге! Цветы свежайшие, простояли почти две недели. Доставили точно ко времени. Рахмет үлкен!",
        rating: 5,
        date: "15 қазан 2026",
    },
    {
        name: "Данияр М.",
        city: "Астана",
        text: "Уже в третий раз заказываю здесь цветы для супруги. Сервис на высоте, перед отправкой прислали фото готового букета в WhatsApp. Оплата через Kaspi очень удобная. Рекомендую!",
        rating: 5,
        date: "10 қазан 2026",
    },
    {
        name: "Динара К.",
        city: "Шымкент",
        text: "Свадебный букет получился просто сказочным! Флористы учли все детали под цвет платья. Букет стойко выдержал весь день свадьбы. Спасибо огромное вашему салону!",
        rating: 5,
        date: "5 қазан 2026",
    },
    {
        name: "Бауыржан Т.",
        city: "Караганда",
        text: "Отличный цветочный магазин! Большой выбор, быстрая доставка и вежливый курьер. Заказывал доставку-сюрприз, получательница очень счастлива!",
        rating: 5,
        date: "1 қазан 2026",
    },
];
