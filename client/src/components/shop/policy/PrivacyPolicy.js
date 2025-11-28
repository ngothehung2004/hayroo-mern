import React, { Fragment } from "react";
import Layout from "../layout";

const sections = [
  {
    title: "1. Mục tiêu",
    items: [
      "Bảo vệ dữ liệu và hệ thống khỏi rò rỉ, mất mát và truy cập trái phép.",
    ],
  },
  {
    title: "2. Phạm vi",
    items: [
      "Áp dụng cho toàn bộ nhân viên, đối tác, và hệ thống của công ty.",
    ],
  },
  {
    title: "3. Quy tắc mật khẩu",
    items: ["Mật khẩu ≥ 12 ký tự", "Đổi mật khẩu mỗi 90 ngày", "Bắt buộc kích hoạt 2FA"],
  },
  {
    title: "4. Bảo vệ thiết bị",
    items: [
      "Đặt mật khẩu hoặc mã PIN cho máy tính/thiết bị",
      "Khóa màn hình khi rời bàn",
      "Không cài đặt phần mềm lạ không rõ nguồn gốc",
    ],
  },
  {
    title: "5. Quản lý dữ liệu",
    items: [
      "Dữ liệu khách hàng phải được lưu trữ ở nơi được phép theo quy định",
      "Không chia sẻ dữ liệu qua email cá nhân hoặc kênh không được phê duyệt",
    ],
  },
  {
    title: "6. Quy trình báo cáo sự cố",
    items: [
      "Báo cho bộ phận IT trong vòng 15 phút khi phát hiện sự cố",
      "Không tự ý sửa chữa hoặc khắc phục khi chưa có hướng dẫn",
    ],
  },
  {
    title: "7. Truy cập hệ thống",
    items: [
      "Nguyên tắc cấp quyền tối thiểu cần thiết",
      "Ghi log đầy đủ mọi hoạt động quan trọng",
      "Thu hồi quyền truy cập ngay khi nhân viên nghỉ việc hoặc chuyển bộ phận",
    ],
  },
  {
    title: "8. Tuân thủ",
    items: [
      "Nhân viên vi phạm sẽ bị xử lý theo quy định của công ty và các điều khoản pháp luật áp dụng.",
    ],
  },
];

const PrivacyPolicyContent = () => (
  <main className="pt-24 pb-16 px-4 md:px-12 bg-gray-50 min-h-screen">
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 md:p-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        Chính Sách Bảo Mật
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Tài liệu này mô tả các nguyên tắc nhằm đảm bảo an toàn thông tin cho toàn bộ hệ thống và dữ liệu của công ty.
      </p>
      <section className="space-y-6">
        {sections.map(({ title, items }) => (
          <article key={title} className="border-l-4 border-yellow-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
            <ul className="list-disc list-outside ml-4 text-gray-700 space-y-1">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  </main>
);

const PrivacyPolicy = () => (
  <Fragment>
    <Layout>
      <PrivacyPolicyContent />
    </Layout>
  </Fragment>
);

export default PrivacyPolicy;
