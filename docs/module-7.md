# Модуль 7: Инициализация SQLite Wasm + OPFS (Local-First база данных)

---

## 1. Архитектура решения

Поскольку работа с файловой системой и тяжелые SQL-запросы могут блокировать главный поток (UI-thread) и вызывать фризы интерфейса (снижая те самые 60 FPS, за которые мы боролись через `debounceRender`), архитектурно правильно запускать SQLite внутри отдельного **Web Worker**.

[UI Thread (Компоненты)] ⇄ (сообщения postMessage) ⇄ [Web Worker (database.worker.js)] ⇄ [SQLite Wasm + OPFS]

---

## 2. Пошаговый план внедрения

### Шаг 1: Скачивание бинарников SQLite Wasm

Для работы нам понадобятся официальные файлы сборки SQLite для WebAssembly. Обычно это два файла:

1. `sqlite3.js` — JavaScript-обертка.
2. `sqlite3.wasm` — скомпилированный бинарник самой БД.

> **Задание:** Скачай актуальную версию сборки `sqlite-wasm` (например, из официального репозитория или через npm) и положи их в свою структуру, например, в папку `/js/vendor/`.

---

### Шаг 2: Создание Web Worker (`database.worker.js`)

Создай файл `./js/src/database/database.worker.js`. Этот воркер будет инициализировать базу данных при старте и слушать запросы от компонентов.

```javascript
// Импортируем обертку SQLite
importScripts('/js/vendor/sqlite3.js');

let db = null;

async function initDatabase() {
  try {
    // Инициализируем нативный SQLite3 Wasm
    const sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    });

    if ('opfs' in sqlite3) {
      // Открываем базу данных в Origin Private File System (данные не пропадут после перезагрузки)
      db = new sqlite3.oo1.OpfsDb('/profiles_db.sqlite3');
      console.log('SQLite: Успешно подключено к OPFS базе данных', db.filename);
    } else {
      // Фолбэк на память, если OPFS не поддерживается браузером
      db = new sqlite3.oo1.DB();
      console.warn('SQLite: OPFS недоступна, база данных создана в памяти (In-Memory)');
    }

    // Создаем таблицу профилей, если её еще нет
    db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

  } catch (err) {
    console.error('SQLite: Ошибка инициализации:', err);
  }
}

// Слушаем сообщения от главного потока (из наших веб-компонентов)
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (!db) {
    self.postMessage({ type: 'ERROR', payload: 'База данных еще не инициализирована' });
    return;
  }

  switch (type) {
    case 'GET_ALL_PROFILES':
      const rows = db.selectObjects('SELECT * FROM profiles ORDER BY updated_at DESC');
      self.postMessage({ type: 'PROFILES_LIST', payload: rows });
      break;

    case 'SAVE_PROFILE':
      db.exec({
        sql: 'INSERT OR REPLACE INTO profiles (id, name, role, updated_at) VALUES (?, ?, ?, ?)',
        bind: [payload.id, payload.name, payload.role, Date.now()]
      });
      self.postMessage({ type: 'SAVE_SUCCESS' });
      break;

    default:
      console.warn('Worker: Неизвестный тип сообщения:', type);
  }
};

// Запускаем инициализацию при старте воркера
initDatabase();

```

---

### Шаг 3: Подключение базы к приложению (`main.js` / `dataSource.js`)

Теперь давай свяжем этот воркер с нашим центральным кодом. Вместо старого файла `/js/src/metadata/dataSource.js` мы настроим единый менеджер данных, который будет общаться с воркером.

Обнови твой `dataSource.js`:

```javascript
class DatabaseManager {
  constructor() {
    // Запускаем наш фоновый поток БД
    this.worker = new Worker('/js/src/database/database.worker.js');
    this.listeners = new Set();

    this.worker.onmessage = (event) => {
      const { type, payload } = event.data;
      
      // Оповещаем все подписанные компоненты о новых данных
      this.listeners.forEach(callback => callback(type, payload));
    };
  }

  // Метод для подписки компонентов на обновления из БД
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getAllProfiles() {
    this.worker.postMessage({ type: 'GET_ALL_PROFILES' });
  }

  saveProfile(profile) {
    // Если это новый профиль и у него нет id — генерируем нативный UUID
    const id = profile.id || crypto.randomUUID();
    this.worker.postMessage({ 
      type: 'SAVE_PROFILE', 
      payload: { ...profile, id } 
    });
  }
}

export const dbManager = new DatabaseManager();

```

---

## 3. Важный нюанс: За заголовки COOP и COEP (Важно!)

Для того чтобы браузер разрешил Web Worker'у использовать высокопроизводительный OPFS режим для SQLite, твой локальный сервер **обязан отдавать специальные HTTP-заголовки безопасности**:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp

```

Если ты используешь сервер `serve -s`, о котором мы говорили, или плагин в VS Code, проверь их настройки. Без этих заголовков SQLite Wasm будет ругаться в консоль и сбрасывать работу в медленный In-Memory режим.

---

Жизненный цикл Web Worker при запуске
Браузер инициализирует скрипт воркера только тогда, когда создается экземпляр new Worker(). Давай заставим приложение общаться с базой данных прямо при старте.

Перепишем логику инициализации в main.js:
``` js
// 1. Подписываемся на обновления из базы данных
dbManager.subscribe((type, payload) => {
  console.log(`[Main Thread] Получено сообщение от DB Worker: ${type}`, payload);
  
  if (type === 'PROFILES_LIST') {
    // Находим наш компонент каталога/списка и прокидываем туда данные из SQLite
    const directoryElem = document.getElementById(ELEM_IDS.PROFILE_DIRECTORY); 
    if (directoryElem) {
      directoryElem.data = payload; 
    }
  }
});

// 2. Делаем первичный запрос данных при загрузке приложения
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Main Thread] Запрашиваем профили из SQLite...');
  dbManager.getAllProfiles();
});

// 3. Переводим сохранение формы на рельсы базы данных
const handleProfileFormSubmit = (event) => {
  const profileData = event.detail;
  
  // Отправляем данные в воркер вместо старого dataSource memory-объекта
  dbManager.saveProfile(profileData);
};

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_SAVE, handleProfileFormSubmit);
```

---

## Что нужно сделать в Модуле 7:

1. Скачать бинарники `sqlite3.js` и `sqlite3.wasm`.
2. Создать файл воркера `database.worker.js` и настроить инициализацию таблицы `profiles`.
3. Переписать `dataSource.js` на отправку сообщений в воркер.
4. Внедрить в `main.js` вызов `dbManager.getAllProfiles()` при старте приложения, чтобы список наполнялся уже из реальной локальной базы данных SQLite!


```js
import ProfileSearch from "../profile-search/profile-search.js";
import ProfileList from '../profile-list/profile-list.js';
import { template, TEMPLATE_SHARED_CONST } from "./template.js";
import stylesheet from './styles.css' with {type: 'css'};
import { CUSTOM_EVENTS, OPEN } from '../../metadata/constants.js';

const ELEM_NAME = 'profile-directory';

class ProfileDirectory extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: OPEN });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.statusElement = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.SEARCH_ELEM_ID);
    this.listElement = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.LIST_ELEM_ID);
  }

  // 🔥 Сеттер, через который main.js будет передавать массив из SQLite
  set data(profilesList) {
    if (this.listElement) {
      this.listElement.data = profilesList;
    }
  }

  connectedCallback() {
    // Сигнализируем в main.js, что компонент готов к получению первичных данных
    this.dispatchEvent(new CustomEvent('directory-ready', { 
      bubbles: true, 
      composed: true 
    }));

    // Слушаем внутреннее событие изменения строки поиска
    this.shadowRoot.addEventListener(CUSTOM_EVENTS.SEARCH_CHANGE, (e) => {
      const searchQuery = e.detail.query;
      this.updateStatus(searchQuery);
      
      // 🔥 Перенаправляем намерение отфильтровать наверх в main.js
      this.dispatchEvent(new CustomEvent('directory-search', {
        detail: { query: searchQuery },
        bubbles: true,
        composed: true
      }));
    });

    // Слушаем внутреннее событие удаления профиля из списка
    this.shadowRoot.addEventListener(CUSTOM_EVENTS.PROFILE_DELETE, (e) => {
      // 🔥 Перенаправляем намерение удалить наверх в main.js
      this.dispatchEvent(new CustomEvent('directory-delete', {
        detail: { profileId: e.detail.profileId },
        bubbles: true,
        composed: true
      }));
    });
  }

  updateStatus(searchQuery) {
    const query = searchQuery.trim();
    if (query === '') {
      this.statusElement.textContent = 'Showing all profiles.';
      return;
    }
    this.statusElement.textContent = `Searching database for "${query}"...`;
  }
}

customElements.define(ELEM_NAME, ProfileDirectory);

export default ProfileDirectory;
```

```js
  // Получаем ссылку на элемент директории в DOM (id должен совпадать с разметкой в index.html)
  const directoryElem = document.getElementById('profile-directory');

  // 1. Подписываемся на события фонового воркера СУБД
  dbManager.subscribe((type, payload) => {
    console.log(`[Main Thread] DB Worker Event: ${type}`, payload);
    
    switch (type) {
      case 'DB_READY':
      case 'SAVE_SUCCESS':
      case 'DELETE_SUCCESS':
        // При инициализации, сохранении или удалении запрашиваем актуальный срез данных
        // Если была активна строка поиска, можно сохранять её состояние, пока шлем пустую строку
        dbManager.searchProfiles(''); 
        break;

      case 'PROFILES_LIST':
        // 🔥 Поймали массив данных из SQLite — прокидываем в сеттер компонента
        if (directoryElem) {
          directoryElem.data = payload;
        }
        break;

      case 'ERROR':
        console.error(`[Main Thread] DB Worker Error:`, payload);
        break;
    }
  });

  // 2. Слушаем кастомные всплывающие события от самого веб-компонента
  document.addEventListener('directory-ready', () => {
    console.log('Main Thread: Компонент директории смонтирован. Запрашиваем данные...');
    dbManager.searchProfiles('');
  });

  document.addEventListener('directory-search', (e) => {
    console.log(`Main Thread: Пользователь ищет: "${e.detail.query}"`);
    dbManager.searchProfiles(e.detail.query);
  });

  document.addEventListener('directory-delete', (e) => {
    console.log(`Main Thread: Запрос на удаление ID: ${e.detail.profileId}`);
    dbManager.deleteProfile(e.detail.profileId);
  });
```