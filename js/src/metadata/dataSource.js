const STATE_MOCKUP = {
  profiles: [
    { id: 1783453573753, name: 'John Snow', role: 'System Architect & Node.js Expert' },
    { id: 1783453537753, name: 'Reistling Madjere', role: 'Frontend Developer (Web Components)' },
    { id: 1783543573753, name: 'Krisaniya Lightlady', role: 'UI/UX Designer' }
  ]
};

class DataLayer {
  constructor() {
    this._state = STATE_MOCKUP;
  }

  getProfile(id) {
    const profileData = this._state.profiles.find(p => p.id === id);
    return profileData;
  }

  updateProfiles = (profiles) => {
    this._state = { ...this._state, profiles };
  }

  createProfile = (newProfile) => {
    console.dir({ newProfile });
    newProfile.id = Date.now();
    const profiles = structuredClone(this._state.profiles);
    profiles.push(newProfile);
    this.updateProfiles(profiles);
  }

  editProfile = ({id, ...profileData}) => {
    const profiles = structuredClone(this._state.profiles);
    const profileRecordId = profiles.findIndex(p => p.id === id); 
    profiles[profileRecordId] = { ...profiles[profileRecordId], ...profileData}
    this.updateProfiles(profiles);
    console.log(this._state.profiles);
  }

  searchProfiles(searchQuery) {
    const query = searchQuery.trim()
    if (query === '')
      return this._state.profiles;

    const profilesSearchHandler = (profile) =>
      profile.name.toLowerCase().includes(query.toLowerCase()) || profile.role.toLowerCase().includes(query.toLowerCase());

    const filtered = this._state.profiles.filter(profilesSearchHandler)
  }

  deleteProfile(profileId) {
    const filtered = this._state.profiles.filter(profile => profile.id !== profileId);
    console.dir(filtered);
    this.updateProfiles(filtered);
  }
}

const dataSource = new DataLayer();

export default dataSource;
