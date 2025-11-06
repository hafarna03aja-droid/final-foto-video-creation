const DB_NAME = 'CreativeSuiteDB';
const DB_VERSION = 1;
const STORE_NAME = 'mediaHistory';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Database error:", request.error);
      reject("Database error");
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const addMedia = (item: { id: number, blob: Blob }): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
        const dbInstance = await initDB();
        const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(item);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error adding media to DB:', request.error);
            reject(request.error);
        };
    } catch (error) {
        reject(error);
    }
  });
};

export const getMedia = (id: number): Promise<Blob | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await initDB();
            const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.blob);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => {
                console.error('Error getting media from DB:', request.error);
                reject(request.error);
            };
        } catch(error) {
            reject(error);
        }
    });
};


export const deleteMedia = (id: number): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await initDB();
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Error deleting media from DB:', request.error);
                reject(request.error);
            }
        } catch (error) {
            reject(error);
        }
    });
};

export const clearMedia = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await initDB();
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Error clearing media store:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};
