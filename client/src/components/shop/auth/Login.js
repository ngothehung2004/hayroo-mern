import React, { Fragment, useState, useContext } from "react";
import { loginReq } from "./fetchApi";
import { LayoutContext } from "../index";
import { useSnackbar } from 'notistack';
import MFAVerification from "./MFAVerification";
import ReCAPTCHA from "react-google-recaptcha";

const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const SITE_KEY = "6Ld0rBEsAAAAAMIVhg3XRtkusoiG2xkCfZl2og6B"; // ❗ THAY BẰNG SITE KEY CỦA BẠN

const Login = (props) => {
  const { data: layoutData, dispatch: layoutDispatch } = useContext(LayoutContext);

  const [data, setData] = useState({
    email: "",
    password: "",
    error: false,
    loading: true,
  });

  const [captchaToken, setCaptchaToken] = useState("");
  const [manualCaptcha, setManualCaptcha] = useState("");
  const [displayedCaptcha, setDisplayedCaptcha] = useState(generateCaptcha());
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaUserId, setMfaUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const alert = (msg) => <div className="text-xs text-red-500">{msg}</div>;

  const formSubmit = async () => {
    if (manualCaptcha.trim().toUpperCase() !== displayedCaptcha) {
      enqueueSnackbar("Mã bảo vệ không chính xác!", { variant: "error" });
      return;
    }

    if (!captchaToken) {
      enqueueSnackbar("Vui lòng xác minh reCAPTCHA!", { variant: "error" });
      return;
    }

    setData({ ...data, loading: true });

    try {
      let responseData = await loginReq({
        email: data.email,
        password: data.password,
        captchaToken: captchaToken, // gửi captcha sang backend
      });

      if (responseData.error) {
        setData({
          ...data,
          loading: false,
          error: responseData.error,
          password: "",
        });
      } 
      else if (responseData.requiresMFA) {
        setRequiresMFA(true);
        setMfaUserId(responseData.userId);
        setData({ ...data, loading: false });
        enqueueSnackbar('MFA verification required', { variant: 'info' });
      } 
      else if (responseData.token) {
        setData({ email: "", password: "", loading: false, error: false });
        localStorage.setItem("jwt", JSON.stringify(responseData));
        enqueueSnackbar('Login Completed Successfully..!', { variant: 'success' });
        window.location.href = "/";
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Nếu yêu cầu MFA thì chuyển sang giao diện xác minh
  if (requiresMFA && mfaUserId) {
    return (
      <MFAVerification
        userId={mfaUserId}
        onSuccess={() => {
          setRequiresMFA(false);
          setMfaUserId(null);
        }}
        onCancel={() => {
          setRequiresMFA(false);
          setMfaUserId(null);
          setData({ ...data, password: "" });
        }}
      />
    );
  }

  return (
    <Fragment>
      <div className="text-center text-2xl mb-6">Login</div>

      {layoutData.loginSignupError && (
        <div className="bg-red-200 py-2 px-4 rounded">
          You need to login for checkout. Haven't accont? Create new one.
        </div>
      )}

      <form className="space-y-4">
        
        {/* Email */}
        <div className="flex flex-col">
          <label htmlFor="name">
            Username or email address
            <span className="text-sm text-gray-600 ml-1">*</span>
          </label>
          <input
            onChange={(e) => {
              setData({ ...data, email: e.target.value, error: false });
              layoutDispatch({ type: "loginSignupError", payload: false });
            }}
            value={data.email}
            type="text"
            id="name"
            className={`${!data.error ? "" : "border-red-500"} px-4 py-2 focus:outline-none border`}
          />
          {data.error && alert(data.error)}
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label htmlFor="password">
            Password<span className="text-sm text-gray-600 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              onChange={(e) => {
                setData({ ...data, password: e.target.value, error: false });
                layoutDispatch({ type: "loginSignupError", payload: false });
              }}
              value={data.password}
              type={showPassword ? "text" : "password"}
              id="password"
              className={`${!data.error ? "" : "border-red-500"} px-4 py-2 focus:outline-none border w-full pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {data.error && alert(data.error)}
        </div>

        {/* Captcha */}
        <div className="space-y-2">
          <label className="font-medium text-sm text-gray-700">
            Mã bảo vệ
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-32">
              <input
                type="text"
                placeholder="Nhập mã"
                className="w-full px-3 py-2 border focus:outline-none"
                value={manualCaptcha}
                onChange={(e) => setManualCaptcha(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-4 py-2 bg-gray-100 font-semibold tracking-widest text-lg text-blue-600">
                {displayedCaptcha}
              </div>
              <button
                type="button"
                className="p-2 border rounded-full text-blue-600"
                onClick={() => {
                  setDisplayedCaptcha(generateCaptcha());
                  setManualCaptcha("");
                }}
                aria-label="Làm mới mã bảo vệ"
              >
                ↻
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken("")}
            />
          </div>
        </div>

        {/* Remember + Lost password */}
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <input type="checkbox" id="rememberMe" className="px-4 py-2 focus:outline-none border mr-1" />
            <label htmlFor="rememberMe">
              Remember me<span className="text-sm text-gray-600">*</span>
            </label>
          </div>
          <a className="block text-gray-600" href="/">
            Lost your password?
          </a>
        </div>

        {/* Login button */}
        <div
          onClick={formSubmit}
          style={{ background: "#303031" }}
          className="font-medium px-4 py-2 text-white text-center cursor-pointer"
        >
          Login
        </div>
      </form>
    </Fragment>
  );
};

export default Login;
