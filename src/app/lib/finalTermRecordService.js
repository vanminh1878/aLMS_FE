import { fetchGet, fetchPost, fetchPut } from "./httpHandler";

const BASE = "/api/final-term-records";

const getById = async (id, onSuccess, onFail, onException) => {
  return fetchGet(`${BASE}/${id}`, onSuccess, onFail, onException);
};

const getByStudent = async (studentProfileId, onSuccess, onFail, onException) => {
  return fetchGet(`${BASE}/student/${studentProfileId}`, onSuccess, onFail, onException);
};

const getByClass = async (classId, onSuccess, onFail, onException) => {
  return fetchGet(`${BASE}/class/${classId}`, onSuccess, onFail, onException);
};

const createRecord = async (data, onSuccess, onFail, onException) => {
  return fetchPost(BASE, data, onSuccess, onFail, onException);
};

const updateRecord = async (data, onSuccess, onFail, onException) => {
  return fetchPut(BASE, data, onSuccess, onFail, onException);
};

export { getById, getByStudent, getByClass, createRecord, updateRecord };
