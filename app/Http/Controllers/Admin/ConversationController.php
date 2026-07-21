<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $conversations = Conversation::with(['user', 'event', 'messages' => function ($q) {
            $q->with('sender')->latest()->limit(1);
        }])
            ->latest('last_message_at')
            ->get()
            ->map(function ($conversation) {
                $conversation->unread_count = $conversation->unreadCount();
                $conversation->latest_message = $conversation->messages->first();
                return $conversation;
            });

        return Inertia::render('Admin/Messages/Index', [
            'conversations' => $conversations,
        ]);
    }

    public function show(Request $request, $id)
    {
        $conversation = Conversation::with(['user', 'event', 'messages.sender'])->findOrFail($id);

        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $conversation->messages->each->append('created_ago');

        return Inertia::render('Admin/Messages/Show', [
            'conversation' => $conversation,
            'messages' => $conversation->messages,
        ]);
    }

    public function reply(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);

        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => $validated['body'],
            'is_read' => true,
        ]);

        $conversation->update(['last_message_at' => now()]);

        $conversation->user->notify(new NewMessageNotification(
            conversationId: $conversation->id,
            senderName: 'Admin',
            messagePreview: mb_substr($validated['body'], 0, 100),
            routeName: 'user.messages.show',
        ));

        return redirect()->route('admin.messages.show', $conversation->id)
            ->with('success', 'Reply sent.');
    }

    public function close($id)
    {
        $conversation = Conversation::findOrFail($id);
        $conversation->close();

        return back()->with('success', 'Conversation closed.');
    }

    public function poll(Request $request, $id): JsonResponse
    {
        $conversation = Conversation::findOrFail($id);

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
