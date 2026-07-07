const TEMPLATE_CONST = {
  ELEM_NAME: 'template',
  TITLE: 'Profile Directory',
  TEXT: 'Type something to search...',
  TYPE: 'text',
};

const TEMPLATE_SHARED_CONST = {
  SEARCH_ELEM_ID: 'search-status',
  LIST_ELEM_ID: 'profile-list'
};

const template = document.createElement(TEMPLATE_CONST.ELEM_NAME);
template.innerHTML = `<h2>${TEMPLATE_CONST.TITLE}</h2><profile-search></profile-search><div id="${TEMPLATE_SHARED_CONST.SEARCH_ELEM_ID}" class="status">${TEMPLATE_CONST.TEXT}</div><profile-list id="${TEMPLATE_SHARED_CONST.LIST_ELEM_ID}"></profile-list>`;

export {
  template,
  TEMPLATE_SHARED_CONST
};
