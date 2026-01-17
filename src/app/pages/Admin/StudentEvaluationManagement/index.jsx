import React from "react";
import EvaluationTabs from "./EvaluationTabs";
import "./StudentEvaluation.css";

const StudentEvaluationPage = () => {
  return (
    <div className="se-page container">
      <header className="se-header">
        <h1>Quản lý sổ liên lạc</h1>
      </header>
      <EvaluationTabs />
    </div>
  );
};

export default StudentEvaluationPage;
