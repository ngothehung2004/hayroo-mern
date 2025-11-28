const express = require("express");
const router = express.Router();
const authController = require("../controller/auth");
const { loginCheck, isAuth, isAdmin } = require("../middleware/auth");
const verifyCaptcha = require("../middleware/verifyCaptcha"); // ⬅ thêm dòng này

router.post("/isadmin", authController.isAdmin);
router.post("/signup", authController.postSignup);

// 🛡 Thêm CAPTCHA khi đăng nhập
router.post("/signin", verifyCaptcha, authController.postSignin);

router.post("/user", loginCheck, isAuth, isAdmin, authController.allUser);

module.exports = router;
