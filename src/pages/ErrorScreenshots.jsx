import { useState, useEffect } from "react";
import api from "../services/api";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import Alert from "../components/Alert";
import { format } from "date-fns";

// Component to handle base64 image loading
// Uses the base64 endpoint: GET /api/screenshots/errors/{filename}/base64
function ScreenshotImage({ filename, alt, className }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!filename) {
      setError(true);
      setLoading(false);
      return;
    }

    // Fetch base64 data from API
    // The API reconstructs the path from filename and returns base64 data
    const fetchBase64 = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get(`/screenshots/errors/${filename}/base64`);
        
        if (response.data.success && response.data.data) {
          // response.data.data is already a data URI (e.g., "data:image/png;base64,...")
          setImageSrc(response.data.data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error loading screenshot:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBase64();
  }, [filename]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center text-gray-400 text-sm">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Image not found</p>
        </div>
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} />;
}

function ErrorScreenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    message: "",
    type: "error",
    title: null,
  });
  
  // Filters
  const [usernameFilter, setUsernameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [errorTypeFilter, setErrorTypeFilter] = useState("");
  const [limit, setLimit] = useState(50);

  const showAlert = (message, type = "error", title = null) => {
    setAlert({
      isOpen: true,
      message,
      type,
      title,
    });
  };

  const closeAlert = () => {
    setAlert({ ...alert, isOpen: false });
  };

  useEffect(() => {
    // Only load on initial mount
    loadScreenshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScreenshots = async () => {
    try {
      setLoading(true);
      let response;
      
      if (usernameFilter) {
        // Fetch by account with query params
        response = await api.get(`/screenshots/errors/account/${usernameFilter}`, {
          params: { limit },
        });
      } else {
        // Fetch all with query params
        const params = { limit };
        if (usernameFilter) params.username = usernameFilter;
        response = await api.get("/screenshots/errors", { params });
      }
      
      let filteredScreenshots = response.data.screenshots || [];
      
      // Apply date filter (client-side for now)
      if (dateFilter) {
        const filterDate = new Date(dateFilter).toISOString().split("T")[0];
        filteredScreenshots = filteredScreenshots.filter((screenshot) => {
          const screenshotDate = new Date(screenshot.timestamp)
            .toISOString()
            .split("T")[0];
          return screenshotDate === filterDate;
        });
      }
      
      // Apply error type filter (client-side)
      if (errorTypeFilter) {
        filteredScreenshots = filteredScreenshots.filter((screenshot) =>
          screenshot.errorMessage
            .toLowerCase()
            .includes(errorTypeFilter.toLowerCase())
        );
      }
      
      setScreenshots(filteredScreenshots);
    } catch (error) {
      console.error("Error loading screenshots:", error);
      const errorMessage = error.response?.data?.message || "Failed to load error screenshots";
      showAlert(errorMessage, "error", "Error Loading Screenshots");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    const daysOld = prompt(
      "Enter number of days old to delete (default: 30):",
      "30"
    );
    
    if (daysOld === null) return; // User cancelled
    
    const days = parseInt(daysOld) || 30;
    
    if (
      !window.confirm(
        `Are you sure you want to delete error screenshots older than ${days} days? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setCleaningUp(true);
      const response = await api.post("/screenshots/errors/cleanup", {
        daysOld: days,
      });
      showAlert(
        `Cleanup completed. ${response.data.count || 0} screenshots deleted.`,
        "success",
        "Cleanup Successful"
      );
      loadScreenshots();
    } catch (error) {
      console.error("Error cleaning up screenshots:", error);
      showAlert(
        error.response?.data?.message || "Failed to cleanup old screenshots",
        "error",
        "Cleanup Failed"
      );
    } finally {
      setCleaningUp(false);
    }
  };

  const handleDeleteScreenshot = async (screenshotId, username) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this error screenshot for @${username}?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/screenshots/errors/${screenshotId}`);
      showAlert("Screenshot deleted successfully", "success", "Deleted");
      loadScreenshots();
    } catch (error) {
      console.error("Error deleting screenshot:", error);
      showAlert(
        error.response?.data?.message || "Failed to delete screenshot",
        "error",
        "Delete Failed"
      );
    }
  };

  const openScreenshot = (screenshot) => {
    setSelectedScreenshot(screenshot);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedScreenshot(null);
  };

  // Note: We no longer use getImageUrl() - ScreenshotImage component handles base64 fetching

  const formatDate = (timestamp) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Error Screenshots</h1>
        <p className="page-description">
          View and manage error screenshots captured during automation runs
        </p>
      </div>

      {/* Filters - Static bar that doesn't reload */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username Filter
            </label>
            <input
              type="text"
              placeholder="Filter by username"
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date Filter
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Error Type Filter
            </label>
            <input
              type="text"
              placeholder="Filter by error message"
              value={errorTypeFilter}
              onChange={(e) => setErrorTypeFilter(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Limit
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
              className="input-field w-full"
            />
          </div>
          <div className="w-full lg:w-auto flex gap-2">
            <div className="flex-1 lg:flex-initial">
              <label className="block text-sm font-semibold text-gray-700 mb-2 invisible">
                Filter
              </label>
              <Button
                onClick={loadScreenshots}
                variant="primary"
                className="w-full sm:w-auto"
              >
                <svg
                  className="w-4 h-4 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filter
              </Button>
            </div>
            <div className="flex-1 lg:flex-initial">
              <label className="block text-sm font-semibold text-gray-700 mb-2 invisible">
                Cleanup
              </label>
              <Button
                onClick={handleCleanup}
                variant="danger"
                disabled={cleaningUp}
                loading={cleaningUp}
                className="w-full sm:w-auto"
              >
                <svg
                  className="w-4 h-4 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Cleanup Old
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Screenshots Grid */}
      {screenshots.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Error Screenshots Found
            </h3>
            <p className="text-gray-600">
              {usernameFilter || dateFilter || errorTypeFilter
                ? "Try adjusting your filters"
                : "Error screenshots will appear here when automation errors occur"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {screenshots.map((screenshot) => (
            <Card
              key={screenshot._id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openScreenshot(screenshot)}
            >
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <ScreenshotImage
                  filename={screenshot.filename}
                  alt={`Error screenshot for ${screenshot.username}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  Error
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {screenshot.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">@{screenshot.username}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScreenshot(screenshot._id, screenshot.username);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete screenshot"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                  {screenshot.errorMessage}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {screenshot.module && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {screenshot.module}
                    </span>
                  )}
                  {screenshot.action && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {screenshot.action}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDate(screenshot.timestamp)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full-size Image Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          selectedScreenshot
            ? `Error Screenshot - @${selectedScreenshot.username}`
            : "Error Screenshot"
        }
        size="xl"
      >
        {selectedScreenshot && (
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <ScreenshotImage
                filename={selectedScreenshot.filename}
                alt={`Error screenshot for ${selectedScreenshot.username}`}
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedScreenshot.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    @{selectedScreenshot.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(selectedScreenshot.timestamp)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Error Message:
                </p>
                <p className="text-sm text-gray-800 bg-red-50 border border-red-200 rounded p-2">
                  {selectedScreenshot.errorMessage}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedScreenshot.module && (
                  <div>
                    <span className="text-xs font-semibold text-gray-600">Module:</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                      {selectedScreenshot.module}
                    </span>
                  </div>
                )}
                {selectedScreenshot.action && (
                  <div>
                    <span className="text-xs font-semibold text-gray-600">Action:</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded ml-2">
                      {selectedScreenshot.action}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Filename:</p>
                <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                  {selectedScreenshot.filename}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Alert Component */}
      <Alert
        isOpen={alert.isOpen}
        onClose={closeAlert}
        message={alert.message}
        type={alert.type}
        title={alert.title}
      />
    </div>
  );
}

export default ErrorScreenshots;

