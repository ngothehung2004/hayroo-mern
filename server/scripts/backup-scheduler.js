/**
 * Backup Scheduler - Chạy backup theo lịch trong Node.js
 * Sử dụng khi không thể dùng cron (ví dụ: Windows, hoặc muốn chạy trong Node.js)
 * 
 * Chạy: node server/scripts/backup-scheduler.js
 * Hoặc: npm run backup:scheduler (cần thêm vào package.json)
 */

const { fullBackup } = require("./backup-full");
const { uploadToS3, uploadToGCS, uploadToAzure } = require("./backup-cloud");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BACKUP_DIR = path.join(__dirname, "../../backups");

// Lịch backup
const SCHEDULES = {
  daily: {
    hour: 2,
    minute: 0,
    type: "daily"
  },
  weekly: {
    dayOfWeek: 0, // Sunday
    hour: 3,
    minute: 0,
    type: "weekly"
  },
  monthly: {
    dayOfMonth: 1,
    hour: 4,
    minute: 0,
    type: "monthly"
  }
};

// Hàm check xem có cần backup không
function shouldBackup(schedule) {
  const now = new Date();
  
  if (schedule.type === "daily") {
    return now.getHours() === schedule.hour && now.getMinutes() === schedule.minute;
  }
  
  if (schedule.type === "weekly") {
    return now.getDay() === schedule.dayOfWeek && 
           now.getHours() === schedule.hour && 
           now.getMinutes() === schedule.minute;
  }
  
  if (schedule.type === "monthly") {
    return now.getDate() === schedule.dayOfMonth && 
           now.getHours() === schedule.hour && 
           now.getMinutes() === schedule.minute;
  }
  
  return false;
}

// Hàm upload backup lên cloud
async function uploadBackupsToCloud() {
  if (process.env.CLOUD_BACKUP_ENABLED !== "true") {
    return;
  }
  
  const files = fs.readdirSync(BACKUP_DIR);
  const today = new Date().toISOString().split("T")[0];
  
  // Upload backups của hôm nay
  const todayBackups = files.filter(file => 
    file.includes(today) && (file.endsWith(".tar.gz"))
  );
  
  for (const file of todayBackups) {
    const filePath = path.join(BACKUP_DIR, file);
    const provider = process.env.CLOUD_PROVIDER || "s3";
    
    try {
      console.log(`Uploading ${file} to ${provider}...`);
      
      switch (provider) {
        case "s3":
          await uploadToS3(filePath, file);
          break;
        case "gcs":
          await uploadToGCS(filePath, file);
          break;
        case "azure":
          await uploadToAzure(filePath, file);
          break;
      }
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error.message);
    }
  }
}

// Main scheduler loop
async function startScheduler() {
  console.log("═══════════════════════════════════════════");
  console.log("  Backup Scheduler Started");
  console.log("═══════════════════════════════════════════");
  console.log(`Daily: ${SCHEDULES.daily.hour}:${SCHEDULES.daily.minute.toString().padStart(2, "0")}`);
  console.log(`Weekly: Sunday ${SCHEDULES.weekly.hour}:${SCHEDULES.weekly.minute.toString().padStart(2, "0")}`);
  console.log(`Monthly: Day 1, ${SCHEDULES.monthly.hour}:${SCHEDULES.monthly.minute.toString().padStart(2, "0")}`);
  console.log("═══════════════════════════════════════════\n");
  
  let lastBackup = {
    daily: null,
    weekly: null,
    monthly: null
  };
  
  // Check mỗi phút
  setInterval(async () => {
    const now = new Date();
    
    // Check daily backup
    if (shouldBackup(SCHEDULES.daily) && lastBackup.daily !== now.toDateString()) {
      console.log(`\n[${now.toISOString()}] Starting daily backup...`);
      try {
        await fullBackup("daily");
        lastBackup.daily = now.toDateString();
        await uploadBackupsToCloud();
      } catch (error) {
        console.error("Daily backup failed:", error.message);
      }
    }
    
    // Check weekly backup
    if (shouldBackup(SCHEDULES.weekly) && lastBackup.weekly !== now.toDateString()) {
      console.log(`\n[${now.toISOString()}] Starting weekly backup...`);
      try {
        await fullBackup("weekly");
        lastBackup.weekly = now.toDateString();
        await uploadBackupsToCloud();
      } catch (error) {
        console.error("Weekly backup failed:", error.message);
      }
    }
    
    // Check monthly backup
    if (shouldBackup(SCHEDULES.monthly) && lastBackup.monthly !== now.toDateString()) {
      console.log(`\n[${now.toISOString()}] Starting monthly backup...`);
      try {
        await fullBackup("monthly");
        lastBackup.monthly = now.toDateString();
        await uploadBackupsToCloud();
      } catch (error) {
        console.error("Monthly backup failed:", error.message);
      }
    }
  }, 60000); // Check every minute
  
  console.log("Scheduler is running. Press Ctrl+C to stop.\n");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\nShutting down backup scheduler...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\nShutting down backup scheduler...");
  process.exit(0);
});

// Start scheduler
if (require.main === module) {
  startScheduler();
}

module.exports = { startScheduler };











