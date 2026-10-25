/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import webpush from 'web-push';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// VAPID keys for Web Push Notifications
const vapidKeys =
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
    ? {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
      }
    : webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:support@eyeofagamotto.internal',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Server-side Push Subscription Store
interface PushSubRecord {
  subscription: webpush.PushSubscription;
  userId?: string;
  timezone?: string;
  updatedAt: string;
}
const pushSubscriptions = new Map<string, PushSubRecord>();

// Server-side Scheduled Reminders Store
interface ScheduledReminderRecord {
  reminderId: string;
  targetId: string;
  targetType: 'task' | 'calendar_event';
  title: string;
  body: string;
  scheduledTime: string; // ISO
  timezone: string;
  status: 'scheduled' | 'dispatched' | 'confirmed' | 'failed' | 'snoozed';
  deliveryConfirmedAt?: string;
  dispatchedAt?: string;
  userId?: string;
}
const scheduledReminders = new Map<string, ScheduledReminderRecord>();

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Timeout wrapper to prevent hanging requests
const withTimeout = <T>(promise: Promise<T>, ms = 20000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timed out. Google AI endpoint took longer than expected.')),
        ms
      )
    ),
  ]);
};

// Generic error & rate limit handler
const handleGeminiError = (error: any, res: Response) => {
  console.error('[Gemini Server Error]:', error);

  let errorMsg = error?.message || String(error);
  try {
    const parsed = JSON.parse(errorMsg);
    if (parsed?.error?.message) {
      errorMsg = parsed.error.message;
    }
  } catch {
    // Keep as string
  }

  if (errorMsg.includes('timed out')) {
    return res.status(504).json({
      error: 'The AI request timed out. Please try a shorter query or retry in a few moments.',
      isTimeout: true,
    });
  }

  if (
    errorMsg.includes('503') ||
    errorMsg.includes('UNAVAILABLE') ||
    errorMsg.toLowerCase().includes('high demand')
  ) {
    return res.status(503).json({
      error: 'The Gemini model is currently experiencing high demand upstream. Please retry in a few moments.',
      isTemporaryUnavailable: true,
    });
  }

  if (
    errorMsg.includes('429') ||
    errorMsg.includes('RESOURCE_EXHAUSTED') ||
    errorMsg.toLowerCase().includes('quota') ||
    errorMsg.toLowerCase().includes('rate limit')
  ) {
    return res.status(429).json({
      error: 'Rate limit reached on the Gemini API. Please wait a moment before trying again.',
      isRateLimit: true,
    });
  }

  if (errorMsg.includes('API key') || errorMsg.includes('UNAUTHENTICATED')) {
    return res.status(401).json({
      error: 'Invalid or unauthorized Gemini API key.',
    });
  }

  return res.status(500).json({
    error: errorMsg || 'An error occurred while communicating with Gemini.',
  });
};

// ==========================================
// Gemini Health & Configuration Status
// ==========================================
app.get('/api/gemini/status', (_req: Request, res: Response) => {
  const isConfigured = Boolean(process.env.GEMINI_API_KEY);
  return res.json({
    configured: isConfigured,
    model: 'gemini-3.8-flash',
  });
});

// ==========================================
// 1. Concept Explanations
// ==========================================
app.post('/api/gemini/explain', async (req: Request, res: Response) => {
  try {
    const { concept, level = 'advanced', context = '' } = req.body;

    if (!concept || typeof concept !== 'string' || !concept.trim()) {
      return res.status(400).json({ error: 'Concept query is required.' });
    }

    if (concept.length > 5000) {
      return res.status(400).json({ error: 'Concept query exceeds maximum length.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please attach GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const systemInstruction = `You are the Eye of Agamotto Technical Intelligence Engine, an elite computer science professor, systems architect, and mathematician.
Explain technical concepts rigorously yet intuitively.
Formatting requirements:
1. High-level intuition & mental model (1-2 paragraphs).
2. Deep architectural / mathematical breakdown (use LaTeX $...$ or $$...$$ for equations, ASCII architecture diagrams where helpful).
3. Real-world engineering context (e.g., how this applies to distributed training, GPU memory, Linux kernels, or database internals).
4. Common pitfalls or edge cases.
Target audience proficiency: ${level}.
${context ? `Additional user workspace context: ${context}` : ''}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: concept.trim(),
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      })
    );

    return res.json({ text: response.text });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// ==========================================
// 2. Note Summarization
// ==========================================
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const { title = '', content, tags = [] } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required for summarization.' });
    }

    if (content.length > 30000) {
      return res.status(400).json({ error: 'Note content exceeds 30,000 characters.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please attach GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const systemInstruction = `You are a high-yield technical knowledge synthesiser for engineering notes.
Analyze the provided note and output a structured synthesis with:
1. Executive Summary: 2 concise sentences encapsulating the core insight.
2. Key Architectural / Algorithmic Takeaways (4-6 sharp bullet points).
3. Core Equations, Data Structures, or Invariants (formatted cleanly).
4. Memory Anchor Questions: 2 flashcard-style self-test questions based on this note.`;

    const prompt = `Note Title: ${title || 'Untitled Note'}
Tags: ${tags.join(', ')}

Content:
${content.trim()}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      })
    );

    return res.json({ text: response.text });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// ==========================================
// 3. Study Plans
// ==========================================
app.post('/api/gemini/study-plan', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      durationWeeks = 4,
      hoursPerDay = 3,
      currentProficiency = 'intermediate',
      targetGoal = 'Mastery & Examination Readiness',
    } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required to generate a study plan.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please attach GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const systemInstruction = `You are a curriculum architect for engineers preparing for high-stakes roles, research, and GATE exams.
Create a structured, weekly study plan for: "${topic}".
Duration: ${durationWeeks} weeks, allocating ~${hoursPerDay} hours/day.
Level: ${currentProficiency}.
Goal: ${targetGoal}.

Structure the response with:
1. Strategic Overview & Learning Milestones.
2. Week-by-Week Breakdown (Key topics, recommended deep work blocks, and practical implementations).
3. Checkpoint Assessments.
4. Proposed Tasks: At the very end of your response, output a JSON block labeled \`\`\`json:proposed_tasks that contains an array of 3-5 concrete study tasks the user can choose to add to their schedule. Each item in the array MUST have:
   - "title": string (concise task name)
   - "priority": "urgent" | "high" | "medium" | "low"
   - "category": "study"
   - "estimatedMinutes": number (e.g. 90, 120)
   - "dueDate": string (YYYY-MM-DD relative to today or week 1)`;

    const prompt = `Generate an intensive study schedule for ${topic}.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      })
    );

    const text = response.text || '';

    // Extract proposed tasks JSON if present
    let proposedTasks: any[] = [];
    const jsonMatch = text.match(/```json:proposed_tasks\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        proposedTasks = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Failed to parse proposed tasks JSON:', e);
      }
    }

    return res.json({ text, proposedTasks });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// ==========================================
// 4. Practice Questions
// ==========================================
app.post('/api/gemini/practice-questions', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      count = 5,
      difficulty = 'advanced',
      category = 'GATE DA / Machine Learning Systems',
    } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required for practice questions.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please attach GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const safeCount = Math.min(Math.max(1, Number(count) || 5), 10);

    const systemInstruction = `You are a chief examination designer for GATE Data Science & AI and Big Tech Staff Systems Interviews.
Generate exactly ${safeCount} high-yield, challenging practice problems on "${topic}".
Difficulty: ${difficulty}.
Context: ${category}.

Format each question clearly:
### Problem [N]: [Title]
- **Category & Difficulty**: ...
- **Problem Statement**: (Include mathematical notation with LaTeX $...$ or code snippets where applicable).
- <details><summary><b>View Step-by-Step Solution & Derivation</b></summary>
  
  **Detailed Solution**: ...
  **Key Takeaway**: ...
  </details>
Ensure the solutions are rigorous, pedagogical, and completely verified.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate ${safeCount} practice questions for ${topic}`,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      })
    );

    return res.json({ text: response.text });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// ==========================================
// 5. Daily Planning
// ==========================================
app.post('/api/gemini/plan-day', async (req: Request, res: Response) => {
  try {
    const { tasks = [], preferences = '', date = new Date().toISOString().split('T')[0] } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks must be provided as an array.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please attach GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');

    const systemInstruction = `You are the Eye of Agamotto Time-Master & Executive Scheduler.
Your objective is to craft an optimal chronological daily schedule for today (${date}).
Balance deep cognitive work (math, derivations, difficult coding) during peak focus windows, with lower-energy task batches and deliberate breaks.

Provide:
1. Executive Schedule Summary (Primary focus for the day).
2. Time-Blocked Chronological Agenda (e.g., 08:30 - 10:30 Deep Work Block 1).
3. Strategic Priority Rationale (Why this sequence maximizes leverage).
4. Contingency Advice (How to adapt if an interruption occurs).
5. Proposed Task Adjustments: At the very end of your response, if you recommend rescheduling or adding tasks, output a JSON block labeled \`\`\`json:proposed_tasks with an array of items:
   - "title": string
   - "priority": "urgent" | "high" | "medium" | "low"
   - "category": "work" | "study" | "career" | "personal"
   - "estimatedMinutes": number
   - "dueDate": string (YYYY-MM-DD)`;

    const prompt = `Here are my pending tasks:
${JSON.stringify(
  pendingTasks.map((t: any) => ({
    title: t.title,
    priority: t.priority,
    category: t.category,
    dueDate: t.dueDate,
    dueTime: t.dueTime,
    estimatedMinutes: t.estimatedMinutes,
  })),
  null,
  2
)}

${preferences ? `User Preferences & Energy Patterns: ${preferences}` : ''}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      })
    );

    const text = response.text || '';

    // Extract proposed tasks JSON if present
    let proposedTasks: any[] = [];
    const jsonMatch = text.match(/```json:proposed_tasks\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        proposedTasks = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Failed to parse proposed tasks JSON:', e);
      }
    }

    return res.json({ text, proposedTasks });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// ==========================================
// 6. Interactive Assistant Chat with Context
// ==========================================
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, history = [], workspaceContext = {} } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Message prompt is required.' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Message prompt exceeds 10,000 characters.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please attach GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const systemInstruction = `You are the Eye of Agamotto AI Assistant, embedded directly in Harsh's personal operating system.
You have context on his tasks, calendar, engineering roadmaps (GATE DA 2027, Deep Learning, Distributed Systems), projects, and knowledge vault.
Assist with conceptual explanations, study planning, practice question generation, note summarization, and daily schedule orchestration.
Be precise, technically sound, and encouraging. Use LaTeX for math and code blocks for technical syntax.

IMPORTANT PERMISSION RULE:
If you suggest creating new tasks or changing existing tasks, do NOT claim you have already created them.
Instead, suggest them clearly, and include a JSON block labeled \`\`\`json:proposed_tasks at the end of your response with the schema:
[
  {
    "title": "Task title",
    "priority": "urgent" | "high" | "medium" | "low",
    "category": "work" | "study" | "career" | "personal",
    "estimatedMinutes": 60,
    "dueDate": "YYYY-MM-DD"
  }
]
The UI will prompt the user to explicitly approve or reject these tasks before creating or modifying them.

Workspace Context:
${JSON.stringify(workspaceContext, null, 2)}`;

    // Build chat contents from history + current prompt
    const contents: any[] = [];
    if (Array.isArray(history)) {
      history.slice(-8).forEach((h: any) => {
        if (h.sender && h.content) {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt.trim() }],
    });

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      })
    );

    const text = response.text || '';

    // Extract proposed tasks JSON if present
    let proposedTasks: any[] = [];
    const jsonMatch = text.match(/```json:proposed_tasks\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        proposedTasks = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Failed to parse proposed tasks JSON:', e);
      }
    }

    // Clean up text by removing the raw JSON block so the UI can render it cleanly in a dedicated card
    const cleanText = text.replace(/```json:proposed_tasks\s*[\s\S]*?\s*```/, '').trim();

    return res.json({ text: cleanText, proposedTasks });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// ==========================================
// Reminders & Web Push Notification APIs
// ==========================================

// 1. Get VAPID Public Key for client PushManager subscription
app.get('/api/reminders/vapid-key', (_req: Request, res: Response) => {
  return res.json({ publicKey: vapidKeys.publicKey });
});

// 2. Register Web Push Subscription
app.post('/api/reminders/subscribe', (req: Request, res: Response) => {
  try {
    const { subscription, userId = 'anonymous', timezone = 'UTC' } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Valid PushSubscription is required.' });
    }

    const subKey = subscription.endpoint;
    pushSubscriptions.set(subKey, {
      subscription,
      userId,
      timezone,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[Reminders] Registered push subscription for user ${userId}. Total: ${pushSubscriptions.size}`);
    return res.json({ success: true, count: pushSubscriptions.size });
  } catch (error: any) {
    console.error('[Reminders] Failed to subscribe:', error);
    return res.status(500).json({ error: 'Failed to register subscription.' });
  }
});

// 3. Schedule a Server-Side Reminder (Works even when tab is closed)
app.post('/api/reminders/schedule', (req: Request, res: Response) => {
  try {
    const {
      reminderId,
      targetId,
      targetType = 'task',
      title,
      body = 'Reminder from Eye of Agamotto',
      scheduledTime,
      timezone = 'UTC',
      userId,
    } = req.body;

    if (!reminderId || !title || !scheduledTime) {
      return res.status(400).json({ error: 'reminderId, title, and scheduledTime are required.' });
    }

    const record: ScheduledReminderRecord = {
      reminderId,
      targetId: targetId || reminderId,
      targetType,
      title,
      body,
      scheduledTime,
      timezone,
      status: 'scheduled',
      userId,
    };

    scheduledReminders.set(reminderId, record);
    console.log(`[Reminders] Scheduled reminder "${title}" for ${scheduledTime} (${timezone})`);

    return res.json({ success: true, scheduled: record });
  } catch (error: any) {
    console.error('[Reminders] Schedule error:', error);
    return res.status(500).json({ error: 'Failed to schedule reminder.' });
  }
});

// 4. Delivery Acknowledgment (Never claim delivered unless confirmed!)
app.post('/api/reminders/ack', (req: Request, res: Response) => {
  try {
    const { reminderId, status = 'push_confirmed', deliveredAt = new Date().toISOString() } = req.body;

    if (!reminderId) {
      return res.status(400).json({ error: 'reminderId is required for ACK.' });
    }

    const existing = scheduledReminders.get(reminderId);
    if (existing) {
      existing.status = 'confirmed';
      existing.deliveryConfirmedAt = deliveredAt;
      scheduledReminders.set(reminderId, existing);
      console.log(`[Reminders] CONFIRMED delivery for reminder ${reminderId} at ${deliveredAt}`);
    }

    return res.json({ success: true, confirmed: true, reminderId, deliveredAt });
  } catch (error: any) {
    console.error('[Reminders] ACK error:', error);
    return res.status(500).json({ error: 'Failed to process delivery ACK.' });
  }
});

// 5. Check Reminder Status
app.get('/api/reminders/status/:reminderId', (req: Request, res: Response) => {
  const { reminderId } = req.params;
  const existing = scheduledReminders.get(reminderId);
  if (!existing) {
    return res.status(404).json({ error: 'Reminder not found on server.' });
  }
  return res.json(existing);
});

// 6. Server-side Snooze
app.post('/api/reminders/snooze', (req: Request, res: Response) => {
  try {
    const { reminderId, minutes = 15 } = req.body;
    if (!reminderId) {
      return res.status(400).json({ error: 'reminderId is required.' });
    }

    const existing = scheduledReminders.get(reminderId);
    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }

    const newTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    existing.scheduledTime = newTime;
    existing.status = 'scheduled';
    existing.deliveryConfirmedAt = undefined;
    existing.dispatchedAt = undefined;
    scheduledReminders.set(reminderId, existing);

    console.log(`[Reminders] Snoozed reminder ${reminderId} for +${minutes}m -> ${newTime}`);
    return res.json({ success: true, newScheduledTime: newTime });
  } catch (error: any) {
    console.error('[Reminders] Snooze error:', error);
    return res.status(500).json({ error: 'Failed to snooze reminder.' });
  }
});

// Background Dispatch Engine (Checks every 10 seconds)
setInterval(async () => {
  const now = new Date();
  for (const [id, record] of scheduledReminders.entries()) {
    if (record.status === 'scheduled') {
      const targetTime = new Date(record.scheduledTime);
      if (now >= targetTime) {
        record.status = 'dispatched';
        record.dispatchedAt = now.toISOString();
        scheduledReminders.set(id, record);

        console.log(`[Reminders Engine] Triggering reminder "${record.title}". Dispatching to ${pushSubscriptions.size} subscribers...`);

        // Dispatch web-push to all matching subscriptions
        const payload = JSON.stringify({
          reminderId: record.reminderId,
          targetId: record.targetId,
          targetType: record.targetType,
          title: record.title,
          body: record.body,
          tag: `reminder-${record.reminderId}`,
        });

        for (const [subKey, subRecord] of pushSubscriptions.entries()) {
          try {
            await webpush.sendNotification(subRecord.subscription, payload);
            console.log(`[Reminders Engine] Push dispatched to subscription endpoint: ${subKey.slice(0, 35)}...`);
          } catch (err: any) {
            console.error('[Reminders Engine] Push send error:', err?.statusCode, err?.message);
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              // Expired subscription, remove
              pushSubscriptions.delete(subKey);
            }
          }
        }
      }
    }
  }
}, 10000);

// ==========================================
// Vite Dev Server / Static Asset Handler
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Eye of Agamotto] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Eye of Agamotto] Failed to start server:', err);
  process.exit(1);
});
