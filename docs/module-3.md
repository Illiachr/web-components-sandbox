**Модуль 3: Управление состоянием и формами (State & Forms)**.

В предыдущих модулях мы научились связывать компоненты через события. Теперь мы поднимемся на уровень выше и разберем, как веб-компоненты управляют динамическими данными, которые пользователь вводит в форму, как эти данные валидируются и как обновляется интерфейс при изменении состояния приложения (State-driven UI).

В этом модуле мы создадим полноценную **Форму редактирования профиля** (`profile-form.js`), которая будет управлять сложным состоянием (объектом данных) без использования сторонних библиотек.

---

## 1. Теоретическая база

При работе с формами в нативных веб-компонентах нужно понимать две ключевые концепции:

### Что такое Состояние (State)?

Состояние — это просто JavaScript-объект, который отражает текущее «положение дел» в компоненте. Например, для формы состояние — это текущие значения полей `{ name: 'Ivan', role: 'Dev' }`.
В чистом JavaScript нет автоматической реактивности (как в Vue или React), поэтому мы используем паттерн **явного рендеринга**:

1. Данные в объекте состояния меняются.
2. Мы вручную вызываем метод `this.render()`, который обновляет только нужные кусочки DOM.

### Сбор данных через FormData

Вместо того чтобы вручную вешать слушатели на каждый `<input>` и сохранять каждую букву в переменную, в веб-стандартах принято использовать встроенный класс `FormData`. Он позволяет одной строчкой собрать все данные из HTML-формы, если у полей ввода заполнен атрибут `name`.

---

## 2. Разбор архитектуры формы (`profile-form.js`)

Мы создадим форму, которая может работать в двух режимах: **создание** нового профиля или **редактирование** существующего. Она будет принимать объект данных, распределять его по полям, а при отправке (событие `submit`) — валидировать данные и отправлять их родителю.

Создайте файл `profile-form.js` в вашем проекте:

```javascript
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
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-weight: 500; margin-bottom: 0.25rem; }
    input {
      padding: 0.5rem;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
    }
    .error { color: #dc3545; font-size: 0.85rem; margin-top: 0.25rem; display: none; }
    .error[visible] { display: block; }
    button {
      padding: 0.6rem 1.2rem;
      background: #0d6efd;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover { background: #0b5ed7; }
  </style>

  <form id="edit-form">
    <h3 id="form-title">Создать профиль</h3>
    
    <div class="form-group">
      <label for="name">Имя специалиста</label>
      <input type="text" id="name" name="name" required minlength="3" />
      <div class="error" id="name-error">Имя должно быть не короче 3 символов</div>
    </div>

    <div class="form-group">
      <label for="role">Специализация</label>
      <input type="text" id="role" name="role" required />
      <div class="error" id="role-error">Поле обязательно для заполнения</div>
    </div>

    <button type="submit">Сохранить</button>
  </form>
`;

export class ProfileForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.form = this.shadowRoot.getElementById('edit-form');
    this.titleEl = this.shadowRoot.getElementById('form-title');
    
    // Внутреннее состояние (State) компонента по умолчанию
    this._state = {
      id: null,
      name: '',
      role: ''
    };
  }

  // Сеттер для загрузки данных в форму (например, при редактировании)
  set profileData(data) {
    this._state = { ...this._state, ...data };
    this.render();
  }

  connectedCallback() {
    // Перехватываем стандартную отправку формы браузером
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  // Метод рендеринга (синхронизация State -> DOM)
  render() {
    this.titleEl.textContent = this._state.id ? 'Редактировать профиль' : 'Создать профиль';
    
    // Заполняем поля формы текущим состоянием
    this.shadowRoot.getElementById('name').value = this._state.name;
    this.shadowRoot.getElementById('role').value = this._state.role;
  }

  handleSubmit(event) {
    event.preventDefault(); // Отменяем перезагрузку страницы

    // 1. Используем нативный FormData для сбора всех полей по их атрибуту 'name'
    const formData = new FormData(this.form);
    const updatedData = {
      id: this._state.id, // Сохраняем старый ID, если он был
      name: formData.get('name'),
      role: formData.get('role')
    };

    // 2. Нативная валидация с помощью Constraint Validation API
    if (!this.validateForm()) {
      return; // Если есть ошибки, прерываем отправку
    }

    // 3. Если всё ок — отправляем кастомное событие наверх родителю
    const saveEvent = new CustomEvent('profile-save', {
      detail: updatedData,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(saveEvent);

    // Очищаем форму после успешного создания
    if (!this._state.id) {
      this.form.reset();
    }
  }

  validateForm() {
    let isValid = true;
    const nameInput = this.shadowRoot.getElementById('name');
    const nameError = this.shadowRoot.getElementById('name-error');

    // Проверяем валидность поля с помощью встроенных правил HTML (required, minlength)
    if (!nameInput.checkValidity()) {
      nameError.setAttribute('visible', '');
      isValid = false;
    } else {
      nameError.removeAttribute('visible');
    }

    return isValid;
  }
}

customElements.define('profile-form', ProfileForm);

```

---

## 3. Интеграция в приложение (Обновляем `index.html`)

Давайте добавим форму на нашу тестовую страницу рядом с каталогом, чтобы увидеть, как они могут взаимодействовать через родителя (своего рода глобальное состояние).

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Модуль 3: Управление состоянием и формами</title>
  <style>
    body { background-color: #f1f3f5; font-family: sans-serif; display: flex; gap: 2rem; justify-content: center; padding: 2rem; }
  </style>
</head>
<body>

  <profile-directory id="directory"></profile-directory>

  <profile-form id="form"></profile-form>

  <script type="module">
    import { ProfileDirectory } from './profile-directory.js';
    import { ProfileForm } from './profile-form.js';

    const directory = document.getElementById('directory');
    const form = document.getElementById('form');

    // Слушаем, когда форма сообщает об успешном сохранении данных
    document.body.addEventListener('profile-save', (event) => {
      const newProfile = event.detail;
      
      // Логика добавления данных в каталог
      // Нам нужно добавить новый объект в массив внутри <profile-directory>
      if (directory.profiles) {
        newProfile.id = Date.now(); // Генерируем временный ID
        directory.profiles.push(newProfile);
        
        // Триггерим обновление списка в каталоге, принудительно прокинув данные вниз
        directory.filterProfiles(''); 
      }
    });
  </script>
</body>
</html>

```

*Примечание:* Чтобы в `index.html` сработал код `directory.profiles.push`, в файле `profile-directory.js` из Модуля 2 метод `filterProfiles(query)` должен быть доступен снаружи (не быть приватным), что у нас и сделано.

---

## 4. Домашнее задание (Практика)

В репозитории Тимура Шемсединова форма не просто создает элементы, она умеет открывать существующий профиль для редактирования при клике на него.

### Спецификация задания:

1. Вернитесь к компоненту списка `profile-list.js`. Сделайте так, чтобы при клике на саму карточку профиля (или на отдельную кнопку «Редактировать») генерировалось кастомное событие `'edit-profile'`, в `detail` которого передается весь объект профиля `{id, name, role}`.
2. В `index.html` (или в родительском компоненте) поймайте это событие `'edit-profile'`.
3. При наступлении этого события передайте данные выбранного профиля в форму через созданный нами сеттер: `form.profileData = event.detail;`.
4. Модифицируйте обработку `'profile-save'`: если у сохраненного профиля уже есть `id`, вместо `push()` в массив, найдите этот профиль в массиве `directory.profiles` по `id` и обновите его поля.

Выполнение этого задания свяжет каталог и форму в единую CRUD-систему (Create, Read, Update).
