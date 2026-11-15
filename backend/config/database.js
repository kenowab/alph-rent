import mongoose from 'mongoose'

/**
 * Connect to MongoDB Atlas.
 * MONGO_URI must be provided via server/.env — never hard-code credentials.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not set. Set a valid MongoDB connection string.')
  }

  mongoose.set('strictQuery', true)

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    })

    console.log(`MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(
      '[WARN] MongoDB connection failed. Check Atlas Database Access credentials, authSource, and URL-encode special characters in MONGO_URI.',
      error.message,
    )
    throw error
  }
}

export async function disconnectDB() {
  await mongoose.disconnect()
  console.log('MongoDB disconnected')
}
