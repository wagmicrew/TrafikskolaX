"use client";

import { TeoriSessionsClient } from './teori-sessions-client';

export default function TeoriSessionsPage() {
  return <TeoriSessionsClient />;
}
/*
        body: JSON.stringify({
          lessonTypeId: formData.lessonTypeId,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxParticipants: parseInt(formData.maxParticipants),
          isActive: formData.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Kunde inte spara teorisession');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna teorisession?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teori-sessions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte radera teorisession');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Kunde inte radera teorisession');
    }
  };

  // Handle edit
  const handleEdit = (session: TeoriSession) => {
    setEditingSession(session);
    setFormData({
      lessonTypeId: session.lessonType.id,
      title: session.title,
      description: session.description || '',
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      maxParticipants: session.maxParticipants.toString(),
      isActive: session.isActive
    });
    setDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingSession(null);
    setFormData({
      lessonTypeId: '',
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      maxParticipants: '1',
      isActive: true
    });
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingSession(null);
    resetForm();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Remove seconds
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar teorisessioner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teori Sessioner</h1>
          <p className="text-gray-600 mt-2">Hantera teorisessioner för olika lektionstyper</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Skapa Teorisession
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSession ? 'Redigera Teorisession' : 'Skapa Ny Teorisession'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="lessonTypeId">Lektionstyp *</Label>
                <Select
                  value={formData.lessonTypeId}
                  onValueChange={(value) => setFormData({ ...formData, lessonTypeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj lektionstyp" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - {type.price} SEK
                        {type.allowsSupervisors && ' (med handledare)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="t.ex. Riskettan Teori - Grundkurs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beskrivning av denna teorisession..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startTime">Starttid *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Sluttid *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxParticipants">Max Deltagare</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Aktiv</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingSession ? 'Uppdatera' : 'Skapa'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {session.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={session.isActive ? 'default' : 'secondary'}>
                      {session.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    {session.lessonType.allowsSupervisors && (
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        Med Handledare
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {session.lessonType.name}
                  </CardDescription>
                  {session.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {session.description}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span>{formatDate(session.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>{session.currentParticipants}/{session.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>{session.lessonType.price} SEK</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(session)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Redigera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(session.id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Radera
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Inga teorisessioner än</h3>
          <p className="text-gray-600 mb-4">Skapa din första teorisession för att komma igång</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Skapa Första Teorisession
          </Button>
        </div>
      )/*}
    </div>
  );
}*/
