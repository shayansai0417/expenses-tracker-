import mongoose from 'mongoose';

let memoryServerInstance: any = null;

export const connectDB = async (uri?: string): Promise<typeof mongoose> => {
  const mongoURI = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker';

  try {
    // Attempt connection with short timeout so it fails fast if local daemon is not running
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[Database] MongoDB Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.warn(`[Database] Local MongoDB at "${mongoURI}" is not reachable.`);
      console.log('[Database] Starting built-in development In-Memory MongoDB server...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create();
        const memUri = memoryServerInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] Connected to development In-Memory MongoDB at: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error('[Database] Failed to start fallback in-memory database:', memErr);
      }
    }

    console.error('[Database] MongoDB connection failed:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed');
    }
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
      console.log('[Database] In-Memory MongoDB stopped cleanly');
    }
  } catch (error) {
    console.error('[Database] Error while disconnecting MongoDB:', error);
  }
};
