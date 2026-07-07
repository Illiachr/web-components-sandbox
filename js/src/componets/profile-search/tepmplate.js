const TEMPLATE_CONST = {
  TYPE: 'text',
  PLACEHOLDER: 'Profile search...',
};

const TEMPLATE_SHARED_CONST = {
  ELEM_ID: 'search-input',
};

const template = document.createElement('template');
template.innerHTML = `<input type="${TEMPLATE_CONST.TYPE}" placeholder="${TEMPLATE_CONST.PLACEHOLDER}" id="${TEMPLATE_SHARED_CONST.ELEM_ID}" />`;

export {
  template,
  TEMPLATE_SHARED_CONST
};
