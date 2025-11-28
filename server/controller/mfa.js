const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const userModel = require("../models/users");
const { JWT_SECRET } = require("../config/keys");

class MFA {
  /**
   * Tạo secret key và QR code cho MFA setup
   */
  async generateMFASecret(req, res) {
    try {
      // Lấy userId từ JWT token đã được verify
      const userId = req.userDetails._id;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Xóa secret cũ nếu có (để tránh nhầm lẫn)
      if (user.secretKey) {
        console.log("Deleting old secret key before generating new one");
        user.secretKey = null;
        user.verified = false;
        await user.save();
      }

      // Tạo secret key
      const secret = speakeasy.generateSecret({
        name: `Hayroo E-commerce (${user.email})`,
        issuer: "Hayroo Admin",
        length: 32
      });

      console.log("=== Generating New MFA Secret ===");
      console.log("User ID:", userId);
      console.log("User Email:", user.email);
      console.log("Secret (base32):", secret.base32);
      console.log("Secret length:", secret.base32.length);
      console.log("OTPAuth URL:", secret.otpauth_url);

      // Lưu secret tạm thời (chưa enable MFA)
      user.secretKey = secret.base32;
      await user.save();

      // Verify secret đã được lưu đúng
      const savedUser = await userModel.findById(userId);
      console.log("Secret saved correctly:", savedUser.secretKey === secret.base32);
      console.log("Saved secret:", savedUser.secretKey);

      // Generate token ngay để test
      const testToken = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32"
      });
      console.log("Test token with new secret:", testToken);
      console.log("================================");

      // Tạo QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      return res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
        testToken: testToken // Trả về test token để so sánh
      });
    } catch (error) {
      console.log("Generate MFA Secret Error:", error);
      return res.status(500).json({ error: "Failed to generate MFA secret" });
    }
  }

  /**
   * Verify MFA token và enable MFA cho user
   */
  async verifyAndEnableMFA(req, res) {
    try {
      const { token } = req.body;
      // Lấy userId từ JWT token đã được verify
      const userId = req.userDetails?._id;

      console.log("=== Verify and Enable MFA ===");
      console.log("Request body:", req.body);
      console.log("User ID from token:", userId);
      console.log("Token received:", token);

      if (!userId) {
        console.log("Error: User ID not found in token");
        return res.status(400).json({ error: "User ID is required. Please login again." });
      }

      if (!token) {
        console.log("Error: Token not provided");
        return res.status(400).json({ error: "Token is required" });
      }

      const user = await userModel.findById(userId);
      if (!user || !user.secretKey) {
        return res.status(404).json({ error: "User not found or MFA not initialized" });
      }

      // Verify token - đảm bảo token là string và tăng window để cho phép sai lệch thời gian
      const tokenString = String(token).trim().replace(/\s/g, '');
      
      // Kiểm tra token có đúng format không (6 số)
      if (!/^\d{6}$/.test(tokenString)) {
        return res.status(400).json({
          error: "Mã phải là 6 chữ số",
          verified: false
        });
      }

      console.log("=== MFA Verification Debug ===");
      console.log("User ID:", userId);
      console.log("User Email:", user.email);
      console.log("Token received:", tokenString);
      console.log("Secret key exists:", !!user.secretKey);
      console.log("Secret key length:", user.secretKey?.length);
      console.log("Secret key (first 10 chars):", user.secretKey?.substring(0, 10) + "...");
      console.log("Secret key (full):", user.secretKey); // Log full secret để debug

      // Generate token hiện tại để so sánh
      const currentToken = speakeasy.totp({
        secret: user.secretKey,
        encoding: "base32"
      });
      console.log("Current server token:", currentToken);
      console.log("Token match (exact):", currentToken === tokenString);
      
      // Generate token với secret từ database một lần nữa để đảm bảo
      const userFromDB = await userModel.findById(userId);
      const tokenFromDBSecret = speakeasy.totp({
        secret: userFromDB.secretKey,
        encoding: "base32"
      });
      console.log("Token from DB secret:", tokenFromDBSecret);
      console.log("DB secret matches:", userFromDB.secretKey === user.secretKey);

      // Verify với window lớn hơn
      let verified = speakeasy.totp.verify({
        secret: user.secretKey,
        encoding: "base32",
        token: tokenString,
        window: 10 // Tăng lên 10 time steps (300 giây) để cho phép sai lệch thời gian rất lớn
      });

      console.log("Verification result (window=10):", verified);

      // Nếu vẫn fail, thử với window nhỏ hơn nhưng nhiều lần
      if (!verified) {
        // Thử với các window khác nhau
        for (let w = 1; w <= 5; w++) {
          const testVerify = speakeasy.totp.verify({
            secret: user.secretKey,
            encoding: "base32",
            token: tokenString,
            window: w
          });
          if (testVerify) {
            console.log(`Verification successful with window=${w}`);
            verified = true;
            break;
          }
        }
      }

      // Nếu vẫn fail, thử verify với secret.hex nếu có
      if (!verified && user.secretKey) {
        try {
          // Thử verify với cách khác
          const testVerify = speakeasy.totp.verify({
            secret: user.secretKey,
            encoding: "base32",
            token: tokenString,
            window: 10,
            time: Math.floor(Date.now() / 1000) // Explicit time
          });
          if (testVerify) {
            verified = true;
            console.log("Verification successful with explicit time");
          }
        } catch (e) {
          console.log("Alternative verification failed:", e.message);
        }
      }

      console.log("Final verification result:", verified);
      console.log("=============================");

      if (verified) {
        // Enable MFA bằng cách đánh dấu verified = true
        user.verified = true;
        await user.save();
        
        // Verify lại sau khi save
        const savedUser = await userModel.findById(userId);
        console.log("User verified after save:", savedUser.verified);
        console.log("User verified type:", typeof savedUser.verified);

        return res.json({
          success: "MFA enabled successfully",
          verified: true
        });
      } else {
        // Trả về thông tin debug hữu ích - nhưng không phải 400 error, trả về 200 với verified: false
        console.log("Token verification failed");
        console.log("Received token:", tokenString);
        console.log("Expected token:", currentToken);
        return res.json({
          error: `Mã thông báo không hợp lệ. Mã hiện tại trên server: ${currentToken}. Vui lòng thử lại với mã mới. (Lưu ý: Mã thay đổi mỗi 30 giây)`,
          verified: false,
          debug: {
            receivedToken: tokenString,
            expectedToken: currentToken,
            secretExists: !!user.secretKey
          }
        });
      }
    } catch (error) {
      console.log("Verify MFA Error:", error);
      return res.status(500).json({ error: "Failed to verify MFA token" });
    }
  }

  /**
   * Verify MFA token khi login
   */
  async verifyMFAToken(req, res) {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        return res.status(400).json({ error: "User ID and token are required" });
      }

      const user = await userModel.findById(userId);
      // Xử lý cả trường hợp verified là string hoặc boolean
      const isVerified = user?.verified === true || user?.verified === "true" || String(user?.verified || "").toLowerCase() === "true";
      if (!user || !user.secretKey || !isVerified) {
        return res.status(404).json({ error: "MFA not enabled for this user" });
      }

      // Verify token - đảm bảo token là string và tăng window
      const tokenString = String(token).trim();
      const verified = speakeasy.totp.verify({
        secret: user.secretKey,
        encoding: "base32",
        token: tokenString,
        window: 5 // Tăng lên 5 time steps để cho phép sai lệch thời gian
      });

      if (verified) {
        // Tạo JWT token sau khi verify MFA thành công
        const jwt = require("jsonwebtoken");
        const jwtToken = jwt.sign(
          { _id: user._id, role: user.userRole },
          JWT_SECRET
        );
        const encode = jwt.verify(jwtToken, JWT_SECRET);

        return res.json({
          success: "MFA verified successfully",
          verified: true,
          token: jwtToken,
          user: encode
        });
      } else {
        return res.status(400).json({
          error: "Invalid MFA token. Please try again.",
          verified: false
        });
      }
    } catch (error) {
      console.log("Verify MFA Token Error:", error);
      return res.status(500).json({ error: "Failed to verify MFA token" });
    }
  }

  /**
   * Disable MFA cho user
   */
  async disableMFA(req, res) {
    try {
      // Lấy userId từ JWT token đã được verify
      const userId = req.userDetails._id;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Disable MFA
      user.secretKey = null;
      user.verified = false;
      await user.save();

      return res.json({
        success: "MFA disabled successfully"
      });
    } catch (error) {
      console.log("Disable MFA Error:", error);
      return res.status(500).json({ error: "Failed to disable MFA" });
    }
  }

  /**
   * Test token - để debug (không enable MFA, chỉ verify)
   */
  async testToken(req, res) {
    try {
      const { token } = req.body;
      const userId = req.userDetails._id;

      if (!userId || !token) {
        return res.status(400).json({ error: "User ID and token are required" });
      }

      const user = await userModel.findById(userId);
      if (!user || !user.secretKey) {
        return res.status(404).json({ error: "User not found or MFA not initialized" });
      }

      const tokenString = String(token).trim().replace(/\s/g, '');
      const currentToken = speakeasy.totp({
        secret: user.secretKey,
        encoding: "base32"
      });

      const verified = speakeasy.totp.verify({
        secret: user.secretKey,
        encoding: "base32",
        token: tokenString,
        window: 10
      });

      // Generate tokens với các time steps khác nhau để debug
      const tokens = [];
      for (let i = -2; i <= 2; i++) {
        const timeStep = Math.floor(Date.now() / 1000) + (i * 30);
        const tokenAtTime = speakeasy.totp({
          secret: user.secretKey,
          encoding: "base32",
          time: timeStep
        });
        tokens.push({ offset: i, time: timeStep, token: tokenAtTime });
      }

      return res.json({
        verified: verified,
        receivedToken: tokenString,
        expectedToken: currentToken,
        match: currentToken === tokenString,
        secretExists: !!user.secretKey,
        secretKey: user.secretKey, // Trả về để debug
        tokensAtDifferentTimes: tokens
      });
    } catch (error) {
      console.log("Test Token Error:", error);
      return res.status(500).json({ error: "Failed to test token" });
    }
  }

  /**
   * Get current token - để so sánh với Google Authenticator
   */
  async getCurrentToken(req, res) {
    try {
      const userId = req.userDetails._id;
      const user = await userModel.findById(userId);
      
      if (!user || !user.secretKey) {
        return res.status(404).json({ error: "MFA not initialized" });
      }

      const currentToken = speakeasy.totp({
        secret: user.secretKey,
        encoding: "base32"
      });

      return res.json({
        currentToken: currentToken,
        secretKey: user.secretKey,
        timestamp: Date.now()
      });
    } catch (error) {
      console.log("Get Current Token Error:", error);
      return res.status(500).json({ error: "Failed to get current token" });
    }
  }

  /**
   * Kiểm tra MFA status của user
   */
  async getMFAStatus(req, res) {
    try {
      // Lấy userId từ JWT token đã được verify
      const userId = req.userDetails._id;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Xử lý cả trường hợp verified là string hoặc boolean (tương thích với dữ liệu cũ)
      const isVerified = user.verified === true || user.verified === "true" || String(user.verified).toLowerCase() === "true";
      
      return res.json({
        mfaEnabled: isVerified && user.secretKey !== null,
        hasSecret: user.secretKey !== null
      });
    } catch (error) {
      console.log("Get MFA Status Error:", error);
      return res.status(500).json({ error: "Failed to get MFA status" });
    }
  }
}

const mfaController = new MFA();
module.exports = mfaController;

