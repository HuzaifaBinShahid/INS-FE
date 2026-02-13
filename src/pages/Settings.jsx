import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

function Settings() {
  const [settings, setSettings] = useState({
    headless: false,
    slowMo: 100,
    timeout: 30000,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: Implement save settings API call
    // await api.put('/settings', settings);
    
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Configure automation and system settings
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          {/* Headless Mode */}
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <label className="text-sm font-semibold text-gray-900">
                  Headless Mode
                </label>
              </div>
              <p className="text-sm text-gray-600 ml-8">
                Run browser in headless mode (no visible window). Recommended for production environments.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.headless}
                onChange={(e) => setSettings({ ...settings, headless: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Slow Motion */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slow Motion (ms)
            </label>
            <input
              type="number"
              value={settings.slowMo}
              onChange={(e) => setSettings({ ...settings, slowMo: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="0"
              max="5000"
            />
            <p className="mt-2 text-sm text-gray-600 flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Delay between actions to simulate human behavior. Higher values make automation slower but more human-like.</span>
            </p>
            <div className="mt-2">
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={settings.slowMo}
                onChange={(e) => setSettings({ ...settings, slowMo: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0ms</span>
                <span>2500ms</span>
                <span>5000ms</span>
              </div>
            </div>
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={settings.timeout}
              onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="5000"
              max="120000"
            />
            <p className="mt-2 text-sm text-gray-600 flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Maximum time to wait for page actions before timing out. Recommended: 30000ms (30 seconds).</span>
            </p>
            <div className="mt-2">
              <input
                type="range"
                min="5000"
                max="120000"
                step="5000"
                value={settings.timeout}
                onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5s</span>
                <span>62.5s</span>
                <span>120s</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              variant="primary"
              size="lg"
              loading={saving}
              disabled={saving}
            >
              {saved ? (
                <>
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Settings;
