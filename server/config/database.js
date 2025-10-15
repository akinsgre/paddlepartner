import mongoose from 'mongoose'

// Function to get MongoDB URI (to ensure it gets the latest env value)
const getMongodbUri = () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paddle-partner'
  return uri
}

let isConnected = false

export const connectDatabase = async () => {
  if (isConnected) {
    console.log('Already connected to MongoDB')
    return
  }

  const MONGODB_URI = getMongodbUri()

  // Debug: Log the MongoDB URI (without showing full credentials)
  console.log('🔗 Attempting to connect to MongoDB...')
  console.log('📊 MongoDB URI type:', MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB')
  console.log('🔧 Connection string preview:', MONGODB_URI.substring(0, 30) + '...')

  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }

    await mongoose.connect(MONGODB_URI, options)
    isConnected = true
    
    console.log('✅ Connected to MongoDB successfully')
    console.log(`📂 Database: ${mongoose.connection.name}`)

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected')
      isConnected = false
    })

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected')
      isConnected = true
    })

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    isConnected = false
    throw error
  }
}

export const disconnectDatabase = async () => {
  if (!isConnected) {
    return
  }

  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('🔌 Disconnected from MongoDB')
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error)
    throw error
  }
}

export const getConnectionStatus = () => {
  return isConnected && mongoose.connection.readyState === 1
}

export default {
  connectDatabase,
  disconnectDatabase,
  getConnectionStatus
}