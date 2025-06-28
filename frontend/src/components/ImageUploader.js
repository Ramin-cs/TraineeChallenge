import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function ImageUploader() {
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [authorized, setAuthorized] = useState(true);
  const [checked, setChecked] = useState(false);

  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const res = await axios.get(`${API}/images`);
      setImages(res.data);
      setAuthorized(true);
    } catch (err) {
      if (err.response?.status === 403) {
        setAuthorized(false);
      }
    } finally {
      setChecked(true);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    try {
      await axios.post(`${API}/upload`, formData);
      setFile(null);
      checkAccess();
    } catch (err) {
      if (err.response?.status === 403) {
        setAuthorized(false);
      } else if (err.response?.status === 400 && err.response.data.error) {
        setErrorModal({ visible: true, message: err.response.data.error });
      } else if (err.response?.status === 400 && err.response.data.error) {
        setErrorModal({ visible: true, message: err.response.data.error });
      } else {
        setErrorModal({
          visible: true,
          message: "Upload failed. Please try again.",
        });
      }
    }
  };

  const handleDelete = async (filename) => {
    try {
      await axios.delete(`${API}/delete/${filename}`);
      checkAccess();
    } catch (err) {
      if (err.response?.status === 403) {
        setAuthorized(false);
      }
    }
  };

  if (!checked) {
    return <p className="text-center text-gray-600">Checking access...</p>;
  }

  if (!authorized) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-700 mb-4">
            Your IP address is not authorized to access this application.
          </p>
          <p className="text-sm text-gray-500">
            Please connect through the approved VPN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto ">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">
        Image Upload Portal
      </h1>

      <div className="flex  sm:flex-row gap-4 justify-center  items-center mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="p-2 border rounded-md bg-white shadow-sm"
        />

        <button
          onClick={handleUpload}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Upload
        </button>
      </div>

      {/* مودال خطا */}
      {errorModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700 mb-4">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ visible: false, message: "" })}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {images.map((img, idx) => (
          <div key={idx} className="bg-white p-4 rounded shadow">
            <img
              src={`${API}/images/${img}`}
              alt={img}
              className="w-full h-48 object-cover rounded mb-2"
            />
            <button
              onClick={() => handleDelete(img)}
              className="bg-red-500 text-white w-full py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;
