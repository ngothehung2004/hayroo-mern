import axios from "axios";
const apiURL = process.env.REACT_APP_API_URL;

const BearerToken = () =>
  localStorage.getItem("jwt")
    ? JSON.parse(localStorage.getItem("jwt")).token
    : false;

const Headers = () => {
  return {
    headers: {
      token: BearerToken(),
    },
  };
};

// Generate MFA secret và QR code
export const generateMFASecret = async () => {
  try {
    let res = await axios.post(
      `${apiURL}/api/mfa/generate-secret`,
      {},
      Headers()
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return { error: error.response?.data?.error || "Failed to generate MFA secret" };
  }
};

// Verify và enable MFA
export const verifyAndEnableMFA = async (token) => {
  try {
    console.log("Sending verify request with token:", token);
    let res = await axios.post(
      `${apiURL}/api/mfa/verify-enable`,
      { token },
      Headers()
    );
    console.log("Verify response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Verify MFA Error:", error);
    console.error("Error response:", error.response?.data);
    return { 
      error: error.response?.data?.error || error.message || "Failed to verify MFA token",
      status: error.response?.status
    };
  }
};

// Verify MFA token khi login
export const verifyMFAToken = async (userId, token) => {
  try {
    let res = await axios.post(`${apiURL}/api/mfa/verify-token`, {
      userId,
      token,
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return { error: error.response?.data?.error || "Failed to verify MFA token" };
  }
};

// Disable MFA
export const disableMFA = async () => {
  try {
    let res = await axios.post(
      `${apiURL}/api/mfa/disable`,
      {},
      Headers()
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return { error: error.response?.data?.error || "Failed to disable MFA" };
  }
};

// Get MFA status
export const getMFAStatus = async () => {
  try {
    let res = await axios.post(
      `${apiURL}/api/mfa/status`,
      {},
      Headers()
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return { error: error.response?.data?.error || "Failed to get MFA status" };
  }
};

