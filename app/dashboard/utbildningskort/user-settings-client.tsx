'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';

// TypeScript interfaces
interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
}

interface UserFeedback {
  [key: string]: {
    valuation: number;
    comment?: string;
  };
}

interface EducationStep {
  id: string;
  category: string;
  subcategory: string;
  description: string;
}

const UserSettingsClient = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<UserFormData>({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<UserFeedback>({});
  const [steps, setSteps] = useState<EducationStep[]>([]);

  useEffect(() => {
    // Fetch user feedback when component mounts
    if (user) { 
      const fetchFeedback = async () => {
        try {
          const token = localStorage.getItem('auth-token');
          const response = await fetch('/api/user/feedback', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setFeedback(data);
          } else {
            console.error('Failed to fetch feedback', response.statusText);
          }
        } catch (error) {
          console.error('Failed to fetch feedback', error);
        }
      };

      // Fetch education steps (assuming it's an API endpoint)
      const fetchEducationSteps = async () => {
        try {
          const token = localStorage.getItem('auth-token');
          const response = await fetch('/api/education/steps', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setSteps(data);
          } else {
            console.error('Failed to fetch education steps', response.statusText);
          }
        } catch (error) {
          console.error('Failed to fetch education steps', error);
        }
      };

      fetchFeedback();
      fetchEducationSteps();
    }
  }, [user]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAvatar(event.target.files[0]);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (response.ok) {
        setMessage('Profile updated successfully!');
      } else {
        console.error('Failed to update profile', response.statusText);
        setMessage('Failed to update profile.');
      }
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatar) return;

    const formData = new FormData();
    formData.append('avatar', avatar);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        // Note: setUser is not available in the current useAuth hook
        // const data = await response.json();
        // setUser({ ...user, profileImage: data.avatarUrl });
        setMessage('Avatar uploaded successfully!');
      } else {
        console.error('Failed to upload avatar', response.statusText);
        setMessage('Failed to upload avatar.');
      }
    } catch (error) {
      console.error('Failed to upload avatar', error);
      setMessage('Failed to upload avatar.');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-lg mx-auto bg-white p-5 rounded-lg shadow-md">
      {message && <div className="mb-4 text-center text-green-500">{message}</div>}
      <form onSubmit={handleFormSubmit}>
        <div className="mb-4">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded mt-4"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
      <div className="mt-6">
        <label>Profile Image</label>
        <input type="file" onChange={handleAvatarChange} accept="image/jpeg, image/png" />
        <button
          onClick={handleAvatarUpload}
          className="w-full bg-gray-500 text-white p-2 rounded mt-4"
          disabled={!avatar}
        >
          Upload Avatar
        </button>
      </div>
      
      {/* Education Steps Infographic Section */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Utbildningssteg</h2>
        {loading && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}
        {!loading && steps.map((step: EducationStep) => (
          <div
            className="flex items-center justify-between p-4 mb-2 border rounded"
            key={step.id}
          >
            <div>
              <h4 className="text-lg font-semibold">
                {step.category} - {step.subcategory}
              </h4>
              <p className="text-gray-600">{step.description}</p>
            </div>
            {feedback[step.id] && (
              <div className="flex items-center">
                {feedback[step.id].valuation >= 8 && (
                  <span className="text-green-500 text-2xl">✔️</span>
                )}
                {feedback[step.id].valuation >= 5 &&
                  feedback[step.id].valuation < 8 && (
                    <span className="text-yellow-500 text-2xl">⭐</span>
                  )}
                {feedback[step.id].valuation < 5 && (
                  <span className="text-red-500 text-2xl">❌</span>
                )}
              </div>
            )}
          </div>
        ))}
      </section>
      
      <div className="mt-6 border-t-2 pt-6">
        {/* General Actions */}
        <div className="flex items-center justify-end">
          <Button
            onClick={() => handleFormSubmit({} as React.FormEvent<HTMLFormElement>)}
            disabled={loading}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            {loading ? 'Sparar...' : 'Spara alla ändringar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsClient;
