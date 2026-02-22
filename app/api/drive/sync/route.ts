import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/auth';

const FILE_NAME = 'focusflow_data.json';
// Use 'appDataFolder' for private app data, or 'root' for user visibility.
// The prompt suggests "App Data Folder or root".
// 'appDataFolder' is cleaner.
const FOLDER = 'appDataFolder'; 

export async function GET() {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drive = google.drive({ version: 'v3', auth });

    // Find the file
    const listRes = await drive.files.list({
      q: `name = '${FILE_NAME}' and '${FOLDER}' in parents and trashed = false`,
      spaces: FOLDER,
      fields: 'files(id, name)',
    });

    const files = listRes.data.files;
    if (!files || files.length === 0) {
      return NextResponse.json({ data: null }); // No file found
    }

    const fileId = files[0].id!;

    // Get file content
    const fileRes = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    return NextResponse.json(fileRes.data);
  } catch (error) {
    console.error('Drive Sync GET Error:', error);
    return NextResponse.json({ error: 'Failed to sync from Drive' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const drive = google.drive({ version: 'v3', auth });

    // Find the file
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
      // Update existing file
      const fileId = files[0].id!;
      await drive.files.update({
        fileId: fileId,
        media: media,
      });
      return NextResponse.json({ success: true, fileId });
    } else {
      // Create new file
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
    return NextResponse.json({ error: 'Failed to sync to Drive' }, { status: 500 });
  }
}
