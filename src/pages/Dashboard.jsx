import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

function Dashboard() {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    todayDMs: 0,
    todayComments: 0,
    weeklyDMs: 0,
    weeklyComments: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [loadingAccountStats, setLoadingAccountStats] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [accountStats, setAccountStats] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Filter states - empty by default to show all records
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef(null);

  useEffect(() => {
    loadAccounts();
    loadDashboardData(true);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      loadDashboardData(false);
    }
  }, [startDate, endDate, selectedAccounts]);

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadDashboardData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedAccounts.length > 0) {
        selectedAccounts.forEach(acc => params.append('accounts', acc));
      }
      
      const queryString = params.toString();
      console.log('📊 Frontend sending filters:', { startDate, endDate, selectedAccounts, queryString });
      
      // Load data with separate loading states
      setLoadingStats(true);
      setLoadingCharts(true);
      setLoadingAccountStats(true);
      
      const [statsRes, activityRes, chartRes, accountStatsRes] = await Promise.all([
        api.get(`/dashboard/stats${queryString ? '?' + queryString : ''}`),
        api.get("/dashboard/recent-activity"),
        api.get(`/dashboard/chart-data${queryString ? '?' + queryString : ''}`),
        api.get(`/dashboard/account-stats${queryString ? '?' + queryString : ''}`),
      ]);
      
      console.log("Dashboard data loaded:", {
        stats: statsRes.data,
        activity: activityRes.data,
        chartData: chartRes.data
      });
      
      // Ensure we have valid data
      if (statsRes.data) {
        setStats({
          totalAccounts: statsRes.data.totalAccounts || 0,
          activeAccounts: statsRes.data.activeAccounts || 0,
          todayDMs: statsRes.data.todayDMs || 0,
          todayComments: statsRes.data.todayComments || 0,
          weeklyDMs: statsRes.data.weeklyDMs || 0,
          weeklyComments: statsRes.data.weeklyComments || 0,
        });
      }
      
      if (activityRes.data) {
        setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data : []);
      }
      
      if (chartRes.data) {
        setChartData(Array.isArray(chartRes.data) ? chartRes.data : []);
      }
      
      if (accountStatsRes.data) {
        setAccountStats(Array.isArray(accountStatsRes.data) ? accountStatsRes.data : []);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Set empty data on error so UI still renders
      setStats({
        totalAccounts: 0,
        activeAccounts: 0,
        todayDMs: 0,
        todayComments: 0,
        weeklyDMs: 0,
        weeklyComments: 0,
      });
      setRecentActivity([]);
      setChartData([]);
      setAccountStats([]);
    } finally {
      setLoadingStats(false);
      setLoadingCharts(false);
      setLoadingAccountStats(false);
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const handleAccountToggle = (username) => {
    setSelectedAccounts(prev => {
      if (prev.includes(username)) {
        return prev.filter(acc => acc !== username);
      } else {
        return [...prev, username];
      }
    });
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map(acc => acc.username));
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedAccounts([]);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  // Define statCards inside component so it uses current stats state
  const statCards = [
    {
      title: "Total Accounts",
      value: stats.totalAccounts,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      trend: "+12%",
    },
    {
      title: "Active Accounts",
      value: stats.activeAccounts,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      trend: "+8%",
    },
    {
      title: "Today's DMs",
      value: stats.todayDMs,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      trend: "+24%",
    },
    {
      title: "Today's Comments",
      value: stats.todayComments,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      ),
      gradient: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
      trend: "+18%",
    },
    {
      title: "Total Actions Sent",
      value: stats.todayDMs + stats.todayComments,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      gradient: "from-orange-500 to-amber-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      trend: "+20%",
    },
    {
      title: "Weekly DMs",
      value: stats.weeklyDMs,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      gradient: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      trend: "+15%",
    },
    {
      title: "Weekly Comments",
      value: stats.weeklyComments,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      gradient: "from-amber-500 to-yellow-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      trend: "+22%",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="max-w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              Dashboard
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 break-words">
              Welcome back! Here's what's happening with your accounts.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(), "EEEE, MMMM dd, yyyy")}
          </div>
        </div>
      </div>

      {/* Filters - Static bar that doesn't reload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Date Filters */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Account Filter - Dropdown with checkboxes */}
          <div className="flex-1 relative w-full" ref={accountDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Account
            </label>
            <button
              type="button"
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">
                {selectedAccounts.length === 0
                  ? "All Accounts"
                  : selectedAccounts.length === 1
                  ? selectedAccounts[0]
                  : `${selectedAccounts.length} accounts selected`}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${accountDropdownOpen ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {accountDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {accounts.length === 0 ? (
                  <p className="text-sm text-gray-500 py-3 px-3">No accounts available</p>
                ) : (
                  <>
                    <label className="flex items-center gap-2 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.length === accounts.length && accounts.length > 0}
                        onChange={handleSelectAllAccounts}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Select All</span>
                    </label>
                    {accounts.map((account) => (
                      <label
                        key={account.username}
                        className="flex items-center gap-2 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.username)}
                          onChange={() => handleAccountToggle(account.username)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">{account.username}</span>
                        {account.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            account.status === 'active' ? 'bg-green-100 text-green-700' :
                            account.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {account.status}
                          </span>
                        )}
                      </label>
                    ))}
                    {selectedAccounts.length > 0 && (
                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={() => {
                            setSelectedAccounts([]);
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full text-xs text-primary-600 hover:text-primary-700 text-center py-2"
                        >
                          Clear selection
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reset Button - Aligned with input fields */}
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2 invisible">
              Reset
            </label>
            <button
              onClick={handleResetFilters}
              className="w-full lg:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-full">
        {loadingStats ? (
          // Skeleton loaders for stat cards
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-20 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="bg-gray-100 rounded-xl p-3 sm:p-4 w-12 h-12"></div>
              </div>
              <div className="h-1 bg-gray-200 rounded mt-4"></div>
            </div>
          ))
        ) : (
          statCards.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
            >
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {(stat.value || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium text-green-600">
                      {stat.trend}
                    </span>
                    <span className="text-xs text-gray-500">vs last week</span>
                  </div>
                </div>
                <div
                  className={`${stat.bgColor} rounded-xl p-3 sm:p-4 flex-shrink-0`}
                >
                  <div className={stat.textColor}>{stat.icon}</div>
                </div>
              </div>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
            ></div>
          </div>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Activity Overview
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Last 7 days performance
            </p>
          </div>
          {loadingCharts ? (
            <div className="h-[250px] animate-pulse">
              <div className="h-full bg-gray-100 rounded-lg"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No chart data available</p>
                <p className="text-xs text-gray-400 mt-1">Run automation to see activity</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="dms"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorDms)"
                name="Direct Messages"
              />
              <Area
                type="monotone"
                dataKey="comments"
                stroke="#ec4899"
                fillOpacity={1}
                fill="url(#colorComments)"
                name="Comments"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Weekly Performance
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              DMs vs Comments comparison
            </p>
          </div>
          {loadingCharts ? (
            <div className="h-[250px] animate-pulse">
              <div className="h-full bg-gray-100 rounded-lg"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No chart data available</p>
                <p className="text-xs text-gray-400 mt-1">Run automation to see activity</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="dms"
                fill="#8b5cf6"
                name="Direct Messages"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="comments"
                fill="#ec4899"
                name="Comments"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-Account Stats */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
              Stats Per Account
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Individual account performance for selected date range
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loadingAccountStats ? (
            <div className="p-6 animate-pulse">
              <div className="space-y-4">
                {/* Table header skeleton */}
                <div className="flex gap-4 pb-3 border-b border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                {/* Table rows skeleton */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex gap-4 py-3 border-b border-gray-100">
                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                    <div className="h-4 bg-gray-100 rounded w-16"></div>
                    <div className="h-4 bg-gray-100 rounded w-16 ml-auto"></div>
                    <div className="h-4 bg-gray-100 rounded w-16"></div>
                    <div className="h-4 bg-gray-100 rounded w-12"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : accountStats.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-sm">No account stats available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      DMs Sent
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Comments Sent
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {accountStats.map((account, index) => (
                    <tr key={account.username} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {account.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          account.status === 'active' ? 'bg-green-100 text-green-700' :
                          account.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {account.dmsSent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {account.commentsSent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        {account.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {accountStats.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan="2" className="px-6 py-3 text-sm font-semibold text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        {accountStats.reduce((sum, acc) => sum + acc.dmsSent, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        {accountStats.reduce((sum, acc) => sum + acc.commentsSent, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                        {accountStats.reduce((sum, acc) => sum + acc.total, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
              Recent Activity
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Latest actions and updates
            </p>
          </div>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            View All
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === "success"
                        ? "bg-green-100"
                        : activity.type === "error"
                        ? "bg-red-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {activity.type === "success" ? (
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : activity.type === "error" ? (
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 break-words mb-1">
                      {activity.message}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {activity.timestamp}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.type === "success"
                            ? "bg-green-100 text-green-700"
                            : activity.type === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {activity.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === "success"
                                ? "bg-green-100"
                                : activity.type === "error"
                                ? "bg-red-100"
                                : "bg-blue-100"
                            }`}
                          >
                            {activity.type === "success" ? (
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : activity.type === "error" ? (
                              <svg
                                className="w-4 h-4 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 break-words">
                            {activity.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {activity.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            activity.type === "success"
                              ? "bg-green-100 text-green-700"
                              : activity.type === "error"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {activity.type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        No recent activity
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
