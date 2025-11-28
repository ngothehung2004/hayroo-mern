const axios = require("axios");

module.exports = async function (req, res, next) {
  try {
    const { captchaToken } = req.body;

    if (!captchaToken) {
      return res.json({ error: "Captcha verification failed: token missing" });
    }

    const secretKey = "6Lf6oxosAAAAAIQD8LL8Fo4Fdsysk63P2WORxTeFc"; // ❗ Thay bằng SECRET KEY của bạn

    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
    const { data } = await axios.post(url);

    if (!data.success) {
      return res.json({ error: "Captcha verification failed" });
    }

    next();
  } catch (error) {
    console.log("CAPTCHA ERROR:", error);
    return res.json({ error: "Captcha validation error" });
  }
};
