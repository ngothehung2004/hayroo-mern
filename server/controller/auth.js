const { toTitleCase, validateEmail, validateStrongPassword } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");

class Auth {
  async isAdmin(req, res) {
    let { loggedInUserId } = req.body;
    try {
      let loggedInUserRole = await userModel.findById(loggedInUserId);
      res.json({ role: loggedInUserRole.userRole });
    } catch {
      res.status(404);
    }
  }

  async allUser(req, res) {
    try {
      let allUser = await userModel.find({});
      res.json({ users: allUser });
    } catch {
      res.status(404);
    }
  }

  /* User Registration/Signup controller  */
  async postSignup(req, res) {
    let { name, email, password, cPassword } = req.body;
    let error = {};
    if (!name || !email || !password || !cPassword) {
      error = {
        ...error,
        name: "Filed must not be empty",
        email: "Filed must not be empty",
        password: "Filed must not be empty",
        cPassword: "Filed must not be empty",
      };
      return res.json({ error });
    }
    if (name.length < 3 || name.length > 25) {
      error = { ...error, name: "Name must be 3-25 charecter" };
      return res.json({ error });
      } else {
        if (validateEmail(email)) {
        name = toTitleCase(name);
        
        // Validate mật khẩu mạnh
        const passwordValidation = validateStrongPassword(password);
        if (!passwordValidation.isValid) {
          error = {
            ...error,
            password: passwordValidation.errors.join(". "),
            name: "",
            email: "",
          };
          return res.json({ error });
        }
        
        if (password.length > 255) {
          error = {
            ...error,
            password: "Password must be less than 255 characters",
            name: "",
            email: "",
          };
          return res.json({ error });
        } else {
          // If Email & Number exists in Database then:
          try {
            password = bcrypt.hashSync(password, 10);
            const data = await userModel.findOne({ email: email });
            if (data) {
              error = {
                ...error,
                password: "",
                name: "",
                email: "Email already exists",
              };
              return res.json({ error });
            } else {
              let newUser = new userModel({
                name,
                email,
                password,
                // ========= Here role 1 for admin signup role 0 for customer signup =========
                userRole: 1, // Field Name change to userRole from role
              });
              newUser
                .save()
                .then((data) => {
                  return res.json({
                    success: "Account create successfully. Please login",
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          } catch (err) {
            console.log(err);
          }
        }
      } else {
        error = {
          ...error,
          password: "",
          name: "",
          email: "Email is not valid",
        };
        return res.json({ error });
      }
    }
  }

  /* User Login/Signin controller  */
  async postSignin(req, res) {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        error: "Fields must not be empty",
      });
    }
    try {
      const data = await userModel.findOne({ email: email });
      if (!data) {
        return res.json({
          error: "Invalid email or password",
        });
      } else {
        const login = await bcrypt.compare(password, data.password);
        if (login) {
          // Kiểm tra nếu user đã enable MFA (xử lý cả string và boolean)
          const isVerified = data.verified === true || data.verified === "true" || String(data.verified || "").toLowerCase() === "true";
          if (isVerified && data.secretKey) {
            // Yêu cầu MFA verification
            return res.json({
              requiresMFA: true,
              userId: data._id,
              message: "MFA verification required"
            });
          } else {
            // Login bình thường nếu chưa enable MFA
            const token = jwt.sign(
              { _id: data._id, role: data.userRole },
              JWT_SECRET
            );
            const encode = jwt.verify(token, JWT_SECRET);
            return res.json({
              token: token,
              user: encode,
              requiresMFA: false
            });
          }
        } else {
          return res.json({
            error: "Invalid email or password",
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}

const authController = new Auth();
module.exports = authController;
