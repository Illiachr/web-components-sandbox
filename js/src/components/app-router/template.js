const TEMPLATE_CONST = {
  ELEM_NAME: 'template',
};

const TEMPLATE_SHARED_CONST = {
  ROUTER_OUTLET: 'router-outlet',
};

const template = document.createElement(TEMPLATE_CONST.ELEM_NAME);
template.innerHTML = `<div id="${TEMPLATE_SHARED_CONST.ROUTER_OUTLET}"><slot></slot></div>`;

export {
  template,
  TEMPLATE_SHARED_CONST
};