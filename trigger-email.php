<?php
$reg = App\Models\EventRegistration::find(50);
$reg->payment_status = 'pending';
$reg->save();
$reg->payment_status = 'paid';
$reg->save();
exit;
