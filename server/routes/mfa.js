const express = require("express");
const router = express.Router();
const mfaController = require("../controller/mfa");
const { loginCheck, isAuth } = require("../middleware/auth");

// Generate MFA secret và QR code (cần đăng nhập)
router.post("/generate-secret", loginCheck, mfaController.generateMFASecret);

// Verify và enable MFA (cần đăng nhập)
router.post("/verify-enable", loginCheck, mfaController.verifyAndEnableMFA);

// Verify MFA token khi login (không cần đăng nhập)
router.post("/verify-token", mfaController.verifyMFAToken);

// Disable MFA (cần đăng nhập)
router.post("/disable", loginCheck, mfaController.disableMFA);

// Get MFA status (cần đăng nhập)
router.post("/status", loginCheck, mfaController.getMFAStatus);

// Test token (cần đăng nhập) - để debug
router.post("/test-token", loginCheck, mfaController.testToken);

// Get current token (cần đăng nhập) - để so sánh với Google Authenticator
router.get("/current-token", loginCheck, mfaController.getCurrentToken);

module.exports = router;

