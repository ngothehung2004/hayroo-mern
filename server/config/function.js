/* This all of are helper function */
const userModel = require("../models/users");

exports.toTitleCase = function (str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

exports.validateEmail = function (mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  } else {
    return false;
  }
};

exports.emailCheckInDatabase = async function (email) {
  let user = await userModel.findOne({ email: email });
  user.exec((err, data) => {
    if (!data) {
      return false;
    } else {
      return true;
    }
  });
};

exports.phoneNumberCheckInDatabase = async function (phoneNumber) {
  let user = await userModel.findOne({ phoneNumber: phoneNumber });
  user.exec((err, data) => {
    if (data) {
      return true;
    } else {
      return false;
    }
  });
};

/**
 * Validate mật khẩu mạnh
 * Yêu cầu: 
 * - Ít nhất 8 ký tự
 * - Có ít nhất 1 chữ hoa
 * - Có ít nhất 1 chữ thường
 * - Có ít nhất 1 số
 * - Có ít nhất 1 ký tự đặc biệt
 */
exports.validateStrongPassword = function (password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Mật khẩu phải có ít nhất ${minLength} ký tự`);
  }
  if (!hasUpperCase) {
    errors.push("Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)");
  }
  if (!hasLowerCase) {
    errors.push("Mật khẩu phải có ít nhất 1 chữ thường (a-z)");
  }
  if (!hasNumbers) {
    errors.push("Mật khẩu phải có ít nhất 1 số (0-9)");
  }
  if (!hasSpecialChar) {
    errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};
