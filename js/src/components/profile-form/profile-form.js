import { CUSTOM_EVENTS, OPEN } from '../../metadata/constants.js';
import { template, TEMPLATE_SHARED_CONST } from './template.js';
import stylesheet from './styles.css' with {type: 'css'};

const ELEM_NAME = 'profile-form';
const FORM_TITLES = {
  CREATE_PROFILE: 'Create profile',
  EDIT_PROFILE: 'Edit profile',
  PROFILE_DETAILS: 'Profile Details'
}
const INITIAL_STATE = {
  id: null,
  name: '',
  role: '',
  mode: 'create',
}

class ProfileForm extends HTMLElement {
  #state = INITIAL_STATE;
  #renderPending = null;

  constructor() {
    super();

    this.attachShadow({ mode: OPEN });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.formElement = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.FORM_ELEM_ID);
    this.editBtn = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.EDIT_BTN_ID);
    this.formTitleElement = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.TITLE_ELEM_ID);
    this.nameErrElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.NAME_ERR_ELEM_ID);
    this.roleErrElem = this.shadowRoot.getElementById(TEMPLATE_SHARED_CONST.ROLE_ERR_ELEM_ID);
  }

  set profileData(data) {
    this.#state = { ...this.#state, ...data };
    this.debounceRender()
  }

  connectedCallback() {
    this.abortController = new AbortController()
    this.formElement.addEventListener(
      'submit',
      (e) => { this.handleSubmit(e) },
      { signal: this.abortController.signal });

    this.editBtn.addEventListener(
      'click',
      () => { this.setAttribute('mode', 'edit'); },
      { signal: this.abortController.signal });
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  onRouteEnter() {
    if (window.location.pathname === '/create') {
      this.reset();
      this.debounceRender()
    }
  }

  static get observedAttributes() {
    return ['mode'];
  }

  attributeChangedCallback(name, prevVal, newVal) {
    if (prevVal === newVal) return;

    if (name === 'mode') {
      this.#state.mode = newVal;
      this.debounceRender()
    }
  }

  reset() {
    this.formElement.reset();
    this.nameErrElem.hide();
    this.roleErrElem.hide();
    this.#state = { ...INITIAL_STATE };
    this.debounceRender()
  }

  debounceRender() {
    if (this.#renderPending) {
      cancelAnimationFrame(this.#renderPending);
    }

    const handler = () => {
      this.render();
      this.#renderPending = null;
    };

    this.#renderPending = requestAnimationFrame(handler);
  }

  render() {
    this.formTitleElement.textContent = this.#state.id ? FORM_TITLES.PROFILE_DETAILS : FORM_TITLES.CREATE_PROFILE;

    if (this.#state.mode === 'edit')
      this.formTitleElement.textContent = FORM_TITLES.EDIT_PROFILE;

    for (const key in this.#state) {
      if (['id', 'mode'].includes(key)) continue;
      if (!this.formElement[key]) continue;
        console.log(key);
        this.formElement[key].value = this.#state[key] || '';
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
