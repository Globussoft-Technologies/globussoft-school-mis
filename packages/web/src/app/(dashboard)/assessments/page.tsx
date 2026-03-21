'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  type: string;
  tier: number;
  totalMarks: number;
  isPublished: boolean;
  scheduledDate?: string;
  subject: { name: string };
  class: { name: string };
  _count: { submissions: number; questions: number };
}

const tierLabels: Record<number, string> = {
  1: 'Micro Checkpoint', 2: 'Cyclic Test', 3: 'Unit Assessment',
  4: 'Monthly Test', 5: 'Half-Yearly', 6: 'Annual Exam',
  7: 'Remedial', 8: 'Mock/Practice',
};

const typeColors: Record<string, string> = {
  CLASSWORK: 'bg-blue-100 text-blue-700',
  HOMEWORK: 'bg-green-100 text-green-700',
  QUIZ: 'bg-purple-100 text-purple-700',
  UNIT_TEST: 'bg-orange-100 text-orange-700',
  MID_TERM: 'bg-red-100 text-red-700',
  FINAL_EXAM: 'bg-red-100 text-red-800',
  PRACTICAL: 'bg-teal-100 text-teal-700',
  PROJECT: 'bg-pink-100 text-pink-700',
};

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setAssessments(await res.json());
      } catch {}
    }
    fetch_();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          <Plus className="h-4 w-4" /> Create Assessment
        </button>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Type / Tier</th>
              <th className="text-left p-3 font-medium">Subject</th>
              <th className="text-left p-3 font-medium">Class</th>
              <th className="text-left p-3 font-medium">Marks</th>
              <th className="text-left p-3 font-medium">Questions</th>
              <th className="text-left p-3 font-medium">Submissions</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No assessments created yet. Create your first assessment to get started.
                </td>
              </tr>
            ) : (
              assessments.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{a.title}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${typeColors[a.type] || 'bg-gray-100'}`}>
                      {a.type}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">T{a.tier}</span>
                  </td>
                  <td className="p-3">{a.subject.name}</td>
                  <td className="p-3">{a.class.name}</td>
                  <td className="p-3">{a.totalMarks}</td>
                  <td className="p-3">{a._count.questions}</td>
                  <td className="p-3">{a._count.submissions}</td>
                  <td className="p-3">
                    <span className={`text-xs ${a.isPublished ? 'text-green-600' : 'text-yellow-600'}`}>
                      {a.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
