/**
 * Script Restore Database từ Backup
 * Chạy: node server/scripts/restore-database.js <backup-file-name>
 * Ví dụ: node server/scripts/restore-database.js daily_2024-01-15_10-30-00.tar.gz
 * 
 * Lưu ý: Hỗ trợ .tar.gz (Linux/Mac) và .zip (Windows)
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BACKUP_DIR = path.join(__dirname, "../../backups");
const RESTORE_TEMP_DIR = path.join(__dirname, "../../backups/restore_temp");
const MONGODB_URI = process.env.DATABASE || "mongodb://localhost:27017/Ecommerce";

// Hàm extract backup
function extractBackup(backupFile) {
  return new Promise((resolve, reject) => {
    const backupPath = path.join(BACKUP_DIR, backupFile);
    
    if (!fs.existsSync(backupPath)) {
      reject(new Error(`Backup file not found: ${backupFile}`));
      return;
    }
    
    // Tạo temp directory
    if (fs.existsSync(RESTORE_TEMP_DIR)) {
      fs.rmSync(RESTORE_TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(RESTORE_TEMP_DIR, { recursive: true });
    
    // Extract (hỗ trợ cả tar.gz và zip)
    const isWindows = process.platform === "win32";
    const isZip = backupFile.endsWith(".zip");
    let extractCmd;
    
    if (isWindows || isZip) {
      // Windows hoặc file .zip: Dùng PowerShell
      extractCmd = `powershell -Command "Expand-Archive -Path '${backupPath}' -DestinationPath '${RESTORE_TEMP_DIR}' -Force"`;
    } else {
      // Linux/Mac: Dùng tar
      extractCmd = `tar -xzf "${backupPath}" -C "${RESTORE_TEMP_DIR}"`;
    }
    
    exec(extractCmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Extraction failed: ${error.message}`));
        return;
      }
      
      resolve(RESTORE_TEMP_DIR);
    });
  });
}

// Hàm restore database
function restoreDatabase(extractedPath) {
  return new Promise((resolve, reject) => {
    console.log("Restoring database...");
    
    // Find database name
    const dirs = fs.readdirSync(extractedPath);
    const dbDir = dirs.find(dir => fs.statSync(path.join(extractedPath, dir)).isDirectory());
    
    if (!dbDir) {
      reject(new Error("Database directory not found in backup"));
      return;
    }
    
    const dbPath = path.join(extractedPath, dbDir);
    
    // Restore command
    let restoreCmd;
    if (MONGODB_URI.includes("mongodb://localhost")) {
      restoreCmd = `mongorestore --db="${dbDir}" "${dbPath}"`;
    } else {
      restoreCmd = `mongorestore --uri="${MONGODB_URI}" "${dbPath}"`;
    }
    
    exec(restoreCmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Restore failed: ${error.message}`));
        return;
      }
      
      if (stderr && !stderr.includes("building a list")) {
        console.warn(`Restore warning: ${stderr}`);
      }
      
      console.log("Database restored successfully!");
      resolve();
    });
  });
}

// Hàm cleanup temp files
function cleanup() {
  if (fs.existsSync(RESTORE_TEMP_DIR)) {
    fs.rmSync(RESTORE_TEMP_DIR, { recursive: true, force: true });
    console.log("Cleaned up temporary files");
  }
}

// Main function
async function main() {
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.error("Usage: node restore-database.js <backup-file-name>");
    console.error("Example: node restore-database.js daily_2024-01-15_10-30-00.tar.gz");
    process.exit(1);
  }
  
  try {
    console.log(`\n🔄 Starting restore from: ${backupFile}`);
    console.log("⚠️  WARNING: This will overwrite existing data!");
    
    // Extract backup
    console.log("\n📦 Extracting backup...");
    const extractedPath = await extractBackup(backupFile);
    
    // Restore database
    console.log("\n💾 Restoring database...");
    await restoreDatabase(extractedPath);
    
    // Cleanup
    cleanup();
    
    console.log("\n✅ Restore completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Restore failed:", error.message);
    cleanup();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { restoreDatabase, extractBackup };

