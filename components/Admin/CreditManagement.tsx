import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface CreditManagementProps {
  userId: string;
}

interface Credit {
  id: string;
  lessonTypeId: string | null;
  handledarSessionId: string | null;
  creditsRemaining: number;
  creditsTotal: number;
  lessonTypeName?: string;
  handledarSessionTitle?: string;
}

const CreditManagement: React.FC<CreditManagementProps> = ({ userId }) => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok) {
        setCredits(data.credits);
      } else {
        toast.error(data.error || 'Failed to fetch credits');
      }
    } catch (error) {
      toast.error('Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredit = async (creditType: string, identifier: string, amount: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditType,
          lessonTypeId: creditType === 'lesson' ? identifier : null,
          handledarSessionId: creditType === 'handledar' ? identifier : null,
          amount,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchCredits();
      } else {
        toast.error(data.error || 'Failed to add credits');
      }
    } catch (error) {
      toast.error('Failed to add credits');
    }
  };

  const handleRemoveCredit = async (creditId: string, amount: number, removeAll: boolean = false) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits?creditsId=${creditId}&amount=${amount}&all=${removeAll}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchCredits();
      } else {
        toast.error(data.error || 'Failed to remove credits');
      }
    } catch (error) {
      toast.error('Failed to remove credits');
    }
  };

  return (
    <div>
      <h2>Manage Credits</h2>
      {loading ? (
        <p>Loading credits...</p>
      ) : (
        <div>
          <ul>
            {credits.map(credit => (
              <li key={credit.id}>
                <span>{credit.lessonTypeName || credit.handledarSessionTitle}:</span>
                <span>{credit.creditsRemaining} / {credit.creditsTotal}</span>
                {/* Add controls to edit or remove specific credits here */}
              </li>
            ))}
          </ul>
          <button onClick={() => handleAddCredit('lesson', 'sample-lesson-type-id', 5)}>Add Lesson Credit</button>
          <button onClick={() => handleAddCredit('handledar', 'sample-handledar-session-id', 2)}>Add Handledar Credit</button>
          {/* More control UI for adding / removing credits can be added here */}
        </div>
      )}
    </div>
  );
};

export default CreditManagement;

