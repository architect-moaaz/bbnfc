const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

let client = null;
let db = null;

const uri = process.env.MONGODB_URI || "mongodb+srv://m:to7kXzNixG4y78CB@cluster0.dbmqmws.mongodb.net/?retryWrites=true&w=majority&appName=cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
async function connectToDatabase() {
  if (client && client.topology && client.topology.isConnected()) {
    console.log('Using existing database connection');
    return db;
  }

  try {
    console.log('Creating new database connection...');
    
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    
    // Get the database (will use 'test' database by default)
    db = client.db('test');
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (client) {
      await client.close();
    }
    throw error;
  }
}

// Get database instance
async function getDatabase() {
  if (!db) {
    db = await connectToDatabase();
  }
  return db;
}

// Close the connection
async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

// Helper function to create ObjectId
function createObjectId() {
  return new ObjectId();
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeConnection,
  ObjectId,
  createObjectId
};