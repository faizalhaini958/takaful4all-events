<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendBroadcastRequest;
use App\Mail\BroadcastMail;
use App\Models\BroadcastEmail;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Media;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class BroadcastController extends Controller
{
    public function create(): Response
    {
        $events = Event::where('is_published', true)
            ->orderBy('start_at', 'desc')
            ->select('id', 'title', 'start_at')
            ->get()
            ->map(function (Event $event) {
                $event->registrants_count = $this->countEventRegistrants($event->id);
                return $event;
            });

        return Inertia::render('Admin/Broadcast', [
            'events' => $events,
            'roles' => [
                ['value' => 'admin',         'label' => 'Admins'],
                ['value' => 'checkin_staff', 'label' => 'Check-in Staff'],
                ['value' => 'public',        'label' => 'Public Users'],
            ],
            'stats' => [
                'total_users'           => User::count(),
                'total_admin'           => User::where('role', 'admin')->count(),
                'total_checkin_staff'   => User::where('role', 'checkin_staff')->count(),
                'total_public'          => User::where('role', 'public')->count(),
                'total_event_registrants' => EventRegistration::distinct('email')->count('email'),
            ],
        ]);
    }

    public function store(SendBroadcastRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $recipients = $this->resolveRecipients($validated);

        if ($recipients->isEmpty()) {
            return redirect()->route('admin.broadcast.create')->with('error', 'No recipients found for the selected criteria.');
        }

        $subject = $validated['subject'];
        $body = $validated['body'];

        // Normalize encoding — contentEditable can emit invalid UTF-8 sequences
        $body = mb_convert_encoding($body, 'UTF-8', 'UTF-8');
        $body = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $body);

        $imageProcessing = $this->processBroadcastImages($body);
        $processedBody = $imageProcessing['body'];
        $embeddedMediaIds = $imageProcessing['embedded_ids'];

        $recipients->chunk(50)->each(function ($chunk) use ($subject, $processedBody, $embeddedMediaIds) {
            $chunk->each(function ($user) use ($subject, $processedBody, $embeddedMediaIds) {
                $replacements = ['{{name}}' => $user->name, '{{email}}' => $user->email];
                $personalizedSubject = str_replace(array_keys($replacements), array_values($replacements), $subject);
                $personalizedBody = str_replace(array_keys($replacements), array_values($replacements), $processedBody);
                Mail::to($user)->queue(new BroadcastMail($personalizedSubject, $personalizedBody, $user, $embeddedMediaIds));
            });
        });

        BroadcastEmail::create([
            'user_id'         => $request->user()->id,
            'subject'         => $subject,
            'body'            => $body,
            'recipient_type'  => $validated['recipient_type'],
            'recipient_label' => $this->recipientLabel($validated),
            'recipient_count' => $recipients->count(),
        ]);

        $message = sprintf(
            'Email broadcast queued successfully. It will be sent to %d recipient(s).',
            $recipients->count()
        );

        session()->flash('success', $message);

        return redirect()->route('admin.broadcast.create');
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        if ($request->filled('event_id')) {
            return $this->searchEventRegistrants($request);
        }

        $query = User::query()->select('id', 'name', 'email', 'role');

        if ($request->filled('q')) {
            $searchTerm = $request->input('q');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $users = $query->orderBy('name')->paginate(20, ['*'], 'page', $request->input('page', 1));

        return response()->json($users);
    }

    public function index(): JsonResponse
    {
        $emails = BroadcastEmail::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($emails);
    }

    public function show(int $id): JsonResponse
    {
        $email = BroadcastEmail::with('user:id,name')->findOrFail($id);

        return response()->json($email);
    }

    private function resolveRecipients(array $validated): Collection
    {
        return match ($validated['recipient_type']) {
            'all' => User::select('id', 'name', 'email')->get(),

            'role' => User::where('role', $validated['recipient_role'])
                ->select('id', 'name', 'email')
                ->get(),

            'event' => $this->resolveEventRecipients($validated['recipient_event_id']),

            'individual' => $this->resolveIndividualRecipients($validated['recipient_emails']),

            default => collect(),
        };
    }

    private function resolveEventRecipients(int $eventId): Collection
    {
        return EventRegistration::where('event_id', $eventId)
            ->whereIn('status', ['confirmed', 'attended'])
            ->select('name', 'email')
            ->get()
            ->unique('email')
            ->map(fn (EventRegistration $reg) => (object) ['name' => $reg->name, 'email' => $reg->email])
            ->values();
    }

    private function searchEventRegistrants(Request $request): JsonResponse
    {
        $eventId = $request->input('event_id');

        $registrantsQuery = EventRegistration::query()
            ->whereIn('id', function ($q) use ($eventId) {
                $q->selectRaw('MIN(id)')
                  ->from('event_registrations')
                  ->where('event_id', $eventId)
                  ->whereIn('status', ['confirmed', 'attended'])
                  ->groupBy('email');
            });

        if ($request->filled('q')) {
            $searchTerm = $request->input('q');
            $registrantsQuery->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $registrants = $registrantsQuery->orderBy('name')
            ->paginate(20, ['id', 'name', 'email'], 'page', $request->input('page', 1));

        $emails = $registrants->getCollection()->pluck('email');
        $usersByEmail = User::whereIn('email', $emails)
            ->select('id', 'email', 'role')
            ->get()
            ->keyBy('email');

        $registrants->setCollection(
            $registrants->getCollection()->map(function (EventRegistration $r) use ($usersByEmail) {
                $matchedUser = $usersByEmail->get($r->email);
                return [
                    'id'    => $matchedUser?->id ?? null,
                    'name'  => $r->name,
                    'email' => $r->email,
                    'role'  => $matchedUser?->role ?? null,
                ];
            })
        );

        return response()->json($registrants);
    }

    private function resolveIndividualRecipients(array $emails): Collection
    {
        $users = User::whereIn('email', $emails)
            ->select('id', 'name', 'email')
            ->get()
            ->keyBy('email');

        $missingEmails = array_values(array_diff($emails, $users->keys()->all()));

        $guestRegistrants = collect();

        if (! empty($missingEmails)) {
            $guestRegistrants = EventRegistration::whereIn('email', $missingEmails)
                ->select('name', 'email')
                ->distinct()
                ->get()
                ->unique('email')
                ->map(fn (EventRegistration $r) => (object) ['name' => $r->name, 'email' => $r->email])
                ->values();
        }

        $userObjects = $users->map(fn (User $u) => (object) ['name' => $u->name, 'email' => $u->email]);

        return $userObjects->concat($guestRegistrants)->values();
    }

    private function countEventRegistrants(int $eventId): int
    {
        return EventRegistration::where('event_id', $eventId)
            ->whereIn('status', ['confirmed', 'attended'])
            ->distinct()
            ->count('email');
    }

    private function recipientLabel(array $validated): string
    {
        return match ($validated['recipient_type']) {
            'all'        => 'All Users',
            'role'       => ucfirst($validated['recipient_role']),
            'event'      => Event::find($validated['recipient_event_id'])?->title ?? 'Event',
            'individual' => count($validated['recipient_emails'] ?? []) . ' selected user(s)',
            default      => 'Unknown',
        };
    }

    private function processBroadcastImages(string $body): array
    {
        // Strip editor-only image wrappers: extract img from wrapper div
        $body = preg_replace(
            '/<div contenteditable="false"[^>]*>(<img[^>]*data-media-id="\d+"[^>]*>).*?<\/div>/is',
            '$1',
            $body
        );

        if (!preg_match_all('/<img[^>]+data-media-id="(\d+)"[^>]*>/i', $body, $matches)) {
            return ['body' => $body, 'embedded_ids' => []];
        }

        $mediaIds = array_unique(array_map('intval', $matches[1]));
        $mediaItems = Media::whereIn('id', $mediaIds)->get()->keyBy('id');

        $embeddedIds = [];

        foreach ($matches[0] as $index => $fullTag) {
            $mediaId = (int) $matches[1][$index];
            $media = $mediaItems[$mediaId] ?? null;

            if (!$media) {
                continue;
            }

            $cid = 'embed-' . $media->id . '@broadcast';
            $embeddedIds[] = $media->id;

            $newTag = preg_replace(
                '/src="[^"]*"/i',
                'src="cid:' . $cid . '"',
                $fullTag
            );
            $body = str_replace($fullTag, $newTag, $body);
        }

        return ['body' => $body, 'embedded_ids' => array_unique($embeddedIds)];
    }
}
