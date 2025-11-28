import React, { useState, useEffect, useCallback } from "react";
import { generateMFASecret, verifyAndEnableMFA, getMFAStatus, disableMFA } from "./FetchApi";
import { useSnackbar } from "notistack";

const MFASetup = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState({ mfaEnabled: false, hasSecret: false });
  const [qrCode, setQrCode] = useState(null);
  const [manualKey, setManualKey] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [step, setStep] = useState("status"); // status, setup, verify

  const user = localStorage.getItem("jwt")
    ? JSON.parse(localStorage.getItem("jwt")).user
    : null;

  const checkMFAStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getMFAStatus();
      console.log("MFA Status Response:", response);
      if (response.error) {
        enqueueSnackbar(response.error, { variant: "error" });
        setMfaStatus({ mfaEnabled: false, hasSecret: false });
      } else {
        console.log("Setting MFA status:", response);
        setMfaStatus(response);
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
      enqueueSnackbar("Failed to check MFA status", { variant: "error" });
      setMfaStatus({ mfaEnabled: false, hasSecret: false });
    } finally {
      setLoading(false);
    }
  }, [user, enqueueSnackbar]);

  useEffect(() => {
    // Reset loading khi component mount hoặc user thay đổi
    setLoading(false);
    
    if (user && user._id) {
      // Delay nhỏ để đảm bảo state đã được reset
      const timer = setTimeout(() => {
        checkMFAStatus();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleGenerateSecret = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await generateMFASecret();
      if (response.error) {
        enqueueSnackbar(response.error, { variant: "error" });
      } else {
        setQrCode(response.qrCode);
        setManualKey(response.manualEntryKey);
        setStep("verify");
        enqueueSnackbar("QR Code generated. Please scan with Google Authenticator", {
          variant: "info",
        });
      }
    } catch (error) {
      console.error("Error generating MFA secret:", error);
      enqueueSnackbar("Failed to generate MFA secret", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!user || !verificationToken) {
      enqueueSnackbar("Please enter the 6-digit code from your authenticator app", {
        variant: "warning",
      });
      return;
    }
    try {
      setLoading(true);
      const response = await verifyAndEnableMFA(verificationToken);
      if (response.error) {
        enqueueSnackbar(response.error, { variant: "error" });
      } else if (response.verified || response.success) {
        console.log("MFA enabled successfully, response:", response);
        enqueueSnackbar("MFA enabled successfully!", { variant: "success" });
        setStep("status");
        setVerificationToken("");
        setQrCode(null);
        setManualKey("");
        // Cập nhật state ngay lập tức
        setMfaStatus({ mfaEnabled: true, hasSecret: true });
        // Force refresh status từ server để đảm bảo
        setTimeout(async () => {
          console.log("Refreshing MFA status after enable...");
          await checkMFAStatus();
        }, 500);
      } else {
        // Nếu response không có verified hoặc success, vẫn refresh để kiểm tra
        console.log("Unexpected response format:", response);
        enqueueSnackbar("MFA may have been enabled. Refreshing status...", { variant: "info" });
        setTimeout(async () => {
          await checkMFAStatus();
        }, 500);
      }
    } catch (error) {
      console.error("Error verifying MFA:", error);
      enqueueSnackbar("Failed to verify MFA token", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to disable MFA? This will reduce your account security.")) {
      return;
    }
    try {
      setLoading(true);
      const response = await disableMFA();
      if (response.error) {
        enqueueSnackbar(response.error, { variant: "error" });
      } else {
        enqueueSnackbar("MFA disabled successfully", { variant: "success" });
        // Force refresh status sau khi disable
        setTimeout(async () => {
          await checkMFAStatus();
        }, 500);
      }
    } catch (error) {
      console.error("Error disabling MFA:", error);
      enqueueSnackbar("Failed to disable MFA", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please login to access MFA settings</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Multi-Factor Authentication (MFA)</h2>

      {step === "status" && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">MFA Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              {mfaStatus.mfaEnabled
                ? "✅ MFA is currently enabled for your account"
                : "❌ MFA is not enabled. Enable it to add an extra layer of security."}
            </p>
          </div>

          {mfaStatus.mfaEnabled ? (
            <button
              onClick={handleDisableMFA}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Disabling..." : "Disable MFA"}
            </button>
          ) : (
            <button
              onClick={handleGenerateSecret}
              disabled={loading || step !== "status"}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading && step === "status" ? "Generating..." : "Enable MFA"}
            </button>
          )}
        </div>
      )}

      {step === "verify" && qrCode && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Step 1: Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Open Google Authenticator (or any TOTP app) on your phone and scan this QR code:
            </p>
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="MFA QR Code" className="border-2 border-gray-300 rounded" />
            </div>
            <p className="text-sm text-gray-600">
              <strong>Manual Entry Key:</strong> {manualKey}
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded">
            <h3 className="font-semibold mb-2">Step 2: Verify Setup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app to verify and enable MFA:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength="6"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="px-4 py-2 border rounded flex-1 text-center text-2xl tracking-widest"
              />
              <button
                onClick={handleVerifyAndEnable}
                disabled={loading || verificationToken.length !== 6}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
            </div>
            <button
              onClick={() => {
                setStep("status");
                setQrCode(null);
                setVerificationToken("");
              }}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFASetup;

