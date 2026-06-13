import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Plus } from 'lucide-react';

export default function Schedule() {
  const { state, setExamDate, addStudySession } = useApp();
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    activity: '',
    notes: '',
  });
  const [showAddSession, setShowAddSession] = useState(false);

  const daysUntilExam = state.examDate
    ? Math.ceil((new Date(state.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const totalStudyTime = state.studySessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = Math.floor(totalStudyTime / 60);
  const totalMinutes = totalStudyTime % 60;

  const handleAddSession = () => {
    if (!newSession.activity) return;
    addStudySession({
      date: newSession.date,
      duration: newSession.duration,
      activity: newSession.activity,
      notes: newSession.notes,
    });
    setNewSession({
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      activity: '',
      notes: '',
    });
    setShowAddSession(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Study Schedule</h1>
        <p className="text-gray-600 mt-2">Plan and track your study sessions</p>
      </div>

      {/* Exam Date & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-primary-500" size={24} />
            <h2 className="font-semibold">Exam Date</h2>
          </div>
          <input
            type="date"
            value={state.examDate || ''}
            onChange={e => setExamDate(e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {daysUntilExam !== null && (
            <p className={`mt-3 font-medium ${daysUntilExam < 14 ? 'text-red-600' : daysUntilExam < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
              {daysUntilExam > 0 ? `${daysUntilExam} days remaining` : daysUntilExam === 0 ? 'Exam is today!' : 'Exam date has passed'}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-blue-500" size={24} />
            <h2 className="font-semibold">Total Study Time</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {totalHours}h {totalMinutes}m
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {state.studySessions.length} study sessions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="text-green-500" size={24} />
            <h2 className="font-semibold">Quick Add</h2>
          </div>
          <button
            onClick={() => setShowAddSession(true)}
            className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Log Study Session
          </button>
        </div>
      </div>

      {/* Add Session Modal */}
      {showAddSession && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Log Study Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newSession.date}
                onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={newSession.duration}
                onChange={e => setNewSession({ ...newSession, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
              <input
                type="text"
                placeholder="e.g., Review Manual Chapter 1, QAE Practice..."
                value={newSession.activity}
                onChange={e => setNewSession({ ...newSession, activity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                placeholder="Any additional notes..."
                value={newSession.notes}
                onChange={e => setNewSession({ ...newSession, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddSession}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Save Session
            </button>
            <button
              onClick={() => setShowAddSession(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Study Sessions List */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Study Sessions</h2>
        {state.studySessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No study sessions logged yet. Click "Log Study Session" to add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Activity</th>
                  <th className="pb-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {state.studySessions.slice().reverse().map(session => (
                  <tr key={session.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm">{new Date(session.date).toLocaleDateString()}</td>
                    <td className="py-3 text-sm">{session.duration} min</td>
                    <td className="py-3 text-sm font-medium">{session.activity}</td>
                    <td className="py-3 text-sm text-gray-600">{session.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommended Study Plan */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Recommended 12-Week Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">Phase 1: Foundation</h3>
            <p className="text-sm text-blue-700 mt-1">Weeks 1-4</p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• First read of Review Manual</li>
              <li>• Complete Online Course</li>
              <li>• Start ML Specialization</li>
            </ul>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Phase 2: Practice</h3>
            <p className="text-sm text-yellow-700 mt-1">Weeks 5-8</p>
            <ul className="text-sm text-yellow-600 mt-2 space-y-1">
              <li>• First QAE pass</li>
              <li>• Second read of Manual</li>
              <li>• Review OWASP Top 10</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800">Phase 3: Mastery</h3>
            <p className="text-sm text-green-700 mt-1">Weeks 9-12</p>
            <ul className="text-sm text-green-600 mt-2 space-y-1">
              <li>• Second & third QAE passes</li>
              <li>• Focus on weak areas</li>
              <li>• Final review</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
