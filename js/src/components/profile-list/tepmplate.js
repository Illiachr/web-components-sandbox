const TEMPLATE_CONST = {
  ELEM_NAME: 'template',
};

const TEMPLATE_SHARED_CONST = {
  ELEM_ID: 'list',
};

const template = document.createElement(TEMPLATE_CONST.ELEM_NAME);
template.innerHTML = `<div id="${TEMPLATE_SHARED_CONST.ELEM_ID}" class="list-container"></div>`;

const profileListTemplate = {
  TEMPLATE_SHARED_CONST,
  template
};

export default profileListTemplate;
