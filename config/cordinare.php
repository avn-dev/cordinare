<?php

return [
    'lead_api_key_header' => env('CORDINARE_LEAD_API_KEY_HEADER', 'X-Lead-Api-Key'),
    'check_in_early_minutes' => env('CORDINARE_CHECK_IN_EARLY_MINUTES', 60),
    'check_in_late_minutes' => env('CORDINARE_CHECK_IN_LATE_MINUTES', 120),
    'geofence_radius_meters' => env('CORDINARE_GEOFENCE_RADIUS_METERS', 300),
];
