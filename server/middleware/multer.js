const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const allowedFormats = ["jpg", "jpeg", "png", "webp"]; // Cloudinary accepts lowercase codes

const createStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `hayroo/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });

const uploadProductImages = multer({ storage: createStorage("products") });
const uploadCategoryImage = multer({ storage: createStorage("categories") });
const uploadCustomizeImage = multer({ storage: createStorage("customize") });

module.exports = {
  uploadProductImages,
  uploadCategoryImage,
  uploadCustomizeImage,
};
