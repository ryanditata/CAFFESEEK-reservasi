<?php

namespace App\Http\Controllers;

use App\Models\Cafe;
use App\Models\CafeMenu;
use App\Models\CafePhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CafeController extends Controller
{
    public function index(Request $request)
    {
        $query = Cafe::with(['photos', 'menus']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $facilityFilters = collect($request->input('facilities', []))->filter();
        $facilityMap = [
            'wifi' => 'has_wifi',
            'colokan' => 'has_colokan',
            'meeting_room' => 'meeting_room_available',
            'indoor' => 'has_indoor',
            'outdoor' => 'has_outdoor',
            'smoking_area' => 'has_smoking_area',
        ];

        foreach ($facilityFilters as $facilityKey) {
            if (isset($facilityMap[$facilityKey])) {
                $query->where($facilityMap[$facilityKey], true);
            }
        }

        $cafes = $query->latest()->paginate(10);

        $cafeItems = collect($cafes->items())->map(fn ($cafe) => self::transformCafe($cafe))->values()->all();

        if ($request->wantsJson()) {
            return response()->json([
                'cafes' => $cafeItems,
                'pagination' => $this->paginationMeta($cafes),
            ]);
        }

        return Inertia::render('admin/cafes/index', [
            'cafes' => $cafeItems,
            'filters' => [
                'search' => $request->input('search', ''),
                'facilities' => $facilityFilters->values()->all(),
            ],
            'pagination' => $this->paginationMeta($cafes),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateCafe($request);

        DB::transaction(function () use ($request, $validated) {
            $cafe = Cafe::create($this->buildCafePayload($request));

            $this->handleVideoUpload($request, $cafe);
            $this->handlePhotoUploads($request, $cafe);
            $this->syncMenus($request, $cafe);
        });

        return redirect()->route('cafes.index')->with('success', 'Caffe & Resto created successfully.');
    }

    public function show(Cafe $cafe)
    {
        if (request()->wantsJson()) {
            $cafe->load(['photos', 'menus']);

            return response()->json([
                'cafe' => self::transformCafe($cafe),
            ]);
        }

        abort(404);
    }

    public function update(Request $request, Cafe $cafe)
    {
        $validated = $this->validateCafe($request, $cafe->id);

        DB::transaction(function () use ($request, $cafe) {
            $cafe->update($this->buildCafePayload($request));

            if ($request->hasFile('video')) {
                $this->deleteStoredFile($cafe->video_url);
                $this->handleVideoUpload($request, $cafe);
            }

            $this->handlePhotoUploads($request, $cafe);
            $this->removeMarkedPhotos($request, $cafe);

            $this->syncMenus($request, $cafe);
            $this->removeMarkedMenus($request, $cafe);
        });

        return redirect()->route('cafes.index')->with('success', 'Caffe & Resto updated successfully.');
    }

    public function destroy(Cafe $cafe)
    {
        $cafe->delete();

        return redirect()->route('cafes.index')->with('success', 'Caffe & Resto removed.');
    }

    private function validateCafe(Request $request, ?int $cafeId = null): array
    {
        $rules = [
            'name' => 'required|string|max:255',
            'kategori' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'operational_hours' => 'required|array',
            'operational_hours.monday' => 'required|string|max:255',
            'operational_hours.tuesday' => 'required|string|max:255',
            'operational_hours.wednesday' => 'required|string|max:255',
            'operational_hours.thursday' => 'required|string|max:255',
            'operational_hours.friday' => 'required|string|max:255',
            'operational_hours.saturday' => 'required|string|max:255',
            'operational_hours.sunday' => 'required|string|max:255',
            'meeting_room_capacity' => 'nullable|integer|min:1',
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo|max:51200',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:5120',
            'menus' => 'nullable|array',
            'menus.*.id' => 'nullable|exists:cafe_menus,id',
            'menus.*.name' => 'required|string|max:255',
            'menus.*.category' => 'required|string|max:255',
            'menus.*.price' => 'required|numeric|min:0',
            'menus.*.photo' => 'nullable|image|max:5120',
            'removed_photo_ids' => 'nullable|array',
            'removed_photo_ids.*' => 'exists:cafe_photos,id',
            'removed_menu_ids' => 'nullable|array',
            'removed_menu_ids.*' => 'exists:cafe_menus,id',
        ];

        if ($request->boolean('meeting_room_available')) {
            $rules['meeting_room_capacity'] = 'required|integer|min:1';
        }

        return $request->validate($rules);
    }

    private function buildCafePayload(Request $request): array
    {
        return [
            'name' => $request->input('name'),
            'kategori' => $request->input('kategori'),
            'description' => $request->input('description'),
            'location' => $request->input('location'),
            'operational_hours' => $request->input('operational_hours', []),
            'has_colokan' => $request->boolean('has_colokan'),
            'has_wifi' => $request->boolean('has_wifi'),
            'has_indoor' => $request->boolean('has_indoor'),
            'has_outdoor' => $request->boolean('has_outdoor'),
            'has_smoking_area' => $request->boolean('has_smoking_area'),
            'meeting_room_available' => $request->boolean('meeting_room_available'),
            'meeting_room_capacity' => $request->filled('meeting_room_capacity') ? $request->input('meeting_room_capacity') : null,
        ];
    }

    private function handleVideoUpload(Request $request, Cafe $cafe): void
    {
        if ($request->hasFile('video')) {
            $videoPath = $request->file('video')->store('cafes/videos', 'public');
            $cafe->update([
                'video_url' => Storage::url($videoPath),
            ]);
        }
    }

    private function handlePhotoUploads(Request $request, Cafe $cafe): void
    {
        if (!$request->hasFile('photos')) {
            return;
        }

        $sortStart = ($cafe->photos()->max('sort_order') ?? -1) + 1;
        $hasExistingPhotos = $cafe->photos()->exists();

        foreach ($request->file('photos') as $index => $photo) {
            $path = $photo->store('cafes/photos', 'public');

            CafePhoto::create([
                'cafe_id' => $cafe->id,
                'url' => Storage::url($path),
                'is_primary' => !$hasExistingPhotos && $index === 0,
                'sort_order' => $sortStart + $index,
            ]);
        }
    }

    private function removeMarkedPhotos(Request $request, Cafe $cafe): void
    {
        $photoIds = $request->input('removed_photo_ids', []);

        if (empty($photoIds)) {
            return;
        }

        $photos = CafePhoto::whereIn('id', $photoIds)->where('cafe_id', $cafe->id)->get();

        foreach ($photos as $photo) {
            $this->deleteStoredFile($photo->url);
            $photo->delete();
        }

        if (!$cafe->photos()->where('is_primary', true)->exists()) {
            $nextPrimary = $cafe->photos()->orderBy('sort_order')->first();
            if ($nextPrimary) {
                $nextPrimary->update(['is_primary' => true]);
            }
        }
    }

    private function syncMenus(Request $request, Cafe $cafe): void
    {
        $menus = $request->input('menus', []);

        foreach ($menus as $index => $menuData) {
            $menu = null;
            if (!empty($menuData['id'])) {
                $menu = CafeMenu::where('cafe_id', $cafe->id)
                    ->where('id', $menuData['id'])
                    ->first();
            }

            if (!$menu) {
                $menu = new CafeMenu(['cafe_id' => $cafe->id]);
            }

            $menu->name = $menuData['name'] ?? '';
            $menu->category = $menuData['category'] ?? '';
            $menu->price = $menuData['price'] ?? 0;

            if ($request->hasFile("menus.{$index}.photo")) {
                $this->deleteStoredFile($menu->photo_url);
                $photoPath = $request->file("menus.{$index}.photo")->store('cafes/menus', 'public');
                $menu->photo_url = Storage::url($photoPath);
            }

            $menu->save();
        }
    }

    private function removeMarkedMenus(Request $request, Cafe $cafe): void
    {
        $menuIds = $request->input('removed_menu_ids', []);

        if (empty($menuIds)) {
            return;
        }

        $menus = CafeMenu::whereIn('id', $menuIds)->where('cafe_id', $cafe->id)->get();

        foreach ($menus as $menu) {
            $this->deleteStoredFile($menu->photo_url);
            $menu->delete();
        }
    }

    private function deleteStoredFile(?string $publicUrl): void
    {
        if (!$publicUrl) {
            return;
        }

        $path = parse_url($publicUrl, PHP_URL_PATH);
        $path = ltrim(str_replace('/storage/', '', $path), '/');

        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    public static function transformCafe(Cafe $cafe): array
    {
        return [
            'id' => $cafe->id,
            'name' => $cafe->name,
            'kategori' => $cafe->kategori,
            'description' => $cafe->description,
            'location' => $cafe->location,
            'video_url' => $cafe->video_url,
            'operational_hours' => $cafe->operational_hours,
            'facilities' => [
                'colokan' => $cafe->has_colokan,
                'wifi' => $cafe->has_wifi,
                'indoor' => $cafe->has_indoor,
                'outdoor' => $cafe->has_outdoor,
                'smoking_area' => $cafe->has_smoking_area,
                'meeting_room' => [
                    'available' => $cafe->meeting_room_available,
                    'capacity' => $cafe->meeting_room_capacity,
                ],
            ],
            'photos' => $cafe->photos->map(fn ($photo) => [
                'id' => $photo->id,
                'url' => $photo->url,
                'is_primary' => $photo->is_primary,
            ])->values()->all(),
            'menus' => $cafe->menus->map(fn ($menu) => [
                'id' => $menu->id,
                'name' => $menu->name,
                'category' => $menu->category,
                'price' => $menu->price,
                'photo_url' => $menu->photo_url,
            ])->values()->all(),
        ];
    }

    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
