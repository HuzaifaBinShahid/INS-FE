import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import automationService from '../services/automation.js';
import api from '../services/api.js';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

function Automation() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    loadAccounts();
    return () => {
      if (jobId) {
        automationService.unsubscribeFromJob(jobId);
      }
    };
  }, []);

  useEffect(() => {
    if (jobId) {
      const eventSource = automationService.subscribeToJob(jobId, (status) => {
        setJobStatus(status);

        if (status.status === 'waiting_2fa') {
          setShow2FA(true);
        }

        if (status.status === 'completed' || status.status === 'failed') {
          eventSource.close();
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      });

      return () => {
        eventSource.close();
      };
    }
  }, [jobId, navigate]);

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleStart = async () => {
    if (!selectedAccount || !password) {
      alert('Please select an account and enter password');
      return;
    }

    setLoading(true);
    try {
      const result = await automationService.startAutomation(selectedAccount, password);
      setJobId(result.jobId);
      setPassword('');
    } catch (error) {
      alert('Error starting automation: ' + error.message);
      setLoading(false);
    }
  };

  const handleSubmit2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length < 4) {
      alert('Please enter a valid 2FA code');
      return;
    }

    try {
      // Submit 2FA code - this returns immediately after verification
      // Automation continues in background via SSE updates
      await automationService.submit2FA(jobId, twoFactorCode);
      setTwoFactorCode('');
      setShow2FA(false);
      // Don't show alert on success - let SSE updates handle status
      // The status updates will show progress automatically
    } catch (error) {
      // Only show alert on actual errors (invalid code, network issues, etc.)
      alert('Error submitting 2FA code: ' + error.message);
    }
  };

  const handleCancel = async () => {
    if (jobId) {
      try {
        await automationService.cancelJob(jobId);
        automationService.unsubscribeFromJob(jobId);
        setJobId(null);
        setJobStatus(null);
        setShow2FA(false);
        setLoading(false);
      } catch (error) {
        console.error('Error cancelling job:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'waiting_2fa':
        return 'text-yellow-600';
      default:
        return 'text-primary-600';
    }
  };

  if (loadingAccounts) {
    return <LoadingSpinner />;
  }

  const enabledAccounts = accounts.filter((acc) => acc.enabled);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Run Automation</h1>
        <p className="page-description">
          Start automation for an Instagram account
        </p>
      </div>

      {!jobId ? (
        <div className="flex justify-center">
          <Card className="w-full max-w-lg">
            {enabledAccounts.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enabled Accounts</h3>
                <p className="text-gray-600 mb-4">Please enable at least one account in the Accounts page</p>
                <Button variant="primary" onClick={() => navigate('/accounts')}>
                  Go to Accounts
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Account
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="input-field"
                  >
                    <option value="">-- Select Account --</option>
                    {enabledAccounts.map((account) => (
                      <option key={account.username} value={account.username}>
                        @{account.username} {account.notes ? `(${account.notes})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder="Enter Instagram password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Password is not stored - entered securely through UI
                  </p>
                </div>

                <Button
                  onClick={handleStart}
                  disabled={loading || !selectedAccount || !password}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Start Automation
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Automation Status</h2>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>

            {jobStatus && (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(jobStatus.status)} bg-opacity-10`}>
                    {jobStatus.status?.toUpperCase() || 'RUNNING'}
                  </div>
                  {jobStatus.progress !== undefined && (
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span className="font-semibold">{jobStatus.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                          style={{ width: `${jobStatus.progress}%` }}
                        >
                          {jobStatus.progress > 10 && (
                            <span className="text-xs text-white font-semibold">{jobStatus.progress}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {jobStatus.message && (
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
                    <p className="text-sm font-medium text-gray-700 mb-1">Current Step</p>
                    <p className="text-gray-900">{jobStatus.message}</p>
                  </div>
                )}

                {show2FA && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-900 mb-1">
                          Two-Factor Authentication Required
                        </h3>
                        <p className="text-sm text-yellow-800">
                          Please enter the 2FA code from your authenticator app or SMS
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Enter 2FA code"
                        maxLength={8}
                      />
                      <Button
                        onClick={handleSubmit2FA}
                        disabled={!twoFactorCode || twoFactorCode.length < 4}
                        variant="primary"
                      >
                        Submit
                      </Button>
                    </div>
                  </Card>
                )}

                {jobStatus.status === 'completed' && (
                  <Card className="bg-green-50 border-green-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-green-900 mb-1">
                          Automation Completed Successfully!
                        </p>
                        <p className="text-sm text-green-800">
                          Redirecting to dashboard...
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {jobStatus.status === 'failed' && (
                  <Card className="bg-red-50 border-red-200 overflow-hidden">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-semibold text-red-900 mb-1">Automation Failed</p>
                        <p className="text-sm text-red-800 break-words overflow-wrap-anywhere">
                          {jobStatus.error || 'Unknown error occurred'}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default Automation;
