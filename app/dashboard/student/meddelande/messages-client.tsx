"use client";

import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaEye, FaPaperPlane, FaInbox, FaEdit } from 'react-icons/fa';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/lib/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';

interface Message {
  id: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  senderEmail: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
}

function MessagesClient() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Compose form state
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchTeachers();
  }, [user]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages?type=all');
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      addToast({ type: 'error', message: 'Kunde inte hämta meddelanden.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      const data = await response.json();
      setTeachers(data.teachers);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId, subject, message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      addToast({ type: 'success', message: 'Meddelandet har skickats!' });
      setRecipientId('');
      setSubject('');
      setMessage('');
      setActiveTab('inbox');
      fetchMessages(); // Refresh messages
    } catch (error) {
      addToast({ type: 'error', message: 'Misslyckades att skicka meddelandet.' });
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      addToast({ type: 'success', message: 'Meddelandet har tagits bort.' });
    } catch (error) {
      console.error('Failed to delete message:', error);
      addToast({ type: 'error', message: 'Kunde inte ta bort meddelandet.' });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inbox'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaInbox className="inline mr-2" />
            Inkorg ({messages.filter(m => !m.isRead).length})
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compose'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaEdit className="inline mr-2" />
            Skriv nytt
          </button>
        </nav>
      </div>

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Dina Meddelanden
                </h3>
              </div>
              <div className="border-t border-gray-200">
                {messages.length === 0 ? (
                  <div className="p-4">
                    <p className="text-gray-500">Inga nya meddelanden</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {messages.map((msg) => (
                      <li 
                        key={msg.id} 
                        className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 ${
                          selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleMessageClick(msg)}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${
                            !msg.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'
                          }`}>
                            {msg.subject}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            {!msg.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Från: {msg.senderName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Message Details */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedMessage.subject}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Från: {selectedMessage.senderName} • {new Date(selectedMessage.createdAt).toLocaleDateString('sv-SE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Är du säker på att du vill ta bort detta meddelande?')) {
                          deleteMessage(selectedMessage.id);
                        }
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <div className="prose max-w-none">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                  <FaEnvelope className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Välj ett meddelande för att läsa det</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Skriv nytt meddelande
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Skicka ett meddelande till dina lärare
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
                  Mottagare
                </label>
                <select
                  name="recipient"
                  id="recipient"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  required
                >
                  <option value="" disabled>Välj en mottagare</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.role === 'admin' ? 'Administratör' : 'Lärare'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Ämne
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Meddelande
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={8}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={sending}
                >
                  <FaPaperPlane className="mr-2 h-4 w-4" />
                  {sending ? 'Skickar...' : 'Skicka Meddelande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesClient;
