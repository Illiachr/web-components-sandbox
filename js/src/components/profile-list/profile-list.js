import profileListTemplate from './template.js';
import stylesheet from './styles.css' with {type: 'css'};
import { CUSTOM_EVENTS, OPEN } from '../../metadata/constants.js';

const ELEM_NAME = 'profile-list';

class ProfileList extends HTMLElement {
  constructor() {
    super();

    this.PROFILE_DELETE = 'profile-delete';

    this.attachShadow({ mode: OPEN });
    this.shadowRoot.appendChild(profileListTemplate.template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.listContainer = this.shadowRoot.getElementById(profileListTemplate.TEMPLATE_SHARED_CONST.ELEM_ID);

  }

  set data(profiles) {
    if (!profiles || profiles.lenght === 0) {
      this.listContainer.innerHTML = '<div class="empty">No profiles found</div>';
      return;
    }

    const profileCardBuilder = (profile) => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      const profileNameEl = document.createElement('div');
      profileNameEl.textContent = profile.name;
      const profileRoleEl = document.createElement('div');
      profileRoleEl.textContent = profile.role;

      const profileRemoveBtn = document.createElement('button');
      profileRemoveBtn.textContent = 'Delete';
      profileRemoveBtn.value = profile.id;

      card.appendChild(profileNameEl);
      card.appendChild(profileRoleEl);
      card.appendChild(profileRemoveBtn);

      card.addEventListener('click', () => { this.handleProfileEdit(profile.id); });

      profileRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.handleProfileRemove(profile.id);
      });

      const cardLinkWrapper = document.createElement('app-link');
      cardLinkWrapper.setAttribute('to', '/edit');
      cardLinkWrapper.appendChild(card);

      return cardLinkWrapper;
    };

    const elements = profiles.map(profileCardBuilder);
    this.listContainer.replaceChildren(...elements);
  }

  handleProfileEdit(profileId) {
    const payload = {
      detail: { profileId },
      bubbles: true,
      composed: true
    };
    const profileEditEvent = new CustomEvent(CUSTOM_EVENTS.PROFILE_EDIT, payload);
    this.dispatchEvent(profileEditEvent);
  }

  handleProfileRemove(val) {
    const profileRomoveEvent = new CustomEvent(this.PROFILE_DELETE, {
      detail: { profileId: val },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(profileRomoveEvent);
  }
}

customElements.define(ELEM_NAME, ProfileList);

export default ProfileList;
