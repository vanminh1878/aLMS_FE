import React, { useState } from "react";
import SubjectTab from "./SubjectTab";
import HomeroomTab from "./HomeroomTab";

const EvaluationTabs = () => {
  const [active, setActive] = useState("subject");

  return (
    <div className="se-tabs card">
      <div className="se-tab-header">
        <button className={active === "subject" ? "active" : ""} onClick={() => setActive("subject")}>Điểm theo môn (Giáo viên bộ môn)</button>
        <button className={active === "homeroom" ? "active" : ""} onClick={() => setActive("homeroom")}>Sổ liên lạc lớp (Giáo viên chủ nhiệm)</button>
      </div>
      <div className="se-tab-body">
        {active === "subject" ? <SubjectTab /> : <HomeroomTab />}
      </div>
    </div>
  );
};

export default EvaluationTabs;
