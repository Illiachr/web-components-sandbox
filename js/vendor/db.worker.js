import "/js/vendor/sqlite3.js";

let db = null;

async function initDatabase() {
  try {
    const sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
      locateFile: (file) => {
        if (file.endsWith('.wasm')) {
          return '/js/vendor/sqlite3.wasm';
        }
        return file;
      }
    });
    
    if ('OpfsDb' in sqlite3.oo1) {
      db = new sqlite3.oo1.OpfsDb('/profiles_db.sqlite3');
      console.log(`SQLite: OPFS db connection successful, ${db.filename}`);
    } else {
      db = new sqlite3.oo1.DB();
      console.warn(`SQLite: OPFS not allowed, using In-Memory`);
    }

    db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    console.log("SQLite: profiles table created/exists.");
    self.postMessage({ type: 'DB_READY' });
  } catch (err) {
    console.error(`SQLite: Initialization error, ${err}`)
  }
};

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (!db) {
    return self.postMessage({
      type: 'ERROR',
      payload: 'Database not initialized'
    });
  }

  switch (type) {
    case 'GET_PROFILE': {
      const rows = db.selectObjects(
        'SELECT * FROM profiles WHERE id = ?',
        [payload.id]
      );
      self.postMessage({
        type: 'PROFILE_DATA',
        payload: rows[0]
      });
      break;
    }
    case 'GET_ALL_PROFILES':{
      const rows = db.selectObjects('SELECT * FROM profiles ORDER BY updated_at DESC');
      self.postMessage({
        type: 'PROFILES_LIST',
        payload: rows
      });
      break;
    }
    case 'SAVE_PROFILE':{
      db.exec({
        sql: 'INSERT OR REPLACE INTO profiles (id, name, role, updated_at) VALUES (?, ?, ?, ?)',
        bind: [payload.id, payload.name, payload.role, Date.now()],
      });
      self.postMessage({ type: 'SAVE_SUCCESS' });
      break;
    }
    case 'SEARCH_PROFILES':{
      const searchQuery = `%${payload.query}%`;
      const rows = db.selectObjects(
        'SELECT * FROM profiles WHERE name LIKE ? OR role LIKE ? ORDER BY updated_at DESC',
        [searchQuery, searchQuery],
      );
      self.postMessage({ type: 'SEARCH_SUCCESS', payload: rows });
      break;
    }
    case 'DELETE_PROFILE':{
      db.exec({
        sql: 'DELETE FROM profiles WHERE id = ?',
        bind: [payload.id],
      });
      self.postMessage({ type: 'DELETE_SUCCESS' });
      break;
    }

    default:
      console.warn(`Worker: Message type not defined: ${type}`);
  }
};

initDatabase();