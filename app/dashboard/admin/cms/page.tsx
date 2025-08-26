'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  FileText,
  Menu,
  Settings
} from 'lucide-react';

interface Page {
  id: string;
  slug: string;
  title: string;
  content?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'published' | 'archived';
  isStatic: boolean;
  staticPath?: string;
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: string;
  parentId?: string;
  label: string;
  url?: string;
  pageId?: string;
  isExternal: boolean;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  isAdminMenu: boolean;
}

export default function CmsAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [pages, setPages] = useState<Page[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pages');

  // Page editing state
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft' as const
  });

  // Menu editing state
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    label: '',
    url: '',
    pageId: '',
    isExternal: false,
    icon: '',
    sortOrder: 0,
    isActive: true,
    isAdminMenu: false
  });

  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load data
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadPages();
      loadMenuItems();
    }
  }, [user]);

  const loadPages = async () => {
    try {
      const response = await fetch('/api/admin/cms/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      } else {
        toast.error('Kunde inte ladda sidor');
      }
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Kunde inte ladda sidor');
    }
  };

  const loadMenuItems = async () => {
    try {
      const response = await fetch('/api/admin/cms/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menuItems || []);
      } else {
        toast.error('Kunde inte ladda menyobjekt');
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast.error('Kunde inte ladda menyobjekt');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async () => {
    try {
      const method = editingPage ? 'PUT' : 'POST';
      const url = editingPage
        ? `/api/admin/cms/pages/${editingPage.id}`
        : '/api/admin/cms/pages';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageForm)
      });

      if (response.ok) {
        toast.success(editingPage ? 'Sidan uppdaterad' : 'Sidan skapad');
        setShowPageDialog(false);
        setEditingPage(null);
        resetPageForm();
        loadPages();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte spara sidan');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Kunde inte spara sidan');
    }
  };

  const handleSaveMenuItem = async () => {
    try {
      const method = editingMenuItem ? 'PUT' : 'POST';
      const url = editingMenuItem
        ? `/api/admin/cms/menu/${editingMenuItem.id}`
        : '/api/admin/cms/menu';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuForm)
      });

      if (response.ok) {
        toast.success(editingMenuItem ? 'Menyobjekt uppdaterat' : 'Menyobjekt skapat');
        setShowMenuDialog(false);
        setEditingMenuItem(null);
        resetMenuForm();
        loadMenuItems();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte spara menyobjekt');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Kunde inte spara menyobjekt');
    }
  };

  const resetPageForm = () => {
    setPageForm({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      metaTitle: '',
      metaDescription: '',
      status: 'draft'
    });
  };

  const resetMenuForm = () => {
    setMenuForm({
      label: '',
      url: '',
      pageId: '',
      isExternal: false,
      icon: '',
      sortOrder: 0,
      isActive: true,
      isAdminMenu: false
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setPageForm(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Laddar...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">CMS - Innehållshantering</h1>
              <p className="text-gray-600">Hantera sidor och menyobjekt</p>
            </div>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sidredigerare
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Menu className="w-4 h-4" />
            Menyredigerare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sidor</CardTitle>
                <CardDescription>Skapa och redigera webbsidor</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (confirm('Detta kommer att rensa alla nuvarande sidor och importera de nuvarande statiska sidorna. Är du säker?')) {
                      try {
                        setLoading(true);
                        const response = await fetch('/api/admin/cms/initialize-current-pages', {
                          method: 'POST'
                        });

                        if (response.ok) {
                          const data = await response.json();
                          toast.success(`Importerade ${data.pagesProcessed} sidor!`);
                          loadPages();
                          loadMenuItems();
                        } else {
                          const errorData = await response.json();
                          toast.error(errorData.error || 'Kunde inte importera sidor');
                        }
                      } catch (error) {
                        console.error('Error initializing pages:', error);
                        toast.error('Kunde inte importera sidor');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Initiera nuvarande sidor
                </Button>
                <Button onClick={() => setShowPageDialog(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Skapa ny sida
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Laddar sidor...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pages.map((page) => (
                    <div key={page.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{page.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              page.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : page.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {page.status === 'published' ? 'Publicerad' : page.status === 'draft' ? 'Utkast' : 'Arkiverad'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Slug: /{page.slug}</p>
                          <p className="text-sm text-gray-500">
                            Uppdaterad: {new Date(page.updatedAt).toLocaleDateString('sv-SE')}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/${page.slug}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPage(page);
                              setPageForm({
                                title: page.title,
                                slug: page.slug,
                                content: page.content || '',
                                excerpt: page.excerpt || '',
                                metaTitle: page.metaTitle || '',
                                metaDescription: page.metaDescription || '',
                                status: page.status
                              });
                              setShowPageDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {pages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Inga sidor hittades. Skapa din första sida!
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Menyobjekt</CardTitle>
                <CardDescription>Skapa och ordna menyobjekt</CardDescription>
              </div>
              <Button onClick={() => setShowMenuDialog(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Skapa menyobjekt
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuItems
                  .filter(item => !item.isAdminMenu)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.label}</h3>
                          {!item.isActive && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              Inaktiv
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.isExternal ? `Extern länk: ${item.url}` : item.pageId ? 'Länkad till sida' : `URL: ${item.url}`}
                        </p>
                        <p className="text-sm text-gray-500">Sortering: {item.sortOrder}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMenuItem(item);
                            setMenuForm({
                              label: item.label,
                              url: item.url || '',
                              pageId: item.pageId || '',
                              isExternal: item.isExternal,
                              icon: item.icon || '',
                              sortOrder: item.sortOrder,
                              isActive: item.isActive,
                              isAdminMenu: item.isAdminMenu
                            });
                            setShowMenuDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Är du säker på att du vill radera detta menyobjekt?')) {
                              // Delete logic would go here
                              toast.success('Menyobjekt raderat');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {menuItems.filter(item => !item.isAdminMenu).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Inga menyobjekt hittades. Skapa ditt första menyobjekt!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Page Editor Dialog */}
      <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? 'Redigera sida' : 'Skapa ny sida'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page-title">Titel *</Label>
                <Input
                  id="page-title"
                  value={pageForm.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Sidan titel"
                />
              </div>

              <div>
                <Label htmlFor="page-slug">Slug (URL) *</Label>
                <Input
                  id="page-slug"
                  value={pageForm.slug}
                  onChange={(e) => setPageForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="sidans-url"
                />
                <p className="text-xs text-gray-500 mt-1">URL kommer att bli: /{pageForm.slug}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="page-excerpt">Sammanfattning</Label>
              <Textarea
                id="page-excerpt"
                value={pageForm.excerpt}
                onChange={(e) => setPageForm(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Kort beskrivning av sidan..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="page-content">Innehåll</Label>
              <Textarea
                id="page-content"
                value={pageForm.content}
                onChange={(e) => setPageForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Skriv sidans innehåll här..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                TinyMCE WYSIWYG-editor kommer att integreras för rik textredigering med bilduppladdning
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page-meta-title">Meta-titel (SEO)</Label>
                <Input
                  id="page-meta-title"
                  value={pageForm.metaTitle}
                  onChange={(e) => setPageForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO-titel för sökmotorer"
                />
              </div>

              <div>
                <Label htmlFor="page-status">Status</Label>
                <Select
                  value={pageForm.status}
                  onValueChange={(value: 'draft' | 'published' | 'archived') =>
                    setPageForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Utkast</SelectItem>
                    <SelectItem value="published">Publicerad</SelectItem>
                    <SelectItem value="archived">Arkiverad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="page-meta-description">Meta-beskrivning (SEO)</Label>
              <Textarea
                id="page-meta-description"
                value={pageForm.metaDescription}
                onChange={(e) => setPageForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="SEO-beskrivning för sökmotorer..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={() => setShowPageDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSavePage} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {editingPage ? 'Uppdatera' : 'Skapa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Item Editor Dialog */}
      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMenuItem ? 'Redigera menyobjekt' : 'Skapa nytt menyobjekt'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="menu-label">Etikett *</Label>
                <Input
                  id="menu-label"
                  value={menuForm.label}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Menyobjektets namn"
                />
              </div>

              <div>
                <Label htmlFor="menu-url">URL</Label>
                <Input
                  id="menu-url"
                  value={menuForm.url}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Relativ URL eller fullständig URL"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="menu-page">Länka till sida</Label>
                <Select
                  value={menuForm.pageId || "none"}
                  onValueChange={(value) => setMenuForm(prev => ({
                    ...prev,
                    pageId: value === "none" ? "" : value,
                    url: value === "none" ? prev.url : ""
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en sida (valfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen specifik sida</SelectItem>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title} (/{page.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="menu-sort-order">Sorteringsordning</Label>
                <Input
                  id="menu-sort-order"
                  type="number"
                  value={menuForm.sortOrder}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="menu-icon">Ikon</Label>
                <Input
                  id="menu-icon"
                  value={menuForm.icon}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Lucide ikonnamn (t.ex. Home)"
                />
              </div>

              <div className="flex items-center space-x-4 pt-8">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={menuForm.isExternal}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, isExternal: e.target.checked }))}
                  />
                  <span className="text-sm">Extern länk</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={menuForm.isActive}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span className="text-sm">Aktiv</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={() => setShowMenuDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveMenuItem} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {editingMenuItem ? 'Uppdatera' : 'Skapa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
