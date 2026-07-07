import AppLink from "./src/componets/app-link/app-link.js"
import AppRouter from "./src/componets/app-router/app-router.js";
import ProfileDirectory from "./src/componets/profile-directory/profile-directory.js";
import ProfileForm from "./src/componets/profile-form/profile-form.js";
import { ValidationMessage } from "./src/componets/validation-message/validation-message.js";
import { CUSTOM_EVENTS, ELEM_IDS } from "./src/metadata/constants.js";
import dataSource from "./src/metadata/dataSource.js";

const appElem = document.getElementById(ELEM_IDS.APP);
const profileForm = document.getElementById(ELEM_IDS.PROFILE_FORM_EDIT);
const msgElem = document.getElementById(ELEM_IDS.MSG_ELEM);
const showBtn = document.getElementById(ELEM_IDS.SHOW_BTN);
const hideBtn = document.getElementById(ELEM_IDS.HIDE_BTN);

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_EDIT, (e) => {
  const profile = dataSource.getProfile(e.detail.profileId);
  profileForm.profileData = profile;
});

const handleProfileFormSubmit = (event) => {
  const profileData = event.detail;
  if (!profileData.id) 
    return dataSource.createProfile(profileData);
  dataSource.editProfile(profileData);  
};

appElem.addEventListener(CUSTOM_EVENTS.PROFILE_SAVE, handleProfileFormSubmit);
