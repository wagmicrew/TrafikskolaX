"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, CreditCard, Key, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import TestEmailButton from '@/components/admin/TestEmailButton';

interface UserDetailProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "student" | "teacher" | "admin";
    isActive: boolean;
    inskriven: boolean;
    inskrivenDate: string | null;
    customPrice: string | null;
    bookingCount: number;
    profileImage?: string;
    personalNumber?: string;
    riskEducation1?: string;
    riskEducation2?: string;
    knowledgeTest?: string;
    drivingTest?: string;
    teacherNotes?: string;
  };
}

export default function UserDetailClient({ user }: UserDetailProps) {
  const [formData, setFormData] = useState(user);
  const [originalData, setOriginalData] = useState(user);
  const [passwordData, setPasswordData] = useState({ password: "", confirmPassword: "" });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const router = useRouter();

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  const handlePasswordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Användaruppgifter sparade!");
        setOriginalData(formData);
        router.refresh();
      } else {
        toast.error("Ett fel uppstod vid sparande");
      }
    } catch (error) {
      toast.error("Ett fel uppstod vid sparande");
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordData.password) {
      toast.error("Ange ett lösenord");
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error("Lösenorden matchar inte!");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, password: passwordData.password }),
      });

      if (response.ok) {
        toast.success("Lösenord uppdaterat!");
        setPasswordData({ password: "", confirmPassword: "" });
        setShowPasswordReset(false);
      } else {
        toast.error("Ett fel uppstod vid sparande av lösenord");
      }
    } catch (error) {
      toast.error("Ett fel uppstod vid sparande av lösenord");
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const response = await fetch('/api/admin/users/generate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Nytt lösenord: ${result.password}`, { duration: 10000 });
      } else {
        toast.error("Ett fel uppstod vid generering av lösenord");
      }
    } catch (error) {
      toast.error("Ett fel uppstod vid generering av lösenord");
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-blue-500" /> Utbildningskort
      </h1>
      
      {/* User Info with Avatar */}
      <div className="flex items-center mb-8 p-6 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg">
        <div className="flex-shrink-0 mr-6">
          <div className="h-32 w-32 rounded-full bg-gray-300 overflow-hidden border-4 border-white shadow-lg">
            {formData.profileImage ? (
              <img src={formData.profileImage} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-3xl font-bold">
                {formData.firstName?.[0]}{formData.lastName?.[0]}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
              placeholder="Förnamn"
            />
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
              placeholder="Efternamn"
            />
          </div>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-2 text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
            placeholder="E-post"
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Personnummer:</span>
            <input
              type="text"
              name="personalNumber"
              placeholder="ÅÅÅÅMMDD-XXXX"
              value={formData.personalNumber || ''}
              onChange={handleInputChange}
              className="text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* User Details Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" /> Användaruppgifter
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roll</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Lärare</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="inskriven"
              checked={formData.inskriven}
              onChange={handleInputChange}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Inskriven</label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={() => router.push(`/dashboard/admin/bookings?user=${user.id}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Boka för användare
          </button>
          
          <button
            onClick={() => setShowPasswordReset(!showPasswordReset)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <Key className="w-4 h-4" /> Återställ lösenord
          </button>

          <TestEmailButton 
            userId={user.id}
            userEmail={formData.email}
            userName={`${formData.firstName} ${formData.lastName}`}
            variant="outline"
            size="sm"
          />
        </div>

        {/* Password Reset Section */}
        {showPasswordReset && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="password"
                name="password"
                placeholder="Nytt lösenord"
                value={passwordData.password}
                onChange={handlePasswordInputChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Bekräfta lösenord"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-3 flex gap-3">
              <button
                onClick={handlePasswordSave}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Key className="w-4 h-4" /> Spara lösenord
              </button>
              <button
                onClick={handleGeneratePassword}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Generera lösenord
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Education Progress Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Utbildningsstatus</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Teoretisk utbildning</h4>
            
            {/* Riskutbildning 1 */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mr-4">
                {formData.riskEducation1 ? (
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Riskutbildning 1</p>
                <input
                  type="date"
                  name="riskEducation1"
                  value={formData.riskEducation1 || ''}
                  onChange={handleInputChange}
                  className="mt-1 text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Riskutbildning 2 */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mr-4">
                {formData.riskEducation2 ? (
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Riskutbildning 2</p>
                <input
                  type="date"
                  name="riskEducation2"
                  value={formData.riskEducation2 || ''}
                  onChange={handleInputChange}
                  className="mt-1 text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Examination</h4>
            
            {/* Kunskapsprov */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mr-4">
                {formData.knowledgeTest ? (
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Kunskapsprov</p>
                <input
                  type="date"
                  name="knowledgeTest"
                  value={formData.knowledgeTest || ''}
                  onChange={handleInputChange}
                  className="mt-1 text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Körprov */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mr-4">
                {formData.drivingTest ? (
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Körprov</p>
                <input
                  type="date"
                  name="drivingTest"
                  value={formData.drivingTest || ''}
                  onChange={handleInputChange}
                  className="mt-1 text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Notes Section */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">Lärarens anteckningar</h4>
        <textarea
          name="teacherNotes"
          value={formData.teacherNotes || ''}
          onChange={handleInputChange}
          placeholder="Lägg till anteckningar om elevens framsteg..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Save Button - Only shows when there are changes */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold"
          >
            Spara ändringar
          </button>
        </div>
      )}
    </div>
  );
}
