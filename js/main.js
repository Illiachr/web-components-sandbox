import AppLink from "./src/components/app-link/app-link.js"
import AppRouter from "./src/components/app-router/app-router.js";
import ProfileDirectory from "./src/components/profile-directory/profile-directory.js";
import ProfileForm from "./src/components/profile-form/profile-form.js";
import { ValidationMessage } from "./src/components/validation-message/validation-message.js";
import { CUSTOM_EVENTS, ELEM_IDS } from "./src/metadata/constants.js";
import dbManager from "./src/db/db.manager.js";

const appElem = document.getElementById(ELEM_IDS.APP);
const profileDirElem = document.getElementById(ELEM_IDS.PROFILE_DIR);
const profileForm = document.getElementById(ELEM_IDS.PROFILE_FORM_EDIT);
const msgElem = document.getElementById(ELEM_IDS.MSG_ELEM);
const showBtn = document.getElementById(ELEM_IDS.SHOW_BTN);
const hideBtn = document.getElementById(ELEM_IDS.HIDE_BTN);

const isEditPageActive = () => {
  let isEditPage = false;
  if (window.location.pathname === '/edit')
    isEditPage = true
  return isEditPage;
}; 

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log(`PWA: Service Worker registered: ${reg.scope}`)
      )
      .catch(err => console.error(`PWA: Service Worker registeration error: ${err}`)
      )
  });
}

dbManager.subscribe((type, payload) => {
  console.log('[Main Thread] DB Worker: ', type, {payload});
  
  switch (type) {
    case 'DB_READY': {
      console.log('[Main Thread] DB ready, loading profiles...');
      dbManager.searchProfiles('');
      break;
    }
    case 'SAVE_SUCCESS':
    case 'DELETE_SUCCESS':
      dbManager.searchProfiles('');
      break;
    case 'PROFILES_LIST': {
      if (profileDirElem) {
        profileDirElem.data = payload;
      }
      break;
    }
    case 'PROFILE_DATA': {
      if (profileForm) {
        profileForm.setAttribute('mode', 'edit');
        profileForm.data = payload;
      }
      break;
    }
    case 'SEARCH_SUCCESS': {
      if (profileDirElem) {
        profileDirElem.data = payload;
      }
      break;
    }
    case 'ERROR': {
      console.error('[Main Thread] DB Worker Error:', payload);
      break;
    }
  }
}); 

document.addEventListener('DOMContentLoaded', () => {
  console.log('Main Thread: Loading profiles from SQLite...');
});

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_DIR_READY, () => {
  console.log('[Main Thread] Profile directory mounted. Loading data ..');
  dbManager.searchProfiles('');  
});

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_DIR_SEARCH, (e) => {
  console.log('[Main Thread] Searching for: ', e.detail.query);
  dbManager.searchProfiles(e.detail.query);
});

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_DELETE, (e) => {
  console.log('[Main Thread] Requesting delete profile with ID: ', e.detail.profileId);
  dbManager.deleteProfile(e.detail.profileId);
});

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_EDIT, (e) => {
  dbManager.getProfile(e.detail.profileId);
});

const handleProfileFormSubmit = (event) => {
  const profileData = event.detail;
  dbManager.saveProfile(profileData);
  // if (!profileData.id) 
  //   return dataSource.createProfile(profileData);
  // dataSource.editProfile(profileData);  
};

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_SAVE, handleProfileFormSubmit);

