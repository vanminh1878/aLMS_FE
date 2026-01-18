const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5120";
const BE_ENPOINT = API_BASE;

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  accept: "application/json",
};

const getHeaders = () => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("jwtToken");
  if (token === null) {
    return HEADERS;
  }
  return {
    ...HEADERS,
    Authorization: `Bearer ${token}`,
  };
};

const fetchGet = async (uri, onSuccess, onFail, onException) => {
  try {
    const res = await fetch(BE_ENPOINT + uri, {
      method: "GET",
      headers: getHeaders(),
    });

    if (res.status === 204) {
      return onSuccess({});
    }

    const data = await res.json();
    if (!res.ok) {
      return onFail({ title: data.title, status: res.status });
    }
    return onSuccess(data);
  } catch (error) {
    console.error("Fetch GET error:", error.message);
    if (typeof onException === "function") {
      return onException();
    } else {
      console.warn("onException is not a function, skipping...");
      return;
    }
  }
};
const fetchPostFormData = async (uri, formData, onSuccess, onFail, onException) => {
  try {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("jwtToken");

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(BE_ENPOINT + uri, {
      method: "POST",
      headers: headers, // Chỉ Authorization, KHÔNG có Content-Type
      body: formData,
    });

    if (res.status === 204) {
      return onSuccess({ message: "Thành công" });
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = { title: "Không thể parse response" };
    }

    if (!res.ok) {
      return onFail({
        title: data.title || "Lỗi server",
        status: res.status,
        detail: data.detail || data.errors || data.message || "Không có thông tin chi tiết",
      });
    }

    return onSuccess(data);
  } catch (error) {
    console.error("Fetch POST FormData error:", error.message);
    if (typeof onException === "function") {
      return onException(error);
    } else {
      console.warn("onException is not a function, skipping...");
      return;
    }
  }
};
const fetchPost = async (uri, reqData, onSuccess, onFail, onException) => {
  try {
    const res = await fetch(BE_ENPOINT + uri, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(reqData),
    });

    if (res.status === 204) {
      return onSuccess({ message: "Thành công" });
    }

    const data = await res.json();
    if (!res.ok) {
      return onFail({ title: data.title, status: res.status });
    }
    return onSuccess(data);
  } catch (error) {
    console.error("Fetch POST error:", error.message);
    if (typeof onException === "function") {
      return onException();
    } else {
      console.warn("onException is not a function, skipping...");
      return;
    }
  }
};

const fetchDelete = async (uri, reqData, onSuccess, onFail, onException) => {
  try {
    const res = await fetch(BE_ENPOINT + uri, {
      method: "DELETE",
      headers: getHeaders(),
      body: reqData ? JSON.stringify(reqData) : null,
    });

    if (res.status === 204) {
      return onSuccess({ message: "Xóa thành công" });
    }

    const data = await res.json();
    if (!res.ok) {
      return onFail({ title: data.title, status: res.status });
    }
    return onSuccess(data);
  } catch (error) {
    console.error("Fetch DELETE error:", error.message);
    if (typeof onException === "function") {
      return onException();
    } else {
      console.warn("onException is not a function, skipping...");
      return;
    }
  }
};

const fetchPut = async (uri, reqData, onSuccess, onFail, onException) => {
  try {
    const options = {
      method: "PUT",
      headers: getHeaders(),
    };
    if (reqData) {
      options.body = JSON.stringify(reqData);
    }
    const res = await fetch(BE_ENPOINT + uri, options);

    if (res.status === 204) {
      return onSuccess({ message: "Cập nhật thành công" });
    }

    let data = null;
    try {
      // try to parse JSON if present
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        // no JSON body
        data = null;
      }
    } catch (e) {
      // empty body or invalid JSON
      data = null;
    }

    if (!res.ok) {
      return onFail({ title: (data && data.title) || 'Lỗi server', status: res.status });
    }
    // if no body, return an empty object so callers can continue
    return onSuccess(data || {});
  } catch (error) {
    console.error("Fetch PUT error:", error.message);
    if (typeof onException === "function") {
      return onException();
    } else {
      console.warn("onException is not a function, skipping...");
      return;
    }
  }
};

const fetchUpload = async (uri, formData, onSuccess, onFail, onException) => {
  try {
    const res = await fetch(BE_ENPOINT + uri, {
      method: "POST",
      body: formData,
    });

    if (res.status === 204) {
      return onSuccess({ message: "Tải lên thành công" });
    }

    const data = await res.json();
    if (!res.ok) {
      return onFail({ title: data.title, status: res.status });
    }
    return onSuccess(data);
  } catch (error) {
    console.error("Fetch UPLOAD error:", error.message);
    if (typeof onException === "function") {
      return onException();
    } else {
      console.warn("onException is not a function, skipping...");
      return;
    }
  }
};

export { fetchGet, fetchPost, fetchDelete, fetchPut, fetchUpload,fetchPostFormData, BE_ENPOINT };