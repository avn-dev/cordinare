<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Terminbestätigung</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827;">
    <h2>Terminbestätigung Besichtigung</h2>
    <div style="font-size: 14px; line-height: 1.6;">
        {!! nl2br(e($appointment->email_body ?? '')) !!}
    </div>
</body>
</html>
