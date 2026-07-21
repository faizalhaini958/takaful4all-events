<?php

namespace App\Mail;

use App\Models\Media;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Mime\Email as SymfonyEmail;
use Symfony\Component\Mime\Part\DataPart;

class BroadcastMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tries = 1;

    protected array $embeddedMediaIds;

    public function __construct(
        public readonly string $mailSubject,
        public readonly string $body,
        public readonly object $recipient,
        array $embeddedMediaIds = [],
    ) {
        $this->embeddedMediaIds = $embeddedMediaIds;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->mailSubject,
        );
    }

    public function content(): Content
    {
        $generalSettings = Setting::getGroup('general');

        return new Content(
            view: 'emails.broadcast',
            with: [
                'subject'       => $this->mailSubject,
                'body'          => $this->body,
                'recipientName' => $this->recipient->name,
                'siteName'      => $generalSettings['site_name'] ?? 'Takaful Events',
                'contactEmail'  => $generalSettings['contact_email'] ?? null,
                'contactPhone'  => $generalSettings['contact_phone'] ?? null,
            ],
        );
    }

    private function attachEmbeddedImages(): void
    {
        $mediaItems = Media::whereIn('id', $this->embeddedMediaIds)->get()->keyBy('id');

        if ($mediaItems->isEmpty()) {
            return;
        }

        $this->withSymfonyMessage(function (SymfonyEmail $email) use ($mediaItems) {
            foreach ($mediaItems as $media) {
                $disk = Storage::disk($media->disk);

                if (!$disk->exists($media->path)) {
                    Log::warning('BroadcastMail: embedded image not found on disk', [
                        'media_id' => $media->id,
                        'disk'     => $media->disk,
                        'path'     => $media->path,
                    ]);
                    continue;
                }

                $content = $disk->get($media->path);
                $mime    = $media->mime ?? 'image/jpeg';

                // Resize to max 600px wide while preserving aspect ratio (no crop)
                try {
                    if ($media->width && $media->width > 600) {
                        $manager = new \Intervention\Image\ImageManager(new \Intervention\Image\Drivers\Gd\Driver);
                        $image = $manager->read($content);
                        $image->scale(width: 600);
                        $content = (string) $image->toJpeg(85);
                        $mime = 'image/jpeg';
                    }
                } catch (\Exception $e) {
                    Log::warning('BroadcastMail: image resize failed, using original', [
                        'media_id' => $media->id,
                        'error'    => $e->getMessage(),
                    ]);
                }

                $filename = basename($media->path);
                $cid      = 'embed-' . $media->id . '@broadcast';

                $part = (new DataPart($content, $filename, $mime))
                    ->asInline()
                    ->setContentId($cid);

                $email->addPart($part);
            }
        });
    }

    protected function prepareMailableForDelivery(): void
    {
        if (!empty($this->embeddedMediaIds)) {
            $this->attachEmbeddedImages();
        }

        parent::prepareMailableForDelivery();
    }
}
