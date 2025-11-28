import React, { Fragment, useState } from "react";
import { signupReq } from "./fetchApi";
import { useSnackbar } from 'notistack';
const Signup = (props) => {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    cPassword: "",
    error: false,
    loading: false,
    success: false,
  });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    upperCase: false,
    lowerCase: false,
    number: false,
    specialChar: false,
  });

  const alert = (msg, type) => (
    <div className={`text-sm text-${type}-500`}>{msg}</div>
  );
  const { enqueueSnackbar } = useSnackbar();

  // Validate password strength
  const validatePasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    });
  };
  const formSubmit = async (e) => {
    e && e.preventDefault();

    if (data.loading) return;

    setData({ ...data, loading: true, success: false, error: {} });

    if (data.cPassword !== data.password) {
      setData({
        ...data,
        loading: false,
        error: {
          cPassword: "Password doesn't match",
          password: "Password doesn't match",
        },
      });
      return;
    }

    try {
      const responseData = await signupReq({
        name: data.name,
        email: data.email,
        password: data.password,
        cPassword: data.cPassword,
      });

      if (!responseData) {
        setData({ ...data, loading: false });
        enqueueSnackbar("Không thể kết nối tới máy chủ. Vui lòng thử lại!", {
          variant: "error",
        });
        return;
      }

      if (responseData.error) {
        setData({
          ...data,
          loading: false,
          error: responseData.error,
          password: "",
          cPassword: "",
        });
      } else if (responseData.success) {
        setData({
          success: responseData.success,
          name: "",
          email: "",
          password: "",
          cPassword: "",
          loading: false,
          error: false,
        });
        enqueueSnackbar("Account Created Successfully..!", { variant: "success" });
      }
    } catch (error) {
      console.log(error);
      setData({ ...data, loading: false });
      enqueueSnackbar("Đăng ký thất bại, vui lòng thử lại!", { variant: "error" });
    }
  };

  return (
    <Fragment>
      <div className="text-center text-2xl mb-6">Register</div>
      <form className="space-y-4" onSubmit={formSubmit}>
        {data.success ? alert(data.success, "green") : ""}
        <div className="flex flex-col">
          <label htmlFor="name">
            Name<span className="text-sm text-gray-600 ml-1">*</span>
          </label>
          <input
            onChange={(e) =>
              setData({
                ...data,
                success: false,
                error: {},
                name: e.target.value,
              })
            }
            value={data.name}
            type="text"
            id="name"
            className={`${
              data.error.name ? "border-red-500" : ""
            } px-4 py-2 focus:outline-none border`}
          />
          {!data.error ? "" : alert(data.error.name, "red")}
        </div>
        <div className="flex flex-col">
          <label htmlFor="email">
            Email address<span className="text-sm text-gray-600 ml-1">*</span>
          </label>
          <input
            onChange={(e) =>
              setData({
                ...data,
                success: false,
                error: {},
                email: e.target.value,
              })
            }
            value={data.email}
            type="email"
            id="email"
            className={`${
              data.error.email ? "border-red-500" : ""
            } px-4 py-2 focus:outline-none border`}
          />
          {!data.error ? "" : alert(data.error.email, "red")}
        </div>
        <div className="flex flex-col">
          <label htmlFor="password">
            Password<span className="text-sm text-gray-600 ml-1">*</span>
          </label>
          <input
            onChange={(e) => {
              const newPassword = e.target.value;
              validatePasswordStrength(newPassword);
              setData({
                ...data,
                success: false,
                error: {},
                password: newPassword,
              });
            }}
            value={data.password}
            type="password"
            id="password"
            className={`${
              data.error.password ? "border-red-500" : ""
            } px-4 py-2 focus:outline-none border`}
          />
          {!data.error ? "" : alert(data.error.password, "red")}
          
          {/* Password Strength Indicator */}
          {data.password && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
              <p className="font-semibold mb-2">Yêu cầu mật khẩu mạnh:</p>
              <ul className="space-y-1">
                <li className={passwordStrength.length ? "text-green-600" : "text-gray-500"}>
                  {passwordStrength.length ? "✓" : "○"} Ít nhất 8 ký tự
                </li>
                <li className={passwordStrength.upperCase ? "text-green-600" : "text-gray-500"}>
                  {passwordStrength.upperCase ? "✓" : "○"} Có chữ hoa (A-Z)
                </li>
                <li className={passwordStrength.lowerCase ? "text-green-600" : "text-gray-500"}>
                  {passwordStrength.lowerCase ? "✓" : "○"} Có chữ thường (a-z)
                </li>
                <li className={passwordStrength.number ? "text-green-600" : "text-gray-500"}>
                  {passwordStrength.number ? "✓" : "○"} Có số (0-9)
                </li>
                <li className={passwordStrength.specialChar ? "text-green-600" : "text-gray-500"}>
                  {passwordStrength.specialChar ? "✓" : "○"} Có ký tự đặc biệt (!@#$%^&*)
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label htmlFor="cPassword">
            Confirm password
            <span className="text-sm text-gray-600 ml-1">*</span>
          </label>
          <input
            onChange={(e) =>
              setData({
                ...data,
                success: false,
                error: {},
                cPassword: e.target.value,
              })
            }
            value={data.cPassword}
            type="password"
            id="cPassword"
            className={`${
              data.error.cPassword ? "border-red-500" : ""
            } px-4 py-2 focus:outline-none border`}
          />
          {!data.error ? "" : alert(data.error.cPassword, "red")}
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <input
              type="checkbox"
              id="rememberMe"
              className="px-4 py-2 focus:outline-none border mr-1"
            />
            <label htmlFor="rememberMe">
              Remember me<span className="text-sm text-gray-600">*</span>
            </label>
          </div>
          <a className="block text-gray-600" href="/">
            Lost your password?
          </a>
        </div>
        <button
          type="submit"
          disabled={data.loading}
          style={{ background: "#303031" }}
          className={`px-4 py-2 text-white text-center font-medium ${
            data.loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {data.loading ? "Processing..." : "Create an account"}
        </button>
      </form>
    </Fragment>
  );
};

export default Signup;
