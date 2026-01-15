import { fetchGet, fetchPost, fetchPut } from "../lib/httpHandler";

const BASE = "/api/student-evaluations";

const getByStudent = async (studentId, semester, schoolYear, onSuccess, onFail, onException) => {
  const q = `?semester=${encodeURIComponent(semester || "")}&schoolYear=${encodeURIComponent(schoolYear || "")}`;
  return fetchGet(`${BASE}/by-student/${studentId}${q}`, onSuccess, onFail, onException);
};

const getByClass = async (classId, semester, schoolYear, onSuccess, onFail, onException) => {
  const q = `?semester=${encodeURIComponent(semester || "")}&schoolYear=${encodeURIComponent(schoolYear || "")}`;
  return fetchGet(`${BASE}/by-class/${classId}${q}`, onSuccess, onFail, onException);
};

const createEvaluation = async (data, onSuccess, onFail, onException) => {
  return fetchPost(BASE, data, onSuccess, onFail, onException);
};

const updateEvaluation = async (id, data, onSuccess, onFail, onException) => {
  return fetchPut(`${BASE}/${id}`, data, onSuccess, onFail, onException);
};

const postSubjectComment = async (evaluationId, data, onSuccess, onFail, onException) => {
  return fetchPost(`${BASE}/${evaluationId}/subject-comments`, data, onSuccess, onFail, onException);
};

const postQualityEvaluation = async (evaluationId, data, onSuccess, onFail, onException) => {
  return fetchPost(`${BASE}/${evaluationId}/quality-evaluations`, data, onSuccess, onFail, onException);
};

export { getByStudent, getByClass, createEvaluation, updateEvaluation, postSubjectComment, postQualityEvaluation };
