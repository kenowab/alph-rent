import mongoose from 'mongoose'

/**
 * Connect to MongoDB Atlas.
 * MONGO_URI must be provided via server/.env — never hard-code credentials.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Copy server/.env.example to server/.env and set your MongoDB Atlas connection string.',
    )
  }

  mongoose.set('strictQuery', true)

  const conn = await mongoose.connect(uri, {
    autoIndex: true,
  })

  console.log(`MongoDB connected: ${conn.connection.host}`)
  return conn
}

export async function disconnectDB() {
  await mongoose.disconnect()
  console.log('MongoDB disconnected')
}
