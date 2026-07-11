import { template, TEMPLATE_SHARED_CONST } from './tepmplate.js'
import stylesheet from './profile-search.css' with {type: 'css'};
import { OPEN } from '../../metadata/constants.js';

const PROFILE_SEARCH = 'profile-search';

class ProfileSearch extends HTMLElement {
  constructor() {
    super();

    this.DEBOUNCE_DURATION = 300;
    this.SEARCH_EVENT = 'search-change';

    this.attachShadow({ mode: OPEN });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.inputElement = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.ELEM_ID);
    this.debounceTimeout = null;
  }

  connectedCallback() {
    this.inputElement.addEventListener('input', (e) => this.handleInput(e.target.value));
  }

  handleInput(value) {
    const handler = () => {
      const searchEvent = new CustomEvent(this.SEARCH_EVENT, {
        detail: { query: value },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(searchEvent);
    };
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(handler, this.DEBOUNCE_DURATION);
  }
}

customElements.define(PROFILE_SEARCH, ProfileSearch);

export default ProfileSearch;
