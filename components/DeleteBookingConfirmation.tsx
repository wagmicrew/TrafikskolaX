import React from 'react';

interface DeleteBookingConfirmationProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteBookingConfirmation: React.FC<DeleteBookingConfirmationProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-80 p-6">
        <h3 className="text-lg font-medium mb-4">Är du säker?</h3>
        <p>Vill du verkligen ta bort denna bokning?</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring focus:ring-gray-200"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring focus:ring-red-200"
          >
            Ta bort
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookingConfirmation;
