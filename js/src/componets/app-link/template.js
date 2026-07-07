const TEMPLATE_CONST = {
  ELEM_NAME: 'template',
};

const TEMPLATE_SHARED_CONST = {
  LINK: 'link',
};

const template = document.createElement(TEMPLATE_CONST.ELEM_NAME);
template.innerHTML = `<a id="${TEMPLATE_SHARED_CONST.LINK}"><slot></slot></a>`;

export {
  template,
  TEMPLATE_SHARED_CONST
};