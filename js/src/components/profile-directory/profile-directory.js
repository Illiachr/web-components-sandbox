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

  set data(profiles) {
    if (this.listElement) {
      this.listElement.data = profiles;
    }
  }

  connectedCallback() {
    this.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.PROFILE_DIR_READY, {
      bubbles: true,
      composed: true
    }));
    this.shadowRoot.addEventListener(CUSTOM_EVENTS.SEARCH_CHANGE, (e) => {
      const searchQuery = e.detail.query;
      this.updateStatus(searchQuery);
      this.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.PROFILE_DIR_SEARCH, {
        detail: { query: searchQuery },
        bubbles: true,
        composed: true
      }));
    });

    this.shadowRoot.addEventListener(CUSTOM_EVENTS.PROFILE_DELETE, (e) => {
      this.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.PROFILE_DIR_DELETE, {
        detail: { profileId: e.detail.profileId },
        bubbles: true,
        composed: true
      }));
    })
  }

  updateStatus(searchQuery) {
    const query = searchQuery.trim()
    if (query === '') {
      this.statusElement.textContent = 'Showing all profiles.';
      return;
    }

    this.statusElement.textContent = `Searching database for ${query}`;
  }
}

customElements.define(ELEM_NAME, ProfileDirectory);

export default ProfileDirectory;
