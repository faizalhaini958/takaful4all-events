<?php

namespace App\Console\Commands;

use App\Mail\RegistrationConfirmationMail;
use App\Models\EventRegistration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class PreviewConfirmationEmail extends Command
{
    protected $signature = 'email:preview-confirmation 
                            {registration_id : The ID of the EventRegistration to preview}
                            {--to= : Email address to send the preview to (optional)}';

    protected $description = 'Preview the registration confirmation email without going through real registration flow';

    public function handle(): int
    {
        $registrationId = $this->argument('registration_id');
        $recipientEmail = $this->option('to');

        try {
            // Load registration with all required relations
            $registration = EventRegistration::with(['event', 'ticket', 'attendees', 'invoice'])
                ->findOrFail($registrationId);

            $this->info("✓ Loaded registration #{$registrationId}: {$registration->reference_no}");
            $this->info("  Event: {$registration->event?->title}");
            $this->info("  Attendees: {$registration->attendees->count()}");
            $this->newLine();

            // Build the mailable
            $mailable = new RegistrationConfirmationMail($registration);

            if ($recipientEmail) {
                // Send actual email to the specified address
                $this->info("Sending email to: {$recipientEmail}");
                
                Mail::to($recipientEmail)->send($mailable);
                
                $this->info("✓ Email sent successfully to {$recipientEmail}");
                $this->newLine();
                $this->comment("Check your inbox at {$recipientEmail}");
            } else {
                // Render to HTML and save to storage
                $html = $mailable->render();
                
                $timestamp = now()->format('Y-m-d_His');
                $filename = "preview-{$registrationId}-{$timestamp}.html";
                $directory = 'email-previews';
                $relativePath = "{$directory}/{$filename}";
                
                // Ensure directory exists
                Storage::disk('local')->makeDirectory($directory);
                
                // Save HTML
                Storage::disk('local')->put($relativePath, $html);
                
                $fullPath = Storage::disk('local')->path($relativePath);
                
                $this->info("✓ Email preview saved to:");
                $this->comment("  {$fullPath}");
                $this->newLine();
                $this->comment("Open this file in your browser to preview the email.");
                $this->comment("Or send to a real email address using: --to=your@email.com");
            }

            return 0;

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $this->error("✗ Registration with ID {$registrationId} not found.");
            return 1;

        } catch (\Exception $e) {
            $this->error("✗ Failed to preview email:");
            $this->error("  " . $e->getMessage());
            $this->newLine();
            $this->comment("Stack trace:");
            $this->line($e->getTraceAsString());
            return 1;
        }
    }
}
