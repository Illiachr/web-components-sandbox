import { template } from './template.js';
import stylesheet from './validation-message.css' with { type: 'css' };

export class ValidationMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    // this.shadowRoot.innerHTML = `<span class="error-icon">⚠️</span><span id="text"></span>`
    this.textElement = this.shadowRoot.getElementById('text');
  }

  connectedCallback() {
  }

  disconnectedCallback() {

  }

  show(msg) {
    this.textElement.textContent = msg;
    this.setAttribute('visible', '');
  }

  hide() {
    this.removeAttribute('visible');
    this.textElement.textContent = '';
  }
}

customElements.define('validation-message', ValidationMessage);
