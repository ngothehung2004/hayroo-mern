/**
 * Full Backup Script - Backup cả Database và Files
 * Chạy: node server/scripts/backup-full.js [daily|weekly|monthly]
 */

const { backupDatabase } = require("./backup-database");
const { backupFiles } = require("./backup-files");
const fs = require("fs");
const path = require("path");

const BACKUP_DIR = path.join(__dirname, "../../backups");

async function fullBackup(type = "daily") {
  console.log("═══════════════════════════════════════════");
  console.log(`  FULL BACKUP - ${type.toUpperCase()}`);
  console.log("═══════════════════════════════════════════\n");
  
  const results = {
    database: null,
    files: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Backup database
    console.log("📊 Step 1: Backing up database...");
    results.database = await backupDatabase(type);
    console.log("✅ Database backup completed\n");
    
    // Backup files
    console.log("📁 Step 2: Backing up files...");
    results.files = await backupFiles(type);
    console.log("✅ Files backup completed\n");
    
    // Summary
    console.log("═══════════════════════════════════════════");
    console.log("  BACKUP SUMMARY");
    console.log("═══════════════════════════════════════════");
    console.log(`Type: ${type.toUpperCase()}`);
    console.log(`Database: ${results.database.fileName} (${results.database.size} MB)`);
    console.log(`Files: ${results.files.fileName} (${results.files.size} MB)`);
    console.log(`Total Size: ${(parseFloat(results.database.size) + parseFloat(results.files.size)).toFixed(2)} MB`);
    console.log("═══════════════════════════════════════════\n");
    
    // Log
    const logFile = path.join(BACKUP_DIR, "backup.log");
    const logEntry = `[${results.timestamp}] FULL ${type.toUpperCase()} backup completed - DB: ${results.database.fileName}, Files: ${results.files.fileName}\n`;
    fs.appendFileSync(logFile, logEntry);
    
    return results;
  } catch (error) {
    console.error("\n❌ Full backup failed:", error.message);
    throw error;
  }
}

// Main
if (require.main === module) {
  const type = process.argv[2] || "daily";
  fullBackup(type)
    .then(() => {
      console.log("✅ Full backup process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Full backup failed:", error);
      process.exit(1);
    });
}

module.exports = { fullBackup };











