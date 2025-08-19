"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  AlertTriangle,
  Edit,
  Copy,
  Clock
} from 'lucide-react';
import { ResetSiteButton } from '@/components/Admin/ResetSiteButton';
import OpeningHoursEditor from '@/components/Admin/OpeningHoursEditor';
import type { OpeningHoursConfig } from '@/lib/site-settings/opening-hours';

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
  // Qliro flow type
  qliro_checkout_flow?: string;
  // Social links (optional)
  social_facebook?: string;
  social_instagram?: string;
  social_tiktok?: string;
  // Maps
  google_maps_api_key?: string;
  // Debug
  debug_extended_logs?: boolean;
  // Opening hours
  opening_hours?: OpeningHoursConfig;
}

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data: any;
  error?: string;
}

type CronExamples = {
  linuxCron: string;
  curlNow: string;
  windowsPowerShellOneLiner: string;
  windowsSchtasks: string;
};

type CronInfo = {
  endpoint: string;
  validated: boolean;
  probe: { status: number; body: any };
  examples: CronExamples;
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [exportTestResults, setExportTestResults] = useState<any>(null);
  const [qliroTestOpen, setQliroTestOpen] = useState(false);
  const [testUserId, setTestUserId] = useState('d601c43a-599c-4715-8b9a-65fe092c6c11');
  const [editEmail, setEditEmail] = useState(false);
  const [editSchool, setEditSchool] = useState(false);
  const [editSite, setEditSite] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  const [editOpening, setEditOpening] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Cron setup dialog state
  const [cronDialogOpen, setCronDialogOpen] = useState(false);
  const [cronInfo, setCronInfo] = useState<CronInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadSettings = async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        const response = await fetch('/api/admin/settings');
        if (!mounted) return;
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        if (!mounted) return;
        setSettings(data.settings);
        setHasUnsavedChanges(false);
        toast.success('Inställningar hämtade');
      } catch (error) {
        if (!mounted) return;
        console.error('Error fetching settings:', error);
        toast.error('Kunde inte hämta inställningar');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings);
      setHasUnsavedChanges(false);
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
      setHasUnsavedChanges(false);
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
    setHasUnsavedChanges(true);
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

  const copyToClipboard = async (value: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(value || '');
      toast.success(`${label || 'Värde'} kopierad`);
    } catch (e) {
      toast.error('Kunde inte kopiera');
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

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Du har osparade ändringar. Är du säker på att du vill lämna sidan?';
        return 'Du har osparade ändringar. Är du säker på att du vill lämna sidan?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="max-w-6xl mx-auto text-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link href="/dashboard/admin/settings/qliro">
          <Card className="bg-white/10 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-600/30 text-sky-300">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-white">Qliro-betalningar</CardTitle>
                  <CardDescription className="text-slate-300">Visa, exportera, skapa betalningar</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-7 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1">
          <TabsTrigger value="email" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:border data-[state=active]:border-white/20 rounded-xl">
            <Mail className="w-4 h-4" />
            E-postinställningar
          </TabsTrigger>
          <TabsTrigger value="school" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:border data-[state=active]:border-white/20 rounded-xl">
            <Building className="w-4 h-4" />
            Skolinformation
          </TabsTrigger>
          <TabsTrigger value="site" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:border data-[state=active]:border-white/20 rounded-xl">
            <Globe className="w-4 h-4" />
            Webbplatsinställningar
          </TabsTrigger>
          <TabsTrigger value="opening" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:border data-[state=active]:border-white/20 rounded-xl">
            <Clock className="w-4 h-4" />
            Öppettider
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:border data-[state=active]:border-white/20 rounded-xl">
            <CreditCard className="w-4 h-4" />
            Betalningsinställningar
          </TabsTrigger>
          <TabsTrigger value="useful" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:border data-[state=active]:border-white/20 rounded-xl">
            <SettingsIcon className="w-4 h-4" />
            Nyttigt
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:border data-[state=active]:border-white/20 rounded-xl">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Felsökning</span>
          </TabsTrigger>
        </TabsList>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle className="text-white font-extrabold drop-shadow">E-postinställningar</CardTitle>
              <CardDescription className="text-slate-300">
                Konfigurera hur e-postmeddelanden skickas från systemet
              </CardDescription>
              <div className="ml-auto flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    Osparade ändringar
                  </div>
                )}
                <button onClick={() => setEditEmail((v) => !v)} className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20">
                  <Edit className="w-4 h-4 text-white" />
                </button>
                <button onClick={saveSettings} disabled={saving || !hasUnsavedChanges} className={`p-2 rounded-lg ${hasUnsavedChanges ? 'bg-green-600/90 hover:bg-green-600' : 'bg-sky-600/90 hover:bg-sky-600'} text-white`}>
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${editEmail ? '' : 'opacity-60 pointer-events-none'}`}> 
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
                <div className="space-y-4 pt-4 border-t border-white/10">
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
                <div className="space-y-4 pt-4 border-t border-white/10">
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

              <div className="space-y-4 pt-4 border-t border-white/10">
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
                  {/* moved to Nyttigt tab */}

                 {/* Initialize All Email Settings Button */}
                  {/* moved to Nyttigt tab */}

                 {/* Add Swish Payment Template Button */}
                  {/* moved to Nyttigt tab */}

                 {/* Add Enum Value Button */}
                  {/* moved to Nyttigt tab */}

                 {/* Test Swish Confirmation Button */}
                  {/* moved to Nyttigt tab */}

                 {/* Update Swish Template Receiver Button */}
                 {/* moved to Nyttigt tab */}

                 {/* Add School Receiver Type Button */}
                 {/* moved to Nyttigt tab */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opening Hours Tab */}
        <TabsContent value="opening">
          <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle className="text-white font-extrabold drop-shadow">Öppettider</CardTitle>
              <CardDescription className="text-slate-300">
                Redigera öppettider för kontor och körlektioner samt undantag
              </CardDescription>
              <div className="ml-auto flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    Osparade ändringar
                  </div>
                )}
                <button onClick={() => setEditOpening((v) => !v)} className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20">
                  <Edit className="w-4 h-4 text-white" />
                </button>
                <button onClick={saveSettings} disabled={saving || !hasUnsavedChanges} className={`p-2 rounded-lg ${hasUnsavedChanges ? 'bg-green-600/90 hover:bg-green-600' : 'bg-sky-600/90 hover:bg-sky-600'} text-white`}>
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${editOpening ? '' : 'opacity-60 pointer-events-none'}`}>
              {settings.opening_hours && (
                <OpeningHoursEditor
                  value={settings.opening_hours}
                  onChange={(next) => updateSetting('opening_hours', next)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* School Information Tab */}
        <TabsContent value="school">
          <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle>Skolinformation</CardTitle>
              <CardDescription>
                Grundläggande information om trafikskolan
              </CardDescription>
              <div className="ml-auto flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    Osparade ändringar
                  </div>
                )}
                <button onClick={() => setEditSchool((v) => !v)} className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={saveSettings} disabled={saving || !hasUnsavedChanges} className={`p-2 rounded-lg ${hasUnsavedChanges ? 'bg-green-600/90 hover:bg-green-600' : 'bg-sky-600/90 hover:bg-sky-600'} text-white`}>
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${editSchool ? '' : 'opacity-60 pointer-events-none'}`}> 
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
          <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle>Webbplatsinställningar</CardTitle>
              <CardDescription>
                Allmänna inställningar för webbplatsen
              </CardDescription>
              <div className="ml-auto flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    Osparade ändringar
                  </div>
                )}
                <button onClick={() => setEditSite((v) => !v)} className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={saveSettings} disabled={saving || !hasUnsavedChanges} className={`p-2 rounded-lg ${hasUnsavedChanges ? 'bg-green-600/90 hover:bg-green-600' : 'bg-sky-600/90 hover:bg-sky-600'} text-white`}>
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-4 ${editSite ? '' : 'opacity-60 pointer-events-none'}`}> 
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <Label htmlFor="internal-messages-enabled" className="text-white">Interna meddelanden</Label>
                  <p className="text-sm text-slate-300">Stäng av för att dölja interna meddelanden och sluta räkna olästa</p>
                </div>
                <Switch
                  id="internal-messages-enabled"
                  checked={settings.internal_messages_enabled}
                  onCheckedChange={(checked) => updateSetting('internal_messages_enabled', checked)}
                />
              </div>
              {/* Google Maps API Key */}
              <div className="space-y-2">
                <Label htmlFor="google-maps-api-key">
                  <Key className="w-4 h-4 inline mr-2" />
                  Google Maps API-nyckel
                </Label>
                <Input
                  id="google-maps-api-key"
                  type="password"
                  placeholder="AIza..."
                  value={settings.google_maps_api_key || ''}
                  onChange={(e) => updateSetting('google_maps_api_key', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Används för kartor och vägbeskrivning på betalnings- och informationssidor.</p>
              </div>
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
                <Label htmlFor="public-app-url">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Publik webb-URL (https)
                </Label>
                <Input
                  id="public-app-url"
                  placeholder="https://www.dintrafikskolahlm.se"
                  value={settings.public_app_url || ''}
                  onChange={(e) => updateSetting('public_app_url', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Används för leverantörs-callbacks (Qliro) och e-postlänkar. Måste vara https utan port.
                </p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Facebook-länk</Label>
                  <Input value={settings.social_facebook || ''} onChange={(e) => updateSetting('social_facebook', e.target.value)} placeholder="https://facebook.com/dinskola" />
                </div>
                <div>
                  <Label>Instagram-länk</Label>
                  <Input value={settings.social_instagram || ''} onChange={(e) => updateSetting('social_instagram', e.target.value)} placeholder="https://instagram.com/dinskola" />
                </div>
                <div>
                  <Label>TikTok-länk</Label>
                  <Input value={settings.social_tiktok || ''} onChange={(e) => updateSetting('social_tiktok', e.target.value)} placeholder="https://tiktok.com/@dinskola" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Useful Tab: collect setup/init/test actions */}
        <TabsContent value="useful">
          <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white font-extrabold drop-shadow">Nyttigt</CardTitle>
              <CardDescription className="text-slate-300">Snabbåtgärder för initiering och test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Button onClick={initializeSchoolEmail} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <SettingsIcon className="w-4 h-4 mr-2" /> Initiera skolans e-postinställning
                </Button>
                <Button onClick={initializeAllEmailSettings} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <SettingsIcon className="w-4 h-4 mr-2" /> Initiera alla e-postinställningar
                </Button>
                <Button onClick={initializeSchoolPhonenumber} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <Phone className="w-4 h-4 mr-2" /> Initiera skolans telefonnummer
                </Button>
                <Button onClick={addSwishPaymentTemplate} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <DollarSign className="w-4 h-4 mr-2" /> Lägg till Swish betalningsmall
                </Button>
                <Button onClick={addEnumValue} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <SettingsIcon className="w-4 h-4 mr-2" /> Lägg till enum värde
                </Button>
                <Button onClick={updateSwishTemplateReceiver} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <AtSign className="w-4 h-4 mr-2" /> Uppdatera Swish mall till skol-e-post
                </Button>
                <Button onClick={addSchoolReceiverType} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <AtSign className="w-4 h-4 mr-2" /> Lägg till school receiver type
                </Button>
                <Button
                  onClick={async () => {
                    const t = toast.loading('Initierar Qliro checkout flow setting...');
                    try {
                      const res = await fetch('/api/admin/settings/init-qliro-flow', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Misslyckades att initiera setting');
                      toast.success('Qliro checkout flow setting initierad!', { id: t });
                      // Reload settings
                      fetchSettings();
                    } catch (error: any) {
                      toast.error(`Fel: ${error.message || 'Okänt fel'}`, { id: t });
                    }
                  }}
                  className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Initiera Qliro Checkout Flow Setting
                </Button>
                <Button onClick={testSwishConfirmation} className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <CheckCircle className="w-4 h-4 mr-2" /> Testa Swish bekräftelse
                </Button>
                <Button
                  onClick={async () => {
                    const appUrl = prompt('Ange APP URL (t.ex. https://dintrafikskolahlm.se)');
                    const cronSecret = prompt('Ange CRON_SECRET som servern kommer validera');
                    if (!appUrl || !cronSecret) return;
                    const t = toast.loading('Sätter upp cron...');
                    try {
                      const res = await fetch('/api/admin/system/run-cron-setup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ appUrl, cronSecret })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Misslyckades att generera instruktioner');
                      setCronInfo({
                        endpoint: data.endpoint,
                        validated: !!data.validated,
                        probe: data.probe || { status: 0, body: null },
                        examples: data.examples,
                      });
                      setCronDialogOpen(true);
                      toast.success(data.validated ? 'Instruktioner klara (validering OK)' : 'Instruktioner klara (validering misslyckades)', { id: t });
                    } catch (e: any) {
                      toast.error(e.message || 'Fel vid cron-setup', { id: t });
                    }
                  }}
                  className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" /> Sätt upp cron för temp-rensning
                </Button>
                {/* Cron instructions dialog */}
                <Dialog open={cronDialogOpen} onOpenChange={setCronDialogOpen}>
                  <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Cron-instruktioner för temp-rensning</DialogTitle>
                    </DialogHeader>
                    {cronInfo ? (
                      <div className="space-y-4 text-slate-200">
                        <div className="text-sm">
                          Endpoint: <code className="bg-black/30 px-1 py-0.5 rounded">{cronInfo.endpoint}</code>
                          <span className={`ml-2 text-xs ${cronInfo.validated ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {cronInfo.validated ? 'Validerad' : 'Ej validerad – kontrollera URL/secret'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Kör nu (cURL)</div>
                            <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(cronInfo.examples.curlNow); toast('Kopierad'); } catch {} }}>
                              <Copy className="w-4 h-4 mr-1" /> Kopiera
                            </Button>
                          </div>
                          <pre className="bg-slate-900/60 border border-white/10 rounded p-2 text-xs overflow-auto">{cronInfo.examples.curlNow}</pre>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Linux cron (var 5:e minut)</div>
                            <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(cronInfo.examples.linuxCron); toast('Kopierad'); } catch {} }}>
                              <Copy className="w-4 h-4 mr-1" /> Kopiera
                            </Button>
                          </div>
                          <pre className="bg-slate-900/60 border border-white/10 rounded p-2 text-xs overflow-auto">{cronInfo.examples.linuxCron}</pre>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Windows PowerShell (engångskörning)</div>
                            <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(cronInfo.examples.windowsPowerShellOneLiner); toast('Kopierad'); } catch {} }}>
                              <Copy className="w-4 h-4 mr-1" /> Kopiera
                            </Button>
                          </div>
                          <pre className="bg-slate-900/60 border border-white/10 rounded p-2 text-xs overflow-auto">{cronInfo.examples.windowsPowerShellOneLiner}</pre>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Windows Schemalagd uppgift (var 5:e minut)</div>
                            <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(cronInfo.examples.windowsSchtasks); toast('Kopierad'); } catch {} }}>
                              <Copy className="w-4 h-4 mr-1" /> Kopiera
                            </Button>
                          </div>
                          <pre className="bg-slate-900/60 border border-white/10 rounded p-2 text-xs overflow-auto">{cronInfo.examples.windowsSchtasks}</pre>
                        </div>
                    
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCronDialogOpen(false)}>Stäng</Button>
                          <Button onClick={async () => {
                            const all = `# Endpoint\n${cronInfo.endpoint}\n\n# Kör nu (cURL)\n${cronInfo.examples.curlNow}\n\n# Linux cron\n${cronInfo.examples.linuxCron}\n\n# Windows PowerShell\n${cronInfo.examples.windowsPowerShellOneLiner}\n\n# Windows Schemalagd uppgift\n${cronInfo.examples.windowsSchtasks}\n`;
                            try { await navigator.clipboard.writeText(all); toast('Allt kopierat'); } catch {}
                          }}>Kopiera allt</Button>
                        </DialogFooter>
                      </div>
                    ) : null}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment">
          <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle>Betalningsinställningar</CardTitle>
              <CardDescription>
                Konfigurera betalningsmetoder och API-nycklar
              </CardDescription>
              <div className="ml-auto flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    Osparade ändringar
                  </div>
                )}
                <button onClick={() => setEditPayment((v) => !v)} className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={saveSettings} disabled={saving || !hasUnsavedChanges} className={`p-2 rounded-lg ${hasUnsavedChanges ? 'bg-green-600/90 hover:bg-green-600' : 'bg-sky-600/90 hover:bg-sky-600'} text-white`}>
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${editPayment ? '' : 'opacity-60 pointer-events-none'}`}> 
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
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-white font-semibold">Produktionsmiljö</div>
                          <div className="text-sm text-slate-300">Växla mellan utvecklings- och produktionsmiljö</div>
                        </div>
                        <Switch
                          id="qliro-use-prod"
                          checked={settings.qliro_use_prod_env}
                          onCheckedChange={(checked) => updateSetting('qliro_use_prod_env', checked)}
                        />
                      </div>
                      <div className="text-sm text-slate-200">
                        Aktuell miljö: <span className="font-bold">{settings.qliro_use_prod_env ? 'Produktion' : 'Utveckling/Sandbox'}</span>
                      </div>
                    </div>

                    {/* Extended debug toggle */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-semibold">Utökad felsökning</div>
                          <div className="text-sm text-slate-300">Aktivera extra debug-utskrifter i konsolen för Qliro-flöden</div>
                        </div>
                        <Switch id="debug-extended" checked={!!settings.debug_extended_logs} onCheckedChange={(checked) => updateSetting('debug_extended_logs', checked)} />
                      </div>
                    </div>

                    {/* Qliro checkout flow type */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="space-y-3">
                        <div>
                          <div className="text-white font-semibold">Checkout Flow Type</div>
                          <div className="text-sm text-slate-300">Välj hur Qliro-checkout ska visas för kunder</div>
                        </div>
                        <Select 
                          value={settings.qliro_checkout_flow || 'window'} 
                          onValueChange={(value) => updateSetting('qliro_checkout_flow', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Välj checkout flow" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="window">
                              <div className="flex flex-col">
                                <span className="font-medium">Nytt fönster</span>
                                <span className="text-sm text-gray-500">Öppnar Qliro i ett nytt webbläsarfönster</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="popup">
                              <div className="flex flex-col">
                                <span className="font-medium">Modern popup</span>
                                <span className="text-sm text-gray-500">Visar Qliro i en modal med steg-för-steg progress</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* API URLs Configuration */}
                    <div className="space-y-4 border-t border-white/10 pt-4">
                      <h4 className="font-medium text-white">API-konfiguration</h4>
                      
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
                      {/* Computed config URLs helper */}
                      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-white font-semibold">Qliro URL-konfiguration</div>
                          <div className="text-xs text-slate-300">baserat på Publik webb-URL</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="min-w-[180px] text-slate-200">Köpvillkor</span>
                            <Input readOnly value={(settings.public_app_url || '').replace(/\/$/, '') + '/kopvillkor'} className="bg-white/10 border-white/20 text-white" />
                            <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(((settings.public_app_url || '').replace(/\/$/, '') + '/kopvillkor'), 'Köpvillkor')}>Kopiera</Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="min-w-[180px] text-slate-200">Integritetspolicy</span>
                            <Input readOnly value={(settings.public_app_url || '').replace(/\/$/, '') + '/integritetspolicy'} className="bg-white/10 border-white/20 text-white" />
                            <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(((settings.public_app_url || '').replace(/\/$/, '') + '/integritetspolicy'), 'Integritetspolicy')}>Kopiera</Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="min-w-[180px] text-slate-200">Checkout Push</span>
                            <Input readOnly value={(settings.public_app_url || '').replace(/\/$/, '') + '/api/payments/qliro/checkout-push'} className="bg-white/10 border-white/20 text-white" />
                            <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(((settings.public_app_url || '').replace(/\/$/, '') + '/api/payments/qliro/checkout-push'), 'Checkout Push')}>Kopiera</Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="min-w-[180px] text-slate-200">Order Mgmt Push</span>
                            <Input readOnly value={(settings.public_app_url || '').replace(/\/$/, '') + '/api/payments/qliro/order-management-push'} className="bg-white/10 border-white/20 text-white" />
                            <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(((settings.public_app_url || '').replace(/\/$/, '') + '/api/payments/qliro/order-management-push'), 'Order Mgmt Push')}>Kopiera</Button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Se till att Publik webb-URL är korrekt och börjar med https.</p>
                      </div>
                    </div>

                    {/* Credentials */}
                    <div className="space-y-6 border-t pt-4">
                      <h4 className="font-medium text-white">Kredentialer</h4>

                      {/* Dev/Sandbox credentials */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /> Utvecklings-kredentialer (Sandbox)
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qliro-dev-api-key">
                            <Key className="w-4 h-4 inline mr-2" />
                            Dev API-nyckel
                          </Label>
                          <Input
                            id="qliro-dev-api-key"
                            type="password"
                            placeholder="Ange din Qliro API-nyckel (dev)"
                            value={settings.qliro_api_key}
                            onChange={(e) => updateSetting('qliro_api_key', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qliro-dev-secret">
                            <Key className="w-4 h-4 inline mr-2" />
                            Dev API Secret
                          </Label>
                          <Input
                            id="qliro-dev-secret"
                            type="password"
                            placeholder="Ange din Qliro API Secret (dev)"
                            value={settings.qliro_api_secret || settings.qliro_secret || ''}
                            onChange={(e) => { updateSetting('qliro_api_secret', e.target.value); updateSetting('qliro_secret', e.target.value); }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qliro-dev-merchant-id">
                            <Building className="w-4 h-4 inline mr-2" />
                            Dev Merchant ID
                          </Label>
                          <Input
                            id="qliro-dev-merchant-id"
                            placeholder="Ange ditt Qliro Merchant ID (dev)"
                            value={settings.qliro_merchant_id}
                            onChange={(e) => updateSetting('qliro_merchant_id', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Prod credentials */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-rose-400" /> Produktions-kredentialer
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qliro-prod-api-key">
                            <Key className="w-4 h-4 inline mr-2" />
                            Prod API-nyckel
                          </Label>
                          <Input
                            id="qliro-prod-api-key"
                            type="password"
                            placeholder="Ange din Qliro API-nyckel (prod)"
                            value={settings.qliro_prod_api_key}
                            onChange={(e) => updateSetting('qliro_prod_api_key', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qliro-prod-secret">
                            <Key className="w-4 h-4 inline mr-2" />
                            Prod API Secret
                          </Label>
                          <Input
                            id="qliro-prod-secret"
                            type="password"
                            placeholder="Ange din Qliro API Secret (prod)"
                            value={settings.qliro_prod_api_secret || ''}
                            onChange={(e) => updateSetting('qliro_prod_api_secret', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qliro-prod-merchant-id">
                            <Building className="w-4 h-4 inline mr-2" />
                            Prod Merchant ID
                          </Label>
                          <Input
                            id="qliro-prod-merchant-id"
                            placeholder="Ange ditt Qliro Merchant ID (prod)"
                            value={settings.qliro_prod_merchant_id}
                            onChange={(e) => updateSetting('qliro_prod_merchant_id', e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-slate-400">Produktion används när växeln "Produktionsmiljö" är påslagen.</p>
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
        <TabsContent value="troubleshooting">
          <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white font-extrabold drop-shadow">Felsökning</CardTitle>
              <CardDescription className="text-slate-300">Diagnostik och tester</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-user-id" className="text-slate-200">Test Användar-ID</Label>
                <Input id="test-user-id" value={testUserId} onChange={(e) => setTestUserId(e.target.value)} placeholder="Ange användar-ID för test" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={runTests} disabled={testing} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  {testing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Kör test...</>) : 'Kör krediterings-API-test'}
                </Button>
                <Button onClick={testQliroPayment} disabled={testing || !testUserId} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <CreditCard className="w-4 h-4 mr-2" /> Test Qliro Payment
                </Button>
                <Button onClick={testSendGridEmail} disabled={testing || !testUserId} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <Mail className="w-4 h-4 mr-2" /> Testa SendGrid
                </Button>
                <Button onClick={testContactEmail} disabled={testing} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <Mail className="w-4 h-4 mr-2" /> Testa Kontaktformulär
                </Button>
                <Button onClick={testContactEmailDesign} disabled={testing} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <Mail className="w-4 h-4 mr-2" /> Testa Kontaktformulär Design
                </Button>
                <Button onClick={testExportFunctions} disabled={testing} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <DollarSign className="w-4 h-4 mr-2" /> Testa Export-funktioner
                </Button>
              </div>
              <div className="text-sm text-slate-200 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="font-semibold">Observera:</p>
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
                  <h4 className="font-semibold text-white">Test Resultat:</h4>
                  {testResults.map((result, index) => (
                    <div key={index} className={`p-4 rounded-xl border ${result.success ? 'border-green-500/50 bg-green-500/10' : 'border-rose-500/50 bg-rose-500/10'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-white">{result.method} {result.endpoint}</strong>
                        <span className={`px-2 py-1 rounded text-sm ${result.success ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}`}>
                          {result.status} {result.success ? 'OK' : 'Fel'}
                        </span>
                      </div>
                      <pre className="bg-white/5 border border-white/10 p-2 rounded overflow-x-auto text-xs text-slate-200">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                      {result.error && (
                        <p className="mt-2 text-rose-300">Error: {result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {exportTestResults && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-white">Export Test Resultat:</h4>
                  <pre className="bg-white/5 border border-white/10 p-2 rounded overflow-x-auto text-xs text-slate-200">
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
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-sm text-amber-400 mr-4">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            Osparade ändringar
          </div>
        )}
        <Button 
          onClick={saveSettings} 
          disabled={saving || !hasUnsavedChanges}
          className={`${hasUnsavedChanges ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
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
