**Модуль 4: Нативный роутинг (Native Routing)**!

В современных Single Page Applications (SPA) мы не перезагружаем страницу при переходе по ссылкам. Вместо этого JavaScript перехватывает клики, меняет URL в адресной строке и переключает видимость веб-компонентов на экране.

В этом модуле мы создадим легкий, декларативный роутер полностью на стандартах платформы (без библиотек вроде React Router).

---

## 1. Теоретическая база

Нативный роутинг в браузере держится на трех китах:

1. **`window.history.pushState()`** — метод, который позволяет изменить URL в адресной строке браузера (например, с `/` на `/edit`), **не вызывая** перезагрузку страницы.
2. **Событие `popstate**` — глобальное событие окна (`window`), которое срабатывает, когда пользователь нажимает кнопки «Назад» или «Вперед» в интерфейсе браузера.
3. **Кастомные события для навигации** — так как метод `pushState()` сам по себе не генерирует никаких событий в JS, мы создадим кастомное событие (например, `app-navigate`), чтобы компоненты узнавали о смене страницы.

---

## 2. Архитектура роутера: Декларативный подход

Мы напишем компонент-контейнер `<app-router>`, который будет анализировать текущий URL и решать, какой из дочерних компонентов сейчас отображать: список профилей или форму.

### Шаг 1: Создаем компонент роутера (`app-router.js`)

Этот компонент управляет отображением страниц. Мы будем использовать простую схему переключения через атрибут `hidden` или динамический рендеринг.

```javascript
export class AppRouter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; }
        .page { display: none; }
        .page.active { display: block; }
      </style>
      
      <div id="router-outlet">
        <slot></slot>
      </div>
    `;

    this.outlet = this.shadowRoot.getElementById('router-outlet');
  }

  connectedCallback() {
    // 1. Слушаем кнопки «Назад / Вперед» браузера
    window.addEventListener('popstate', () => this.handleRoute());

    // 2. Слушаем наше кастомное событие перехода по приложению
    window.addEventListener('app-navigate', (e) => {
      const url = e.detail.url;
      // Меняем URL в строке браузера без перезагрузки
      window.history.pushState(null, '', url);
      // Переключаем страницу
      this.handleRoute();
    });

    // Из-за особенностей работы со слотами, подождем пока дочерние элементы распределятся
    setTimeout(() => this.handleRoute(), 0);
  }

  handleRoute() {
    // Получаем текущий путь (например, "/" или "/edit")
    const path = window.location.pathname;
    
    // Находим все дочерние элементы, переданные в слот (наши страницы)
    const pages = Array.from(this.children);

    pages.forEach(page => {
      // Каждый компонент-страница должен иметь атрибут route (например, route="/edit")
      const routeAttr = page.getAttribute('route');
      
      if (routeAttr === path) {
        page.classList.add('active');
        // Если у компонента есть метод активации — вызываем его
        if (typeof page.onRouteEnter === 'function') {
          page.onRouteEnter();
        }
      } else {
        page.classList.remove('active');
      }
    });
  }
}

customElements.define('app-router', AppRouter);

```

---

### Шаг 2: Создаем кастомную ссылку (`app-link.js`)

Обычный тег `<a href="/path">` заставит браузер перезагрузить страницу. Создадим обертку, которая перехватывает клик и превращает его в наше событие `app-navigate`.

```javascript
export class AppLink extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        a { color: #0d6efd; text-decoration: none; cursor: pointer; }
        a:hover { text-decoration: underline; }
      </style>
      <a id="link"><slot></slot></a>
    `;
    this.link = this.shadowRoot.getElementById('link');
  }

  connectedCallback() {
    this.link.addEventListener('click', (e) => {
      e.preventDefault(); // Запрещаем браузеру перезагружать страницу
      const to = this.getAttribute('to');

      // Отправляем глобальное событие навигации
      window.dispatchEvent(new CustomEvent('app-navigate', {
        detail: { url: to }
      }));
    });
  }
}

customElements.define('app-link', AppLink);

```

---

## 3. Собираем всё вместе в `index.html`

Теперь мы можем обернуть наши компоненты каталога (`profile-directory`) и формы (`profile-form`) в наш новый роутер.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Модуль 4: Нативный роутинг</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f8f9fa; margin: 0; padding: 2rem; }
    nav { max-width: 600px; margin: 0 auto 1rem; display: flex; gap: 1rem; }
    /* Стили для управления видимостью страниц роутера */
    app-router > * { display: none; }
    app-router > .active { display: block; }
  </style>
</head>
<body>

  <nav>
    <app-link to="/">Каталог</app-link>
    <app-link to="/create">Добавить мастера</app-link>
  </nav>

  <app-router>
    <profile-directory route="/"></profile-directory>
    <profile-form id="app-form" route="/create"></profile-form>
  </app-router>

  <script type="module">
    import { AppRouter } from './app-router.js';
    import { AppLink } from './app-link.js';
    import { ProfileDirectory } from './profile-directory.js';
    import { ProfileForm } from './profile-form.js';
    
    // Сюда можно перенести ту самую CRUD логику связывания формы и каталога из Модуля 3!
  </script>
</body>
</html>

```

*Важное примечание для тестирования:* Метод `pushState` из соображений безопасности работает только тогда, когда проект запущен через локальный сервер (например, VS Code Live Server). Если просто открыть `index.html` дважды кликнув по файлу на диске (`file:///...`), браузер выдаст ошибку безопасности.

---

## 4. Практическое задание (Домашняя работа)

Сейчас наш роутер умеет переключать статичные пути (`/` и `/create`). Но для полноценного приложения нам нужно уметь открывать конкретный профиль для редактирования, например по адресу `/edit`.

### Спецификация задания:

1. В компоненте `profile-list.js` при клике на кнопку «Редактировать» вместо отправки события наружу, совершайте переход на страницу редактирования с помощью генерации события `app-navigate` на адрес `'/create'`.
2. Перед осуществлением перехода сохраните редактируемый объект во временное «глобальное» хранилище (или передайте его в форму напрямую через JS до генерации события).
3. Сделайте так, чтобы при переходе на `/create` форма автоматически открывалась с данными этого профиля (а если мы нажали «Добавить мастера» в меню — форма должна быть пустой). *Подсказка: используйте метод `onRouteEnter()` внутри формы для проверки, есть ли данные для предзаполнения.*

Я сгенерировал полноценный гайд по роутингу. Вы можете скопировать этот текст и сохранить себе как `module_4_routing.md`.
