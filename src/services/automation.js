import api from './api.js';
const API_BASE = "http://localhost:5000";
/**
 * Automation Service - Handles automation API calls and SSE connections
 */
export class AutomationService {
  constructor() {
    this.eventSources = new Map();
  }

  /**
   * Start automation for an account
   */
  async startAutomation(username, password) {
    const response = await api.post('/automation/start', {
      username,
      password,
    });
    return response.data;
  }

  /**
   * Subscribe to job status updates (SSE)
   */
  subscribeToJob(jobId, onStatusUpdate) {
    // Close existing connection if any
    if (this.eventSources.has(jobId)) {
      this.eventSources.get(jobId).close();
    }

    // Create new EventSource connection
    // Note: EventSource doesn't support custom headers, so we use query param
    // Backend will verify token from query param for SSE
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(
      `${API_BASE}/api/automation/status/${jobId}?token=${encodeURIComponent(token)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onStatusUpdate(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      this.eventSources.delete(jobId);
    };

    this.eventSources.set(jobId, eventSource);
    return eventSource;
  }

  /**
   * Unsubscribe from job updates
   */
  unsubscribeFromJob(jobId) {
    if (this.eventSources.has(jobId)) {
      this.eventSources.get(jobId).close();
      this.eventSources.delete(jobId);
    }
  }

  /**
   * Submit 2FA code
   */
  async submit2FA(jobId, code) {
    const response = await api.post(`/automation/2fa/${jobId}`, { code });
    return response.data;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    const response = await api.get(`/automation/job/${jobId}`);
    return response.data;
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId) {
    const response = await api.post(`/automation/cancel/${jobId}`);
    return response.data;
  }

  /**
   * Cleanup all connections
   */
  cleanup() {
    this.eventSources.forEach((eventSource) => {
      eventSource.close();
    });
    this.eventSources.clear();
  }
}

export default new AutomationService();

