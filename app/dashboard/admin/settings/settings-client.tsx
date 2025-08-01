"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
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
  Settings as SettingsIcon
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
  
  // Site settings
  site_domain: string;
  site_name: string;
  
  // Payment settings
  swish_number: string;
  swish_enabled: boolean;
  qliro_api_key: string;
  qliro_secret: string;
  qliro_merchant_id: string;
  qliro_sandbox: boolean;
  qliro_enabled: boolean;
}

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data: any;
  error?: string;
}

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>({
    use_sendgrid: false,
    sendgrid_api_key: '',
    use_smtp: false,
    smtp_host: 'mailcluster.loopia.se',
    smtp_port: 587,
    smtp_username: 'admin@dintrafikskolahlm.se',
    smtp_password: '',
    smtp_secure: false,
    from_name: 'Din Trafikskola Hässleholm',
    from_email: 'admin@dintrafikskolahlm.se',
    reply_to: 'info@dintrafikskolahlm.se',
    site_domain: '',
    site_name: 'Din Trafikskola Hässleholm',
    swish_number: '',
    swish_enabled: false,
    qliro_api_key: '',
    qliro_secret: '',
    qliro_merchant_id: '',
    qliro_sandbox: true,
    qliro_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testUserId, setTestUserId] = useState('d601c43a-599c-4715-8b9a-65fe092c6c11');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings);
      toast.success('Inställningar hämtade');
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Kunde inte hämta inställningar');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    const loadingToast = toast.loading('Sparar inställningar...');
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('Inställningar sparade framgångsrikt!', {
        id: loadingToast,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Kunde inte spara inställningar', {
        id: loadingToast,
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    const loadingToast = toast.loading('Kör krediteringstester...');
    
    console.log('=== Credits API Test Started ===');
    console.log('Test User ID:', testUserId);

    const apiBase = `/api/admin/users/${testUserId}/credits`;
    
    // First, get a real lesson type ID
    let realLessonTypeId = null;
    try {
      const lessonTypesResponse = await fetch('/api/lesson-types');
      if (lessonTypesResponse.ok) {
        const lessonTypesData = await lessonTypesResponse.json();
        if (lessonTypesData.length > 0) {
          realLessonTypeId = lessonTypesData[0].id;
          console.log('Using real lesson type ID:', realLessonTypeId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch lesson types:', error);
    }
    
    const tests = [
      { 
        name: 'GET credits',
        method: 'GET', 
        endpoint: apiBase 
      },
      { 
        name: 'POST lesson credits',
        method: 'POST', 
        endpoint: apiBase,
        body: { 
          creditType: 'lesson', 
          lessonTypeId: realLessonTypeId, 
          amount: 5 
        }
      },
      { 
        name: 'POST handledar credits',
        method: 'POST', 
        endpoint: apiBase,
        body: { 
          creditType: 'handledar', 
          handledarSessionId: null, 
          amount: 3 
        }
      }
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      try {
        console.log(`\n=== Running ${test.name} ===`);
        console.log('Endpoint:', test.endpoint);
        console.log('Method:', test.method);
        if (test.body) {
          console.log('Body:', JSON.stringify(test.body, null, 2));
        }
        
        const options: RequestInit = {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
        };
        
        if (test.body) {
          options.body = JSON.stringify(test.body);
        }

        const response = await fetch(test.endpoint, options);
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', data);
        
        const result = {
          endpoint: test.endpoint,
          method: test.method,
          status: response.status,
          success: response.ok,
          data
        };
        
        results.push(result);
        
        // Show individual test results as toasts
        if (response.ok) {
          toast.success(`${test.name}: Success!`);
        } else {
          toast.error(`${test.name}: Failed (${response.status})`);
        }
        
      } catch (error: any) {
        console.error(`Error in ${test.name}:`, error);
        const result = {
          endpoint: test.endpoint,
          method: test.method,
          status: 0,
          success: false,
          data: null,
          error: error.message
        };
        results.push(result);
        toast.error(`${test.name}: Network error`);
      }
    }

    console.log('=== All tests completed ===');
    console.log('Results:', results);
    
    setTestResults(results);
    setTesting(false);
    toast.success('Alla tester slutförda!', { id: loadingToast });
  };
  
  const testSendGridEmail = async () => {
    if (!testUserId) {
      toast.error('Ange ett användar-ID först');
      return;
    }
    
    const loadingToast = toast.loading('Skickar test-email...');
    
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: testUserId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send test email');
      }
      
      toast.success('Test-email skickat framgångsrikt!', { id: loadingToast });
    } catch (error: any) {
      console.error('SendGrid test error:', error);
      toast.error(`SendGrid test misslyckades: ${error.message}`, { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-postinställningar
          </TabsTrigger>
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Webbplatsinställningar
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Betalningsinställningar
          </TabsTrigger>
          <TabsTrigger value="troubleshoot" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Felsökning
          </TabsTrigger>
        </TabsList>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>E-postinställningar</CardTitle>
              <CardDescription>
                Konfigurera hur e-postmeddelanden skickas från systemet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use-sendgrid">Använd SendGrid</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktivera SendGrid för e-postutskick.
                  </p>
                </div>
                <Switch
                  id="use-sendgrid"
                  checked={settings.use_sendgrid}
                  onCheckedChange={(checked) => {
                    updateSetting('use_sendgrid', checked);
                    if (checked) updateSetting('use_smtp', false);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use-smtp">Använd SMTP</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktivera SMTP för e-postutskick.
                  </p>
                </div>
                <Switch
                  id="use-smtp"
                  checked={settings.use_smtp}
                  onCheckedChange={(checked) => {
                    updateSetting('use_smtp', checked);
                    if (checked) updateSetting('use_sendgrid', false);
                  }}
                />
              </div>

              {settings.use_sendgrid && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-api-key">
                      <Key className="w-4 h-4 inline mr-2" />
                      SendGrid API-nyckel
                    </Label>
                    <Input
                      id="sendgrid-api-key"
                      type="password"
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.sendgrid_api_key}
                      onChange={(e) => updateSetting('sendgrid_api_key', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {settings.use_smtp && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">
                      <Building className="w-4 h-4 inline mr-2" />
                      SMTP Server
                    </Label>
                    <Input
                      id="smtp-host"
                      placeholder="mailcluster.loopia.se"
                      value={settings.smtp_host}
                      onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">
                      <Key className="w-4 h-4 inline mr-2" />
                      SMTP Port
                    </Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={settings.smtp_port}
                      onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value) || 587)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">
                      <User className="w-4 h-4 inline mr-2" />
                      SMTP Användare
                    </Label>
                    <Input
                      id="smtp-username"
                      placeholder="admin@dintrafikskolahlm.se"
                      value={settings.smtp_username}
                      onChange={(e) => updateSetting('smtp_username', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">
                      <Key className="w-4 h-4 inline mr-2" />
                      SMTP Lösenord
                    </Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      placeholder="Ditt SMTP lösenord"
                      value={settings.smtp_password}
                      onChange={(e) => updateSetting('smtp_password', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="smtp-secure">SMTP Secure (TLS/SSL)</Label>
                      <p className="text-sm text-muted-foreground">
                        Aktivera säker anslutning för SMTP
                      </p>
                    </div>
                    <Switch
                      id="smtp-secure"
                      checked={settings.smtp_secure}
                      onCheckedChange={(checked) => updateSetting('smtp_secure', checked)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="from-name">
                    <User className="w-4 h-4 inline mr-2" />
                    Avsändarnamn
                  </Label>
                  <Input
                    id="from-name"
                    placeholder="Din Trafikskola Hässleholm"
                    value={settings.from_name}
                    onChange={(e) => updateSetting('from_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">
                    <AtSign className="w-4 h-4 inline mr-2" />
                    Avsändare-post
                  </Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@dintrafikskolahlm.se"
                    value={settings.from_email}
                    onChange={(e) => updateSetting('from_email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply-to">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Svara till e-post
                  </Label>
                  <Input
                    id="reply-to"
                    type="email"
                    placeholder="info@dintrafikskolahlm.se"
                    value={settings.reply_to}
                    onChange={(e) => updateSetting('reply_to', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Settings Tab */}
        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle>Webbplatsinställningar</CardTitle>
              <CardDescription>
                Allmänna inställningar för webbplatsen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">
                  <Building className="w-4 h-4 inline mr-2" />
                  Webbplatsnamn
                </Label>
                <Input
                  id="site-name"
                  placeholder="Din Trafikskola Hässleholm"
                  value={settings.site_name}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-domain">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Webbplatsdomän
                </Label>
                <Input
                  id="site-domain"
                  placeholder="https://dintrafikskolahlm.se"
                  value={settings.site_domain}
                  onChange={(e) => updateSetting('site_domain', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Används för att generera länkar i e-postmeddelanden
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Betalningsinställningar</CardTitle>
              <CardDescription>
                Konfigurera betalningsmetoder och API-nycklar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Swish Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="swish-enabled">Swish</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktivera betalning via Swish
                    </p>
                  </div>
                  <Switch
                    id="swish-enabled"
                    checked={settings.swish_enabled}
                    onCheckedChange={(checked) => updateSetting('swish_enabled', checked)}
                  />
                </div>

                {settings.swish_enabled && (
                  <div className="space-y-2 pl-4">
                    <Label htmlFor="swish-number">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Swish-nummer
                    </Label>
                    <Input
                      id="swish-number"
                      placeholder="123 456 7890"
                      value={settings.swish_number}
                      onChange={(e) => updateSetting('swish_number', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4" />

              {/* Qliro Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qliro-enabled">Qliro</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktivera betalning via Qliro
                    </p>
                  </div>
                  <Switch
                    id="qliro-enabled"
                    checked={settings.qliro_enabled}
                    onCheckedChange={(checked) => updateSetting('qliro_enabled', checked)}
                  />
                </div>

                {settings.qliro_enabled && (
                  <div className="space-y-4 pl-4">
                    <div className="space-y-2">
                      <Label htmlFor="qliro-api-key">
                        <Key className="w-4 h-4 inline mr-2" />
                        Qliro API-nyckel
                      </Label>
                      <Input
                        id="qliro-api-key"
                        type="password"
                        placeholder="Ange din Qliro API-nyckel"
                        value={settings.qliro_api_key}
                        onChange={(e) => updateSetting('qliro_api_key', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="qliro-secret">
                        <Key className="w-4 h-4 inline mr-2" />
                        Qliro API Secret
                      </Label>
                      <Input
                        id="qliro-secret"
                        type="password"
                        placeholder="Ange din Qliro API Secret"
                        value={settings.qliro_secret}
                        onChange={(e) => updateSetting('qliro_secret', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="qliro-merchant-id">
                        <Building className="w-4 h-4 inline mr-2" />
                        Qliro Merchant ID
                      </Label>
                      <Input
                        id="qliro-merchant-id"
                        placeholder="Ange ditt Qliro Merchant ID"
                        value={settings.qliro_merchant_id}
                        onChange={(e) => updateSetting('qliro_merchant_id', e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="qliro-sandbox">Sandbox-läge</Label>
                        <p className="text-sm text-muted-foreground">
                          Använd Qliro testmiljö (playground)
                        </p>
                      </div>
                      <Switch
                        id="qliro-sandbox"
                        checked={settings.qliro_sandbox}
                        onCheckedChange={(checked) => updateSetting('qliro_sandbox', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshoot">
          <Card>
            <CardHeader>
              <CardTitle>API Felsökning</CardTitle>
              <CardDescription>Testa krediterings-API för diagnostik</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-user-id">Test Användar-ID</Label>
                <Input
                  id="test-user-id"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="Ange användar-ID för test"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={runTests}
                  disabled={testing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kör test...
                    </>
                  ) : (
                    'Kör krediterings-API-test'
                  )}
                </Button>
                
                <Button
                  onClick={testSendGridEmail}
                  disabled={testing || !testUserId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Testa SendGrid
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded">
                <p><strong>Observera:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Krediterings-testet kontrollerar att API:et fungerar korrekt</li>
                  <li>SendGrid-testet skickar en e-post till användarens e-postadress</li>
                  <li>Se konsolen för detaljerade loggmeddelanden</li>
                  <li>Toast-notifieringar visar testresultat</li>
                </ul>
              </div>
              {testResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Test Resultat:</h4>
                  {testResults.map((result, index) => (
                    <div key={index} className={`p-4 border rounded ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <strong>{result.method} {result.endpoint}</strong>
                        <span className={`px-2 py-1 rounded text-sm ${result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {result.status} {result.success ? 'OK' : 'Fel'}
                        </span>
                      </div>
                      <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                      {result.error && (
                        <p className="mt-2 text-red-600">Error: {result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-red-600 hover:bg-red-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Spara inställningar
        </Button>
      </div>
    </div>
  );
}
