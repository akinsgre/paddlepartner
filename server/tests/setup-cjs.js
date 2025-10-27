const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

// Load test environment variables
dotenv.config({ path: '.env.test' })

let mongoServer

const setupTestDatabase = async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  // Connect mongoose to the in-memory database
  await mongoose.connect(mongoUri)
  
  console.log('🧪 Test database connected')
}

const teardownTestDatabase = async () => {
  // Close mongoose connection
  await mongoose.connection.close()
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop()
  }
  
  console.log('🧪 Test database disconnected')
}

const clearTestDatabase = async () => {
  const collections = mongoose.connection.collections
  
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
  
  console.log('🧪 Test database cleared')
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
}

// Global test setup
beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})

afterEach(async () => {
  await clearTestDatabase()
})