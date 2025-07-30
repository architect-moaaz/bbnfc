const mongoose = require('mongoose');

// Wrapper to ensure database operations work in serverless
async function executeDbOperation(operation) {
  // Wait for connection to be ready
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        // Execute the operation
        return await operation();
      } catch (error) {
        if (error.message && error.message.includes('buffering timed out')) {
          console.log(`Retry ${retries + 1} due to buffering timeout`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw error;
      }
    }
    
    console.log(`Waiting for connection... attempt ${retries + 1}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    retries++;
  }
  
  throw new Error('Database connection not ready after maximum retries');
}

module.exports = { executeDbOperation };