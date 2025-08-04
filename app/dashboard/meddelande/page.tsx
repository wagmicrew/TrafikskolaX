'use client';

import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPaperPlane, FaInbox, FaEdit, FaUserFriends, FaUserShield, FaUserGraduate, FaTrash } from 'react-icons/fa';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/loading-spinner';
import { refreshGlobalUnreadCount } from '@/lib/hooks/use-messages';

// Simple toast implementation
const useToast = () => {
  const addToast = ({ type, message }: { type: 'success' | 'error'; message: string }) => {
    if (type === 'success') {
      alert(`✅ ${message}`);
    } else {
      alert(`❌ ${message}`);
    }
  };
  return { addToast };
};

interface Message {
  id: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  fromUserId: string;
  toUserId: string;
  senderFirstName: string;
  senderLastName: string;
  senderEmail: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
}

function MessagesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Compose form state
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchRecipients();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages?type=received');
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const response = await fetch('/api/teachers'); // Changed to /api/teachers
      if (!response.ok) {
        throw new Error('Failed to fetch recipients');
      }
      const data = await response.json();
      setRecipients(data.teachers);
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
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
      const response = await fetch(`/api/messages/${messageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isRead: true }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      
      // Refresh global unread count
      refreshGlobalUnreadCount();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead && message.toUserId === (user.userId || user.id)) {
      markAsRead(message.id);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setRecipientId(message.fromUserId);
    setSubject(`Re: ${message.subject}`);
    setMessage(`\n\n--- Ursprungligt meddelande ---\nFrån: ${message.senderFirstName} ${message.senderLastName}\nÄmne: ${message.subject}\n\n${message.message}`);
    setActiveTab('compose');
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Är du säker på att du vill radera detta meddelande?')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      
      addToast({ type: 'success', message: 'Meddelandet har raderats!' });
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setSelectedMessage(null);
      // Refresh global unread count
      refreshGlobalUnreadCount();
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte radera meddelandet.' });
      console.error('Error deleting message:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="inline-block text-red-500" />;
      case 'teacher':
        return <FaUserGraduate className="inline-block text-blue-500" />;
      default:
        return <FaUserFriends className="inline-block text-gray-500" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaEnvelope className="text-blue-600" /> Meddelanden
            </h1>
            <p className="text-gray-600 mt-2">Här kan du se och skicka meddelanden till andra användare.</p>
          </div>

          <div className="p-6">
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
                  Inkorg ({messages.filter(m => !m.isRead && m.toUserId === (user.userId || user.id)).length})
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
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Dina Meddelanden
                      </h3>
                    </div>
                    <div>
                      {messages.length === 0 ? (
                        <div className="p-4">
                          <p className="text-gray-500">Inga nya meddelanden</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {messages.map((msg) => (
                            <li 
                              key={msg.id} 
                              className={`relative p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
                              } ${
                                !msg.isRead && msg.toUserId === (user.userId || user.id) 
                                  ? 'border-l-4 border-l-green-500 bg-green-50' 
                                  : 'border-l-4 border-l-gray-200'
                              }`}
                              onClick={() => handleMessageClick(msg)}
                            >
                              <div className="flex items-center justify-between">
                                <p className={`text-sm truncate ${
                                  !msg.isRead && msg.toUserId === (user.userId || user.id) ? 'font-bold text-gray-900' : 'font-medium text-gray-600'
                                }`}>
                                  {msg.subject}
                                </p>
                                <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                                  {!msg.isRead && msg.toUserId === (user.userId || user.id) && (
                                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                  )}
                                  {msg.isRead && msg.toUserId === (user.userId || user.id) && (
                                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                <p>Från: {msg.senderFirstName} {msg.senderLastName}</p>
                                <p>{new Date(msg.createdAt).toLocaleString('sv-SE')}</p>
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
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {selectedMessage.subject}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Från: {selectedMessage.senderFirstName} {selectedMessage.senderLastName} • {new Date(selectedMessage.createdAt).toLocaleString('sv-SE')}
                        </p>
                      </div>
                      <div className="p-4">
                        <div className="prose max-w-none text-gray-800">
                          <div 
                            dangerouslySetInnerHTML={{ __html: selectedMessage.message }}
                            style={{ whiteSpace: 'pre-wrap' }}
                            className="message-content"
                          />
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
                          <button
                            onClick={() => handleReply(selectedMessage)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                          >
                            <FaEdit className="w-4 h-4" />
                            Svara
                          </button>
                          <button
                            onClick={() => handleDelete(selectedMessage.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
                          >
                            <FaTrash className="w-4 h-4" />
                            Radera
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                      <FaEnvelope className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>Välj ett meddelande för att läsa det</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compose Tab */}
            {activeTab === 'compose' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {replyingTo ? 'Svara på meddelande' : 'Skriv nytt meddelande'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {replyingTo 
                      ? `Svarar till ${replyingTo.senderFirstName} ${replyingTo.senderLastName}` 
                      : 'Skicka ett meddelande till en annan användare'
                    }
                  </p>
                  {replyingTo && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setRecipientId('');
                        setSubject('');
                        setMessage('');
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Avbryt svar - Skriv nytt meddelande istället
                    </button>
                  )}
                </div>
                <form onSubmit={handleComposeSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
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
                      {recipients.map(recipient => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.name} ({recipient.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
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

                  <div className="flex justify-end space-x-4">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;

