import React from "react";
import EvaluationTabs from "./EvaluationTabs";
import "./StudentEvaluation.css";

const StudentEvaluationPage = () => {
  return (
    <div className="se-page container">
      <header className="se-header">
        <h1>Quản lý sổ liên lạc</h1>
        <p className="se-sub">Nhập điểm, nhận xét và đánh giá cho học sinh</p>
      </header>
      <EvaluationTabs />
    </div>
  );
};

export default StudentEvaluationPage;
