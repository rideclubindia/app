import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface MapCacheDB extends DBSchema {
  tiles: {
    key: string;
    value: {
      url: string;
      data: ArrayBuffer;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MapCacheDB>> | null = null;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MapCacheDB>('RideClubMapCache', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tiles')) {
          db.createObjectStore('tiles', { keyPath: 'url' });
        }
      },
    });
  }
  return dbPromise;
};

export const cacheTile = async (url: string, data: ArrayBuffer) => {
  try {
    const db = await initDB();
    await db.put('tiles', {
      url,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Failed to cache tile:', error);
  }
};

export const getCachedTile = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const db = await initDB();
    const cached = await db.get('tiles', url);
    return cached ? cached.data : null;
  } catch (error) {
    console.warn('Failed to get cached tile:', error);
    return null;
  }
};
