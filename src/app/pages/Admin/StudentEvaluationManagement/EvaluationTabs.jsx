import React, { useState } from "react";
import HomeroomTab from "./HomeroomTab";
import NotificationsManagement from "./NotificationsManagement";
import { Tabs, Tab, Box } from "@mui/material";

const EvaluationTabs = () => {
  const [tab, setTab] = useState(0);
  return (
    <div className="se-tabs card">
      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="Sổ liên lạc" />
        <Tab label="Thông báo" />
      </Tabs>
      <div className="se-tab-body" style={{ padding: 12 }}>
        {tab === 0 && <HomeroomTab />}
        {tab === 1 && <NotificationsManagement />}
      </div>
    </div>
  );
};

export default EvaluationTabs;
