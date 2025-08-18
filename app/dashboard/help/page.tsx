'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  FaQuestionCircle, 
  FaUsers, 
  FaCalendar, 
  FaCog, 
  FaEnvelope, 
  FaBookOpen,
  FaGraduationCap,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDatabase,
  FaShieldAlt,
  FaUserGraduate,
  FaUserFriends,
  FaStar,
  FaCoins,
  FaCreditCard,
  FaFileAlt,
  FaBell,
  FaInfoCircle
} from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function HelpPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  function SchoolContact() {
    const [phone, setPhone] = React.useState<string>('');
    const [email, setEmail] = React.useState<string>('');
    React.useEffect(() => {
      (async () => {
        try {
          const res = await fetch('/api/admin/settings', { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            setPhone(data.settings?.school_phonenumber || '');
            setEmail(data.settings?.school_email || '');
          }
        } catch {}
      })();
    }, []);
    return (
      <ul className="space-y-1 text-sm text-gray-600">
        {phone && <li>• <strong>Ring oss:</strong> {phone}</li>}
        {email && <li>• <strong>E-post:</strong> {email}</li>}
      </ul>
    );
  }

  function SocialLinks() {
    const [links, setLinks] = React.useState<{ facebook?: string; instagram?: string; tiktok?: string }>({});
    React.useEffect(() => {
      (async () => {
        try {
          const res = await fetch('/api/admin/settings', { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            setLinks({
              facebook: data.settings?.social_facebook || '',
              instagram: data.settings?.social_instagram || '',
              tiktok: data.settings?.social_tiktok || '',
            });
          }
        } catch {}
      })();
    }, []);
    const hasAny = links.facebook || links.instagram || links.tiktok;
    if (!hasAny) return null;
    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📣 Sociala medier</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          {links.facebook && (
            <li>• <a className="underline text-blue-600" href={links.facebook} target="_blank" rel="noreferrer">Facebook</a></li>
          )}
          {links.instagram && (
            <li>• <a className="underline text-pink-600" href={links.instagram} target="_blank" rel="noreferrer">Instagram</a></li>
          )}
          {links.tiktok && (
            <li>• <a className="underline text-black" href={links.tiktok} target="_blank" rel="noreferrer">TikTok</a></li>
          )}
        </ul>
      </div>
    );
  }

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=%2Fdashboard%2Fhelp');
      return;
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const renderAdminHelp = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-4">
          <FaShieldAlt className="text-yellow-300" />
          Admin Hjälp & Guide
        </h1>
        <p className="text-xl text-blue-100">
          Välkommen till admin-hjälpen! Här hittar du all information du behöver för att hantera trafikskolan.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="bookings">Bokningar</TabsTrigger>
          <TabsTrigger value="users">Användare</TabsTrigger>
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                Vad kan du göra som admin?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">👥 Användarhantering</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Lägg till nya studenter och lärare</li>
                    <li>• Hantera användarroller och behörigheter</li>
                    <li>• Se användarstatistik och aktivitet</li>
                    <li>• Redigera användarinformation</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">📅 Bokningshantering</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Se alla bokningar i systemet</li>
                    <li>• Hantera bokningsstatus och bekräftelser</li>
                    <li>• Skapa bokningar för studenter</li>
                    <li>• Hantera betalningar och Swish-bekräftelser</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">⚙️ Systeminställningar</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Konfigurera e-postinställningar</li>
                    <li>• Hantera betalningsmetoder</li>
                    <li>• Ställa in skolans information</li>
                    <li>• Hantera e-postmallar</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">📊 Rapporter & Export</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Exportera bokningsdata</li>
                    <li>• Se systemloggar</li>
                    <li>• Generera rapporter</li>
                    <li>• Backup av systemdata</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaCalendar className="text-green-600" />
                Hantera Bokningar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📋 Bokningsöversikt</h3>
                <p className="text-sm text-gray-700 mb-3">
                  På bokningssidan kan du se alla bokningar i systemet. Du kan filtrera efter:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Status:</strong> Bekräftade, väntande, avbokade</li>
                  <li>• <strong>Datum:</strong> Välj specifika datum eller perioder</li>
                  <li>• <strong>Lärare:</strong> Filtrera efter specifika lärare</li>
                  <li>• <strong>Student:</strong> Sök efter specifika studenter</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Bekräfta Bokningar</h3>
                <p className="text-sm text-gray-700 mb-3">
                  När studenter bokar lektioner via Swish behöver du bekräfta betalningen:
                </p>
                <ol className="space-y-1 text-sm text-gray-600">
                  <li>1. Gå till bokningssidan och leta efter "Väntande Swish-betalning"</li>
                  <li>2. Kontrollera Swish-appen för betalningen</li>
                  <li>3. Klicka "Bekräfta betalning" eller "Avvisa betalning"</li>
                  <li>4. Studenten får automatiskt bekräftelse via e-post</li>
                </ol>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">➕ Skapa Bokningar</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Du kan skapa bokningar för studenter direkt i systemet:
                </p>
                <ol className="space-y-1 text-sm text-gray-600">
                  <li>1. Gå till "Skapa bokning" i bokningsmenyn</li>
                  <li>2. Välj student från listan</li>
                  <li>3. Välj lektionstyp och lärare</li>
                  <li>4. Välj datum och tid</li>
                  <li>5. Bekräfta bokningen</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaUsers className="text-blue-600" />
                Hantera Användare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">👤 Användartyper</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold text-green-600">Student</h4>
                    <p className="text-sm text-gray-600">Kan boka lektioner, se sin schemaläggning och hantera sina bokningar</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold text-blue-600">Lärare</h4>
                    <p className="text-sm text-gray-600">Kan se sina bokningar, hantera studenter och skapa bokningar</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold text-red-600">Admin</h4>
                    <p className="text-sm text-gray-600">Fullständig åtkomst till alla funktioner i systemet</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">➕ Lägg till ny användare</h3>
                <ol className="space-y-1 text-sm text-gray-600">
                  <li>1. Gå till "Användare" i admin-menyn</li>
                  <li>2. Klicka "Lägg till ny användare"</li>
                  <li>3. Fyll i användarinformation (namn, e-post, telefon)</li>
                  <li>4. Välj användarroll (student/lärare/admin)</li>
                  <li>5. Sätt ett temporärt lösenord</li>
                  <li>6. Användaren får e-post med inloggningsuppgifter</li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⚠️ Viktiga säkerhetsfunktioner</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Lösenord:</strong> Användare måste ändra sitt lösenord vid första inloggning</li>
                  <li>• <strong>Sessioner:</strong> Automatisk utloggning efter inaktivitet</li>
                  <li>• <strong>Behörigheter:</strong> Varje användare ser bara relevant information</li>
                  <li>• <strong>Loggning:</strong> Alla admin-åtgärder loggas för säkerhet</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaCog className="text-purple-600" />
                Systeminställningar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🏫 Skolinformation</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Skolnamn:</strong> Visas på alla e-postmeddelanden och sidor</li>
                  <li>• <strong>Kontaktinformation:</strong> Adress, telefon, e-post</li>
                  <li>• <strong>Öppettider:</strong> Visas för studenter vid bokning</li>
                  <li>• <strong>Logo:</strong> Ladda upp skolans logotyp</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">💳 Betalningsinställningar</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Swish-nummer:</strong> Ange skolans Swish-nummer för betalningar</li>
                  <li>• <strong>Qliro:</strong> Konfigurera Qliro för avbetalningar</li>
                  <li>• <strong>Priser:</strong> Ställ in standardpriser för olika lektionstyper</li>
                  <li>• <strong>Rabatter:</strong> Konfigurera studentrabatter och paketpriser</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📧 E-postinställningar</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>SMTP-inställningar:</strong> Konfigurera e-postserver</li>
                  <li>• <strong>Från-adress:</strong> Ange avsändaradress för alla e-postmeddelanden</li>
                  <li>• <strong>E-postmallar:</strong> Anpassa meddelanden för bokningsbekräftelser</li>
                  <li>• <strong>Test-e-post:</strong> Skicka testmeddelanden för att verifiera inställningar</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🔧 Avancerade inställningar</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Systemloggar:</strong> Se alla systemhändelser och fel</li>
                  <li>• <strong>Backup:</strong> Skapa säkerhetskopior av systemdata</li>
                  <li>• <strong>Underhållsläge:</strong> Aktivera för systemuppdateringar</li>
                  <li>• <strong>API-nycklar:</strong> Hantera externa integrationsnycklar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderStudentHelp = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-4">
          <FaUserFriends className="text-yellow-300" />
          Student Hjälp & Guide
        </h1>
        <p className="text-xl text-green-100">
          Välkommen till student-hjälpen! Här hittar du all information du behöver för att boka och hantera dina lektioner.
        </p>
      </div>

      <Tabs defaultValue="booking" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="booking">Boka Lektioner</TabsTrigger>
            <TabsTrigger value="dashboard">Din sida</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

        <TabsContent value="booking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaCalendar className="text-green-600" />
                Så här bokar du lektioner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📅 Steg för steg bokning</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li><strong>1. Gå till bokningssidan</strong> - Klicka på "Boka lektion" i menyn</li>
                  <li><strong>2. Välj lektionstyp</strong> - T.ex. B-körkort, handledarutbildning</li>
                  <li><strong>3. Välj datum</strong> - Bläddra i kalendern och välj önskat datum</li>
                  <li><strong>4. Välj tid</strong> - Klicka på en ledig tid i schemat</li>
                  <li><strong>5. Välj lärare</strong> - Om flera lärare finns tillgängliga</li>
                  <li><strong>6. Bekräfta bokning</strong> - Granska informationen och bekräfta</li>
                  <li><strong>7. Betala</strong> - Välj betalningsmetod (Swish/Qliro/Krediter)</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">💡 Tips för bokning</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Boka i tid:</strong> Lektioner bokas ofta snabbt, särskilt populära tider</li>
                  <li>• <strong>Kontrollera din e-post:</strong> Du får bekräftelse via e-post</li>
                  <li>• <strong>Avbokning:</strong> Du kan avboka upp till 24h före lektionen</li>
                  <li>• <strong>Krediter:</strong> Använd dina krediter för att spara pengar</li>
                  <li>• <strong>Påminnelser:</strong> Du får SMS/e-post 24h före lektionen</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⚠️ Viktigt att veta</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Avbokning:</strong> Gratis upp till 24h före, avgift efter det</li>
                  <li>• <strong>Försening:</strong> Kom i tid, försening kan påverka din lektion</li>
                  <li>• <strong>Väder:</strong> Lektioner genomförs även vid dåligt väder</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaBookOpen className="text-blue-600" />
                Din sida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📊 Översikt</h3>
                <p className="text-sm text-gray-700 mb-3">
                  På din dashboard kan du se all viktig information på ett ställe:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Kommande lektioner</strong> - Dina bokade lektioner</li>
                  <li>• <strong>Genomförda lektioner</strong> - Din utveckling</li>
                  <li>• <strong>Tillgängliga krediter</strong> - Dina lektionskrediter</li>
                  
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Hantera dina bokningar</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Se detaljer:</strong> Klicka på en bokning för mer information</li>
                  <li>• <strong>Avboka:</strong> Avboka lektioner du inte kan gå på</li>
                  <li>• <strong>Omboka:</strong> Ändra tid för befintliga bokningar</li>
                  <li>• <strong>Feedback:</strong> Ge feedback efter genomförda lektioner</li>
                </ul>
              </div>

              
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaQuestionCircle className="text-red-600" />
                Support & Hjälp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🚨 Akut hjälp</h3>
                <SchoolContact />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">❓ Vanliga frågor</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold">Kan jag avboka en lektion?</h4>
                    <p className="text-sm text-gray-600">Ja, du kan avboka gratis upp till 24h före lektionen. Senare avbokning kan medföra avgift.</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold">Vad händer om jag kommer för sent?</h4>
                    <p className="text-sm text-gray-600">Kontakta oss direkt. Vi försöker alltid anpassa lektionen, men det kan påverka lektionens längd.</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold">Hur många lektioner behöver jag?</h4>
                    <p className="text-sm text-gray-600">Det varierar beroende på erfarenhet och inlärningsförmåga. Vi rekommenderar att börja med 5-10 lektioner.</p>
                  </div>
                </div>
              </div>

              <SocialLinks />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTeacherHelp = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-4">
          <FaUserGraduate className="text-yellow-300" />
          Lärare Hjälp & Guide
        </h1>
        <p className="text-xl text-purple-100">
          Välkommen till lärar-hjälpen! Här hittar du all information du behöver för att hantera dina lektioner och studenter.
        </p>
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Schema</TabsTrigger>
          <TabsTrigger value="students">Studenter</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="tools">Verktyg</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaCalendar className="text-purple-600" />
                Hantera ditt schema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📅 Ditt schema</h3>
                <p className="text-sm text-gray-700 mb-3">
                  På lärar-dashboarden kan du se och hantera ditt schema:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Dagens lektioner:</strong> Se alla lektioner för idag</li>
                  <li>• <strong>Veckoschema:</strong> Översikt över hela veckan</li>
                  <li>• <strong>Månadsschema:</strong> Långsiktig planering</li>
                  <li>• <strong>Lediga tider:</strong> Se när du är tillgänglig för bokningar</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Lektionshantering</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Starta lektion:</strong> Markera lektion som påbörjad</li>
                  <li>• <strong>Slutför lektion:</strong> Markera lektion som genomförd</li>
                  <li>• <strong>Avbryt lektion:</strong> Vid oförutsedda händelser</li>
                  <li>• <strong>Förläng lektion:</strong> Om extra tid behövs</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⏰ Tillgänglighet</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Ställ in tillgänglighet:</strong> Markera när du kan undervisa</li>
                  <li>• <strong>Pauser:</strong> Ställ in lunch- och raster</li>
                  <li>• <strong>Semester:</strong> Markera lediga perioder</li>
                  <li>• <strong>Flexibel tid:</strong> Justera schemat vid behov</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaUsers className="text-blue-600" />
                Hantera studenter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">👥 Studentöversikt</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Du kan se information om dina studenter:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Kontaktinformation:</strong> Telefon, e-post, adress</li>
                  <li>• <strong>Lektionshistorik:</strong> Tidigare lektioner och framsteg</li>
                  <li>• <strong>Bokningar:</strong> Kommande lektioner</li>
                  <li>• <strong>Betalningsstatus:</strong> Om studenten har betalat</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📝 Studentanteckningar</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Lägg till anteckningar:</strong> Skriv privata anteckningar om varje student</li>
                  <li>• <strong>Framsteg:</strong> Spåra studentens utveckling</li>
                  <li>• <strong>Mål:</strong> Sätt mål för kommande lektioner</li>
                  <li>• <strong>Påminnelser:</strong> Sätt påminnelser för viktiga saker</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📞 Kommunikation</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Direktmeddelanden:</strong> Skicka meddelanden till studenter</li>
                  <li>• <strong>Påminnelser:</strong> Skicka påminnelser om lektioner</li>
                  <li>• <strong>Feedback:</strong> Ge konstruktiv feedback efter lektioner</li>
                  <li>• <strong>Uppföljning:</strong> Kontakta studenter som inte bokat på länge</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaStar className="text-yellow-600" />
                Feedback & Utvärdering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⭐ Ge feedback</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Efter varje lektion bör du ge feedback till studenten:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Positiva punkter:</strong> Vad gick bra under lektionen</li>
                  <li>• <strong>Förbättringsområden:</strong> Vad kan förbättras</li>
                  <li>• <strong>Nästa steg:</strong> Vad fokusera på nästa lektion</li>
                  <li>• <strong>Betyg:</strong> Ge ett betyg på 1-5 stjärnor</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📊 Utvärdering</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Framsteg:</strong> Spåra studentens utveckling över tid</li>
                  <li>• <strong>Statistik:</strong> Se statistik över dina lektioner</li>
                  <li>• <strong>Rapporter:</strong> Generera rapporter för admin</li>
                  <li>• <strong>Kvalitet:</strong> Fokusera på kvalitet i undervisningen</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🎯 Målsättning</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Sätt mål:</strong> Definiera tydliga mål för varje student</li>
                  <li>• <strong>Uppföljning:</strong> Regelbunden uppföljning av framsteg</li>
                  <li>• <strong>Anpassning:</strong> Anpassa undervisningen efter behov</li>
                  <li>• <strong>Motivation:</strong> Hjälp studenter att hålla motivationen</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaCog className="text-purple-600" />
                Lärarverktyg
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🛠️ Tillgängliga verktyg</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold text-blue-600">Schemahantering</h4>
                    <p className="text-sm text-gray-600">Hantera ditt schema och tillgänglighet</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold text-green-600">Studentöversikt</h4>
                    <p className="text-sm text-gray-600">Se information om dina studenter</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold text-yellow-600">Feedback-system</h4>
                    <p className="text-sm text-gray-600">Ge feedback efter lektioner</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-semibold text-red-600">Rapporter</h4>
                    <p className="text-sm text-gray-600">Generera rapporter och statistik</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📱 Mobil användning</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Mobil app:</strong> Hantera schema från telefonen</li>
                  <li>• <strong>Push-notifikationer:</strong> Få påminnelser om lektioner</li>
                  <li>• <strong>Snabb feedback:</strong> Ge feedback direkt efter lektion</li>
                  <li>• <strong>Offline-läge:</strong> Fungerar även utan internet</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📚 Resurser</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Undervisningsmaterial:</strong> Tillgång till digitala resurser</li>
                  <li>• <strong>Videobibliotek:</strong> Instruktiva videor för studenter</li>
                  <li>• <strong>Körkortsboken:</strong> Digital version tillgänglig</li>
                  <li>• <strong>Forum:</strong> Diskutera med andra lärare</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {user.role === 'admin' && renderAdminHelp()}
        {user.role === 'student' && renderStudentHelp()}
        {user.role === 'teacher' && renderTeacherHelp()}
      </div>
    </div>
  );
}
