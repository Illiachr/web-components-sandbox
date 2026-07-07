const TEMPLATE_CONST = {
  ELEM_NAME: 'template',
  TITLE: 'Create Profile',
  TEXT: 'Type something to search...',
  TYPE: 'text',
};

const TEMPLATE_SHARED_CONST = {
  FORM_ELEM_ID: 'profile-form',
  TITLE_ELEM_ID: 'form-title',
  NAME_INPUT_ELEM_ID: 'name',
  ROLE_INPUT_ELEM_ID: 'role',
  NAME_ERR_ELEM_ID: 'name-error',
  ROLE_ERR_ELEM_ID: 'role-error',
};

const template = document.createElement(TEMPLATE_CONST.ELEM_NAME);
template.innerHTML = `<form novalidate id="${TEMPLATE_SHARED_CONST.FORM_ELEM_ID}">
    <h3 id="form-title">${TEMPLATE_CONST.TITLE}</h3>
    <div class="form-group">
      <label for="name">Specialist Name</label>
      <input type="text" id="${TEMPLATE_SHARED_CONST.NAME_INPUT_ELEM_ID}" name="name" required minlength="3" />
      <validation-message class="error" id="${TEMPLATE_SHARED_CONST.NAME_ERR_ELEM_ID}"></validation-message>
    </div>
    <div class="form-group">
      <label for="role">Specialisation</label>
      <input type="text" id="${TEMPLATE_SHARED_CONST.ROLE_INPUT_ELEM_ID}" name="role" required>
      <validation-message class="error" id="${TEMPLATE_SHARED_CONST.ROLE_ERR_ELEM_ID}"></validation-message>
    </div>

    <button type="submit">Save</button>
  </form>`;

export {
  template,
  TEMPLATE_SHARED_CONST
};
