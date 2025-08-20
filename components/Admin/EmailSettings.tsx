import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const AdminEmailSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmailSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/email-settings');
      if (!response.ok) throw new Error('Failed to fetch email settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast({ title: 'Error', description: 'Failed to load email settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmailSettings();
  }, [fetchEmailSettings]);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) throw new Error('Failed to update email settings');

      toast({ title: 'Success', description: 'Email settings updated successfully.', variant: 'default' });
    } catch (error) {
      console.error('Error updating email settings:', error);
      toast({ title: 'Error', description: 'Failed to update email settings.', variant: 'destructive' });
    }
  }, [settings, toast]);

  const handleTestConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' }),
      });
      const result = await response.json();
      toast({ title: 'Test Email', description: result.message, variant: result.success ? 'default' : 'destructive' });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({ title: 'Error', description: 'Failed to send test email.', variant: 'destructive' });
    }
  }, [toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Email Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(settings || {}).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700">{key.replace(/_/g, ' ')}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleTestConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
        >
          Test Email
        </button>
        <button
          onClick={handleSave}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AdminEmailSettings;

