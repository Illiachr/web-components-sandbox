```python
import os

md_content = """# Модуль 1: Анатомия нативного компонента («Атомы»)

Добро пожаловать в первый модуль практического курса по веб-компонентам! Здесь мы разберем, как устроен нативный кастомный элемент, как работает изоляция стилей с помощью Shadow DOM, и создадим первый изолированный кирпичик нашего приложения.

---

## 1. Теоретическая база

В основе Web Components лежат три технологии, встроенные прямо в браузер:
1. **Custom Elements API** — позволяет регистрировать новые HTML-теги в браузере и связывать их с JavaScript-классами.
2. **Shadow DOM (Теневой DOM)** — механизм полной изоляции HTML-разметки и CSS-стилей компонента. Никакой внешний глобальный стиль не сможет «сломать» верстку внутри компонента, а стили компонента не «вытекут» наружу.
3. **HTML Templates (`<template>`)** — теги для хранения инертных заготовок разметки, которые не рендерятся браузером до тех пор, пока их явно не склонируют и не вставят в DOM.

### Ключевые хуки жизненного цикла (Lifecycle Hooks)
Кастомные элементы наследуются от класса `HTMLElement` и обладают методами-хуками, которые браузер вызывает автоматически:
* `constructor()` — вызывается при создании экземпляра элемента. Идеальное место для инициализации Shadow DOM и привязки шаблона. **Запрещено** манипулировать атрибутами или дочерними элементами страницы.
* `connectedCallback()` — вызывается, когда элемент добавляется в DOM-дерево документа. Здесь настраиваются слушатели событий, запускаются таймеры или делаются первичные сетевые запросы.
* `disconnectedCallback()` — вызывается при удалении элемента из DOM. Обязательное место для очистки памяти: снятия глобальных слушателей (например, со `window` или `body`) и сброса таймеров.
* `attributeChangedCallback(name, oldValue, newValue)` — срабатывает при изменении отслеживаемых атрибутов. Чтобы он работал, нужно обязательно объявить статический геттер `observedAttributes`.

---

## 2. Разбор кода: Компонент `validation-message.js`

Создайте в своей рабочей директории файл `validation-message.js` и добавьте в него следующий код. Это адаптация простейшего изолированного «атома» из репозитория:


```

```text
File generated successfully.

```javascript
// 1. Создаем шаблон компонента, который парсится браузером один раз при загрузке скрипта
const template = document.createElement('template');
template.innerHTML = `
  <style>
    /* :host ссылается на сам кастомный тег-контейнер <validation-message> */
    :host {
      display: none; /* По умолчанию компонент скрыт */
      color: #dc3545;
      font-size: 0.875rem;
      font-weight: 500;
      margin-top: 0.25rem;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    /* Стили применятся только тогда, когда на теге появится атрибут visible */
    :host([visible]) {
      display: block;
    }

    .error-icon {
      margin-right: 4px;
      display: inline-block;
    }
  </style>
  <span class="error-icon">⚠️</span><span id="text"></span>
`;

export class ValidationMessage extends HTMLElement {
  constructor() {
    super(); // Обязательный вызов для инициализации родительского класса HTMLElement
    
    // Создаем Shadow DOM в режиме 'open'. Режим open позволяет обращаться к теневому дереву извне через элемент.shadowRoot
    this.attachShadow({ mode: 'open' });
    
    // Клонируем содержимое шаблона и добавляем его в корень Shadow DOM
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    // Кешируем ссылку на внутренний элемент, чтобы не искать его при каждом вызове show()
    this.textElement = this.shadowRoot.getElementById('text');
  }

  connectedCallback() {
    console.log('<validation-message> успешно добавлен в DOM-дерево страницы.');
  }

  disconnectedCallback() {
    console.log('<validation-message> удален из DOM-дерева страницы.');
  }

  /**
   * Публичный метод для отображения ошибки
   * @param {string} message - Текст сообщения об ошибке
   */
  show(message) {
    // Безопасная вставка текста: textContent защищает от XSS атак, кодируя спецсимволы вроде < или >
    this.textElement.textContent = message;
    this.setAttribute('visible', ''); // Добавляем атрибут, чтобы сработал CSS-селектор :host([visible])
  }

  /**
   * Публичный метод для скрытия ошибки
   */
  hide() {
    this.removeAttribute('visible');
    this.textElement.textContent = '';
  }
}

// Регистрация кастомного элемента в глобальном реестре. 
// Имя тега ОБЯЗАТЕЛЬНО должно содержать как минимум один дефис (-), чтобы избежать конфликтов с будущими тегами HTML-стандарта.
customElements.define('validation-message', ValidationMessage);

```

---

## 3. Подключение и тестирование (`index.html`)

Создайте файл `index.html` в той же папке:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Модуль 1: Тестирование Web Components</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      background-color: #f8f9fa;
      color: #212529;
    }
    .card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      max-width: 400px;
    }
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-weight: 500;
      margin-right: 0.5rem;
    }
    button:hover {
      background: #f1f3f5;
    }
  </style>
</head>
<body>

  <div class="card">
    <h3>Проверка валидации</h3>
    <p>Наш кастомный компонент находится прямо под этой строкой:</p>
    
    <validation-message id="test-error"></validation-message>
    
    <div style="margin-top: 1.5rem;">
      <button id="btn-show">Показать ошибку</button>
      <button id="btn-hide">Скрыть</button>
    </div>
  </div>

  <script type="module">
    import { ValidationMessage } from './validation-message.js';

    const errorEl = document.getElementById('test-error');
    const showBtn = document.getElementById('btn-show');
    const hideBtn = document.getElementById('btn-hide');

    showBtn.addEventListener('click', () => {
      // Вызываем публичный метод инкапсулированного класса
      errorEl.show('Введен некорректный адрес электронной почты!');
    });

    hideBtn.addEventListener('click', () => {
      errorEl.hide();
    });
  </script>
</body>
</html>

```

> ⚠️ **Важно:** Поскольку мы используем нативные ES-модули (`import`/`export`), файлы нельзя открывать двойным кликом по `index.html` (через протокол `file://`). Запустите локальный сервер (например, расширение **Live Server** в VS Code, или выполнив команду `npx serve` в терминале этой папки).

---

## 4. Домашнее задание (Практика)

Чтобы закрепить материал, вам необходимо самостоятельно создать более сложный компонент — **`profile-field.js`**, который в будущем станет частью формы редактирования профилей.

### Спецификация компонента `profile-field`:

1. Шаблон должен содержать структуру: `<label><span id="label-text"></span><input type="text" /></label>`.
2. Компонент должен принимать атрибут `label` (например, `<profile-field label="Имя пользователя"></profile-field>`) и динамически выводить его значение в тег `<span id="label-text">`.
3. Для реализации отслеживания атрибута воспользуйтесь реактивным хуком `attributeChangedCallback`.

**Подсказка по реализации реактивности атрибутов:**

```javascript
export class ProfileField extends HTMLElement {
  // 1. Обязательно указываем список атрибутов, за изменением которых следит браузер
  static get observedAttributes() {
    return ['label'];
  }

  // 2. Реализуем хук, который выполнится при добавлении или изменении атрибута 'label'
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'label' && this.shadowRoot) {
      const labelSpan = this.shadowRoot.getElementById('label-text');
      if (labelSpan) labelSpan.textContent = newValue;
    }
  }
}

```

Выполните домашнее задание, убедитесь, что поле ввода корректно отображает переданный лейбл, и переходите к **Модулю 2: Композиция и передача данных**.
"""

with open("module_1_anatomy.md", "w", encoding="utf-8") as f:
f.write(md_content)

print("File generated successfully.")

```
Your Markdown file for Module 1 is ready
[file-tag: code-generated-file-0-1781852558312491685]

Этот файл содержит подробное теоретическое описание первого модуля, детальный разбор исходного кода базового атомарного компонента `validation-message.js`, тестовую HTML-разметку для проверки в браузере, а также спецификацию к домашнему заданию (компонент `profile-field.js`) с готовыми подсказками по реактивности атрибутов.

```