"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Globe, 
  CreditCard, 
  Save, 
  Loader2,
  Building,
  Phone,
  MessageSquare,
  Key,
  User,
  AtSign,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon,
  AlertTriangle,
  Edit,
  Copy,
  Plus,
  Trash2,
  Download,
  X,
  Disc
} from 'lucide-react';

interface Settings {
  // Email settings
  use_sendgrid: boolean;
  sendgrid_api_key: string;
  use_smtp: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_name: string;
  from_email: string;
  reply_to: string;
  school_email: string;
  force_internal_only: boolean;
  fallback_to_internal: boolean;
  
  // Site settings
  site_domain: string;
    public_app_url?: string;
  site_name: string;
  schoolname: string;
  school_phonenumber: string;
    internal_messages_enabled: boolean;
  
// Qliro API URLs
  qliro_dev_api_url: string;
  qliro_prod_api_url: string;
  qliro_use_prod_env: boolean;

  // Payment settings
  swish_number: string;
  swish_enabled: boolean;
  qliro_api_key: string;
  qliro_api_secret?: string;
  qliro_secret: string;
  qliro_merchant_id: string;
  qliro_sandbox: boolean;
  qliro_enabled: boolean;
  qliro_prod_enabled: boolean;
  qliro_prod_merchant_id: string;
  qliro_prod_api_key: string;
  qliro_prod_api_secret?: string;
  qliro_checkout_flow?: string;

  // Social links
  social_facebook?: string;
  social_instagram?: string;
  social_tiktok?: string;

  // Maps
  google_maps_api_key?: string;

  // Debug
  debug_extended_logs?: boolean;
}

export default function SettingsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings>({
    // Email settings
    use_sendgrid: false,
    sendgrid_api_key: '',
    use_smtp: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_secure: true,
    from_name: '',
    from_email: '',
    reply_to: '',
    school_email: '',
    force_internal_only: false,
    fallback_to_internal: false,

    // Site settings
    site_domain: '',
    public_app_url: '',
    site_name: '',
    schoolname: '',
    school_phonenumber: '',
    internal_messages_enabled: true,

    // Qliro API URLs
    qliro_dev_api_url: '',
    qliro_prod_api_url: '',
    qliro_use_prod_env: false,

    // Payment settings
    swish_number: '',
    swish_enabled: false,
    qliro_api_key: '',
    qliro_api_secret: '',
    qliro_secret: '',
    qliro_merchant_id: '',
    qliro_sandbox: true,
    qliro_enabled: false,
    qliro_prod_enabled: false,
    qliro_prod_merchant_id: '',
    qliro_prod_api_key: '',
    qliro_prod_api_secret: '',
    qliro_checkout_flow: 'redirect',

    // Social links
    social_facebook: '',
    social_instagram: '',
    social_tiktok: '',

    // Maps
    google_maps_api_key: '',

    // Debug
    debug_extended_logs: false,
  });

  const [originalSettings, setOriginalSettings] = useState<Settings | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Handle navigation warnings
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
        if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setOriginalSettings(JSON.parse(JSON.stringify(data.settings)));
        } else {
        toast.error('Kunde inte ladda inställningar', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Kunde inte ladda inställningar', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Check if settings have changed
    if (originalSettings) {
      const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(hasChanges);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Inställningar sparade!', {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        setHasUnsavedChanges(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte spara inställningar', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Kunde inte spara inställningar', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowExitWarning(true);
      } else {
      router.push(path);
    }
  };

  const confirmExit = () => {
    setShowExitWarning(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const cancelExit = () => {
    setShowExitWarning(false);
    setPendingNavigation(null);
  };

    // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>

          {/* Tabs skeleton */}
          <div className="flex space-x-1 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
            ))}
      </div>

          {/* Content skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                </div>
              </div>
      </div>
                </div>
                    </div>
                  </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sticky Save Banner */}
        {hasUnsavedChanges && (
          <div
            id="sticky-banner"
            className="fixed top-0 left-0 z-50 flex justify-between w-full p-4 border-b border-gray-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
          >
            <div className="flex items-center mx-auto">
              <p className="flex items-center text-sm font-normal text-amber-800 dark:text-amber-200">
                <span className="inline-flex p-1 mr-3 bg-amber-200 rounded-full dark:bg-amber-800 w-6 h-6 items-center justify-center shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                        </span>
                <span>Du har osparade ändringar - kom ihåg att spara innan du lämnar sidan</span>
              </p>
                      </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setHasUnsavedChanges(false)}
                className="text-amber-800 hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Disc className="w-4 h-4 mr-2" />
                    Spara ändringar
                  </>
                )}
              </button>
                </div>
                    </div>
        )}

        {/* Main Content */}
        <div className={`space-y-6 ${hasUnsavedChanges ? 'mt-20' : ''}`}>
          {/* Flowbite Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'email', label: 'E-post', icon: Mail },
                  { id: 'school', label: 'Skola', icon: Building },
                                  { id: 'site', label: 'Webbplats', icon: Globe },
                    { id: 'payment', label: 'Betalning', icon: CreditCard },
                    { id: 'setup', label: 'Inställningar', icon: SettingsIcon },
                    { id: 'useful', label: 'Nyttigt', icon: SettingsIcon },
                    { id: 'troubleshooting', label: 'Felsökning', icon: AlertTriangle }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-600 dark:border-blue-500'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
                </div>

            <div className="p-6">
              {/* Email Tab */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">E-postinställningar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Konfigurera hur e-postmeddelanden skickas från systemet
                    </p>
                      </div>

                  <div className="grid gap-6">
                    {/* SendGrid Settings */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">SendGrid</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Använd SendGrid för e-postutskick</p>
                  </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                  checked={settings.use_sendgrid}
                            onChange={(e) => {
                              updateSetting('use_sendgrid', e.target.checked);
                              if (e.target.checked) updateSetting('use_smtp', false);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
               </div>

              {settings.use_sendgrid && (
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      SendGrid API-nyckel
                            </label>
                            <input
                      type="password"
                      value={settings.sendgrid_api_key}
                      onChange={(e) => updateSetting('sendgrid_api_key', e.target.value)}
                              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxx"
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
                    </div>

                    {/* SMTP Settings */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">SMTP</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Använd SMTP för e-postutskick</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.use_smtp}
                            onChange={(e) => {
                              updateSetting('use_smtp', e.target.checked);
                              if (e.target.checked) updateSetting('use_sendgrid', false);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

              {settings.use_smtp && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              SMTP-server
                            </label>
                            <input
                              type="text"
                      value={settings.smtp_host}
                      onChange={(e) => updateSetting('smtp_host', e.target.value)}
                              placeholder="mailcluster.loopia.se"
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              Port
                            </label>
                            <input
                      type="number"
                      value={settings.smtp_port}
                              onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                              placeholder="587"
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              Användarnamn
                            </label>
                            <input
                              type="text"
                      value={settings.smtp_username}
                      onChange={(e) => updateSetting('smtp_username', e.target.value)}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              Lösenord
                            </label>
                            <input
                      type="password"
                      value={settings.smtp_password}
                      onChange={(e) => updateSetting('smtp_password', e.target.value)}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
                    </div>

                    {/* General Email Settings */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Allmänna e-postinställningar</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Från namn
                          </label>
                          <input
                            type="text"
                    value={settings.from_name}
                    onChange={(e) => updateSetting('from_name', e.target.value)}
                            placeholder="Din Trafikskola"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Från e-post
                          </label>
                          <input
                    type="email"
                    value={settings.from_email}
                    onChange={(e) => updateSetting('from_email', e.target.value)}
                            placeholder="info@dintrafikskola.se"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Svara till
                          </label>
                          <input
                    type="email"
                    value={settings.reply_to}
                    onChange={(e) => updateSetting('reply_to', e.target.value)}
                            placeholder="info@dintrafikskola.se"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Skolans e-post
                          </label>
                          <input
                    type="email"
                    value={settings.school_email}
                    onChange={(e) => updateSetting('school_email', e.target.value)}
                            placeholder="skolan@dintrafikskola.se"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
              </div>
                  </div>
              </div>
                  </div>
                )}

              {/* School Tab */}
              {activeTab === 'school' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Skolinformation</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Grundläggande information om skolan
                    </p>
              </div>

                  <div className="grid gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Kontaktinformation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Skolnamn
                          </label>
                          <input
                            type="text"
                  value={settings.schoolname}
                  onChange={(e) => updateSetting('schoolname', e.target.value)}
                            placeholder="Din Trafikskola Hässleholm"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Används i e-postmeddelanden och på webbplatsen
                </p>
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Telefonnummer
                          </label>
                          <input
                            type="tel"
                            value={settings.school_phonenumber}
                            onChange={(e) => updateSetting('school_phonenumber', e.target.value)}
                            placeholder="040-123 45 67"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Används i e-postmeddelanden och kontaktinformation
                          </p>
                        </div>
                      </div>
              </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">E-postadress</h4>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Skolans e-postadress
                        </label>
                        <input
                  type="email"
                  value={settings.school_email}
                  onChange={(e) => updateSetting('school_email', e.target.value)}
                          placeholder="info@dintrafikskola.se"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Används för kontaktformulär och systemmeddelanden
                </p>
                      </div>
              </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Interna meddelanden</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Aktivera interna meddelanden i systemet</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.internal_messages_enabled}
                            onChange={(e) => updateSetting('internal_messages_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
              </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Stäng av för att dölja interna meddelanden och sluta räkna olästa
                  </p>
                </div>
              </div>
                  </div>
                )}

              {/* Site Tab */}
              {activeTab === 'site' && (
                <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Webbplatsinställningar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Allmänna inställningar för webbplatsen
                    </p>
                </div>

                  <div className="grid gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Grundläggande information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Webbplatsnamn
                          </label>
                          <input
                            type="text"
                  value={settings.site_name}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                            placeholder="Din Trafikskola Hässleholm"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
              </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Webbplatsdomän
                          </label>
                          <input
                            type="text"
                  value={settings.site_domain}
                  onChange={(e) => updateSetting('site_domain', e.target.value)}
                            placeholder="https://dintrafikskola.se"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Används för att generera länkar i e-postmeddelanden
                </p>
              </div>
                        <div className="md:col-span-2">
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Offentlig URL (https)
                          </label>
                          <input
                            type="url"
                            value={settings.public_app_url}
                            onChange={(e) => updateSetting('public_app_url', e.target.value)}
                            placeholder="https://www.dintrafikskola.se"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Används för leverantörs-callbacks (Qliro) och e-postlänkar. Måste vara https utan port.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Sociala medier</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Facebook-länk
                          </label>
                          <input
                            type="url"
                            value={settings.social_facebook}
                            onChange={(e) => updateSetting('social_facebook', e.target.value)}
                            placeholder="https://facebook.com/dinskola"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          />
                </div>
                <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Instagram-länk
                          </label>
                          <input
                            type="url"
                            value={settings.social_instagram}
                            onChange={(e) => updateSetting('social_instagram', e.target.value)}
                            placeholder="https://instagram.com/dinskola"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          />
                </div>
                <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            TikTok-länk
                          </label>
                          <input
                            type="url"
                            value={settings.social_tiktok}
                            onChange={(e) => updateSetting('social_tiktok', e.target.value)}
                            placeholder="https://tiktok.com/@dinskola"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          />
                        </div>
                </div>
              </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Google Maps</h4>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Google Maps API-nyckel
                        </label>
                        <input
                          type="text"
                          value={settings.google_maps_api_key}
                          onChange={(e) => updateSetting('google_maps_api_key', e.target.value)}
                          placeholder="AIza..."
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Krävs för att visa kartor på betalnings- och informationssidor.
                        </p>
                        </div>
                          </div>
                        </div>
                          </div>
              )}

              {/* Payment Tab */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Betalningsinställningar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Konfigurera betalningsmetoder och API-nycklar
                    </p>
                  </div>

                  <div className="grid gap-6">
              {/* Swish Settings */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Swish</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Aktivera betalning via Swish</p>
                  </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                    checked={settings.swish_enabled}
                            onChange={(e) => updateSetting('swish_enabled', e.target.checked)}
                            className="sr-only peer"
                  />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                </div>

                {settings.swish_enabled && (
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Swish-nummer
                            </label>
                            <input
                              type="tel"
                      value={settings.swish_number}
                      onChange={(e) => updateSetting('swish_number', e.target.value)}
                              placeholder="1231231231"
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                          </div>
                  </div>
                )}
              </div>

              {/* Qliro Settings */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Qliro</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Aktivera betalning via Qliro</p>
                  </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                    checked={settings.qliro_enabled}
                            onChange={(e) => updateSetting('qliro_enabled', e.target.checked)}
                            className="sr-only peer"
                  />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                </div>

                {settings.qliro_enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                API-nyckel
                              </label>
                              <input
                                type="text"
                                value={settings.qliro_api_key}
                                onChange={(e) => updateSetting('qliro_api_key', e.target.value)}
                                placeholder="API-nyckel"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              />
                        </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Merchant ID
                              </label>
                              <input
                                type="text"
                                value={settings.qliro_merchant_id}
                                onChange={(e) => updateSetting('qliro_merchant_id', e.target.value)}
                                placeholder="Merchant ID"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                      </div>
                    </div>

                      <div className="flex items-center justify-between">
                        <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Sandbox-läge</h5>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Använd testmiljö för Qliro</p>
                        </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.qliro_sandbox}
                                onChange={(e) => updateSetting('qliro_sandbox', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                      </div>
                    </div>
                      )}
                        </div>
                              </div>
                              </div>
              )}

              {/* Setup Tab */}
              {activeTab === 'setup' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Systeminställningar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Avancerade systeminställningar och felsökningsalternativ
                    </p>
                      </div>
                      
                  <div className="grid gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Felsökning</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">Utökad loggning</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Aktivera detaljerad loggning för felsökning</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.debug_extended_logs}
                            onChange={(e) => updateSetting('debug_extended_logs', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                        </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">E-postinställningar</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">Tvinga interna meddelanden</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Använd endast interna meddelanden (för testning)</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.force_internal_only}
                              onChange={(e) => updateSetting('force_internal_only', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                          </div>
                          </div>
                          </div>
                        </div>
                      </div>
              )}

              {/* Useful Tab */}
              {activeTab === 'useful' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nyttiga verktyg</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Verktyg och funktioner för att hantera systemet
                    </p>
                      </div>

                  <div className="grid gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Systemverktyg</h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleNavigation('/dashboard/admin/settings/database-updates')}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <SettingsIcon className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Databasuppdateringar</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Hantera databasändringar och migreringar</div>
                        </div>
                        </div>
                        </button>
                        <button
                          onClick={() => handleNavigation('/dashboard/admin/settings/sideditor')}
                          className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Edit className="w-5 h-5 text-red-600" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Sideditor</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Redigera webbplatsinnehåll</div>
                        </div>
                        </div>
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                )}

{/* Troubleshooting Tab */}
              {activeTab === 'troubleshooting' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Felsökning</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Verktyg för att felsöka och diagnostisera problem
                    </p>
              </div>

                  <div className="grid gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Systemdiagnostik</h4>
                      <div className="space-y-3">
                        <button
                  onClick={async () => {
                            const t = toast.loading('Kontrollerar systemstatus...');
                            try {
                              const response = await fetch('/api/admin/invoices');
                              if (response.ok) {
                                const data = await response.json();
                                toast.success(`System OK! ${data.stats.total_invoices} fakturor`, { id: t });
                              } else {
                                toast.error('Systemfel upptäckt', { id: t });
                              }
                            } catch (error) {
                              toast.error('Kunde inte kontrollera systemstatus', { id: t });
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">Kontrollera systemstatus</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Verifiera att alla tjänster fungerar korrekt</div>
              </div>
                        </button>
              </div>
                      </div>
                    </div>
                </div>
              )}
                </div>
          </div>
        </div>
      </div>

      {/* Exit Warning Dialog */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Osparade ändringar</h3>
          </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Du har gjort ändringar som inte har sparats. Är du säker på att du vill lämna sidan? Dina ändringar kommer att gå förlorade.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Avbryt
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Lämna ändå
              </button>
        </div>
        </div>
      </div>
      )}
    </div>
  );
}
