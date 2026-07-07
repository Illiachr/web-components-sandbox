import { CUSTOM_EVENTS, OPEN } from '../../metadata/constants.js';
import { template, TEMPLATE_SHARED_CONST } from './template.js';
import stylesheet from './styles.css' with {type: 'css'};

const ELEM_NAME = 'profile-form';
const FORM_TITLES = {
  CREATE_PROFILE: 'Create profile',
  EDIT_PROFILE: 'Edit profile',
}
const INITIAL_STATE = {
  id: null,
  name: '',
  role: ''
}

class ProfileForm extends HTMLElement {
  #state = INITIAL_STATE

  constructor() {
    super();

    this.attachShadow({ mode: OPEN });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.formElement = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.FORM_ELEM_ID);
    this.formTitleElement = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.TITLE_ELEM_ID);
    this.nameErrElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.NAME_ERR_ELEM_ID);
    this.roleErrElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.ROLE_ERR_ELEM_ID);
  }

  set profileData(data) {    
    this.#state = { ...this.#state, ...data };
    this.render();
  }

  connectedCallback() {
    this.formElement.addEventListener('submit', (e) => { this.handleSubmit(e) });
  }

  onRouterEnter() {
    if (window.location.pathname === '/create') {
      this.reset();
      this.render();
    }
  }

  reset() {
    this.formElement.reset();
    this.nameErrElem.hide();
    this.roleErrElem.hide();
    this.#state = INITIAL_STATE;
  }

  render() {
    console.dir(this.#state);
    console.dir(this);
    this.formTitleElement.textContent = this.#state.id ? FORM_TITLES.EDIT_PROFILE : FORM_TITLES.CREATE_PROFILE;

    for (const key in this.#state) {
      console.log(key);      
      if (key === 'id') continue;      
      this.formElement[key].value = this.#state[key];
    }

  }

  handleSubmit(event) {
    event.preventDefault();
    const isValid = this.validateForm();
    if (!isValid) return;

    const formData = new FormData(this.formElement);
    const payload = {
      id: this.#state.id,
      name: formData.get('name'),
      role: formData.get('role'),
    };

    const saveProfileEvent = new CustomEvent(CUSTOM_EVENTS.PROFILE_SAVE, {
      detail: payload,
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(saveProfileEvent);

    if (!this.#state.id) this.formElement.reset();
  }

  validateForm() {
    let isValid = true;
    const nameInputElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.NAME_INPUT_ELEM_ID);
    const nameErrElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.NAME_ERR_ELEM_ID);
    const roleInputElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.ROLE_INPUT_ELEM_ID);
    const roleErrElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.ROLE_ERR_ELEM_ID);
    // Name is too short
    if (!nameInputElem.checkValidity()) {
      nameErrElem.show('Name is too short!');
      isValid = false;
    }

    if (!roleInputElem.checkValidity()) {
      roleErrElem.show('Role is required');
      isValid = false;
    }

    return isValid;
  }
}

customElements.define(ELEM_NAME, ProfileForm);

export default ProfileForm;
