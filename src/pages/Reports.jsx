import { useState, useEffect } from "react";
import api from "../services/api";
import { format } from "date-fns";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Format timestamp helper
  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${year}-${month}-${day}:${displayHours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    loadReports();
  }, [reportType, date]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = reportType === "weekly" ? { startDate: date } : { date };
      const response = await api.get(`/reports/${reportType}`, {
        params,
      });
      setReports(response.data);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Download all profiles daily report
  const handleDownloadAllDaily = async () => {
    if (reportType !== "daily") {
      alert("Download All is only available for daily reports");
      return;
    }

    try {
      setDownloadingAll(true);
      const response = await api.get(`/reports/download-all/daily`, {
        params: { date },
        responseType: "blob",
        validateStatus: (status) => status < 500,
      });

      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json") || response.status >= 400) {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Error downloading report");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `all_accounts_daily_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download all error:", error);
      let errorMessage = "Error downloading all profiles report";

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = error.response.statusText || errorMessage;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setDownloadingAll(false);
    }
  };

  const downloadReport = async (type, username, date) => {
    try {
      const response = await api.get(`/reports/download/${type}`, {
        params: { username, date },
        responseType: "blob",
        validateStatus: (status) => status < 500,
      });

      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json") || response.status >= 400) {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Error downloading report");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_${username}_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      let errorMessage = "Error downloading report";

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = error.response.statusText || errorMessage;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-description">
          View and download activity reports for your accounts
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            Reports cover 24-hour periods from 00:00:00 to 23:59:59 in your
            local timezone
          </span>
        </div>
      </div>

      {/* Filters - Static bar that doesn't reload */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {reportType === "weekly" ? "Start Date" : "Date"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field w-full"
            />
            {reportType === "weekly" && (
              <p className="mt-1 text-xs text-gray-500">
                Select start date (reports last 7 days from this date)
              </p>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-2 invisible">
              Load
            </label>
            <Button
              onClick={loadReports}
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Load Reports
            </Button>
          </div>
        </div>
      </Card>

      {/* Download All Profiles Button - Only for Daily Reports */}
      {reportType === "daily" && reports.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Download All Profiles
              </h3>
              <p className="text-xs text-gray-500">
                Download a single CSV file containing all profiles' daily data
                for {date}
              </p>
            </div>
            <Button
              onClick={handleDownloadAllDaily}
              disabled={downloadingAll || loading}
              loading={downloadingAll}
              variant="primary"
              className="ml-4"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {downloadingAll
                ? "Downloading..."
                : "Download All Profiles Daily Report"}
            </Button>
          </div>
        </Card>
      )}

      {/* Reports Table */}
      <Card padding="none" className="overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Reports Found
            </h3>
            <p className="text-gray-600">
              Try selecting a different date or report type
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th>DMs Sent</th>
                  <th>Comments Sent</th>
                  <th className="text-right">
                    <div className="flex justify-end">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => {
                  const displayDate =
                    reportType === "weekly"
                      ? `${report.startDate} - ${report.endDate}`
                      : report.date;
                  const displayDms =
                    reportType === "weekly"
                      ? report.totalDms || 0
                      : report.dmsSent || 0;
                  const displayComments =
                    reportType === "weekly"
                      ? report.totalComments || 0
                      : report.commentsSent || 0;
                  const downloadDate =
                    reportType === "weekly" ? report.startDate : report.date;

                  return (
                    <tr key={index}>
                      <td className="font-medium">
                        <div>
                          {displayDate}
                          {reportType === "daily" && report.lastUpdated && (
                            <span className="text-gray-500 text-xs ml-2 block sm:inline">
                              ({formatTimestamp(report.lastUpdated)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {report.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">
                            @{report.username}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-info">{displayDms}</span>
                      </td>
                      <td>
                        <span className="badge-info">{displayComments}</span>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              downloadReport(
                                reportType,
                                report.username,
                                downloadDate
                              )
                            }
                          >
                            <svg
                              className="w-4 h-4 inline mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download CSV
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Reports;
