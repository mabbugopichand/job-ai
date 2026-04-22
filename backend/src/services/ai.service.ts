import axios from 'axios';
import { AIAnalysisResult, Job, Profile } from '../types';
import fs from 'fs';
import path from 'path';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'gemma:2b';
const OLLAMA_TIMEOUT_MS = 60000;

let promptTemplate: any;
try {
  promptTemplate = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../ai/prompts/job_analysis.json'), 'utf-8')
  );
} catch (e) {
  throw new Error('Failed to load AI prompt template: ' + (e as Error).message);
}

export async function analyzeJobMatch(job: Job, profile: Profile): Promise<AIAnalysisResult> {
  const prompt = promptTemplate.user_prompt_template
    .replace('{job_title}', job.title || '')
    .replace('{job_company}', job.company || '')
    .replace('{job_location}', job.location || '')
    .replace('{job_description}', job.description || '')
    .replace('{job_requirements}', job.requirements || '')
    .replace('{user_skills}', JSON.stringify(profile.skills))
    .replace('{user_experience_years}', String(profile.experience_years || 0))
    .replace('{user_education}', profile.education_level || '')
    .replace('{user_preferred_roles}', JSON.stringify(profile.preferred_roles))
    .replace('{user_preferred_locations}', JSON.stringify(profile.preferred_locations));

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: AI_MODEL,
      prompt: `${promptTemplate.system_prompt}\n\n${prompt}`,
      stream: false,
      format: 'json'
    }, { timeout: OLLAMA_TIMEOUT_MS });

    let result: any;
    try {
      result = JSON.parse(response.data.response);
    } catch {
      throw new Error('AI returned invalid JSON');
    }
    
    return {
      role_classification: result.role_classification || 'Unknown',
      match_score: Math.min(100, Math.max(0, result.match_score || 0)),
      extracted_skills: result.extracted_skills || [],
      missing_skills: result.missing_skills || [],
      summary: result.summary || '',
      reasoning: result.reasoning || '',
      should_alert: result.should_alert || false
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      role_classification: 'Unknown',
      match_score: 0,
      extracted_skills: [],
      missing_skills: [],
      summary: 'Analysis failed',
      reasoning: 'Could not analyze job posting',
      should_alert: false
    };
  }
}
