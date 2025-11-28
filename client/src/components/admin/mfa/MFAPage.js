import React, { Fragment } from "react";
import AdminLayout from "../layout";
import MFASetup from "./MFASetup";

const MFAPage = (props) => {
  return (
    <Fragment>
      <AdminLayout children={<MFASetup />} />
    </Fragment>
  );
};

export default MFAPage;













