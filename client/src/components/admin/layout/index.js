import React, { Fragment } from "react";

import AdminNavber from "../partials/AdminNavber";
import AdminSidebar from "../partials/AdminSidebar";

const AdminLayout = ({ children }) => {
  return (
    <Fragment>
      <AdminNavber />
      <section className="flex bg-gray-100">
        <AdminSidebar />
        <div className="w-full md:w-11/12 h-full">
          {/* All Children pass from here */}
          {children}
        </div>
      </section>
    </Fragment>
  );
};

export default AdminLayout;
