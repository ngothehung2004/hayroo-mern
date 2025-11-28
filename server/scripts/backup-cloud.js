/**
 * Script Upload Backup lên Cloud Storage
 * Hỗ trợ: AWS S3, Google Cloud Storage
 * Chạy: node server/scripts/backup-cloud.js <backup-file-path>
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Cấu hình Cloud Storage
const CLOUD_PROVIDER = process.env.CLOUD_PROVIDER || "s3"; // s3, gcs, azure
const CLOUD_BUCKET = process.env.CLOUD_BUCKET || "";
const CLOUD_REGION = process.env.CLOUD_REGION || "us-east-1";

/**
 * Upload lên AWS S3
 */
async function uploadToS3(filePath, fileName) {
  // Cần cài: npm install aws-sdk
  try {
    const AWS = require("aws-sdk");
    
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: CLOUD_REGION
    });
    
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
      Bucket: CLOUD_BUCKET,
      Key: `backups/${fileName}`,
      Body: fileContent,
      ServerSideEncryption: "AES256" // Mã hóa trên S3
    };
    
    const result = await s3.upload(params).promise();
    console.log(`✅ Uploaded to S3: ${result.Location}`);
    return result;
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      console.log("⚠️  AWS SDK not installed. Install with: npm install aws-sdk");
      return null;
    }
    throw error;
  }
}

/**
 * Upload lên Google Cloud Storage
 */
async function uploadToGCS(filePath, fileName) {
  // Cần cài: npm install @google-cloud/storage
  try {
    const { Storage } = require("@google-cloud/storage");
    
    const storage = new Storage({
      keyFilename: process.env.GCS_KEY_FILE,
      projectId: process.env.GCS_PROJECT_ID
    });
    
    const bucket = storage.bucket(CLOUD_BUCKET);
    const file = bucket.file(`backups/${fileName}`);
    
    await bucket.upload(filePath, {
      destination: `backups/${fileName}`,
      metadata: {
        cacheControl: "public, max-age=31536000"
      }
    });
    
    console.log(`✅ Uploaded to GCS: gs://${CLOUD_BUCKET}/backups/${fileName}`);
    return { success: true };
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      console.log("⚠️  Google Cloud Storage SDK not installed. Install with: npm install @google-cloud/storage");
      return null;
    }
    throw error;
  }
}

/**
 * Upload lên Azure Blob Storage
 */
async function uploadToAzure(filePath, fileName) {
  // Cần cài: npm install @azure/storage-blob
  try {
    const { BlobServiceClient } = require("@azure/storage-blob");
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    
    const containerClient = blobServiceClient.getContainerClient(CLOUD_BUCKET);
    const blockBlobClient = containerClient.getBlockBlobClient(`backups/${fileName}`);
    
    const fileContent = fs.readFileSync(filePath);
    await blockBlobClient.upload(fileContent, fileContent.length);
    
    console.log(`✅ Uploaded to Azure: ${blockBlobClient.url}`);
    return { success: true };
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      console.log("⚠️  Azure Storage SDK not installed. Install with: npm install @azure/storage-blob");
      return null;
    }
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error("Usage: node backup-cloud.js <backup-file-path>");
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const fileName = path.basename(filePath);
  
  try {
    console.log(`\n☁️  Uploading ${fileName} to ${CLOUD_PROVIDER.toUpperCase()}...`);
    
    let result;
    switch (CLOUD_PROVIDER.toLowerCase()) {
      case "s3":
        result = await uploadToS3(filePath, fileName);
        break;
      case "gcs":
        result = await uploadToGCS(filePath, fileName);
        break;
      case "azure":
        result = await uploadToAzure(filePath, fileName);
        break;
      default:
        console.error(`Unsupported cloud provider: ${CLOUD_PROVIDER}`);
        process.exit(1);
    }
    
    if (result) {
      console.log("✅ Cloud upload completed!");
    } else {
      console.log("⚠️  Cloud upload skipped (SDK not installed)");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Cloud upload failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { uploadToS3, uploadToGCS, uploadToAzure };











