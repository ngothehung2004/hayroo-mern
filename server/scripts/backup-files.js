/**
 * Script Backup Files (Uploads, Images, etc.)
 * Chạy: node server/scripts/backup-files.js
 * Hoặc: npm run backup:files
 * 
 * Lưu ý: Script này yêu cầu tar command (Linux/Mac) hoặc 7zip (Windows)
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Cấu hình
const BACKUP_DIR = path.join(__dirname, "../../backups/files");
const FILES_TO_BACKUP = [
  path.join(__dirname, "../public/uploads"), // Images, files
  path.join(__dirname, "../config"), // Config files (nếu cần)
];
const RETENTION_DAYS = 30;

// Tạo thư mục backup nếu chưa có
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Hàm tạo tên file backup
function getBackupFileName(type = "daily") {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "-");
  const isWindows = process.platform === "win32";
  const extension = isWindows ? ".zip" : ".tar.gz";
  
  return `files_${type}_${dateStr}_${timeStr}${extension}`;
}

// Hàm backup files
function backupFiles(type = "daily") {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString();
    const backupFileName = getBackupFileName(type);
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    console.log(`[${timestamp}] Starting ${type} files backup...`);
    
    // Kiểm tra files tồn tại
    const existingFiles = FILES_TO_BACKUP.filter(file => fs.existsSync(file));
    
    if (existingFiles.length === 0) {
      reject(new Error("No files to backup"));
      return;
    }
    
    console.log(`Files to backup: ${existingFiles.length}`);
    existingFiles.forEach(file => console.log(`  - ${file}`));
    
    // Tạo tar.gz hoặc zip (tùy OS)
    const isWindows = process.platform === "win32";
    let compressCmd;
    
    if (isWindows) {
      // Windows: Use PowerShell Compress-Archive
      // Create temp directory and copy files
      const tempBackupDir = path.join(BACKUP_DIR, "temp_files_backup");
      if (fs.existsSync(tempBackupDir)) {
        fs.rmSync(tempBackupDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempBackupDir, { recursive: true });
      
      // Copy files to temp directory
      existingFiles.forEach(file => {
        const dest = path.join(tempBackupDir, path.basename(file));
        if (fs.statSync(file).isDirectory()) {
          // Copy directory recursively
          const copyCmd = `xcopy /E /I /Y "${file}" "${dest}"`;
          exec(copyCmd);
        } else {
          fs.copyFileSync(file, dest);
        }
      });
      
      compressCmd = `powershell -Command "Compress-Archive -Path '${tempBackupDir}\\*' -DestinationPath '${backupPath}' -Force" && rmdir /s /q "${tempBackupDir}"`;
    } else {
      // Linux/Mac: Use tar
      compressCmd = `tar -czf "${backupPath}" -C "${path.join(__dirname, "../")}" ${existingFiles.map(f => path.relative(path.join(__dirname, "../"), f)).join(" ")}`;
    }
    
    exec(compressCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup error: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes("Removing leading")) {
        console.warn(`Backup warning: ${stderr}`);
      }
      
      const fileSize = fs.statSync(backupPath).size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      
      console.log(`[${new Date().toISOString()}] Files backup completed!`);
      console.log(`File: ${backupFileName}`);
      console.log(`Size: ${fileSizeMB} MB`);
      
      resolve({
        success: true,
        fileName: backupFileName,
        filePath: backupPath,
        size: fileSizeMB,
        type: type,
        timestamp: timestamp,
        filesCount: existingFiles.length
      });
    });
  });
}

// Hàm xóa backup cũ
function cleanupOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionTime = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  let deletedCount = 0;
  
  files.forEach(file => {
    if ((file.endsWith(".tar.gz") || file.endsWith(".zip")) && file.startsWith("files_")) {
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
    console.log(`Cleaned up ${deletedCount} old file backup(s)`);
  }
}

// Main function
async function main() {
  try {
    const type = process.argv[2] || "daily";
    
    const result = await backupFiles(type);
    
    cleanupOldBackups();
    
    // Log
    const logFile = path.join(BACKUP_DIR, "../backup.log");
    const logEntry = `[${result.timestamp}] ${result.type.toUpperCase()} files backup: ${result.fileName} (${result.size} MB, ${result.filesCount} files)\n`;
    fs.appendFileSync(logFile, logEntry);
    
    console.log("\n✅ Files backup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Files backup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { backupFiles, cleanupOldBackups };

