<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $filters = [
            'role' => $request->string('role')->toString(),
            'search' => $request->string('search')->toString(),
        ];

        $users = User::query()
            ->when($filters['role'], fn ($query, $role) => $query->where('role', $role))
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => UserResource::collection($users),
            'filters' => $filters,
            'roles' => $this->roleOptions(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', User::class);

        return Inertia::render('users/create', [
            'roles' => $this->roleOptions(),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $user = User::create($request->validated());

        return redirect()
            ->route('users.edit', $user)
            ->with('success', 'Mitarbeiter angelegt.');
    }

    public function edit(User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('users/edit', [
            'user' => UserResource::make($user)->resolve(),
            'roles' => $this->roleOptions(),
            'canDelete' => $user->id !== request()->user()?->id,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $payload = $request->validated();
        if (empty($payload['password'])) {
            unset($payload['password']);
        }

        $user->update($payload);

        return redirect()
            ->route('users.edit', $user)
            ->with('success', 'Mitarbeiter aktualisiert.');
    }

    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('success', 'Mitarbeiter gelöscht.');
    }

    private function roleOptions(): array
    {
        return array_map(
            fn (UserRole $role) => [
                'value' => $role->value,
                'label' => match ($role) {
                    UserRole::FirmAdmin => 'Firmenadmin',
                    UserRole::Dispatcher => 'Disponent',
                    UserRole::Hr => 'HR',
                    UserRole::Employee => 'Mitarbeiter',
                    UserRole::Superadmin => 'Superadmin',
                    default => ucfirst(str_replace('_', ' ', $role->value)),
                },
            ],
            UserRole::internalRoles(),
        );
    }
}
