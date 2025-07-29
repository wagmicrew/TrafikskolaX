"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/lib/hooks/use-toast';

function MessageComposer() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await axios.post('/api/messages', { recipientId, subject, message });
      addToast({ type: 'success', message: 'Meddelandet har skickats!' });
      setRecipientId('');
      setSubject('');
      setMessage('');
    } catch (error) {
      addToast({ type: 'error', message: 'Misslyckades att skicka meddelandet.' });
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            {/* Options fetched via API or context state */}
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
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={sending}
          >
            {sending ? 'Skickar...' : 'Skicka Meddelande'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageComposer;
