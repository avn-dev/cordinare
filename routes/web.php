<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\LeadInboxController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\TimeEntryController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ShiftTemplateController;
use App\Http\Controllers\EmployeePortalController;
use App\Http\Controllers\ServiceReportController;
use App\Http\Controllers\PublicQmController;
use App\Http\Controllers\SiteIssueController;
use App\Http\Controllers\InspectionAppointmentController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('qm/{token}', [PublicQmController::class, 'show'])
    ->where('token', '[A-Za-z0-9]{40}')
    ->name('qm.public.show');
Route::post('qm/{token}', [PublicQmController::class, 'store'])
    ->where('token', '[A-Za-z0-9]{40}')
    ->name('qm.public.store');

Route::middleware(['auth', 'verified'])
    ->group(function () {
        Route::get('qm/issues', [SiteIssueController::class, 'index'])->name('qm.issues.index');
        Route::get('qm/issues/{issue}', [SiteIssueController::class, 'show'])->name('qm.issues.show');
        Route::patch('qm/issues/{issue}', [SiteIssueController::class, 'update'])->name('qm.issues.update');
        Route::get('qm/issues/{issue}/files/{file}', [SiteIssueController::class, 'file'])->name('qm.issues.file');
        Route::get('qm/issues/{issue}/files/{file}/download', [SiteIssueController::class, 'download'])->name('qm.issues.download');
        Route::get('inspections', [InspectionAppointmentController::class, 'index'])->name('inspections.index');
        Route::post('inspections', [InspectionAppointmentController::class, 'store'])->name('inspections.store');
        Route::patch('inspections/{appointment}', [InspectionAppointmentController::class, 'update'])->name('inspections.update');
        Route::post('inspections/{appointment}/resend', [InspectionAppointmentController::class, 'resend'])->name('inspections.resend');
        Route::get('inspections/{appointment}/preview', [InspectionAppointmentController::class, 'preview'])->name('inspections.preview');
        Route::get('inspections/{appointment}/compose', [InspectionAppointmentController::class, 'compose'])->name('inspections.compose');
        Route::get('inspections/calendar', [InspectionAppointmentController::class, 'calendar'])->name('inspections.calendar');
        Route::get('leads', [LeadInboxController::class, 'index'])->name('leads.index');
        Route::get('leads/{lead}', [LeadController::class, 'show'])->name('leads.show');
        Route::post('leads/{lead}/convert', [LeadController::class, 'convert'])->name('leads.convert');
        Route::resource('customers', CustomerController::class);
        Route::resource('users', UserController::class)->except(['show']);
        Route::resource('sites', SiteController::class)->except(['show']);
        Route::resource('offers', OfferController::class);
        Route::post('offers/{offer}/send', [OfferController::class, 'send'])->name('offers.send');
        Route::get('offers/{offer}/pdf', [OfferController::class, 'pdf'])->name('offers.pdf');
        Route::get('offers/{offer}/service-report', [ServiceReportController::class, 'edit'])->name('offers.service-report.edit');
        Route::put('offers/{offer}/service-report', [ServiceReportController::class, 'update'])->name('offers.service-report.update');
        Route::get('offers/{offer}/service-report/pdf', [ServiceReportController::class, 'pdf'])->name('offers.service-report.pdf');
        Route::get('sites/{site}/service-report/pdf', [ServiceReportController::class, 'sitePdf'])->name('sites.service-report.pdf');
        Route::resource('inventory', InventoryController::class)->except(['show']);
        Route::get('my', [EmployeePortalController::class, 'index'])->name('employee.portal');
        Route::post('my/check-in', [EmployeePortalController::class, 'checkIn'])->name('employee.check-in');
        Route::post('my/time-entries/{timeEntry}/check-out', [EmployeePortalController::class, 'checkOut'])->name('employee.check-out');
        Route::post('shift-templates/generate', [ShiftTemplateController::class, 'generate'])->name('shift-templates.generate');
        Route::resource('shift-templates', ShiftTemplateController::class)->except(['show']);
        Route::resource('shifts', ShiftController::class);
        Route::get('time-entries', [TimeEntryController::class, 'index'])->name('time-entries.index');
        Route::get('time-entries/export/csv', [TimeEntryController::class, 'export'])->name('time-entries.export');
        Route::get('absences/export/csv', [AbsenceController::class, 'export'])->name('absences.export');
        Route::resource('absences', AbsenceController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::get('audit-logs/export/csv', [AuditLogController::class, 'export'])->name('audit-logs.export');
        Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    });

require __DIR__.'/settings.php';
