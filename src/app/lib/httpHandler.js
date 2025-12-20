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

    const data = await res.json();
    if (!res.ok) {
      return onFail({ title: data.title, status: res.status });
    }
    return onSuccess(data);
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

export { fetchGet, fetchPost, fetchDelete, fetchPut, fetchUpload, BE_ENPOINT };