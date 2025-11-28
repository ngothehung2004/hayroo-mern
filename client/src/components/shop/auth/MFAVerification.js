import React, { useState } from "react";
import { verifyMFAToken } from "../../admin/mfa/FetchApi";
import { useSnackbar } from "notistack";

const MFAVerification = ({ userId, onSuccess, onCancel }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (token.length !== 6) {
      enqueueSnackbar("Please enter a valid 6-digit code", { variant: "warning" });
      return;
    }

    setLoading(true);
    const response = await verifyMFAToken(userId, token);
    setLoading(false);

    if (response.error) {
      enqueueSnackbar(response.error, { variant: "error" });
      setToken("");
    } else if (response.verified && response.token) {
      // Lưu JWT token và redirect
      localStorage.setItem("jwt", JSON.stringify(response));
      enqueueSnackbar("MFA verified successfully!", { variant: "success" });
      if (onSuccess) {
        onSuccess(response);
      }
      window.location.href = "/";
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Yêu cầu xác minh MFA</h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Vui lòng nhập mã 6 chữ số từ ứng dụng xác thực của bạn để hoàn tất đăng nhập.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Mã xác thực</label>
          <input
            type="text"
            maxLength="6"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full px-4 py-3 border rounded text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || token.length !== 6}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Đang xác minh..." : "Xác minh & Đăng nhập"}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Hủy bỏ
          </button>
        )}
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded text-sm text-yellow-800 border border-yellow-200">
        <strong className="block mb-2">📱 Làm thế nào để lấy mã OTP?</strong>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Mở ứng dụng xác thực trên điện thoại (Google Authenticator, Microsoft Authenticator, Authy, v.v.)</li>
          <li>Tìm tài khoản của bạn trong danh sách</li>
          <li>Nhập mã 6 chữ số đang hiển thị (mã thay đổi mỗi 30 giây)</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded text-sm text-blue-800 border border-blue-200">
        <strong className="block mb-2">ℹ️ Lưu ý:</strong>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>QR code chỉ hiển thị khi thiết lập MFA lần đầu trong Admin Dashboard</li>
          <li>Nếu bạn chưa thiết lập MFA, vui lòng đăng nhập vào Admin Dashboard → MFA Security để thiết lập</li>
          <li>Nếu bạn không có quyền truy cập vào ứng dụng xác thực, vui lòng liên hệ với quản trị viên</li>
        </ul>
      </div>
    </div>
  );
};

export default MFAVerification;

