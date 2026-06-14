import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Dynamically load .env file locally if process.env.MONGODB_URI is not defined
if (!process.env.MONGODB_URI) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of envLines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value.trim();
        }
      }
    }
  } catch (e) {
    // Ignore FS errors in serverless read-only settings
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside your project settings.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'doctorhub'
    };

    cached.promise = mongoose.connect(uri, opts)
      .catch((err) => {
        if (uri && uri.includes('addflow-cluster.h9klu1k.mongodb.net')) {
          console.warn('SRV connection failed (possibly DNS TXT timeout). Trying fallback replica set connection string...');
          const fallbackURI = "mongodb://doctorhub:disconect11@ac-cvj8nqf-shard-00-00.h9klu1k.mongodb.net:27017,ac-cvj8nqf-shard-00-01.h9klu1k.mongodb.net:27017,ac-cvj8nqf-shard-00-02.h9klu1k.mongodb.net:27017/doctorhub?ssl=true&replicaSet=atlas-zyuk7x-shard-0&authSource=admin&retryWrites=true&w=majority";
          return mongoose.connect(fallbackURI, opts);
        }
        throw err;
      })
      .then((mongooseInstance) => {
        return mongooseInstance;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
