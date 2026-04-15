<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MediaUploadRequest;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function __construct(private MediaService $mediaService) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Media/Index', [
            'media' => Media::latest()->paginate(24)->withQueryString(),
        ]);
    }

    public function store(MediaUploadRequest $request): RedirectResponse
    {
        $this->mediaService->upload($request->file('file'));

        return redirect()->route('admin.media.index');
    }

    public function storeFromUrl(Request $request): JsonResponse
    {
        $request->validate(['url' => 'required|url']);

        // YouTube maxresdefault may not exist for all videos — try then fall back to hqdefault
        $urls = [
            $request->url,
            str_replace('maxresdefault', 'hqdefault', $request->url),
        ];

        $response = null;
        foreach ($urls as $url) {
            $res = Http::timeout(15)->get($url);
            if ($res->successful() && str_starts_with($res->header('Content-Type', ''), 'image/')) {
                $response = $res;
                break;
            }
        }

        if (!$response) {
            return response()->json(['message' => 'Could not fetch YouTube thumbnail.'], 422);
        }

        $tmpPath = tempnam(sys_get_temp_dir(), 'yt_thumb_') . '.jpg';
        file_put_contents($tmpPath, $response->body());

        $file  = new UploadedFile($tmpPath, 'youtube-thumbnail.jpg', 'image/jpeg', null, true);
        $media = $this->mediaService->upload($file);

        @unlink($tmpPath);

        return response()->json(['media' => $media], 201);
    }

    public function destroy(Media $media): RedirectResponse
    {
        $this->mediaService->delete($media);

        return redirect()->route('admin.media.index')
            ->with('success', 'File deleted.');
    }
}
