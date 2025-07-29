"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Edit, Save, RotateCcw, Info, Calendar, Plus, Minus, Trash2, CreditCard } from "lucide-react";

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
  };
}

export default function UserDetailClient({ user }: UserDetailProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(user);
  const router = useRouter();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
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

  return (
<div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <User className="w-6 h-6 text-blue-500" /> Användaruppgifter
      </h2>

      {/* Password input */}
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
  );
}
