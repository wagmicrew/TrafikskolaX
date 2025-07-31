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

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>({
    use_sendgrid: false,
    sendgrid_api_key: '',
    from_name: 'Din Trafikskola Hässleholm',
    from_email: 'noreply@dintrafikskolahlm.se',
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
        <TabsList className="grid w-full grid-cols-3">
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
                    Aktivera SendGrid för e-postutskick. Om avaktiverat används endast interna meddelanden.
                  </p>
                </div>
                <Switch
                  id="use-sendgrid"
                  checked={settings.use_sendgrid}
                  onCheckedChange={(checked) => updateSetting('use_sendgrid', checked)}
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
