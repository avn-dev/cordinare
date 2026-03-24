<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSiteRequest;
use App\Http\Requests\UpdateSiteRequest;
use App\Http\Resources\SiteResource;
use App\Models\Site;

class SiteController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Site::class);

        $sites = Site::query()
            ->latest()
            ->paginate(20);

        return SiteResource::collection($sites);
    }

    public function store(StoreSiteRequest $request)
    {
        $this->authorize('create', Site::class);

        $site = Site::create($request->validated());

        return (new SiteResource($site))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Site $site): SiteResource
    {
        $this->authorize('view', $site);

        return new SiteResource($site);
    }

    public function update(UpdateSiteRequest $request, Site $site): SiteResource
    {
        $this->authorize('update', $site);

        $site->update($request->validated());

        return new SiteResource($site);
    }

    public function destroy(Site $site)
    {
        $this->authorize('delete', $site);

        $site->delete();

        return response()->noContent();
    }
}
