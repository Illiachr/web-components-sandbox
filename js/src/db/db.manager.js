const PATH_TO_WORKER = '/js/vendor/db.worker.js';

class DatabaseManager {
  constructor() {
    this.worker = new Worker(PATH_TO_WORKER, { type: 'module' });
    this.listeners = new Set();

    this.worker.onmessage = (e) => {
      const { type, payload } = e.data;

      this.listeners.forEach(cb => cb(type, payload));
    };

    this.worker.onerror = (error) => {
      console.error('CRITICAL DB WORKER ERROR:', error.message, 'in file:', error.filename, 'at line:', error.lineno);
    };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  } 

  getProfile(id) {
    this.worker.postMessage({
      type: 'GET_PROFILE',
      payload: { id }
    });
  }

  saveProfile = (profile) => {
    const id = profile.id || crypto.randomUUID();
    this.worker.postMessage({
      type: 'SAVE_PROFILE',
      payload: { ...profile, id }
    });
  }

  searchProfiles(searchQuery) {
    const query = searchQuery.trim();
    if (query === '')
      return this.worker.postMessage({ type: 'GET_ALL_PROFILES' });
    this.worker.postMessage({
      type: 'SEARCH_PROFILES',
      payload: { query }
    });
  }

  deleteProfile(id) {
    this.worker.postMessage({ 
      type: 'DELETE_PROFILE',
      payload: { id }
    });
  }
}

const dbManager = new DatabaseManager();

export default dbManager;
