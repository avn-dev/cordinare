<?php

use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\OfferController;
use App\Http\Controllers\Api\V1\SiteController;
use App\Http\Controllers\Api\V1\ShiftController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\TimeEntryController;
use App\Http\Controllers\Api\V1\AbsenceController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Middleware\SetTenantFromApiKey;
use App\Http\Middleware\SetTenantFromUser;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware(['throttle:leads', SetTenantFromApiKey::class])
    ->group(function () {
        Route::post('leads', [LeadController::class, 'store'])->name('api.v1.leads.store');
    });

Route::prefix('v1')
    ->name('api.v1.')
    ->middleware(['auth', 'verified', SetTenantFromUser::class])
    ->group(function () {
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('sites', SiteController::class);
        Route::apiResource('offers', OfferController::class);
        Route::post('offers/{offer}/send', [OfferController::class, 'send'])->name('offers.send');
        Route::apiResource('shifts', ShiftController::class);
        Route::apiResource('assignments', AssignmentController::class);
        Route::get('time-entries', [TimeEntryController::class, 'index'])->name('time-entries.index');
        Route::post('time-entries/check-in', [TimeEntryController::class, 'checkIn'])->name('time-entries.check-in');
        Route::post('time-entries/{timeEntry}/check-out', [TimeEntryController::class, 'checkOut'])->name('time-entries.check-out');
        Route::apiResource('absences', AbsenceController::class);
        Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    });
