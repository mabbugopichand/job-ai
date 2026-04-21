import { useState } from 'react';

interface JobFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function JobFilters({ onFilterChange }: JobFiltersProps) {
  const [keyword, setKeyword] = useState('');
  const [roleType, setRoleType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [location, setLocation] = useState('');
  const [minScore, setMinScore] = useState('');

  const handleApply = () => {
    onFilterChange({
      keyword: keyword || undefined,
      role_type: roleType || undefined,
      work_mode: workMode || undefined,
      location: location || undefined,
      min_score: minScore || undefined,
    });
  };

  const handleReset = () => {
    setKeyword(''); setRoleType(''); setWorkMode(''); setLocation(''); setMinScore('');
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex gap-3 mb-3">
        <input
          type="text"
          placeholder="🔍 Search by keyword, skill, company..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select value={roleType} onChange={(e) => setRoleType(e.target.value)} className="p-2 border rounded">
          <option value="">All Roles</option>
          <option value="Software Engineering">Software Engineering</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Full Stack">Full Stack</option>
          <option value="DevOps">DevOps</option>
          <option value="Data Science">Data Science</option>
          <option value="AI/ML">AI/ML</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Product">Product</option>
          <option value="Research Position">Research</option>
          <option value="PhD Position">PhD Position</option>
          <option value="Postdoctoral Researcher">Postdoc</option>
        </select>
        <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="p-2 border rounded">
          <option value="">All Work Modes</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Min Match %"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="p-2 border rounded"
          min="0" max="100"
        />
      </div>
      <div className="flex gap-3 mt-3">
        <button onClick={handleApply} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Search
        </button>
        <button onClick={handleReset} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
          Reset
        </button>
      </div>
    </div>
  );
}
