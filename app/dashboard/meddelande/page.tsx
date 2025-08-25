'use client';

import React from 'react';
import { FaEnvelope } from 'react-icons/fa';

function MessagesPage() {
  return (
    <div className="min-h-[60vh] w-full p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <FaEnvelope className="text-blue-600 h-6 w-6" />
            <h1 className="text-2xl font-bold text-gray-900">Meddelanden är avvecklade</h1>
          </div>
          <p className="text-gray-700">
            Den interna meddelandefunktionen har tagits bort. Vi använder nu endast e-post för
            all kommunikation. Behöver du kontakta oss eller bli notifierad om teorisessioner,
            vänligen använd e-postmeddelanden.
          </p>
          <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-1">
            <li>För teoriförfrågningar används e-postutskick baserat på en mall.</li>
            <li>Vid frågor, kontakta skolan via e-post.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;

