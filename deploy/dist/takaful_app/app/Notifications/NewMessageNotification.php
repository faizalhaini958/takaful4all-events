<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public int $conversationId,
        public string $senderName,
        public string $messagePreview,
        public string $routeName = 'user.messages.show',
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => "New message from {$this->senderName}",
            'body' => $this->messagePreview,
            'action_url' => route($this->routeName, $this->conversationId),
            'icon' => 'message',
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
