/**
 * Script Backup Database MongoDB
 * Chạy: node server/scripts/backup-database.js
 * Hoặc: npm run backup:db
 * 
 * Lưu ý: Script này yêu cầu:
 * - MongoDB Database Tools (mongodump)
 * - tar command (Linux/Mac) hoặc 7zip (Windows)
 * - Node.js
 */

const mongoose = require("mongoose");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Cấu hình
const BACKUP_DIR = path.join(__dirname, "../../backups");
const DATABASE_NAME = process.env.DATABASE_NAME || "Ecommerce";
const MONGODB_URI = process.env.DATABASE || "mongodb://localhost:27017/Ecommerce";
const RETENTION_DAYS = 30; // Giữ backup trong 30 ngày
const isWindows = process.platform === "win32";
const DEFAULT_WINDOWS_MONGODUMP_PATHS = [
  "C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe",
  "C:\\Program Files\\MongoDB\\Tools\\bin\\mongodump.exe",
  "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongodump.exe",
  "D:\\download\\mongodb-database-tools-windows-x86_64-100.13.0\\bin\\mongodump.exe"
];

function resolveMongodumpBinary() {
  if (!isWindows) return "mongodump";

  const envPath = process.env.MONGODUMP_PATH;
  if (envPath) {
    if (!fs.existsSync(envPath)) {
      console.warn(`⚠️  MONGODUMP_PATH set but not found: ${envPath}. Falling back to defaults.`);
    } else {
      return envPath;
    }
  }

  const detected = DEFAULT_WINDOWS_MONGODUMP_PATHS.find((candidate) => fs.existsSync(candidate));
  if (detected) {
    return detected;
  }

  console.warn("⚠️  mongodump not found in PATH. Install MongoDB Database Tools or set MONGODUMP_PATH.");
  return "mongodump";
}

// Tạo thư mục backup nếu chưa có
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Hàm tạo tên file backup
function getBackupFileName(type = "daily") {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
  
  return `${type}_${dateStr}_${timeStr}.tar.gz`;
}

// Hàm backup database
function backupDatabase(type = "daily") {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString();
    const backupFileName = getBackupFileName(type);
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    console.log(`[${timestamp}] Starting ${type} backup...`);
    console.log(`Database: ${DATABASE_NAME}`);
    console.log(`Backup file: ${backupFileName}`);

    // Extract connection string
    let connectionString = MONGODB_URI;
    let dbName = DATABASE_NAME;
    
    // Parse MongoDB URI
    if (MONGODB_URI.includes("mongodb://") || MONGODB_URI.includes("mongodb+srv://")) {
      // Extract database name from URI
      const match = MONGODB_URI.match(/\/([^?]+)/);
      if (match) {
        dbName = match[1].split("?")[0];
      }
      const tempDumpDir = path.join(BACKUP_DIR, "temp");
      if (fs.existsSync(tempDumpDir)) {
        fs.rmSync(tempDumpDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDumpDir, { recursive: true });
      
      // For mongodump, we need to handle authentication
      const mongodumpBinary = resolveMongodumpBinary();
      const quotedBinary = mongodumpBinary.includes(" ") ? `"${mongodumpBinary}"` : mongodumpBinary;
      let mongodumpCmd = `${quotedBinary} --uri="${MONGODB_URI}" --out="${tempDumpDir}"`;
      
      // If using local MongoDB
      if (MONGODB_URI.includes("mongodb://localhost")) {
        mongodumpCmd = `${quotedBinary} --db="${dbName}" --out="${tempDumpDir}"`;
      }
      
      // Create backup
      exec(mongodumpCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Backup error: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr && !stderr.includes("writing")) {
          console.warn(`Backup warning: ${stderr}`);
        }
        
        // Compress backup
        // Note: For Windows, you may need to use 7zip or other compression tools
        const isWindows = process.platform === "win32";
        let compressCmd;
        
        if (isWindows) {
          // Windows: Use 7zip if available, or use Node.js compression
          // For now, we'll use a cross-platform approach with archiver
          compressCmd = `powershell -Command "Compress-Archive -Path '${tempDumpDir}/*' -DestinationPath '${backupPath}' -Force" && rmdir /s /q "${tempDumpDir}"`;
        } else {
          // Linux/Mac: Use tar
          compressCmd = `cd "${tempDumpDir}" && tar -czf "${backupPath}" . && cd - && rm -rf "${tempDumpDir}"`;
        }
        
        exec(compressCmd, (compressError) => {
          if (compressError) {
            console.error(`Compression error: ${compressError.message}`);
            reject(compressError);
            return;
          }
          
          const fileSize = fs.statSync(backupPath).size;
          const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
          
          console.log(`[${new Date().toISOString()}] Backup completed successfully!`);
          console.log(`File: ${backupFileName}`);
          console.log(`Size: ${fileSizeMB} MB`);
          console.log(`Path: ${backupPath}`);
          
          resolve({
            success: true,
            fileName: backupFileName,
            filePath: backupPath,
            size: fileSizeMB,
            type: type,
            timestamp: timestamp
          });
        });
      });
    } else {
      reject(new Error("Invalid MongoDB URI"));
    }
  });
}

// Hàm xóa backup cũ
function cleanupOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionTime = RETENTION_DAYS * 24 * 60 * 60 * 1000; // milliseconds
  
  let deletedCount = 0;
  
  files.forEach(file => {
    if (file.endsWith(".tar.gz")) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > retentionTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted old backup: ${file}`);
      }
    }
  });
  
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} old backup(s)`);
  }
}

// Hàm upload lên cloud (nếu cấu hình)
async function uploadToCloud(backupPath, fileName) {
  // Placeholder - sẽ implement sau với AWS S3 hoặc Google Cloud Storage
  console.log(`[Cloud Upload] Would upload ${fileName} to cloud storage`);
  return Promise.resolve();
}

// Main function
async function main() {
  try {
    const type = process.argv[2] || "daily"; // daily, weekly, monthly
    
    // Backup database
    const result = await backupDatabase(type);
    
    // Cleanup old backups
    cleanupOldBackups();
    
    // Upload to cloud (if configured)
    if (process.env.CLOUD_BACKUP_ENABLED === "true") {
      await uploadToCloud(result.filePath, result.fileName);
    }
    
    // Log backup info
    const logFile = path.join(BACKUP_DIR, "backup.log");
    const logEntry = `[${result.timestamp}] ${result.type.toUpperCase()} backup: ${result.fileName} (${result.size} MB)\n`;
    fs.appendFileSync(logFile, logEntry);
    
    console.log("\n✅ Backup process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Backup failed:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { backupDatabase, cleanupOldBackups };

