import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/auth';
import { z } from 'zod';

const FILE_NAME = 'focusflow_data.json';
const FOLDER = 'appDataFolder';

// Maximum allowed body size (1MB)
const MAX_BODY_SIZE = 1 * 1024 * 1024;

// Zod schema for validating sync POST body
const TaskSchema = z.object({
  id: z.string(),
  title: z.string().max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in-progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string().max(100)).max(50),
  createdAt: z.number(),
  completedAt: z.number().nullable(),
  timeSpent: z.number().min(0),
  deadline: z.number().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  calendarEventId: z.string().nullable().optional(),
});

const TimerSchema = z.object({
  timeLeft: z.number().min(0),
  isActive: z.boolean(),
  mode: z.enum(['focus', 'short-break', 'long-break']),
  linkedTaskId: z.string().nullable(),
});

const SettingsSchema = z.object({
  focusDuration: z.number().min(1).max(120),
  shortBreakDuration: z.number().min(1).max(60),
  longBreakDuration: z.number().min(1).max(60),
  autoStartBreaks: z.boolean(),
  autoStartPomodoros: z.boolean(),
});

const SyncBodySchema = z.object({
  tasks: z.array(TaskSchema).max(10000),
  timer: TimerSchema.optional(),
  settings: SettingsSchema.optional(),
  lastSynced: z.number().optional(),
});

export async function GET() {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drive = google.drive({ version: 'v3', auth });

    const listRes = await drive.files.list({
      q: `name = '${FILE_NAME}' and '${FOLDER}' in parents and trashed = false`,
      spaces: FOLDER,
      fields: 'files(id, name)',
    });

    const files = listRes.data.files;
    if (!files || files.length === 0) {
      return NextResponse.json({ data: null });
    }

    const fileId = files[0].id!;

    const fileRes = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    return NextResponse.json(fileRes.data);
  } catch (error) {
    console.error('Drive Sync GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync from Drive' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Content-Length to reject oversized payloads early
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large (max 1MB)' },
        { status: 413 }
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large (max 1MB)' },
        { status: 413 }
      );
    }

    // Parse and validate body
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const validation = SyncBodySchema.safeParse(parsedBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const drive = google.drive({ version: 'v3', auth });

    const listRes = await drive.files.list({
      q: `name = '${FILE_NAME}' and '${FOLDER}' in parents and trashed = false`,
      spaces: FOLDER,
      fields: 'files(id, name)',
    });

    const files = listRes.data.files;

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data),
    };

    if (files && files.length > 0) {
      const fileId = files[0].id!;
      await drive.files.update({
        fileId: fileId,
        media: media,
      });
      return NextResponse.json({ success: true, fileId });
    } else {
      const createRes = await drive.files.create({
        requestBody: {
          name: FILE_NAME,
          parents: [FOLDER],
        },
        media: media,
        fields: 'id',
      });
      return NextResponse.json({ success: true, fileId: createRes.data.id });
    }
  } catch (error) {
    console.error('Drive Sync POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync to Drive' },
      { status: 500 }
    );
  }
}
