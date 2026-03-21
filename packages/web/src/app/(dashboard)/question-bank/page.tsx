'use client';

import { useEffect, useState } from 'react';
import { Plus, Database } from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  subject: { id: string; name: string };
  _count: { questions: number };
}

export default function QuestionBankPage() {
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/question-bank/banks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setBanks(await res.json());
      } catch {}
    }
    fetch_();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          <Plus className="h-4 w-4" /> Create Bank
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banks.length === 0 ? (
          <div className="col-span-full bg-card rounded-lg border p-8 text-center text-muted-foreground">
            No question banks created yet.
          </div>
        ) : (
          banks.map((b) => (
            <div key={b.id} className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{b.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{b.subject.name}</p>
              <p className="text-sm font-medium mt-2">{b._count.questions} questions</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
