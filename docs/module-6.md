# Модуль 6: Оффлайн-платформа (PWA и Service Workers)

Для создания **Progressive Web App (PWA)** нам понадобятся всего два файла в корне проекта: `manifest.json` и `sw.js` (Service Worker).

### Шаг 1: Создаем Манифест приложения (`manifest.json`)

Этот файл сообщает браузеру, что наш сайт — это полноценное приложение, и описывает его интерфейс при установке. Создай его в корне рядом с `index.html`:

```json
{
  "short_name": "SandboxPOS",
  "name": "Web Components Sandbox POS",
  "icons": [
    {
      "src": "icon-192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/",
  "background_color": "#f8f9fa",
  "theme_color": "#0d6efd",
  "display": "standalone",
  "orientation": "portrait"
}

```

*(Иконки `icon-192.png` и `icon-512.png` можно временно положить любые или просто сгенерировать пустые заглушки).*

---

### Шаг 2: Пишем нативный Service Worker (`sw.js`)

Service Worker — это прокси-скрипт, который работает в фоне, перехватывает все сетевые HTTP-запросы приложения и решает: взять файл из интернета или мгновенно выдать его из локального кэша браузера (**Cache Storage**).

Создай файл `sw.js` в корне проекта:

```javascript
const CACHE_NAME = 'v1_sandbox_cache';

// Список всех файлов интерфейса, которые нужно закэшировать при первом запуске
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/metadata/constants.js',
  // Добавь пути к своим компонентам, например:
  '/components/profile-list/profile-list.js',
  '/components/profile-list/tepmplate.js',
  '/components/profile-form/profile-form.js',
  '/components/profile-form/template.js',
  '/components/profile-form/styles.css'
];

// 1. Событие Установки: кэшируем всю статику интерфейса
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Кэшируем оболочку интерфейса...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Событие Активации: удаляем старые версии кэша, если они были
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('PWA: Удаляем старый кэш:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Стратегия кэширования Cache-First (Сначала кэш, если нет — сеть)
self.addEventListener('fetch', (event) => {
  // Игнорируем запросы к сторонним API или расширениям браузера
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Возвращаем файл из кэша моментально!
      }
      
      // Если файла в кэше нет — идем в сеть
      return fetch(event.request);
    })
  );
});

```

---

### Шаг 3: Регистрируем Service Worker в `index.html`

Внутри твоего главного `<script type="module">` в `index.html` нужно добавить блок регистрации:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('PWA: Service Worker успешно зарегистрирован!', reg.scope))
      .catch(err => console.error('PWA: Ошибка регистрации Service Worker:', err));
  });
}

```

Не забудь также подключить манифест в тег `<head>` твоего `index.html`:

```html
<link rel="manifest" href="/manifest.json">

```

---

### Домашнее задание Модуля 6:

1. Создай эти два файла и пропиши корректные пути к твоим JS/CSS файлам в массив `ASSETS_TO_CACHE`.
2. Запусти локальный сервер разработки.
3. Открой вкладку **DevTools -> Application -> Service Workers** в браузере. Убедись, что сервис-воркер активирован и работает.
4. Поставь галочку **Offline** в DevTools (или отключи интернет на компьютере) и обнови страницу. Интерфейс твоего приложения должен загрузиться мгновенно, несмотря на полное отсутствие сети!