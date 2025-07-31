"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Edit, Save, RotateCcw, Info, Calendar, Plus, Minus, Trash2, CreditCard, Key } from "lucide-react";
import { toast } from "react-hot-toast";

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
    password?: string;
    confirmPassword?: string;
  };
}

export default function UserDetailClient({ user }: UserDetailProps) {
  const [formData, setFormData] = useState(user);
  const [changesMade, setChangesMade] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(user);
  const router = useRouter();

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setChangesMade(true);
    const target = event.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

const handleSave = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Användaruppgifter sparade framgångsrikt!");
        setEditMode(false);
        router.refresh();
      } else {
        alert("Ett fel uppstod vid sparande av användaruppgifter");
      }
    } catch (error) {
      alert("Ett fel uppstod vid sparande av användaruppgifter");
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
        alert(`Nytt lösenord genererat: ${result.password}\n\nOBS: Spara detta lösenord säkert!`);
      } else {
        alert("Ett fel uppstod vid generering av lösenord");
      }
    } catch (error) {
      alert("Ett fel uppstod vid generering av lösenord");
    }
  };

const handlePasswordChange = async () => {
    if (!formData.password || formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await handleSave();
      toast.success("Password changed successfully");
    } catch {
      toast.error("Failed to change password");
    }
  };

return (
    <>
      <div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <User className="w-6 h-6 text-blue-500" /> Användaruppgifter
      </h2>

      {/* Password Reset */}
      <div className="flex gap-4 mb-4">
        <input
          type="password"
          name="password"
          placeholder="Enter new password"
          value={formData.password || ''}
          onChange={handleInputChange}
          className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={formData.confirmPassword || ''}
          onChange={handleInputChange}
          className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
        />
        <button
          onClick={handlePasswordChange}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          <Key className="w-4 h-4 inline" /> Save Password
        </button>
      </div>
      {editMode && (<div className="flex gap-4 mb-4">
        <input
          type="password"
          name="password"
          placeholder="Nytt lösenord"
          onChange={handleInputChange}
          className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Bekräfta lösenord"
          onChange={handleInputChange}
          className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
        />
      </div>)}
      
      {/* Inskriven toggle */}
      {editMode && (<div className="flex gap-4 mb-4">
        <label className="font-semibold">Skriv in?</label>
        <input
          type="checkbox"
          name="inskriven"
          checked={formData.inskriven}
          onChange={handleInputChange}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
      </div>)}
      
      {/* Booking */}
      <div className="mb-4">
        <button
          onClick={() => router.push(`/dashboard/admin/bookings?user=${user.id}`)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mr-2"
        >
          <Calendar className="w-4 h-4 inline mr-1" /> Boka för användare
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        {editMode ? (
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
          />
        ) : (
          <p className="font-semibold">{user.firstName}</p>
        )}

        {editMode ? (
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
          />
        ) : (
          <p className="font-semibold">{user.lastName}</p>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <Mail className="w-5 h-5 text-gray-400" />
        {editMode ? (
          <input
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
          />
        ) : (
          <p>{user.email}</p>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <label htmlFor="role" className="font-semibold">Roll:</label>
        {editMode ? (
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="border-b border-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="student">Student</option>
            <option value="teacher">Lärare</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span>{user.role}</span>
        )}
      </div>

      {editMode && (
        <div className="flex gap-4">
          <button
            onClick={handleGeneratePassword}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
          >
            Generera lösenord
          </button>
        </div>
      )}

    {changesMade && (
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mb-4"
      >
        Save Changes
      </button>
    )}

    <div className="mt-6 flex gap-4">
        {editMode ? (
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Spara
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Redigera
          </button>
        )}
        {editMode && (
          <button
            onClick={() => {
              setEditMode(false);
              setFormData(user);
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Avbryt
          </button>
        )}
      </div>
    </div>

    {/* Utbildningskort B Section */}
    <div className="p-4 bg-white shadow-lg rounded-lg mt-8">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-blue-500" /> Utbildningskort B
      </h3>
      
      {/* User Info with Avatar */}
      <div className="flex items-center mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 mr-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-gray-300 overflow-hidden border-4 border-white shadow-lg">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-2xl font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            )}
          </div>
        </div>
        <div>
          <h4 className="font-bold text-xl text-gray-800">{user.firstName} {user.lastName}</h4>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-500 mt-1">Personnummer: {editMode ? (
            <input
              type="text"
              name="personalNumber"
              placeholder="ÅÅÅÅMMDD-XXXX"
              value={formData.personalNumber || ''}
              onChange={handleInputChange}
              className="border-b border-gray-300 focus:outline-none focus:border-blue-500 ml-2"
            />
          ) : (
            <span>{user.personalNumber || 'Ej angivet'}</span>
          )}</p>
        </div>
      </div>

      {/* Education Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 mb-3">Teoretisk utbildning</h4>
          
          {/* Riskutbildning 1 */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mr-3">
              {formData.riskEducation1 ? (
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 bg-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Riskutbildning 1</p>
              {editMode ? (
                <input
                  type="date"
                  name="riskEducation1"
                  value={formData.riskEducation1 || ''}
                  onChange={handleInputChange}
                  className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {formData.riskEducation1 ? `Genomförd: ${formData.riskEducation1}` : 'Ej genomförd'}
                </p>
              )}
            </div>
          </div>

          {/* Riskutbildning 2 */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mr-3">
              {formData.riskEducation2 ? (
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 bg-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Riskutbildning 2</p>
              {editMode ? (
                <input
                  type="date"
                  name="riskEducation2"
                  value={formData.riskEducation2 || ''}
                  onChange={handleInputChange}
                  className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {formData.riskEducation2 ? `Genomförd: ${formData.riskEducation2}` : 'Ej genomförd'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 mb-3">Examination</h4>
          
          {/* Kunskapsprov */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mr-3">
              {formData.knowledgeTest ? (
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 bg-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Kunskapsprov</p>
              {editMode ? (
                <input
                  type="date"
                  name="knowledgeTest"
                  value={formData.knowledgeTest || ''}
                  onChange={handleInputChange}
                  className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {formData.knowledgeTest ? `Godkänd: ${formData.knowledgeTest}` : 'Ej avlagt'}
                </p>
              )}
            </div>
          </div>

          {/* Körprov */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mr-3">
              {formData.drivingTest ? (
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 bg-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Körprov</p>
              {editMode ? (
                <input
                  type="date"
                  name="drivingTest"
                  value={formData.drivingTest || ''}
                  onChange={handleInputChange}
                  className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {formData.drivingTest ? `Godkänd: ${formData.drivingTest}` : 'Ej avlagt'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Notes Section */}
      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-700 mb-3">Lärarens anteckningar</h4>
        {editMode ? (
          <textarea
            name="teacherNotes"
            value={formData.teacherNotes || ''}
            onChange={handleInputChange}
            placeholder="Lägg till anteckningar om elevens framsteg..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            rows={4}
          />
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
            <p className="text-gray-700">{formData.teacherNotes || 'Inga anteckningar tillagda.'}</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
