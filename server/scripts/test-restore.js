/**
 * Script Test Restore - Kiểm tra quy trình phục hồi
 * Chạy: node server/scripts/test-restore.js <backup-file-name>
 * 
 * Script này sẽ:
 * 1. Restore vào database test
 * 2. Verify dữ liệu
 * 3. Báo cáo kết quả
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BACKUP_DIR = path.join(__dirname, "../../backups");
const TEST_DB_NAME = "Ecommerce_Test";
const MONGODB_URI = process.env.DATABASE || "mongodb://localhost:27017/Ecommerce";

// Hàm extract và restore vào test database
async function testRestore(backupFile) {
  return new Promise((resolve, reject) => {
    const backupPath = path.join(BACKUP_DIR, backupFile);
    
    if (!fs.existsSync(backupPath)) {
      reject(new Error(`Backup file not found: ${backupFile}`));
      return;
    }
    
    console.log(`\n🔄 Testing restore from: ${backupFile}`);
    console.log(`📊 Test database: ${TEST_DB_NAME}`);
    
    // Extract backup
    const tempDir = path.join(BACKUP_DIR, "test_restore_temp");
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    const extractCmd = `tar -xzf "${backupPath}" -C "${tempDir}"`;
    
    exec(extractCmd, (extractError) => {
      if (extractError) {
        reject(new Error(`Extraction failed: ${extractError.message}`));
        return;
      }
      
      // Find database name
      const dirs = fs.readdirSync(tempDir);
      const dbDir = dirs.find(dir => fs.statSync(path.join(tempDir, dir)).isDirectory());
      
      if (!dbDir) {
        reject(new Error("Database directory not found"));
        return;
      }
      
      const dbPath = path.join(tempDir, dbDir);
      
      // Restore to test database
      let restoreCmd;
      if (MONGODB_URI.includes("mongodb://localhost")) {
        restoreCmd = `mongorestore --db="${TEST_DB_NAME}" "${dbPath}"`;
      } else {
        // For MongoDB Atlas, modify URI
        const testUri = MONGODB_URI.replace(/\/[^/]+(\?|$)/, `/${TEST_DB_NAME}$1`);
        restoreCmd = `mongorestore --uri="${testUri}" "${dbPath}"`;
      }
      
      exec(restoreCmd, (restoreError, stdout, stderr) => {
        if (restoreError) {
          reject(new Error(`Restore failed: ${restoreError.message}`));
          return;
        }
        
        // Verify data
        verifyData()
          .then((verification) => {
            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });
            
            resolve({
              success: true,
              backupFile: backupFile,
              verification: verification
            });
          })
          .catch((verifyError) => {
            fs.rmSync(tempDir, { recursive: true, force: true });
            reject(verifyError);
          });
      });
    });
  });
}

// Hàm verify dữ liệu sau khi restore
async function verifyData() {
  return new Promise((resolve, reject) => {
    try {
      // Connect to test database
      const testUri = MONGODB_URI.includes("mongodb://localhost") 
        ? MONGODB_URI.replace(/\/[^/]+(\?|$)/, `/${TEST_DB_NAME}$1`)
        : MONGODB_URI.replace(/\/[^/]+(\?|$)/, `/${TEST_DB_NAME}$1`);
      
      mongoose.connect(testUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }).then(async () => {
        console.log("\n✅ Connected to test database");
        
        // Get collections count
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        const verification = {
          collections: [],
          totalDocuments: 0,
          timestamp: new Date().toISOString()
        };
        
        for (const collection of collections) {
          const count = await db.collection(collection.name).countDocuments();
          verification.collections.push({
            name: collection.name,
            documents: count
          });
          verification.totalDocuments += count;
        }
        
        mongoose.connection.close();
        
        console.log(`\n📊 Verification Results:`);
        console.log(`   Collections: ${verification.collections.length}`);
        console.log(`   Total Documents: ${verification.totalDocuments}`);
        verification.collections.forEach(col => {
          console.log(`   - ${col.name}: ${col.documents} documents`);
        });
        
        resolve(verification);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Main function
async function main() {
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.error("Usage: node test-restore.js <backup-file-name>");
    console.error("Example: node test-restore.js daily_2024-01-15_10-30-00.tar.gz");
    process.exit(1);
  }
  
  try {
    const result = await testRestore(backupFile);
    
    console.log("\n═══════════════════════════════════════════");
    console.log("  RESTORE TEST SUMMARY");
    console.log("═══════════════════════════════════════════");
    console.log(`Backup File: ${result.backupFile}`);
    console.log(`Status: ✅ SUCCESS`);
    console.log(`Collections: ${result.verification.collections.length}`);
    console.log(`Total Documents: ${result.verification.totalDocuments}`);
    console.log("═══════════════════════════════════════════\n");
    
    // Log result
    const logFile = path.join(BACKUP_DIR, "restore-test.log");
    const logEntry = `[${result.verification.timestamp}] TEST RESTORE: ${backupFile} - Collections: ${result.verification.collections.length}, Documents: ${result.verification.totalDocuments}\n`;
    fs.appendFileSync(logFile, logEntry);
    
    console.log("✅ Restore test completed successfully!");
    console.log("⚠️  Note: Test database will be kept for verification");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Restore test failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRestore, verifyData };











