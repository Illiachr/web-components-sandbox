import { template, TEMPLATE_SHARED_CONST } from "./template.js";
import stylesheet from './styles.css' with {type: 'css'};
import { CUSTOM_EVENTS, OPEN } from '../../metadata/constants.js';

const ELEM_NAME = 'app-router';

class AppRouter extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: OPEN });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.outlet = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.ROUTER_OUTLET);
  }

  connectedCallback() {
    window.addEventListener('popstate', () => { this.handleRoute(); });

    window.addEventListener(CUSTOM_EVENTS.APP_NAVIGATE, (e) => {
      const { url } = e.detail;
      window.history.pushState(null, '', url);
      this.handleRoute();
      setTimeout(() => { this.handleRoute() }, 0);
    });
  }

  handleRoute() {
    const path = window.location.pathname;
    const pages = Array.from(this.children);
    
    const pageHandler = (page) => {
      const routeAttr = page.getAttribute('route');
      if (routeAttr !== path) {
        page.classList.remove('active');
        return; 
      }
      page.classList.add('active');
      if (typeof page.onRouterEnter === 'function') {
        page.onRouterEnter();
      }
    };

    pages.forEach(pageHandler);
  }
}

customElements.define(ELEM_NAME, AppRouter);

export default AppRouter;
