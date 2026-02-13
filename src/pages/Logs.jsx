import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filter, username]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.level = filter;
      if (username) params.username = username;
      const response = await api.get('/logs', { params });
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200 border-l-4';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 border-l-4';
      default:
        return 'bg-blue-50 border-blue-200 border-l-4';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">System Logs</h1>
        <p className="page-description">
          View system errors, warnings, and activity logs
        </p>
      </div>

      {/* Filters - Static bar that doesn't reload */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Log Level
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Logs</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username Filter
            </label>
            <input
              type="text"
              placeholder="Filter by username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-2 invisible">
              Filter
            </label>
            <Button onClick={loadLogs} variant="primary" className="w-full sm:w-auto">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <Card>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getLogColor(log.level)} transition-all hover:shadow-md overflow-hidden`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`font-semibold text-sm ${
                        log.level === 'error' ? 'text-red-900' :
                        log.level === 'warning' ? 'text-yellow-900' :
                        'text-blue-900'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      {log.context?.username && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                          @{log.context.username}
                        </span>
                      )}
                      {log.context?.module && (
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          [{log.context.module}]
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-2 break-words overflow-wrap-anywhere">{log.message}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="whitespace-nowrap">{log.timestamp}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Logs Found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Logs;
