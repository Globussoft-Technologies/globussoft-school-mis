'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TableProperties,
  Plus,
  ChevronLeft,
  X,
  Trash2,
  CheckCircle,
  Star,
} from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
}
function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

const typeColors: Record<string, string> = {
  POINTS: 'bg-blue-100 text-blue-700',
  PERCENTAGE: 'bg-purple-100 text-purple-700',
  PROFICIENCY: 'bg-orange-100 text-orange-700',
};

interface RubricLevel {
  id?: string;
  title: string;
  description?: string;
  points: number;
  orderIndex: number;
}

interface RubricCriterion {
  id?: string;
  title: string;
  description?: string;
  maxPoints: number;
  orderIndex: number;
  levels: RubricLevel[];
}

interface Rubric {
  id: string;
  title: string;
  description?: string;
  type: string;
  maxScore?: number;
  criteria: RubricCriterion[];
  _count?: { criteria: number };
}

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssess, setShowAssess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rubricResults, setRubricResults] = useState<any>(null);
  const user = getUser();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'POINTS',
    subjectId: '',
  });
  const [formCriteria, setFormCriteria] = useState<RubricCriterion[]>([
    {
      title: '',
      maxPoints: 10,
      orderIndex: 0,
      levels: [
        { title: 'Excellent', points: 10, orderIndex: 0 },
        { title: 'Good', points: 7, orderIndex: 1 },
        { title: 'Needs Improvement', points: 4, orderIndex: 2 },
        { title: 'Insufficient', points: 1, orderIndex: 3 },
      ],
    },
  ]);

  // Assessment state
  const [assessForm, setAssessForm] = useState({
    studentId: '',
    feedback: '',
  });
  const [selectedScores, setSelectedScores] = useState<Record<string, { levelId: string; points: number; comment: string }>>({});

  const fetchRubrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/rubrics`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setRubrics(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRubrics(); }, [fetchRubrics]);

  async function loadResults(rubricId: string) {
    const res = await fetch(`${BASE}/rubrics/${rubricId}/results`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) setRubricResults(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const maxScore = formCriteria.reduce((s, c) => s + c.maxPoints, 0);
      const res = await fetch(`${BASE}/rubrics`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxScore,
          criteria: formCriteria.map((c, i) => ({
            ...c,
            orderIndex: i,
            levels: c.levels.map((l, j) => ({ ...l, orderIndex: j })),
          })),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', description: '', type: 'POINTS', subjectId: '' });
        fetchRubrics();
      }
    } finally { setSaving(false); }
  }

  async function handleAssess(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRubric) return;
    setSaving(true);
    try {
      const scores = Object.entries(selectedScores).map(([criterionId, v]) => ({
        criterionId,
        levelId: v.levelId,
        points: v.points,
        comment: v.comment,
      }));
      const res = await fetch(`${BASE}/rubrics/${selectedRubric.id}/assess`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assessForm, scores }),
      });
      if (res.ok) {
        setShowAssess(false);
        setAssessForm({ studentId: '', feedback: '' });
        setSelectedScores({});
        loadResults(selectedRubric.id);
      }
    } finally { setSaving(false); }
  }

  function addCriterion() {
    setFormCriteria(c => [...c, {
      title: '',
      maxPoints: 10,
      orderIndex: c.length,
      levels: [
        { title: 'Excellent', points: 10, orderIndex: 0 },
        { title: 'Good', points: 7, orderIndex: 1 },
        { title: 'Needs Improvement', points: 4, orderIndex: 2 },
        { title: 'Insufficient', points: 1, orderIndex: 3 },
      ],
    }]);
  }

  function removeCriterion(idx: number) {
    setFormCriteria(c => c.filter((_, i) => i !== idx));
  }

  function updateCriterion(idx: number, field: string, value: string | number) {
    setFormCriteria(c => c.map((cr, i) => i === idx ? { ...cr, [field]: value } : cr));
  }

  function updateLevel(cIdx: number, lIdx: number, field: string, value: string | number) {
    setFormCriteria(c => c.map((cr, i) =>
      i === cIdx
        ? { ...cr, levels: cr.levels.map((l, j) => j === lIdx ? { ...l, [field]: value } : l) }
        : cr
    ));
  }

  const totalAssessScore = Object.values(selectedScores).reduce((s, v) => s + v.points, 0);
  const maxAssessScore = selectedRubric?.criteria.reduce((s, c) => s + c.maxPoints, 0) ?? 0;

  if (selectedRubric) {
    return (
      <div>
        <button
          onClick={() => { setSelectedRubric(null); setRubricResults(null); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Rubrics
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[selectedRubric.type]}`}>
                {selectedRubric.type}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{selectedRubric.title}</h1>
            {selectedRubric.description && (
              <p className="text-muted-foreground">{selectedRubric.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { loadResults(selectedRubric.id); }}
              className="px-3 py-2 border rounded-lg text-sm text-muted-foreground hover:bg-muted"
            >
              View Results
            </button>
            {['SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
              <button
                onClick={() => setShowAssess(true)}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Assess Student
              </button>
            )}
          </div>
        </div>

        {/* Rubric grid */}
        <div className="bg-card border rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-semibold w-48">Criterion</th>
                  {selectedRubric.criteria[0]?.levels.map(l => (
                    <th key={l.id || l.orderIndex} className="text-center p-3 font-semibold">
                      {l.title}
                    </th>
                  ))}
                  <th className="text-center p-3 font-semibold">Max Points</th>
                </tr>
              </thead>
              <tbody>
                {selectedRubric.criteria.map((criterion, idx) => (
                  <tr key={criterion.id || idx} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3 font-medium align-top">
                      <div>{criterion.title}</div>
                      {criterion.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{criterion.description}</div>
                      )}
                    </td>
                    {criterion.levels.map(level => (
                      <td key={level.id || level.orderIndex} className="p-3 text-center align-top">
                        <div className="font-semibold text-primary">{level.points} pts</div>
                        {level.description && (
                          <div className="text-xs text-muted-foreground mt-1">{level.description}</div>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-center font-bold text-primary">{criterion.maxPoints}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="p-3 font-bold" colSpan={selectedRubric.criteria[0]?.levels.length + 1}>
                    Total Maximum Score
                  </td>
                  <td className="p-3 text-center font-bold text-lg text-primary">
                    {selectedRubric.maxScore ?? selectedRubric.criteria.reduce((s, c) => s + c.maxPoints, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Results */}
        {rubricResults && (
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Assessment Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{rubricResults.summary.total}</div>
                <div className="text-xs text-blue-600">Total Assessed</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{rubricResults.summary.averageScore}</div>
                <div className="text-xs text-green-600">Average Score</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-700">{rubricResults.summary.maxScore}</div>
                <div className="text-xs text-purple-600">Max Score</div>
              </div>
            </div>
            {rubricResults.assessments.length > 0 && (
              <div className="space-y-2">
                {rubricResults.assessments.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                    <span className="font-medium">Student: {a.studentId.slice(0, 8)}...</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                      <span className="font-semibold">{a.totalScore} / {rubricResults.summary.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assessment Modal */}
        {showAssess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Assess Student</h2>
                <button onClick={() => setShowAssess(false)}><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAssess} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Student ID *</label>
                  <input
                    required
                    value={assessForm.studentId}
                    onChange={e => setAssessForm(f => ({ ...f, studentId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Enter student ID"
                  />
                </div>

                {selectedRubric.criteria.map(criterion => (
                  <div key={criterion.id} className="border rounded-lg p-4">
                    <div className="font-medium mb-3">{criterion.title}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {criterion.levels.map(level => {
                        const isSelected = selectedScores[criterion.id!]?.levelId === level.id;
                        return (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => setSelectedScores(s => ({
                              ...s,
                              [criterion.id!]: { levelId: level.id!, points: level.points, comment: s[criterion.id!]?.comment || '' }
                            }))}
                            className={`text-left p-2 rounded-lg border text-sm transition-colors ${
                              isSelected ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-muted'
                            }`}
                          >
                            <div className="font-medium flex items-center justify-between">
                              {level.title}
                              {isSelected && <CheckCircle className="h-4 w-4" />}
                            </div>
                            <div className="text-xs text-muted-foreground">{level.points} pts</div>
                          </button>
                        );
                      })}
                    </div>
                    <input
                      value={selectedScores[criterion.id!]?.comment || ''}
                      onChange={e => setSelectedScores(s => ({
                        ...s,
                        [criterion.id!]: { ...s[criterion.id!], comment: e.target.value }
                      }))}
                      className="w-full border rounded px-2 py-1 text-xs mt-2"
                      placeholder="Comment (optional)"
                    />
                  </div>
                ))}

                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">Total: {totalAssessScore} / {maxAssessScore}</div>
                  <div className="text-sm text-muted-foreground">
                    {maxAssessScore > 0 ? Math.round((totalAssessScore / maxAssessScore) * 100) : 0}%
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Overall Feedback</label>
                  <textarea
                    value={assessForm.feedback}
                    onChange={e => setAssessForm(f => ({ ...f, feedback: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Written feedback for student"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAssess(false)} className="px-4 py-2 border rounded-lg text-sm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || Object.keys(selectedScores).length === 0}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Submit Assessment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TableProperties className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Rubrics</h1>
            <p className="text-sm text-muted-foreground">Standardized assessment criteria</p>
          </div>
        </div>
        {['SUPER_ADMIN', 'IT_ADMIN', 'ACADEMIC_COORDINATOR', 'SUBJECT_TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Create Rubric
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
      ) : rubrics.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TableProperties className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No rubrics yet</p>
          <p className="text-sm">Create standardized grading criteria for assessments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rubrics.map(rubric => (
            <div
              key={rubric.id}
              className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRubric(rubric)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[rubric.type]}`}>
                  {rubric.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {rubric._count?.criteria ?? rubric.criteria?.length ?? 0} criteria
                </span>
              </div>
              <h3 className="font-semibold mb-1">{rubric.title}</h3>
              {rubric.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{rubric.description}</p>
              )}
              {rubric.maxScore && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Max Score: <span className="font-semibold text-foreground">{rubric.maxScore}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Rubric Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Rubric</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g., Essay Writing Rubric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="POINTS">Points</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="PROFICIENCY">Proficiency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              {/* Criteria Builder */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Criteria</label>
                  <button
                    type="button"
                    onClick={addCriterion}
                    className="text-xs text-primary flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Criterion
                  </button>
                </div>

                <div className="space-y-4">
                  {formCriteria.map((criterion, cIdx) => (
                    <div key={cIdx} className="border rounded-lg p-4 bg-muted/10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-muted-foreground">#{cIdx + 1}</span>
                        <input
                          required
                          value={criterion.title}
                          onChange={e => updateCriterion(cIdx, 'title', e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          placeholder="Criterion title (e.g., Content Quality)"
                        />
                        <input
                          type="number"
                          value={criterion.maxPoints}
                          onChange={e => updateCriterion(cIdx, 'maxPoints', parseFloat(e.target.value))}
                          className="w-20 border rounded px-2 py-1 text-sm text-center"
                          placeholder="Max pts"
                        />
                        {formCriteria.length > 1 && (
                          <button type="button" onClick={() => removeCriterion(cIdx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        )}
                      </div>

                      {/* Levels */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {criterion.levels.map((level, lIdx) => (
                          <div key={lIdx} className="border rounded p-2 bg-background text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <input
                                value={level.title}
                                onChange={e => updateLevel(cIdx, lIdx, 'title', e.target.value)}
                                className="flex-1 border rounded px-1.5 py-0.5 text-xs"
                                placeholder="Level title"
                              />
                              <input
                                type="number"
                                value={level.points}
                                onChange={e => updateLevel(cIdx, lIdx, 'points', parseFloat(e.target.value))}
                                className="w-14 border rounded px-1.5 py-0.5 text-xs text-center"
                              />
                            </div>
                            <input
                              value={level.description || ''}
                              onChange={e => updateLevel(cIdx, lIdx, 'description', e.target.value)}
                              className="w-full border rounded px-1.5 py-0.5 text-xs"
                              placeholder="Description (optional)"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                Total Max Score:{' '}
                <strong>{formCriteria.reduce((s, c) => s + (c.maxPoints || 0), 0)}</strong>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Rubric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
