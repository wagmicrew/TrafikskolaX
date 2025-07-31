'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsClientSimple() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="w-full">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="education">Utbildningskort</TabsTrigger>
          <TabsTrigger value="security">Säkerhet</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <div>Profile content</div>
        </TabsContent>
        <TabsContent value="education">
          <div>Education content</div>
        </TabsContent>
        <TabsContent value="security">
          <div>Security content</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
