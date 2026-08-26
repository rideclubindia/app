import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface SyncDB extends DBSchema {
  pending_events: {
    key: number; // Auto-incrementing ID
    value: {
      type: string;
      rideId: string;
      data: any;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SyncDB>> | null = null;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<SyncDB>('RideClubSyncDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_events')) {
          db.createObjectStore('pending_events', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
};

export const enqueueSyncEvent = async (type: string, rideId: string, data: any) => {
  try {
    const db = await initDB();
    await db.add('pending_events', {
      type,
      rideId,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Failed to enqueue sync event:', error);
  }
};

export const getPendingSyncEvents = async () => {
  try {
    const db = await initDB();
    return await db.getAll('pending_events');
  } catch (error) {
    console.warn('Failed to get pending events:', error);
    return [];
  }
};

export const clearPendingSyncEvents = async (keys: number[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction('pending_events', 'readwrite');
    for (const key of keys) {
      tx.store.delete(key);
    }
    await tx.done;
  } catch (error) {
    console.warn('Failed to clear pending events:', error);
  }
};
