
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This API route serves images from the local "output" directory
// URL format: /api/images/2024-02-12/postId/slide-01.png
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    // Await params first (Next.js 15+ requirement)
    const { path: segments } = await params;

    // Reconstruct the relative path
    const relativePath = path.join('output', ...segments);

    // Resolve to absolute path on the file system
    // We go up one level from 'web' to reach the root 'shadowfeed' directory
    const projectRoot = path.resolve(process.cwd(), '..');
    const filePath = path.join(projectRoot, relativePath);

    // Security check: ensure the resolved path is within the allowed output directory
    const allowedDir = path.join(projectRoot, 'output');
    if (!filePath.startsWith(allowedDir)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    try {
        if (!fs.existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';

        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
