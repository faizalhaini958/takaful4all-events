<?php

namespace App\Http\Requests;

class UpdateEventRequest extends StoreEventRequest
{
    // Inherits all rules from StoreEventRequest.
    // The slug uniqueness rule already handles the current event via route model binding.
}
