'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Database,
  FileText,
  Menu,
  Settings,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Calendar
} from 'lucide-react';

interface SetupStatus {
  cmsTables: boolean;
  defaultPages: boolean;
  defaultMenu: boolean;
  uploadDirectory: boolean;
  teoriTables: boolean;
  teoriSampleData: boolean;
}

export default function SetupPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<SetupStatus>({
    cmsTables: false,
    defaultPages: false,
    defaultMenu: false,
    uploadDirectory: false,
    teoriTables: false,
    teoriSampleData: false
  });
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load setup status
  useEffect(() => {
    if (user && user.role === 'admin') {
      checkSetupStatus();
    }
  }, [user]);

  const checkSetupStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch('/api/admin/setup/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      } else {
        toast.error('Kunde inte kontrollera status');
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      toast.error('Kunde inte kontrollera status');
    } finally {
      setCheckingStatus(false);
      setLoading(false);
    }
  };

  const initializeCmsTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup/init-cms', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkSetupStatus();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte initialisera CMS-tabeller');
      }
    } catch (error) {
      console.error('Error initializing CMS tables:', error);
      toast.error('Kunde inte initialisera CMS-tabeller');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup/create-default-pages', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkSetupStatus();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte skapa standardsidor');
      }
    } catch (error) {
      console.error('Error creating default pages:', error);
      toast.error('Kunde inte skapa standardsidor');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultMenu = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup/create-default-menu', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkSetupStatus();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte skapa standardmeny');
      }
    } catch (error) {
      console.error('Error creating default menu:', error);
      toast.error('Kunde inte skapa standardmeny');
    } finally {
      setLoading(false);
    }
  };

  const createUploadDirectory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup/create-upload-directory', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkSetupStatus();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte skapa uppladdningskatalog');
      }
    } catch (error) {
      console.error('Error creating upload directory:', error);
      toast.error('Kunde inte skapa uppladdningskatalog');
    } finally {
      setLoading(false);
    }
  };

  const runTeoriMigration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup/run-teori-migration', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkSetupStatus();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte köra Teori-migrering');
      }
    } catch (error) {
      console.error('Error running Teori migration:', error);
      toast.error('Kunde inte köra Teori-migrering');
    } finally {
      setLoading(false);
    }
  };

  const createTeoriSampleData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup/create-teori-sample-data', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkSetupStatus();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte skapa Teori-exempeldata');
      }
    } catch (error) {
      console.error('Error creating Teori sample data:', error);
      toast.error('Kunde inte skapa Teori-exempeldata');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isComplete: boolean) => {
    return isComplete ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (isComplete: boolean) => {
    return isComplete ? (
      <Badge className="bg-green-100 text-green-800">Klar</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Behövs</Badge>
    );
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Laddar...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Setuphjälp</h1>
          <p className="text-gray-600">Konfigurera och initialisera CMS-systemet</p>
        </div>
        <Button
          onClick={checkSetupStatus}
          disabled={checkingStatus}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
          Uppdatera status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CMS Tables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              CMS-tabeller
            </CardTitle>
            {getStatusBadge(status.cmsTables)}
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Databastabeller för sidor, menyer och bilduppladdningar
            </CardDescription>
            <div className="mt-4 flex items-center gap-2">
              {getStatusIcon(status.cmsTables)}
              <span className="text-sm">
                {status.cmsTables ? 'Tabeller finns' : 'Tabeller saknas'}
              </span>
            </div>
            {!status.cmsTables && (
              <Button
                onClick={initializeCmsTables}
                disabled={loading}
                className="w-full mt-3"
                size="sm"
              >
                {loading ? 'Skapar...' : 'Skapa tabeller'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Default Pages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Standardsidor
            </CardTitle>
            {getStatusBadge(status.defaultPages)}
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Grundläggande sidor som Hem, Om oss och Kontakt
            </CardDescription>
            <div className="mt-4 flex items-center gap-2">
              {getStatusIcon(status.defaultPages)}
              <span className="text-sm">
                {status.defaultPages ? 'Sidor finns' : 'Sidor saknas'}
              </span>
            </div>
            {!status.defaultPages && status.cmsTables && (
              <Button
                onClick={createDefaultPages}
                disabled={loading}
                className="w-full mt-3"
                size="sm"
              >
                {loading ? 'Skapar...' : 'Skapa sidor'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Default Menu */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Menu className="w-4 h-4" />
              Standardmeny
            </CardTitle>
            {getStatusBadge(status.defaultMenu)}
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Grundläggande menyobjekt för webbplatsen
            </CardDescription>
            <div className="mt-4 flex items-center gap-2">
              {getStatusIcon(status.defaultMenu)}
              <span className="text-sm">
                {status.defaultMenu ? 'Meny finns' : 'Meny saknas'}
              </span>
            </div>
            {!status.defaultMenu && status.cmsTables && (
              <Button
                onClick={createDefaultMenu}
                disabled={loading}
                className="w-full mt-3"
                size="sm"
              >
                {loading ? 'Skapar...' : 'Skapa meny'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upload Directory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Uppladdningskatalog
            </CardTitle>
            {getStatusBadge(status.uploadDirectory)}
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Katalog för bilduppladdningar (/public/images)
            </CardDescription>
            <div className="mt-4 flex items-center gap-2">
              {getStatusIcon(status.uploadDirectory)}
              <span className="text-sm">
                {status.uploadDirectory ? 'Katalog finns' : 'Katalog saknas'}
              </span>
            </div>
            {!status.uploadDirectory && (
              <Button
                onClick={createUploadDirectory}
                disabled={loading}
                className="w-full mt-3"
                size="sm"
              >
                {loading ? 'Skapar...' : 'Skapa katalog'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Teori Tables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Teori-tabeller
            </CardTitle>
            {getStatusBadge(status.teoriTables)}
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Databastabeller för teorilektioner och bokningar
            </CardDescription>
            <div className="mt-4 flex items-center gap-2">
              {getStatusIcon(status.teoriTables)}
              <span className="text-sm">
                {status.teoriTables ? 'Tabeller finns' : 'Tabeller saknas'}
              </span>
            </div>
            {!status.teoriTables && (
              <Button
                onClick={runTeoriMigration}
                disabled={loading}
                className="w-full mt-3"
                size="sm"
              >
                {loading ? 'Kör migrering...' : 'Kör Teori-migrering'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Teori Sample Data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Teori-exempeldata
            </CardTitle>
            {getStatusBadge(status.teoriSampleData)}
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Exempellektionstyper och sessioner för testning
            </CardDescription>
            <div className="mt-4 flex items-center gap-2">
              {getStatusIcon(status.teoriSampleData)}
              <span className="text-sm">
                {status.teoriSampleData ? 'Data finns' : 'Data saknas'}
              </span>
            </div>
            {!status.teoriSampleData && status.teoriTables && (
              <Button
                onClick={createTeoriSampleData}
                disabled={loading}
                className="w-full mt-3"
                size="sm"
              >
                {loading ? 'Skapar...' : 'Skapa exempeldata'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Nästa steg</CardTitle>
          <CardDescription>
            Vad du kan göra när CMS-systemet är konfigurerat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <ArrowRight className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-semibold text-blue-900">Redigera sidor</h3>
              <p className="text-sm text-blue-700">Gå till Sidredigerare för att skapa och redigera innehåll</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <ArrowRight className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-900">Anpassa menyn</h3>
              <p className="text-sm text-green-700">Gå till Menyredigerare för att ordna menyobjekt</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <ArrowRight className="w-5 h-5 text-purple-500" />
            <div>
              <h3 className="font-semibold text-purple-900">Ladda upp bilder</h3>
              <p className="text-sm text-purple-700">Använd bilduppladdning i TinyMCE för att lägga till media</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
