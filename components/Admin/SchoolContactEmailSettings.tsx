import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Mail, AtSign, MessageSquare, Bell, Info } from 'lucide-react';

interface SchoolContactEmailSettingsProps {
  settings: Record<string, any>;
  onUpdateSetting: (key: string, value: any) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export default function SchoolContactEmailSettings({
  settings,
  onUpdateSetting,
  onSave,
  saving,
}: SchoolContactEmailSettingsProps) {
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Ange en giltig e-postadress för att skicka test');
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch('/api/admin/test-school-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailAddress }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte skicka test-email');
      }

      toast.success('Test-email skickat!');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(`Kunde inte skicka test-email: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Card className="w-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Skolans Kontakt E-post
        </CardTitle>
        <CardDescription>
          Hantera skolans kontakt e-postadresser och inställningar för automatiska meddelanden
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="school_contact_email">Skolans kontakt e-post</Label>
          <Input
            id="school_contact_email"
            type="email"
            placeholder="kontakt@dintrafikskola.se"
            value={settings.school_contact_email || ''}
            onChange={(e) => onUpdateSetting('school_contact_email', e.target.value)}
            className="bg-white/20 border-white/30 focus:bg-white/30"
          />
          <p className="text-xs text-gray-400">
            E-postadress som ska användas för att ta emot boknings- och betalningsbekräftelser
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="school_contact_name">Kontaktpersonens namn</Label>
          <Input
            id="school_contact_name"
            type="text"
            placeholder="Kontaktpersonens namn"
            value={settings.school_contact_name || ''}
            onChange={(e) => onUpdateSetting('school_contact_name', e.target.value)}
            className="bg-white/20 border-white/30 focus:bg-white/30"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-medium flex items-center gap-1">
            <Bell className="h-4 w-4" />
            Notifikationsinställningar
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_on_booking" className="font-medium">
                Skicka meddelande vid ny bokning
              </Label>
              <p className="text-xs text-gray-400">
                Skicka en notifikation till kontakt-e-postadressen när en ny bokning görs
              </p>
            </div>
            <Switch
              id="notify_on_booking"
              checked={settings.notify_on_booking === true}
              onCheckedChange={(checked) => onUpdateSetting('notify_on_booking', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_on_payment" className="font-medium">
                Skicka meddelande vid betalning
              </Label>
              <p className="text-xs text-gray-400">
                Skicka en notifikation till kontakt-e-postadressen när en betalning genomförs
              </p>
            </div>
            <Switch
              id="notify_on_payment"
              checked={settings.notify_on_payment === true}
              onCheckedChange={(checked) => onUpdateSetting('notify_on_payment', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify_on_cancellation" className="font-medium">
                Skicka meddelande vid avbokning
              </Label>
              <p className="text-xs text-gray-400">
                Skicka en notifikation till kontakt-e-postadressen när en bokning avbokas
              </p>
            </div>
            <Switch
              id="notify_on_cancellation"
              checked={settings.notify_on_cancellation === true}
              onCheckedChange={(checked) => onUpdateSetting('notify_on_cancellation', checked)}
            />
          </div>
        </div>

        <div className="border-t border-white/20 pt-4">
          <div className="space-y-2">
            <Label htmlFor="test_email">Test E-post</Label>
            <div className="flex space-x-2">
              <Input
                id="test_email"
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="bg-white/20 border-white/30 focus:bg-white/30"
              />
              <Button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmailAddress}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Skickar...
                  </>
                ) : (
                  'Skicka test'
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sparar...
              </>
            ) : (
              'Spara inställningar'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
