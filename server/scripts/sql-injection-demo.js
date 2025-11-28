/**
 * SQL Injection Demo Script
 *
 * Chạy thử:
 *   cd server
 *   npm install         # đảm bảo đã cài sqlite3
 *   npm run demo:sql-injection
 *
 * Script sẽ hiển thị sự khác biệt giữa truy vấn ghép chuỗi (dễ bị tấn công)
 * và truy vấn dùng tham số (an toàn).
 */

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DEMO_DIR = path.join(__dirname, "../tmp");
const DB_PATH = path.join(DEMO_DIR, "sql-demo.db");

if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
}

function resetDatabase() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }

    const db = new sqlite3.Database(DB_PATH);
    db.serialize(() => {
      db.run(
        "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)",
        (err) => {
          if (err) {
            db.close();
            return reject(err);
          }

          const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
          stmt.run("admin", "admin123");
          stmt.run("alice", "password1");
          stmt.run("bob", "hunter2");
          stmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              db.close();
              return reject(finalizeErr);
            }

            db.close((closeErr) => {
              if (closeErr) {
                return reject(closeErr);
              }
              resolve();
            });
          });
        }
      );
    });
  });
}

function unsafeLogin(username, password) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.all(query, (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function safeLogin(username, password) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.all(query, [username, password], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function runDemo() {
  await resetDatabase();
  console.log("══════════════════════════════════════════════");
  console.log(" SQL Injection Demo");
  console.log("══════════════════════════════════════════════\n");

  const payload = "' OR '1'='1";
  console.log("Payload độc hại:", payload);

  console.log("\n1) Truy vấn ghép chuỗi (KHÔNG an toàn)");
  const unsafeResult = await unsafeLogin(payload, payload);
  console.log("Kết quả:", unsafeResult);
  console.log(
    unsafeResult.length
      ? "❌ Đăng nhập thành công do bị SQL Injection!"
      : "✅ Không đăng nhập được"
  );

  console.log("\n2) Truy vấn tham số (AN TOÀN)");
  const safeResult = await safeLogin(payload, payload);
  console.log("Kết quả:", safeResult);
  console.log(
    safeResult.length
      ? "❌ Vẫn đăng nhập được (cấu hình sai)"
      : "✅ Đăng nhập bị chặn (tham số hóa)"
  );

  console.log("\nDemo hoàn tất. Hãy luôn sử dụng prepared statement/ORM để ngăn chặn SQL Injection.");
  console.log("Database demo nằm tại:", DB_PATH);
}

runDemo().catch((err) => {
  console.error("Demo lỗi:", err.message);
  process.exit(1);
});
