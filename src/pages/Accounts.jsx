import { useState, useEffect } from 'react';
import api from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import RemoteInstagramLoginModal from '../components/RemoteInstagramLoginModal';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    enabled: true,
    priority: 999,
    status: 'active',
    notes: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [remoteLoginAccount, setRemoteLoginAccount] = useState(null);

  useEffect(() => {
    loadAccounts();
    
    // Refresh accounts when page becomes visible (e.g., after automation completes)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAccounts();
      }
    };
    
    // Refresh when window gains focus (e.g., user navigates back to this tab)
    const handleFocus = () => {
      loadAccounts();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Are you sure you want to delete account ${username}?`)) {
      return;
    }
    try {
      await api.delete(`/accounts/${username}`);
      loadAccounts();
    } catch (error) {
      alert('Error deleting account');
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounts', formData);
      setShowAddModal(false);
      resetForm();
      loadAccounts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding account');
    }
  };

  const handleEditAccount = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/accounts/${editingAccount.username}`, formData);
      setEditingAccount(null);
      resetForm();
      loadAccounts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating account');
    }
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      username: account.username || '',
      enabled: account.enabled !== undefined ? account.enabled : true,
      priority: account.priority !== undefined ? account.priority : 999,
      status: account.status || 'active',
      notes: account.notes || '',
      tags: account.tags || [],
    });
    setTagInput('');
  };

  const resetForm = () => {
    setFormData({
      username: '',
      enabled: true,
      priority: 999,
      status: 'active',
      notes: '',
      tags: [],
    });
    setTagInput('');
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingAccount(null);
    resetForm();
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      paused: 'badge-warning',
      error: 'badge-error',
    };
    return badges[status] || 'badge-gray';
  };

  const getPriorityBadge = (priority) => {
    // Priority: lower number = higher priority
    if (priority <= 10) return 'badge-error'; // High priority
    if (priority <= 100) return 'badge-info'; // Normal priority
    return 'badge-gray'; // Low priority
  };

  const getPriorityLabel = (priority) => {
    if (priority <= 10) return 'High';
    if (priority <= 100) return 'Normal';
    return 'Low';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-description">
            Manage your Instagram accounts and automation settings
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="md"
          className="whitespace-nowrap"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{accounts.length}</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {accounts.filter(a => a.status === 'active').length}
              </p>
            </div>
            <div className="bg-green-100 rounded-xl p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Enabled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {accounts.filter(a => a.enabled).length}
              </p>
            </div>
            <div className="bg-purple-100 rounded-xl p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card padding="none" className="overflow-hidden">
        {accounts.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first Instagram account</p>
            <Button onClick={() => setShowAddModal(true)} variant="primary">
              Add Your First Account
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Last Run</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.username}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {account.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">@{account.username}</div>
                          {account.notes && (
                            <div className="text-sm text-gray-500">{account.notes}</div>
                          )}
                          {account.tags && account.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {account.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadge(account.status)}>
                        {account.status}
                      </span>
                    </td>
                    <td>
                      <span className={getPriorityBadge(account.priority)}>
                        {getPriorityLabel(account.priority)} ({account.priority || 999})
                      </span>
                    </td>
                    <td className="text-gray-600">
                      {account.lastRun ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(new Date(account.lastRun), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(account.lastRun), { addSuffix: true })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(account)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRemoteLoginAccount(account)}
                        >
                          Remote Login
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(account.username)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || !!editingAccount}
        onClose={closeModal}
        title={editingAccount ? 'Edit Account' : 'Add New Account'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editingAccount ? handleEditAccount : handleAddAccount}
            >
              {editingAccount ? 'Update' : 'Add'} Account
            </Button>
          </div>
        }
      >
        <form onSubmit={editingAccount ? handleEditAccount : handleAddAccount} className="space-y-5">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong className="font-semibold">🔒 Security Note:</strong> Passwords are{' '}
              <strong>NOT stored</strong> in accounts. You will enter the password separately
              when running automation from the Automation page.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input-field"
              placeholder="instagram_username"
              disabled={!!editingAccount}
            />
            <p className="mt-1 text-xs text-gray-500">
              Instagram username (without @)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                min="1"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 999 })}
                className="input-field"
                placeholder="999"
              />
              <p className="mt-1 text-xs text-gray-500">
                Lower number = higher priority (1-10: High, 11-100: Normal, 101+: Low)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Optional notes about this account"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="input-field flex-1"
                placeholder="Enter tag and press Enter"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Add tags to organize and filter accounts
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
              Enabled
            </label>
          </div>
        </form>
      </Modal>

      {remoteLoginAccount && (
        <RemoteInstagramLoginModal
          username={remoteLoginAccount.username}
          isOpen={!!remoteLoginAccount}
          onClose={() => setRemoteLoginAccount(null)}
          onConnected={loadAccounts}
        />
      )}
    </div>
  );
}

export default Accounts;
