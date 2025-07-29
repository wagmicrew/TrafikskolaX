'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Package,
  Pencil,
  CheckSquare,
  XSquare,
} from 'lucide-react';

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  priceStudent: string | null;
  salePrice: string | null;
  isActive: boolean;
  bookingCount: number;
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: string;
  priceStudent: string | null;
  salePrice: string | null;
  isActive: boolean;
  purchaseCount: number;
}

interface LessonStats {
  totalLessons: number;
  activeLessons: number;
  totalPackages: number;
  activePackages: number;
}

interface LessonsClientProps {
  lessons: Lesson[];
  packages: Package[];
  stats: LessonStats;
}

export default function LessonsClient({ lessons, packages, stats }: LessonsClientProps) {
  const [showActive, setShowActive] = useState(true);

  const filteredLessons = lessons.filter(l => l.isActive === showActive);
  const filteredPackages = packages.filter(p => p.isActive === showActive);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-600" /> Lektioner &amp; Paket
        </h1>

        <Link
          href="/dashboard/admin/lessons/new"
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Pencil className="w-5 h-5" /> Lägg till Ny
        </Link>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowActive(!showActive)}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          {showActive ? 'Visa Inaktiva' : 'Visa Aktiva'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map(lesson => (
          <div key={lesson.id} className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> {lesson.name}
            </h3>
            <p>{lesson.description}</p>
            <div className="mt-2">
              <span className="text-sm">Pris: {lesson.price} SEK</span>
              {lesson.salePrice && <span className="ml-2 text-green-500">({lesson.salePrice} SEK på rea)</span>}
            </div>
            <div className="mt-2 text-right">
              <Link href={`/dashboard/admin/lessons/${lesson.id}`} className="text-blue-600 hover:underline">
                Hantera
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Paket</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPackages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" /> {pkg.name}
              </h3>
              <p>{pkg.description}</p>
              <div className="mt-2">
                <span className="text-sm">Pris: {pkg.price} SEK</span>
                {pkg.salePrice && <span className="ml-2 text-green-500">({pkg.salePrice} SEK på rea)</span>}
              </div>
              <div className="mt-2 text-right">
                <Link href={`/dashboard/admin/packages/${pkg.id}`} className="text-blue-600 hover:underline">
                  Hantera
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Totalt Lektioner</span>
          <span className="text-2xl font-bold text-blue-600">{stats.totalLessons}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Aktiva Lektioner</span>
          <span className="text-2xl font-bold text-blue-600">{stats.activeLessons}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Totalt Paket</span>
          <span className="text-2xl font-bold text-blue-600">{stats.totalPackages}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Aktiva Paket</span>
          <span className="text-2xl font-bold text-blue-600">{stats.activePackages}</span>
        </div>
      </div>
    </div>
  );
}

