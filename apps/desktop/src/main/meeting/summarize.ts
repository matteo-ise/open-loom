import fs from 'node:fs';
import path from 'node:path';
import type { TranscriptSegment, VideoMeta } from '@shared/types';
import { getSettings, getSecret } from '../settings';
import { library } from '../library';
import { complete, type AiProviderConfig } from '../ai-core';
import { log } from '../logger';
import { VIDEO_FILES } from '@shared/types';
import { emitJobProgress } from '../ffmpeg';

export interface MeetingSummary {
  keyOutcomes: string[];
  summary: string;
  nextSteps: string[];
  transcriptDiarized: string;
}

function providerConfig(): AiProviderConfig {
  const cfg = getSettings().ai;
  if (cfg.provider === 'off') {
    throw new Error('AI features are turned off. Pick a provider in Settings, then try again.');
  }
  return {
    provider: cfg.provider,
    endpoint: cfg.endpoint,
    model: cfg.model,
    apiKey: getSecret('ai.apiKey'),
  };
}

export async function summarizeMeeting(id: string): Promise<void> {
  const store = library();
  const meta = store.get(id);
  const videoDir = store.videoDir(id);
  const transcriptPath = path.join(videoDir, VIDEO_FILES.transcriptJson);

  if (!fs.existsSync(transcriptPath)) {
    throw new Error('No transcript found. Please transcribe the meeting first.');
  }

  const data = JSON.parse(fs.readFileSync(transcriptPath, 'utf8')) as { segments?: TranscriptSegment[] };
  const segments = data.segments ?? [];
  if (segments.length === 0) return;

  emitJobProgress({ videoId: id, kind: 'meeting-summary', pct: 10, note: 'Formatting transcript...' });

  const rawTranscript = segments
    .map((s) => `[${formatClock(s.start)}] ${s.text.trim()}`)
    .join('\n');

  const prompt = `You are a highly skilled executive assistant. Your task is to process the following raw meeting transcript.
Because the transcript lacks speaker labels, you MUST attempt to guess and assign speaker labels based on conversation flow (e.g., Speaker 1, Speaker 2, etc.).

Produce a JSON response ONLY, containing EXACTLY these keys:
- "keyOutcomes": array of short strings representing the main outcomes or decisions.
- "summary": a 3-5 sentence overall summary of the meeting.
- "nextSteps": array of action items with assignees if mentioned.
- "transcriptDiarized": a beautifully formatted string containing the full transcript with your guessed speaker labels and timestamps. Use Markdown formatting.

Do not wrap the JSON in Markdown fences.

Raw Transcript:
${rawTranscript.length > 20000 ? rawTranscript.slice(0, 20000) + '\n[...truncated...]' : rawTranscript}`;

  emitJobProgress({ videoId: id, kind: 'meeting-summary', pct: 50, note: 'Summarizing & Diarizing...' });

  const cfg = providerConfig();
  try {
    const text = await complete(cfg, prompt);
    const result = extractJsonObject(text) as unknown as MeetingSummary;

    // Save the MeetingSummary to meta.meeting
    store.update(id, {
      meeting: {
        keyOutcomes: result.keyOutcomes || [],
        summary: result.summary || '',
        nextSteps: result.nextSteps || [],
        transcriptDiarized: result.transcriptDiarized || '',
      }
    });

    emitJobProgress({ videoId: id, kind: 'meeting-summary', pct: 100, note: 'Meeting processing complete!' });
  } catch (err) {
    log.error(`Meeting summarize failed for ${id}: ${err}`);
    emitJobProgress({ videoId: id, kind: 'meeting-summary', pct: 100, note: 'Summary failed.' });
    throw err;
  }
}

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function extractJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  if (start < 0) throw new Error('The model did not return JSON.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, i + 1)) as Record<string, unknown>;
      }
    }
  }
  throw new Error('The model returned incomplete JSON.');
}
