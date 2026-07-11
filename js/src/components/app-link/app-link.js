import { template, TEMPLATE_SHARED_CONST } from "./template.js";
import stylesheet from './styles.css' with {type: 'css'};
import { CUSTOM_EVENTS, OPEN } from '../../metadata/constants.js';

const ELEM_NAME = 'app-link';

class AppLink extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: OPEN });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.link = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.LINK);
  }

  connectedCallback() {
    this.link.addEventListener('click', (e) => {
      e.preventDefault();
      const to = this.getAttribute('to');
      const appNavEvent = new CustomEvent(CUSTOM_EVENTS.APP_NAVIGATE, {
        detail: { url: to }
      });
      window.dispatchEvent(appNavEvent);
    });
  }
}

customElements.define(ELEM_NAME, AppLink);

export default AppLink;
