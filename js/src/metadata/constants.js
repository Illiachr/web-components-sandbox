const OPEN = 'open';

const ELEM_IDS = {
  APP: 'app',
  PROFILE_DIR: 'app-profile-dir',
  PROFILE_FORM: 'app-profile-form',
  PROFILE_FORM_EDIT: 'app-profile-form-edit',
  MSG_ELEM: 'error-msg',
  SHOW_BTN: 'show-msg-btn',
  HIDE_BTN: 'hide-msg-btn'
};

const CUSTOM_EVENTS = {
  PROFILE_DIR_READY: 'directory-ready',
  PROFILE_DIR_SEARCH: 'directory-search',
  PROFILE_DIR_DELETE: 'directory-delete',
  APP_NAVIGATE: 'app-navigate',
  SEARCH_CHANGE: 'search-change',
  PROFILE_EDIT: 'profile-edit',
  PROFILE_DELETE: 'profile-delete',
  PROFILE_SAVE: 'profile-save',
}

export {
  OPEN,
  ELEM_IDS,
  CUSTOM_EVENTS
};
