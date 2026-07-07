# Модуль 2: Композиция и передача данных («Молекулы»)

Добро пожаловать во второй модуль! В первом модуле мы создали изолированный «атом» — компонент ошибки. Теперь мы научимся соединять компоненты друг с другом, чтобы строить сложные интерфейсы, не превращая код в спагетти.

В современной веб-архитектуре без фреймворков управление потоками данных строится на золотом правиле: **«Свойства — вниз, события — наверх»** (Props down, Events up).

---

## 1. Теоретическая база

Когда один веб-компонент вложен в другой, они должны оставаться максимально независимыми (слабосвязанными). Для этого используются два механизма:

### Свойства — вниз (Properties Down)

Родительский компонент передает сложные данные (массивы, объекты) вниз своим дочерним элементам.

* Вместо передачи больших объектов через HTML-атрибуты (которые могут принимать только строки), мы передаем их напрямую через JavaScript-свойства (Properties) дочернего элемента.
* Для этого в дочернем компоненте используются **геттеры и сеттеры** (`get` / `set`).

### События — наверх (Events Up)

Дочерний компонент никогда не должен напрямую менять данные родителя или вызывать его методы. Вместо этого, когда внутри дочернего элемента что-то происходит (клик, ввод текста, выбор элемента), он «выстреливает» **кастомное событие** (`CustomEvent`).

Чтобы событие могло успешно пройти сквозь границы изолированного Shadow DOM и подняться к родителю, при его создании используются два важных флага:

1. `bubbles: true` — позволяет событию подниматься выше по DOM-дереву к родительским тегам.
2. `composed: true` — **самый важный флаг**. Позволяет событию пересекать границу Shadow DOM и выходить в «светлый» DOM (Light DOM) родительского компонента.

---

## 2. Разбор архитектуры: Поиск и Список

Мы создадим интерфейс каталога, состоящий из трех компонентов:

1. `ProfileSearch` (Дочерний) — строка ввода с задержкой (debounce), генерирующая событие.
2. `ProfileList` (Дочерний) — безопасный список, принимающий массив данных.
3. `ProfileDirectory` (Родительский) — контейнер, который хранит данные, передает их в список и слушает события от поиска.

---

### Шаг 1: Компонент поиска (`profile-search.js`)

Этот компонент инкапсулирует логику текстового поля ввода и использует таймер задержки (`setTimeout`), чтобы не спамить родителя событиями при каждом нажатии клавиши.

```javascript
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; margin-bottom: 1.5rem; }
    input {
      padding: 0.75rem;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      font-size: 1rem;
    }
    input:focus { outline: 2px solid #0d6efd; }
  </style>
  <input type="text" placeholder="Поиск профилей..." id="search-input" />
`;

export class ProfileSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    this.inputElement = this.shadowRoot.getElementById('search-input');
    this.debounceTimeout = null;
  }

  connectedCallback() {
    this.inputElement.addEventListener('input', (e) => this.handleInput(e.target.value));
  }

  handleInput(value) {
    // Сбрасываем предыдущий таймер, если пользователь продолжает печатать
    clearTimeout(this.debounceTimeout);

    // Ждем 300мс тишины перед отправкой события
    this.debounceTimeout = setTimeout(() => {
      
      // Создаем кастомное событие. Передаем данные внутрь свойства 'detail'
      const searchEvent = new CustomEvent('search-change', {
        detail: { query: value },
        bubbles: true,   // Разрешаем подъем по дереву
        composed: true   // Разрешаем выход за пределы Shadow DOM!
      });

      this.dispatchEvent(searchEvent);
    }, 300);
  }
}

customElements.define('profile-search', ProfileSearch);

```

---

### Шаг 2: Компонент безопасного списка (`profile-list.js`)

Этот компонент принимает массив объектов. Для защиты от XSS-атак он **не использует** `innerHTML` для вставки данных пользователя, а генерирует элементы через `document.createElement` и заполняет их с помощью `textContent`.

```javascript
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    .list-container { display: flex; flex-direction: column; gap: 0.5rem; }
    .profile-card {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
      border-left: 4px solid #0d6efd;
    }
    .name { font-weight: bold; margin-bottom: 0.25rem; }
    .role { color: #6c757d; font-size: 0.9rem; }
    .empty { color: #6c757d; font-style: italic; }
  </style>
  <div id="list" class="list-container"></div>
`;

export class ProfileList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.listContainer = this.shadowRoot.getElementById('list');
  }

  // Сеттер "data" позволяет родителю передавать данные: listElement.data = [...]
  set data(profiles) {
    if (!profiles || profiles.length === 0) {
      this.listContainer.innerHTML = '<div class="empty">Ничего не найдено</div>';
      return;
    }

    // Создаем массив нативных DOM-элементов
    const elements = profiles.map(profile => {
      const card = document.createElement('div');
      card.className = 'profile-card';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.textContent = profile.name; // Безопасно от XSS

      const roleDiv = document.createElement('div');
      roleDiv.className = 'role';
      roleDiv.textContent = profile.role; // Безопасно от XSS

      card.appendChild(nameDiv);
      card.appendChild(roleDiv);
      return card;
    });

    // Очищаем старые элементы и вставляем новые за одну высокопроизводительную операцию
    this.listContainer.replaceChildren(...elements);
  }
}

customElements.define('profile-list', ProfileList);

```

---

### Шаг 3: Родительский компонент-контейнер (`profile-directory.js`)

Этот компонент оркестрирует всё подсистему. Он содержит изначальный массив данных, фильтрует его при получении события от поиска и спускает отфильтрованный результат обратно вниз в список.

```javascript
import { ProfileSearch } from './profile-search.js';
import { ProfileList } from './profile-list.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 500px;
      margin: 2rem auto;
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      font-family: system-ui, sans-serif;
    }
    h2 { margin-top: 0; color: #212529; }
  </style>
  
  <h2>Каталог специалистов</h2>
  
  <profile-search></profile-search>
  <profile-list id="profile-list"></profile-list>
`;

export class ProfileDirectory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.listComponent = this.shadowRoot.getElementById('profile-list');

    // Наш внутренний "источник истины" (State)
    this.profiles = [
      { id: 1, name: 'Тимур Шемсединов', role: 'System Architect & Node.js Expert' },
      { id: 2, name: 'Иван Иванов', role: 'Frontend Developer (Web Components)' },
      { id: 3, name: 'Алексей Петров', role: 'UI/UX Designer' }
    ];
  }

  connectedCallback() {
    // Первичная инициализация списка: передаем данные вниз
    this.listComponent.data = this.profiles;

    // Слушаем кастомное событие, поднявшееся из глубины <profile-search>
    this.shadowRoot.addEventListener('search-change', (event) => {
      const query = event.detail.query.toLowerCase().trim();
      this.filterProfiles(query);
    });
  }

  filterProfiles(query) {
    if (query === '') {
      // Если поиск пустой — спускаем полный список
      this.listComponent.data = this.profiles;
    } else {
      // Иначе фильтруем массив и спускаем только совпадения
      const filtered = this.profiles.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.role.toLowerCase().includes(query)
      );
      this.listComponent.data = filtered;
    }
  }
}

customElements.define('profile-directory', ProfileDirectory);

```

---

## 3. Подключение в `index.html`

Обновите тело вашего файла `index.html`, чтобы запустить собранную систему:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Модуль 2: Композиция компонентов</title>
  <style>
    body { background-color: #f1f3f5; margin: 0; padding: 1rem; }
  </style>
</head>
<body>

  <profile-directory></profile-directory>

  <script type="module">
    import { ProfileDirectory } from './profile-directory.js';
  </script>
</body>
</html>

```

---

## 4. Домашнее задание (Практика)

Чтобы закрепить концепцию связи компонентов через события, добавьте в систему функционал **удаления профиля**.

### Спецификация задания:

1. Модифицируйте компонент `profile-list.js`. При генерации карточки (`.profile-card`) добавьте внутрь нее кнопку удаления: `<button class="delete-btn">Удалить</button>`.
2. Повесьте на эту кнопку слушатель клика. При нажатии на кнопку карточка должна отправить наверх кастомное событие `'delete-profile'`.
3. Обязательно передайте в свойстве `detail` уникальный `id` удаляемого профиля (для этого вам нужно будет расширить генерацию элементов, чтобы карточка знала свой `id`).
4. В родительском компоненте `profile-directory.js` подпишитесь на событие `'delete-profile'`. При его срабатывании удалите элемент из массива `this.profiles` (например, через `.filter()`) и обновите отображение списка.