<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Event;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserConversationController extends Controller
{
    public function index(Request $request)
    {
        $conversations = Conversation::with(['user', 'event', 'messages' => function ($q) {
            $q->with('sender')->latest()->limit(1);
        }])
            ->forUser($request->user()->id)
            ->latest('last_message_at')
            ->get()
            ->map(function ($conversation) {
                $conversation->unread_count = $conversation->unreadCount();
                $conversation->latest_message = $conversation->messages->first();
                return $conversation;
            });

        return Inertia::render('User/Messages/Index', [
            'conversations' => $conversations,
        ]);
    }

    public function show(Request $request, $id)
    {
        $conversation = Conversation::with(['user', 'event', 'messages.sender'])
            ->forUser($request->user()->id)
            ->findOrFail($id);

        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $conversation->messages->each->append('created_ago');

        return Inertia::render('User/Messages/Show', [
            'conversation' => $conversation,
            'messages' => $conversation->messages,
        ]);
    }

    public function create(Request $request)
    {
        $events = Event::published()->orderBy('start_at', 'desc')->get(['id', 'title', 'slug']);

        return Inertia::render('User/Messages/Create', [
            'events' => $events,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'event_id' => 'nullable|exists:events,id',
            'body' => 'required|string|max:5000',
        ]);

        $conversation = Conversation::create([
            'user_id' => $request->user()->id,
            'event_id' => $validated['event_id'] ?? null,
            'subject' => $validated['subject'],
            'status' => 'open',
            'last_message_at' => now(),
        ]);

        $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => $validated['body'],
            'is_read' => true,
        ]);

        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new NewMessageNotification(
                conversationId: $conversation->id,
                senderName: $request->user()->name,
                messagePreview: mb_substr($validated['body'], 0, 100),
                routeName: 'admin.messages.show',
            ));
        }

        return redirect()->route('user.messages.show', $conversation->id)
            ->with('success', 'Message sent successfully.');
    }

    public function reply(Request $request, $id)
    {
        $conversation = Conversation::forUser($request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => $validated['body'],
            'is_read' => true,
        ]);

        $conversation->update(['last_message_at' => now()]);

        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new NewMessageNotification(
                conversationId: $conversation->id,
                senderName: $request->user()->name,
                messagePreview: mb_substr($validated['body'], 0, 100),
                routeName: 'admin.messages.show',
            ));
        }

        return redirect()->route('user.messages.show', $conversation->id);
    }

    public function poll(Request $request, $id): JsonResponse
    {
        $conversation = Conversation::forUser($request->user()->id)->findOrFail($id);

        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = $conversation->messages()->with('sender')->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'conversation_id' => $m->conversation_id,
                'sender_id' => $m->sender_id,
                'body' => $m->body,
                'is_read' => $m->is_read,
                'sender' => $m->sender ? ['id' => $m->sender->id, 'name' => $m->sender->name] : null,
                'created_ago' => $m->created_at->diffForHumans(),
                'created_at' => $m->created_at->toISOString(),
            ]);

        return response()->json([
            'messages' => $messages,
            'status' => $conversation->status,
        ]);
    }
}
