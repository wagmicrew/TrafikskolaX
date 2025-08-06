"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog';
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
  Settings as SettingsIcon,
  AlertTriangle
} from 'lucide-react';
import { ResetSiteButton } from '@/components/admin/ResetSiteButton';

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
  site_name: string;
  schoolname: string;
  school_phonenumber: string;
  
// Qliro API URLs
  qliro_dev_api_url: string;
  qliro_prod_api_url: string;
  qliro_use_prod_env: boolean;

  // Payment settings
  swish_number: string;
  swish_enabled: boolean;
  qliro_api_key: string;
  qliro_secret: string;
  qliro_merchant_id: string;
  qliro_sandbox: boolean;
  qliro_enabled: boolean;
  qliro_prod_enabled: boolean;
  qliro_prod_merchant_id: string;
  qliro_prod_api_key: string;
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
    qliro_dev_api_url: 'https://playground.qliro.com',
    qliro_prod_api_url: 'https://api.qliro.com',
    qliro_use_prod_env: false,
    from_name: 'Din Trafikskola Hässleholm',
    from_email: 'admin@dintrafikskolahlm.se',
    reply_to: 'info@dintrafikskolahlm.se',
    school_email: 'info@dintrafikskolahlm.se',
    force_internal_only: false,
    fallback_to_internal: true,
    site_domain: '',
    site_name: 'Din Trafikskola Hässleholm',
    schoolname: 'Din Trafikskola Hässleholm',
    school_phonenumber: '',
    swish_number: '',
    swish_enabled: false,
    qliro_api_key: '',
    qliro_secret: '',
    qliro_merchant_id: '',
    qliro_sandbox: true,
    qliro_enabled: false,
    qliro_prod_enabled: false,
    qliro_prod_merchant_id: '',
    qliro_prod_api_key: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [exportTestResults, setExportTestResults] = useState<any>(null);
  const [qliroTestOpen, setQliroTestOpen] = useState(false);
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

  const testQliroPayment = async () => {
    setQliroTestOpen(true);
    const loadingToast = toast.loading('Testing Qliro payment...');
    try {
      // First, get a real package ID
      const packagesResponse = await fetch('/api/packages');
      if (!packagesResponse.ok) {
        throw new Error('Failed to fetch packages');
      }
      const packagesData = await packagesResponse.json();
      if (packagesData.length === 0) {
        throw new Error('No packages available for testing');
      }
      const testPackageId = packagesData[0].id;
      
      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: testPackageId,  // Use real package ID
          paymentMethod: 'qliro',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to test Qliro payment');
      }
      toast.success('Qliro payment test initiated successfully!', { id: loadingToast });
    } catch (error: unknown) {
      console.error('Qliro test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Qliro test failed: ${errorMessage}`, { id: loadingToast });
    } finally {
      setQliroTestOpen(false);
    }
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

  const testContactEmail = async () => {
    const loadingToast = toast.loading('Skickar test kontaktformulär...');
    
    try {
      const response = await fetch('/api/admin/test-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          testEmail: 'test@example.com' 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test contact email');
      }
      
      toast.success(`Test kontaktformulär skickat till ${data.schoolEmail}!`, { id: loadingToast });
    } catch (error: any) {
      console.error('Contact email test error:', error);
      toast.error(`Test kontaktformulär misslyckades: ${error.message}`, { id: loadingToast });
    }
  };

  const testContactEmailDesign = async () => {
    const loadingToast = toast.loading('Skickar test kontaktformulär design...');
    
    try {
      const response = await fetch('/api/admin/test-contact-email-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          testEmail: 'test@example.com' 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test contact email design');
      }
      
      toast.success('Test kontaktformulär design skickat!', { id: loadingToast });
    } catch (error: any) {
      console.error('Contact email design test error:', error);
      toast.error(`Test kontaktformulär design misslyckades: ${error.message}`, { id: loadingToast });
    }
  };

  const initializeSchoolEmail = async () => {
    try {
      const response = await fetch('/api/admin/settings/add-school-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Refresh settings to show the new school_email field
        await fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to initialize school email setting');
      }
    } catch (error) {
      console.error('Error initializing school email:', error);
      toast.error('Failed to initialize school email setting');
    }
  };

  const initializeAllEmailSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/initialize-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.message} (${result.summary.added} added, ${result.summary.alreadyExists} already existed)`);
        // Refresh settings to show all the new email fields
        await fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to initialize email settings');
      }
    } catch (error) {
      console.error('Error initializing email settings:', error);
      toast.error('Failed to initialize email settings');
    }
  };

  const initializeSchoolPhonenumber = async () => {
    try {
      const response = await fetch('/api/admin/settings/add-school-phonenumber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'Skoltelefonnummer tillagt!');
        fetchSettings(); // Refresh settings
      } else {
        toast.error(result.error || 'Fel vid tillägg av skoltelefonnummer');
      }
    } catch (error) {
      console.error('Error adding school phonenumber:', error);
      toast.error('Fel vid tillägg av skoltelefonnummer');
    }
  };

  const addSwishPaymentTemplate = async () => {
    try {
      const response = await fetch('/api/admin/settings/add-swish-payment-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'Swish betalningsmall tillagd!');
      } else {
        toast.error(result.error || 'Fel vid tillägg av Swish betalningsmall');
      }
    } catch (error) {
      console.error('Error adding Swish payment template:', error);
      toast.error('Fel vid tillägg av Swish betalningsmall');
    }
  };

  const addEnumValue = async () => {
    try {
      const response = await fetch('/api/admin/settings/add-enum-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'Enum värde tillagt!');
      } else {
        toast.error(result.error || 'Fel vid tillägg av enum värde');
      }
    } catch (error) {
      console.error('Error adding enum value:', error);
      toast.error('Fel vid tillägg av enum värde');
    }
  };

  const testSwishConfirmation = async () => {
    try {
      const response = await fetch('/api/admin/test-swish-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'Swish bekräftelse test lyckades!');
      } else {
        toast.error(result.error || 'Fel vid test av Swish bekräftelse');
      }
    } catch (error) {
      console.error('Error testing Swish confirmation:', error);
      toast.error('Fel vid test av Swish bekräftelse');
    }
  };

  const updateSwishTemplateReceiver = async () => {
    try {
      const response = await fetch('/api/admin/settings/update-swish-template-receiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'Swish mall uppdaterad till skol-e-post!');
      } else {
        toast.error(result.error || 'Fel vid uppdatering av Swish mall');
      }
    } catch (error) {
      console.error('Error updating Swish template receiver:', error);
      toast.error('Fel vid uppdatering av Swish mall');
    }
  };

  const addSchoolReceiverType = async () => {
    try {
      const response = await fetch('/api/admin/settings/add-school-receiver-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'School receiver type tillagd!');
      } else {
        toast.error(result.error || 'Fel vid tillägg av school receiver type');
      }
    } catch (error) {
      console.error('Error adding school receiver type:', error);
      toast.error('Fel vid tillägg av school receiver type');
    }
  };

  const testExportFunctions = async () => {
    const loadingToast = toast.loading('Testar export-funktioner...');
    
    try {
      const response = await fetch('/api/admin/test-export-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Export-funktioner testade framgångsrikt!', { id: loadingToast });
        console.log('Export test results:', result);
        setExportTestResults(result);
      } else {
        toast.error(result.error || 'Fel vid test av export-funktioner', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Export test error:', error);
      toast.error(`Export test misslyckades: ${error.message}`, { id: loadingToast });
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-postinställningar
          </TabsTrigger>
          <TabsTrigger value="school" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Skolinformation
          </TabsTrigger>
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Webbplatsinställningar
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Betalningsinställningar
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Felsökning</span>
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

               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label htmlFor="force-internal-only">Tvinga intern meddelande</Label>
                   <p className="text-sm text-muted-foreground">
                     Använd endast intern meddelande (för testning).
                   </p>
                 </div>
                 <Switch
                   id="force-internal-only"
                   checked={settings.force_internal_only}
                   onCheckedChange={(checked) => updateSetting('force_internal_only', checked)}
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

                <div className="space-y-2">
                  <Label htmlFor="school-email">
                    <Building className="w-4 h-4 inline mr-2" />
                    Skolans e-postadress
                  </Label>
                  <Input
                    id="school-email"
                    type="email"
                    placeholder="info@dintrafikskolahlm.se"
                    value={settings.school_email}
                    onChange={(e) => updateSetting('school_email', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Används för kontaktformulär och systemmeddelanden
                  </p>
                </div>

                                 {/* Initialize School Email Button */}
                 <div className="pt-4 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={initializeSchoolEmail}
                     className="w-full"
                   >
                     <SettingsIcon className="w-4 h-4 mr-2" />
                     Initiera skolans e-postinställning
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">
                     Klicka här om skolans e-postadress inte visas ovan
                   </p>
                 </div>

                 {/* Initialize All Email Settings Button */}
                 <div className="pt-4 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={initializeAllEmailSettings}
                     className="w-full"
                   >
                     <SettingsIcon className="w-4 h-4 mr-2" />
                     Initiera alla e-postinställningar
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">
                     Lägger till alla nödvändiga e-postinställningar i databasen
                   </p>
                 </div>

                 {/* Add Swish Payment Template Button */}
                 <div className="pt-4 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={addSwishPaymentTemplate}
                     className="w-full"
                   >
                     <DollarSign className="w-4 h-4 mr-2" />
                     Lägg till Swish betalningsmall
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">
                     Lägger till e-postmall för Swish betalningsverifiering
                   </p>
                 </div>

                 {/* Add Enum Value Button */}
                 <div className="pt-4 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={addEnumValue}
                     className="w-full"
                   >
                     <SettingsIcon className="w-4 h-4 mr-2" />
                     Lägg till enum värde
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">
                     Lägger till swish_payment_verification till email_trigger_type enum
                   </p>
                 </div>

                 {/* Test Swish Confirmation Button */}
                 <div className="pt-4 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={testSwishConfirmation}
                     className="w-full"
                   >
                     <CheckCircle className="w-4 h-4 mr-2" />
                     Testa Swish bekräftelse
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">
                     Testar Swish betalningsverifiering e-postmall
                   </p>
                 </div>

                 {/* Update Swish Template Receiver Button */}
                 <div className="pt-4 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={updateSwishTemplateReceiver}
                     className="w-full"
                   >
                     <AtSign className="w-4 h-4 mr-2" />
                     Uppdatera Swish mall till skol-e-post
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">
                     Ändrar Swish mall från admin till skol-e-post
                   </p>
                 </div>

                 {/* Add School Receiver Type Button */}
                 <div className="pt-4 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={addSchoolReceiverType}
                     className="w-full"
                   >
                     <AtSign className="w-4 h-4 mr-2" />
                     Lägg till school receiver type
                   </Button>
                   <p className="text-xs text-muted-foreground mt-2">
                     Lägger till 'school' till email_receiver_type enum
                   </p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* School Information Tab */}
        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle>Skolinformation</CardTitle>
              <CardDescription>
                Grundläggande information om trafikskolan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="schoolname">
                  <Building className="w-4 h-4 inline mr-2" />
                  Skolnamn
                </Label>
                <Input
                  id="schoolname"
                  placeholder="Din Trafikskola Hässleholm"
                  value={settings.schoolname}
                  onChange={(e) => updateSetting('schoolname', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Används i e-postmeddelanden och på webbplatsen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-email">
                  <AtSign className="w-4 h-4 inline mr-2" />
                  Skolans e-postadress
                </Label>
                <Input
                  id="school-email"
                  type="email"
                  placeholder="info@dintrafikskolahlm.se"
                  value={settings.school_email}
                  onChange={(e) => updateSetting('school_email', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Används för kontaktformulär och systemmeddelanden
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-phonenumber">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Skolans telefonnummer
                </Label>
                <Input
                  id="school-phonenumber"
                  placeholder="040-123 45 67"
                  value={settings.school_phonenumber}
                  onChange={(e) => updateSetting('school_phonenumber', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Används i e-postmeddelanden och kontaktinformation
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <Button
                    onClick={initializeSchoolPhonenumber}
                    variant="outline"
                    className="w-full"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Initiera skolans telefonnummer
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Lägger till telefonnummer-inställningen i databasen om den inte finns
                  </p>
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
                    {/* Environment Selection */}
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-0.5">
                          <Label htmlFor="qliro-use-prod">Produktionsmiljö</Label>
                          <p className="text-sm text-muted-foreground">
                            Växla mellan utvecklings- och produktionsmiljö
                          </p>
                        </div>
                        <Switch
                          id="qliro-use-prod"
                          checked={settings.qliro_use_prod_env}
                          onCheckedChange={(checked) => updateSetting('qliro_use_prod_env', checked)}
                        />
                      </div>
                      
                      <div className="text-sm font-medium text-blue-800">
                        Aktuell miljö: {settings.qliro_use_prod_env ? 'Produktion' : 'Utveckling/Sandbox'}
                      </div>
                    </div>

                    {/* API URLs Configuration */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium text-gray-800">API-konfiguration</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="qliro-dev-api-url">
                          <Globe className="w-4 h-4 inline mr-2" />
                          Utvecklings-API URL
                        </Label>
                        <Input
                          id="qliro-dev-api-url"
                          placeholder="https://playground.qliro.com"
                          value={settings.qliro_dev_api_url}
                          onChange={(e) => updateSetting('qliro_dev_api_url', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="qliro-prod-api-url">
                          <Globe className="w-4 h-4 inline mr-2" />
                          Produktions-API URL
                        </Label>
                        <Input
                          id="qliro-prod-api-url"
                          placeholder="https://api.qliro.com"
                          value={settings.qliro_prod_api_url}
                          onChange={(e) => updateSetting('qliro_prod_api_url', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Credentials */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium text-gray-800">
                        {settings.qliro_use_prod_env ? 'Produktions-kredentialer' : 'Utvecklings-kredentialer'}
                      </h4>
                      
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
                    </div>
                    
                    {/* Legacy Sandbox Toggle - kept for compatibility */}
                    <div className="flex items-center justify-between opacity-50">
                      <div className="space-y-0.5">
                        <Label htmlFor="qliro-sandbox">Legacy Sandbox-läge</Label>
                        <p className="text-sm text-muted-foreground">
                          (Använd miljöväxlaren ovan istället)
                        </p>
                      </div>
                      <Switch
                        id="qliro-sandbox"
                        checked={settings.qliro_sandbox}
                        onCheckedChange={(checked) => updateSetting('qliro_sandbox', checked)}
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

{/* Qliro Test Dialog */}
<QliroPaymentDialog
  isOpen={qliroTestOpen}
  onClose={() => setQliroTestOpen(false)}
  purchaseId="test-purchase-id"
  amount={100}  // Dummy amount for testing
  checkoutUrl="https://qliro.mock.checkout"  // Dummy URL for testing
  onConfirm={() => toast.success('Qliro Test Payment Confirmed')}
/>

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
                  onClick={testQliroPayment}
                  disabled={testing || !testUserId}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Test Qliro Payment
                </Button>

                                 <Button
                   onClick={testSendGridEmail}
                   disabled={testing || !testUserId}
                   className="bg-green-600 hover:bg-green-700"
                 >
                   <Mail className="w-4 h-4 mr-2" />
                   Testa SendGrid
                 </Button>

                 <Button
                   onClick={testContactEmail}
                   disabled={testing}
                   className="bg-blue-600 hover:bg-blue-700"
                 >
                   <Mail className="w-4 h-4 mr-2" />
                   Testa Kontaktformulär
                 </Button>

                 <Button
                   onClick={testContactEmailDesign}
                   disabled={testing}
                   className="bg-green-600 hover:bg-green-700"
                 >
                   <Mail className="w-4 h-4 mr-2" />
                   Testa Kontaktformulär Design
                 </Button>

                 <Button
                   onClick={testExportFunctions}
                   disabled={testing}
                   className="bg-yellow-600 hover:bg-yellow-700"
                 >
                   <DollarSign className="w-4 h-4 mr-2" />
                   Testa Export-funktioner
                 </Button>
              </div>
              
              <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded">
                <p><strong>Observera:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Krediterings-testet kontrollerar att API:et fungerar korrekt</li>
                  <li>SendGrid-testet skickar en e-post till användarens e-postadress</li>
                  <li>Export-testet kontrollerar att alla export-funktioner fungerar för både lärare och admin</li>
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
              {exportTestResults && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Export Test Resultat:</h4>
                  <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                    {JSON.stringify(exportTestResults, null, 2)}
                  </pre>
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
