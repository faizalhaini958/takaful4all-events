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

    public function store(MediaUploadRequest $request): JsonResponse|RedirectResponse
    {
        $media = $this->mediaService->upload($request->file('file'));

        // Axios/XHR uploads (e.g. ImageUpload component) expect JSON
        if ($request->expectsJson()) {
            return response()->json(['media' => $media], 201);
        }

        // Inertia form submissions (e.g. Media Library page) get a redirect
        return redirect()->route('admin.media.index');
    }

    public function storeFromUrl(Request $request): JsonResponse
    {
        $request->validate(['url' => 'required|url']);

        $response = null;

        if ($this->isSpotifyUrl($request->url)) {
            $response = $this->fetchSpotifyThumbnail($request->url);
        } else {
            // YouTube maxresdefault may not exist for all videos — try then fall back to hqdefault
            $urls = [
                $request->url,
                str_replace('maxresdefault', 'hqdefault', $request->url),
            ];

            foreach ($urls as $url) {
                $res = Http::timeout(15)->get($url);
                if ($res->successful() && str_starts_with($res->header('Content-Type', ''), 'image/')) {
                    $response = $res;
                    break;
                }
            }
        }

        if (!$response) {
            return response()->json(['message' => 'Could not fetch thumbnail.'], 422);
        }

        $mime = $response->header('Content-Type', 'image/jpeg');
        $extension = str_contains($mime, 'png') ? '.png' : '.jpg';
        $tmpPath = tempnam(sys_get_temp_dir(), 'embed_thumb_') . $extension;
        file_put_contents($tmpPath, $response->body());

        $file  = new UploadedFile($tmpPath, 'embed-thumbnail' . $extension, $mime, null, true);
        $media = $this->mediaService->upload($file);

        @unlink($tmpPath);

        return response()->json(['media' => $media], 201);
    }

    private function isSpotifyUrl(string $url): bool
    {
        $hostname = parse_url($url, PHP_URL_HOST);
        if (!is_string($hostname)) {
            return false;
        }

        $hostname = str_replace('www.', '', strtolower($hostname));
        return in_array($hostname, ['spotify.com', 'open.spotify.com', 'play.spotify.com'], true);
    }

    private function fetchSpotifyThumbnail(string $url): ?\Illuminate\Http\Client\Response
    {
        $oEmbed = Http::timeout(15)->get('https://open.spotify.com/oembed', ['url' => $url]);
        if (!$oEmbed->successful()) {
            return null;
        }

        $thumbnailUrl = $oEmbed->json('thumbnail_url');
        if (!$thumbnailUrl) {
            return null;
        }

        $response = Http::timeout(15)->get($thumbnailUrl);
        if (!$response->successful() || !str_starts_with($response->header('Content-Type', ''), 'image/')) {
            return null;
        }

        return $response;
    }

    public function destroy(Media $media): RedirectResponse
    {
        $this->mediaService->delete($media);

        return redirect()->route('admin.media.index')
            ->with('success', 'File deleted.');
    }
}
