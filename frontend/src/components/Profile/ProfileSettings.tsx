import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { profile } from '../../services/api';

const ALL_ROLES = [
  'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Data Science',
  'AI/ML', 'Mobile', 'Design', 'Product', 'Marketing',
  'Research', 'PhD Position', 'Postdoctoral Researcher', 'Software Engineering',
];

export default function ProfileSettings() {
  const [formData, setFormData] = useState({
    resume_text: '',
    skills: [] as string[],
    experience_years: 0,
    education_level: '',
    preferred_roles: [] as string[],
    preferred_locations: [] as string[],
    min_salary: 0,
    email_notifications: true,
    telegram_notifications: false,
    telegram_chat_id: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profile.get().then(r => {
      const d = r.data;
      if (!d?.user_id) return;
      setFormData(f => ({
        ...f,
        resume_text: d.resume_text || '',
        skills: Array.isArray(d.skills) ? d.skills : [],
        experience_years: d.experience_years || 0,
        education_level: d.education_level || '',
        preferred_roles: Array.isArray(d.preferred_roles) ? d.preferred_roles : [],
        preferred_locations: Array.isArray(d.preferred_locations) ? d.preferred_locations : [],
        min_salary: d.min_salary || 0,
        email_notifications: d.email_notifications ?? true,
        telegram_notifications: d.telegram_notifications ?? false,
        telegram_chat_id: d.telegram_chat_id || '',
      }));
      if (d.preferred_roles?.length) setSuggestedRoles(d.preferred_roles);
    }).catch(() => {});
  }, []);

  // File upload — use backend for PDF, browser for text files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setError('');
    try {
      let res;
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Send PDF to backend for parsing
        res = await profile.uploadResume(file);
      } else {
        // Plain text files — read in browser then parse
        const text = await file.text();
        res = await profile.parseResume(text);
      }
      const { skills, suggested_roles, resume_text } = res.data;
      setFormData(f => ({
        ...f,
        resume_text: resume_text || f.resume_text,
        skills: Array.from(new Set([...f.skills, ...skills])),
        preferred_roles: suggested_roles,
      }));
      setSuggestedRoles(suggested_roles);
    } catch {
      setError('Failed to parse resume. You can still paste it manually below.');
    } finally {
      setParsing(false);
    }
  };

  // Manual resume text parse
  const handleParseManual = async () => {
    if (!formData.resume_text.trim()) return;
    setParsing(true);
    setError('');
    try {
      const res = await profile.parseResume(formData.resume_text);
      const { skills, suggested_roles } = res.data;
      setFormData(f => ({
        ...f,
        skills: Array.from(new Set([...f.skills, ...skills])),
        preferred_roles: suggested_roles,
      }));
      setSuggestedRoles(suggested_roles);
    } catch {
      setError('Failed to parse resume.');
    } finally {
      setParsing(false);
    }
  };

  const addSkill = (val: string) => {
    const skill = val.trim();
    if (skill && !formData.skills.includes(skill))
      setFormData(f => ({ ...f, skills: [...f.skills, skill] }));
    setSkillInput('');
  };

  const removeSkill = (skill: string) =>
    setFormData(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }));

  const handleSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
  };

  const toggleRole = (role: string) => {
    setFormData(f => ({
      ...f,
      preferred_roles: f.preferred_roles.includes(role)
        ? f.preferred_roles.filter(r => r !== role)
        : [...f.preferred_roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await profile.update(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save profile.');
    }
  };

  // Roles to show: suggested first, then rest
  const displayRoles = suggestedRoles.length > 0
    ? [...suggestedRoles, ...ALL_ROLES.filter(r => !suggestedRoles.includes(r))]
    : ALL_ROLES;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-5">

        {/* Resume Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Resume Upload</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
          >
            {parsing ? (
              <p className="text-blue-600 animate-pulse">⏳ Parsing resume...</p>
            ) : fileName ? (
              <div>
                <p className="text-green-600 font-medium">✅ {fileName}</p>
                <p className="text-xs text-gray-400 mt-1">Click to upload a different file</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-2">📄</p>
                <p className="text-gray-600 font-medium">Click to upload your resume</p>
                <p className="text-xs text-gray-400 mt-1">Supports .txt, .pdf (text-based), .doc content</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Resume Text */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">Resume Text</label>
            <button
              type="button"
              onClick={handleParseManual}
              disabled={parsing || !formData.resume_text.trim()}
              className="text-xs text-blue-600 hover:underline disabled:opacity-40"
            >
              {parsing ? 'Parsing...' : '✨ Parse & detect roles'}
            </button>
          </div>
          <textarea
            rows={5}
            placeholder="Paste your resume text here, then click 'Parse & detect roles'..."
            value={formData.resume_text || ''}
            onChange={(e) => setFormData(f => ({ ...f, resume_text: e.target.value }))}
            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Preferred Roles — filtered by resume */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium">Preferred Roles</label>
            {suggestedRoles.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✨ {suggestedRoles.length} detected from resume
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {displayRoles.map(role => {
              const isSuggested = suggestedRoles.includes(role);
              const isSelected = formData.preferred_roles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isSuggested
                      ? 'bg-green-50 text-green-700 border-green-400 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {isSuggested && !isSelected && '✨ '}{role}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {suggestedRoles.length > 0
              ? 'Green = detected from your resume. Click to select/deselect.'
              : 'Upload or paste your resume to auto-detect relevant roles.'}
          </p>
        </div>

        {/* Skills Tag Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Skills</label>
          <div className="flex flex-wrap gap-2 p-2 border rounded min-h-[44px] focus-within:ring-2 focus-within:ring-blue-400">
            {formData.skills.map(skill => (
              <span key={skill} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-red-500 font-bold">×</button>
              </span>
            ))}
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKey}
              onBlur={() => skillInput && addSkill(skillInput)}
              placeholder={formData.skills.length === 0 ? 'Type a skill and press Enter...' : ''}
              className="flex-1 min-w-[120px] outline-none text-sm p-1"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Skills are auto-extracted from resume. Add more manually.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Years of Experience</label>
            <input
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData(f => ({ ...f, experience_years: Number(e.target.value) }))}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Education Level</label>
            <select
              value={formData.education_level}
              onChange={(e) => setFormData(f => ({ ...f, education_level: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Select</option>
              <option value="High School">High School</option>
              <option value="Bachelor">Bachelor's</option>
              <option value="Master">Master's</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Minimum Salary (USD/year)</label>
          <input
            type="number"
            value={formData.min_salary}
            onChange={(e) => setFormData(f => ({ ...f, min_salary: Number(e.target.value) }))}
            className="w-full p-2 border rounded"
            min="0" step="5000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Preferred Locations</label>
          <input
            type="text"
            value={(formData.preferred_locations || []).join(', ')}
            onChange={(e) => setFormData(f => ({ ...f, preferred_locations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            placeholder="Remote, New York, London..."
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.email_notifications}
              onChange={(e) => setFormData(f => ({ ...f, email_notifications: e.target.checked }))} />
            <span className="text-sm">Email Notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.telegram_notifications}
              onChange={(e) => setFormData(f => ({ ...f, telegram_notifications: e.target.checked }))} />
            <span className="text-sm">Telegram Notifications</span>
          </label>
        </div>

        {formData.telegram_notifications && (
          <div>
            <label className="block text-sm font-medium mb-1">Telegram Chat ID</label>
            <input
              type="text"
              value={formData.telegram_chat_id || ''}
              onChange={(e) => setFormData(f => ({ ...f, telegram_chat_id: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="Your Telegram chat ID"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">✅ Profile saved successfully!</p>}

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium">
          Save Profile
        </button>
      </form>
    </div>
  );
}
