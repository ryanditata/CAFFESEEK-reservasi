import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Check, ImageIcon, MapPin, Plus, PlusIcon, SearchIcon, UploadIcon, XIcon, Sofa} from 'lucide-react';
import { ChangeEvent, DragEvent, useEffect, useState } from 'react';

interface CafePhoto {
    id: number;
    url: string;
    is_primary: boolean;
}

interface CafeMenu {
    id?: number;
    name: string;
    category: string;
    price: number;
    photo_url?: string | null;
}

interface Facilities {
    colokan: boolean;
    wifi: boolean;
    indoor: boolean;
    outdoor: boolean;
    smoking_area: boolean;
    meeting_room: {
        available: boolean;
        capacity: number | null;
    };
}

interface CafeTable {
    id?: number;
    table_number: number | '';
    capacity: number | '';  
}

interface OperationalHours {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
}

interface Cafe {
    id: number;
    name: string;
    kategori: string;
    description: string;
    location: string;
    whatsapp: string,
    maps_embed_url: string | null;
    video_url?: string | null;
    operational_hours: OperationalHours;
    facilities: Facilities;
    photos: CafePhoto[];
    menus: CafeMenu[];
    tables: CafeTable[];
}

interface CafeMenuForm {
    id?: number;
    name: string;
    category: string;
    price: number | string;
    photo_url?: string | null;
    photoFile?: File | null;
}

interface UploadPreview {
    file: File;
    preview: string;
}

interface CafeFormState {
    id?: number;
    name: string;
    kategori: string;
    description: string;
    location: string;
    whatsapp: string;
    maps_embed_url: string;
    has_colokan: boolean;
    has_wifi: boolean;
    has_indoor: boolean;
    has_outdoor: boolean;
    has_smoking_area: boolean;
    meeting_room_available: boolean;
    meeting_room_capacity: string;
    operational_hours: OperationalHours;
    menus: CafeMenuForm[];
    newPhotos: UploadPreview[];
    existingPhotos: CafePhoto[];
    removedPhotoIds: number[];
    removedMenuIds: number[];
    videoFile: File | null;
    videoPreviewUrl: string | null;
    video_url: string | null;
    tables: CafeTable[];
    removedTableIds: number[];
}

interface Filters {
    search: string;
    facilities: string[];
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    cafes: Cafe[];
    filters: Filters;
    pagination: PaginationMeta;
}

const PLACEHOLDER_IMAGE = "https://placehold.co/80x80/DFDFDF/333?text=Img";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Caffe & Resto', href: '/admin/cafes' },
];

const facilityOptions = [
    { key: 'wifi', label: 'WiFi' },
    { key: 'colokan', label: 'Colokan' },
    { key: 'indoor', label: 'Indoor' },
    { key: 'outdoor', label: 'Outdoor' },
    { key: 'smoking_area', label: 'Smoking Area' },
    { key: 'meeting_room', label: 'Meeting Room' },
];

const dayOptions: Array<{ key: keyof OperationalHours; label: string }> = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
];

const defaultOperationalHours: OperationalHours = {
    monday: '08:00 - 22:00',
    tuesday: '08:00 - 22:00',
    wednesday: '08:00 - 22:00',
    thursday: '08:00 - 22:00',
    friday: '08:00 - 23:00',
    saturday: '08:00 - 23:00',
    sunday: '08:00 - 22:00',
};

const initialFormState: CafeFormState = {
    name: '',
    kategori: '',
    description: '',
    location: '',
    whatsapp: '',
    maps_embed_url: '',
    has_colokan: false,
    has_wifi: false,
    has_indoor: false,
    has_outdoor: false,
    has_smoking_area: false,
    meeting_room_available: false,
    meeting_room_capacity: '',
    operational_hours: defaultOperationalHours,
    menus: [],
    newPhotos: [],
    existingPhotos: [],
    removedPhotoIds: [],
    removedMenuIds: [],
    tables: [],
    removedTableIds: [],
    videoFile: null,
    videoPreviewUrl: null,
    video_url: null,
};

const revokePreviews = (items: UploadPreview[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.preview));
};

export default function CafesIndex({ cafes, filters, pagination }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>(filters.facilities || []);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
    const [formState, setFormState] = useState<CafeFormState>(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Cafe | null>(null);
    const [isInitialRender, setIsInitialRender] = useState(true);

    useEffect(() => {
        setSearchTerm(filters.search || '');
        setSelectedFacilities(filters.facilities || []);
    }, [filters.search, filters.facilities]);

    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
            return;
        }

        const debounce = setTimeout(() => {
            fetchCafes(1);
        }, 400);

        return () => clearTimeout(debounce);
    }, [searchTerm, selectedFacilities]);

    const fetchCafes = (page: number) => {
        router.get(
            '/admin/cafes',
            {
                page,
                search: searchTerm || undefined,
                facilities: selectedFacilities,
            },
            {
                replace: true,
                preserveScroll: true,
            },
        );
    };

    const resetForm = () => {
        setFormState((prev) => {
            revokePreviews(prev.newPhotos);
            if (prev.videoPreviewUrl) {
                URL.revokeObjectURL(prev.videoPreviewUrl);
            }
            return { ...initialFormState, operational_hours: { ...defaultOperationalHours } };
        });
        setErrors({});
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (cafe: Cafe) => {
        setSelectedCafe(cafe);
        setFormState((prev) => {
            revokePreviews(prev.newPhotos);
            if (prev.videoPreviewUrl) {
                URL.revokeObjectURL(prev.videoPreviewUrl);
            }

            return {
                id: cafe.id,
                name: cafe.name,
                kategori: cafe.kategori,
                description: cafe.description,
                location: cafe.location,
                whatsapp: cafe.whatsapp ,
                maps_embed_url: cafe.maps_embed_url || '',
                has_colokan: cafe.facilities.colokan,
                has_wifi: cafe.facilities.wifi,
                has_indoor: cafe.facilities.indoor,
                has_outdoor: cafe.facilities.outdoor,
                has_smoking_area: cafe.facilities.smoking_area,
                meeting_room_available: cafe.facilities.meeting_room.available,
                meeting_room_capacity: cafe.facilities.meeting_room.capacity?.toString() || '',
                operational_hours: cafe.operational_hours || { ...defaultOperationalHours },
                menus: cafe.menus.map((menu) => ({
                    ...menu,
                    price: menu.price,
                    photoFile: null,
                })),
                tables: cafe.tables.map(table => ({
                    id: table.id,
                    table_number: table.table_number,
                    capacity: table.capacity,
                })),
                existingPhotos: cafe.photos,
                newPhotos: [],
                removedPhotoIds: [],
                removedMenuIds: [],
                removedTableIds: [],
                videoFile: null,
                videoPreviewUrl: null,
                video_url: cafe.video_url || null,
            };
        });
        setErrors({});
        setIsEditModalOpen(true);
    };

    const openDetailModal = (cafe: Cafe) => {
        setSelectedCafe(cafe);
        setIsDetailModalOpen(true);
    };

    const handleCreateModalChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        setIsCreateModalOpen(open);
    };

    const handleEditModalChange = (open: boolean) => {
        if (!open) {
            resetForm();
            setSelectedCafe(null);
        }
        setIsEditModalOpen(open);
    };

    const handleDetailModalChange = (open: boolean) => {
        if (!open) {
            setSelectedCafe(null);
        }
        setIsDetailModalOpen(open);
    };

    const handleDeleteModalChange = (open: boolean) => {
        if (!open) {
            setDeleteTarget(null);
        }
        setIsDeleteModalOpen(open);
    };

    const handleFacilityFilterToggle = (facilityKey: string) => {
        setSelectedFacilities((prev) => {
            if (prev.includes(facilityKey)) {
                return prev.filter((item) => item !== facilityKey);
            }
            return [...prev, facilityKey];
        });
    };

    const handleOperationalHourChange = (day: keyof OperationalHours, value: string) => {
        setFormState((prev) => ({
            ...prev,
            operational_hours: {
                ...prev.operational_hours,
                [day]: value,
            },
        }));
    };

    const handleAddMenu = () => {
        setFormState((prev) => ({
            ...prev,
            menus: [
                ...prev.menus,
                {
                    id: undefined,
                    name: '',
                    category: '',
                    price: '',
                    photo_url: undefined,
                    photoFile: null,
                },
            ],
        }));
    };

    const handleMenuChange = (index: number, field: keyof CafeMenuForm, value: string | number | File | null) => {
        setFormState((prev) => {
            const menus = [...prev.menus];
            menus[index] = {
                ...menus[index],
                [field]: value,
            };
            return { ...prev, menus };
        });
    };

    const handleRemoveMenu = (index: number) => {
        setFormState((prev) => {
            const menus = [...prev.menus];
            const [removed] = menus.splice(index, 1);
            const removedMenuIds = [...prev.removedMenuIds];
            if (removed?.id) {
                removedMenuIds.push(removed.id);
            }
            return { ...prev, menus, removedMenuIds };
        });
    };

    const handleAddTable = () => {
        setFormState((prev) => ({
            ...prev,
            tables: [
                ...prev.tables,
                {
                    id: undefined,
                    table_number: '',
                    capacity: '',
                },
            ],
        }));
    };

    const handleTableChange = (index: number, field: keyof CafeTable, value: string | number) => {
        setFormState((prev) => {
            const tables = [...prev.tables];
            tables[index] = {
                ...tables[index],
                [field]: value,
            };
            return { ...prev, tables };
        });
    };

    const handleRemoveTable = (index: number) => {
        setFormState((prev) => {
            const tables = [...prev.tables];
            const [removed] = tables.splice(index, 1);
            const removedTableIds = [...prev.removedTableIds];
            
            if (removed?.id) {
                removedTableIds.push(removed.id);
            }
            
            return { ...prev, tables, removedTableIds };
        });
    };

    const handlePhotoInput = (files: FileList | null) => {
        if (!files) return;
        const fileArray = Array.from(files).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setFormState((prev) => ({
            ...prev,
            newPhotos: [...prev.newPhotos, ...fileArray],
        }));
    };

    const handlePhotoDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        handlePhotoInput(event.dataTransfer.files);
    };

    const removeNewPhoto = (index: number) => {
        setFormState((prev) => {
            const target = prev.newPhotos[index];
            if (target) {
                URL.revokeObjectURL(target.preview);
            }
            return {
                ...prev,
                newPhotos: prev.newPhotos.filter((_, i) => i !== index),
            };
        });
    };

    const removeExistingPhoto = (photoId: number) => {
        setFormState((prev) => ({
            ...prev,
            existingPhotos: prev.existingPhotos.filter((photo) => photo.id !== photoId),
            removedPhotoIds: [...prev.removedPhotoIds, photoId],
        }));
    };

    const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setFormState((prev) => {
            if (prev.videoPreviewUrl) {
                URL.revokeObjectURL(prev.videoPreviewUrl);
            }

            if (!file) {
                return { ...prev, videoFile: null, videoPreviewUrl: null };
            }

            return {
                ...prev,
                videoFile: file,
                videoPreviewUrl: URL.createObjectURL(file),
            };
        });
    };

    const buildFormData = () => {
        const payload = new FormData();
        payload.append('name', formState.name);
        payload.append('kategori', formState.kategori);
        payload.append('description', formState.description);
        payload.append('location', formState.location);
        payload.append('maps_embed_url', formState.maps_embed_url);
        payload.append('whatsapp', formState.whatsapp);

        Object.entries(formState.operational_hours).forEach(([day, value]) => {
            payload.append(`operational_hours[${day}]`, value);
        });

        payload.append('has_colokan', formState.has_colokan ? '1' : '0');
        payload.append('has_wifi', formState.has_wifi ? '1' : '0');
        payload.append('has_indoor', formState.has_indoor ? '1' : '0');
        payload.append('has_outdoor', formState.has_outdoor ? '1' : '0');
        payload.append('has_smoking_area', formState.has_smoking_area ? '1' : '0');
        payload.append('meeting_room_available', formState.meeting_room_available ? '1' : '0');

        if (formState.meeting_room_capacity) {
            payload.append('meeting_room_capacity', formState.meeting_room_capacity);
        }

        if (formState.videoFile) {
            payload.append('video', formState.videoFile);
        }

        formState.newPhotos.forEach(({ file }) => {
            payload.append('photos[]', file);
        });

        formState.menus.forEach((menu, index) => {
            if (menu.id) {
                payload.append(`menus[${index}][id]`, menu.id.toString());
            }
            payload.append(`menus[${index}][name]`, menu.name);
            payload.append(`menus[${index}][category]`, menu.category);
            payload.append(`menus[${index}][price]`, menu.price ? menu.price.toString() : '0');
            if (menu.photoFile) {
                payload.append(`menus[${index}][photo]`, menu.photoFile);
            }
        });

        formState.tables.forEach((table, index) => {
            if (table.id) {
                payload.append(`tables[${index}][id]`, table.id.toString());
            }
            payload.append(`tables[${index}][table_number]`, table.table_number ? table.table_number.toString() : '');
            payload.append(`tables[${index}][capacity]`, table.capacity ? table.capacity.toString() : '');
        });

        formState.removedPhotoIds.forEach((photoId, index) => {
            payload.append(`removed_photo_ids[${index}]`, photoId.toString());
        });

        formState.removedMenuIds.forEach((menuId, index) => {
            payload.append(`removed_menu_ids[${index}]`, menuId.toString());
        });

        formState.removedTableIds.forEach((tableId, index) => {
            payload.append(`removed_table_ids[${index}]`, tableId.toString());
        });

        formState.removedPhotoIds.forEach((photoId, index) => {
            payload.append(`removed_photo_ids[${index}]`, photoId.toString());
        });

        formState.removedMenuIds.forEach((menuId, index) => {
            payload.append(`removed_menu_ids[${index}]`, menuId.toString());
        });

        return payload;
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        setErrors({});

        const payload = buildFormData();

        if (isEditModalOpen && formState.id) {
            payload.append('_method', 'PUT');
            router.post(`/admin/cafes/${formState.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    resetForm();
                },
                onError: (formErrors) => {
                    setErrors(formErrors as Record<string, string>);
                },
                onFinish: () => setIsSubmitting(false),
            });
            return;
        }

        router.post('/admin/cafes', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetForm();
            },
            onError: (formErrors) => {
                setErrors(formErrors as Record<string, string>);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const confirmDelete = (cafe: Cafe) => {
        setDeleteTarget(cafe);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        router.delete(`/admin/cafes/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleWhatsappChange = (value : string) => {
        let cleaned = value.replace(/\D/g, "");

        if (cleaned.startsWith("08")) {
            cleaned = "628" + cleaned.substring(2);
        } 

        else if (cleaned.startsWith("8") && !cleaned.startsWith("62")) {
            cleaned = "62" + cleaned;
        } 

        if (cleaned.length > 15) {
            cleaned = cleaned.slice(0, 15);
        }

        setFormState({ ...formState, whatsapp: cleaned });
    };

    const renderFacilities = (facilities: Facilities) => {
        const facilityState: Record<string, boolean> = {
            wifi: facilities.wifi,
            colokan: facilities.colokan,
            indoor: facilities.indoor,
            outdoor: facilities.outdoor,
            smoking_area: facilities.smoking_area,
            meeting_room: facilities.meeting_room.available,
        };

        return (
            <div className="flex flex-wrap gap-2">
                {facilityOptions.map((facility) => {
                    const isActive = facilityState[facility.key];

                    if (!isActive) return null;

                    return (
                        <Badge key={facility.key} variant="outline">
                            {facility.label}
                        </Badge>
                    );
                })}
            </div>
        );
    };

    const getPrimaryPhotoUrl = (photos: CafePhoto[]): string => {
        const primary = photos.find(photo => photo.is_primary);
        return primary?.url || photos[0]?.url || PLACEHOLDER_IMAGE;
    };

    const tableRows = cafes.map((cafe) => {
        const photoUrl = getPrimaryPhotoUrl(cafe.photos);

        return (
        <TableRow key={cafe.id}>
            <TableCell className="max-w-xs">
                <div className="flex items-center gap-3">
                    <img 
                        src={photoUrl} 
                        alt={cafe.name} 
                        className="w-12 h-12 rounded object-cover flex-shrink-0" 
                    />
                    <div>
                        <div className="font-semibold">{cafe.name || "Tidak ada nama."}</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{cafe.description || "Tidak ada deskripsi."}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Badge className="w-fit text-xs">
                    {cafe.kategori || "Tanpa Kategori"}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{cafe.location || "Tidak ada lokasi."}</p>
                </div>
            </TableCell>
            <TableCell className="text-end">
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDetailModal(cafe)} className='cursor-pointer'>
                        Detail
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(cafe)} className='cursor-pointer'>
                        Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => confirmDelete(cafe)} className='cursor-pointer'>
                        Delete
                    </Button>
                </div>
            </TableCell>
        </TableRow>
        )
    });

    const renderMenuInputs = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Menu Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMenu} className='cursor-pointer'>
                    <Plus className="h-4 w-4" />
                    Add Menu
                </Button>
            </div>
            {formState.menus.length === 0 && <p className="text-sm text-muted-foreground">Belum ada menu ditambahkan.</p>}
            <div className="space-y-4">
                {formState.menus.map((menu, index) => (
                    <Card key={`menu-${index}`} className='p-4'>
                        <CardHeader className="flex flex-row items-center justify-between p-0">
                            <CardTitle className="text-sm font-semibold">Menu #{index + 1}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveMenu(index)} className='cursor-pointer'>
                                <XIcon className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Menu Name</Label>
                                <Input value={menu.name} onChange={(e) => handleMenuChange(index, 'name', e.target.value)} />
                                {errors[`menus.${index}.name`] && (
                                    <p className="text-sm text-red-600">{errors[`menus.${index}.name`]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input
                                    value={menu.category}
                                    onChange={(e) => handleMenuChange(index, 'category', e.target.value)}
                                />
                                {errors[`menus.${index}.category`] && (
                                    <p className="text-sm text-red-600">{errors[`menus.${index}.category`]}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Price (IDR)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={menu.price}
                                    onChange={(e) => handleMenuChange(index, 'price', e.target.value)}
                                />
                                {errors[`menus.${index}.price`] && (
                                    <p className="text-sm text-red-600">{errors[`menus.${index}.price`]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Photo (optional)</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleMenuChange(index, 'photoFile', e.target.files?.[0] || null)}
                                />
                                {menu.photo_url && (
                                    <p className="text-xs text-muted-foreground">Current photo will remain if not replaced.</p>
                                )}
                                {errors[`menus.${index}.photo`] && (
                                    <p className="text-sm text-red-600">{errors[`menus.${index}.photo`]}</p>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderTableInputs = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Table List</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddTable} className='cursor-pointer'>
                    <Plus className="h-4 w-4" />
                    Add Meja
                </Button>
            </div>
            {formState.tables.length === 0 && <p className="text-sm text-muted-foreground">Belum ada meja ditambahkan.</p>}
            
            <div className="space-y-4">
                {formState.tables.map((table, index) => (
                    <Card key={`table-${index}`} className="p-4">
                        <CardHeader className="flex flex-row items-center justify-between p-0">
                            <CardTitle className="text-sm font-semibold">Meja #{index + 1}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveTable(index)} className="h-6 w-6 cursor-pointer">
                                <XIcon className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Table Number</Label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    value={table.table_number} 
                                    onChange={(e) => handleTableChange(index, 'table_number', parseInt(e.target.value) || '')} 
                                />
                                {errors[`tables.${index}.table_number`] && (
                                    <p className="text-sm text-red-600">{errors[`tables.${index}.table_number`]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Capacity (Pax)</Label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    value={table.capacity} 
                                    onChange={(e) => handleTableChange(index, 'capacity', parseInt(e.target.value) || '')} 
                                />
                                {errors[`tables.${index}.capacity`] && (
                                    <p className="text-sm text-red-600">{errors[`tables.${index}.capacity`]}</p>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderPhotosSection = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Photos</Label>
                <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handlePhotoDrop}
                >
                    <UploadIcon className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">Drag & Drop photos here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                    <Input type="file" multiple accept="image/*" className="mt-4" onChange={(e) => handlePhotoInput(e.target.files)} />
                </div>
                {errors.photos && <p className="text-sm text-red-600">{errors.photos}</p>}
            </div>

            {formState.existingPhotos.length > 0 && (
                <div className="space-y-2">
                    <Label>Existing Photos</Label>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {formState.existingPhotos.map((photo) => (
                            <div key={photo.id} className="relative rounded-lg border p-2">
                                <img src={photo.url} alt="Cafe" className="h-32 w-full rounded object-cover" />
                                {photo.is_primary && (
                                    <Badge className="absolute left-2 top-2 bg-green-600 text-white">Primary</Badge>
                                )}
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute right-2 top-2 h-6 w-6 cursor-pointer"
                                    onClick={() => removeExistingPhoto(photo.id)}
                                >
                                    <XIcon className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {formState.newPhotos.length > 0 && (
                <div className="space-y-2">
                    <Label>New Photos</Label>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {formState.newPhotos.map((photo, index) => (
                            <div key={`${photo.preview}-${index}`} className="relative rounded-lg border p-2">
                                <img src={photo.preview} alt={photo.file.name} className="h-32 w-full rounded object-cover" />
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute right-2 top-2 h-6 w-6 cursor-pointer"
                                    onClick={() => removeNewPhoto(index)}
                                >
                                    <XIcon className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderVideoSection = () => (
        <div className="space-y-2">
            <Label>Promo Video (optional)</Label>
            <Input type="file" accept="video/*" onChange={handleVideoChange} />
            {(formState.videoPreviewUrl || formState.video_url) && (
                <video
                    controls
                    src={formState.videoPreviewUrl || formState.video_url || undefined}
                    className="mt-3 max-h-48 w-full rounded-lg border"
                />
            )}
            {errors.video && <p className="text-sm text-red-600">{errors.video}</p>}
        </div>
    );

    const renderForm = () => (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Nama Caffe & Resto</Label>
                    <Input value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} placeholder="Dimari Caffe 24 Jam"/>
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Input value={formState.kategori} onChange={(e) => setFormState({ ...formState, kategori: e.target.value })} placeholder="Caffe/Resto"/>
                    {errors.kategori && <p className="text-sm text-red-600">{errors.kategori}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Lokasi</Label>
                    <Input value={formState.location} onChange={(e) => setFormState({ ...formState, location: e.target.value })} placeholder="Semarang Tengah"/>
                    {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Google Maps Embed / URL</Label>
                    <Input value={formState.maps_embed_url} onChange={(e) => setFormState({ ...formState, maps_embed_url: e.target.value })} placeholder="Link URL"/>
                    {errors.maps_embed_url && <p className="text-sm text-red-600">{errors.maps_embed_url}</p>}
                </div>
                <div className="space-y-2">
                    <Label>No WhatsApp</Label>
                    <Input value={formState.whatsapp} onChange={(e) => handleWhatsappChange(e.target.value)} placeholder="6281234567890"/>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                    rows={4}
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Caffe 24 Jam di Semarang Tengah"
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <Separator />

            <div className="space-y-4">
                <Label className="text-base font-semibold">Operational Hours</Label>
                <div className="grid gap-4 md:grid-cols-2">
                    {dayOptions.map((day) => (
                        <div key={day.key} className="space-y-2">
                            <Label className="text-sm text-muted-foreground">{day.label}</Label>
                            <Input
                                value={formState.operational_hours[day.key]}
                                onChange={(e) => handleOperationalHourChange(day.key, e.target.value)}
                            />
                            {errors[`operational_hours.${day.key}`] && (
                                <p className="text-sm text-red-600">{errors[`operational_hours.${day.key}`]}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <Label className="text-base font-semibold">Facilities</Label>
                <div className="grid gap-4 md:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm font-medium cursor">
                        <Checkbox
                            checked={formState.has_wifi}
                            onCheckedChange={(checked) => setFormState({ ...formState, has_wifi: Boolean(checked) })}
                            className='cursor-pointer'
                        />
                        WiFi
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Checkbox
                            checked={formState.has_colokan}
                            onCheckedChange={(checked) => setFormState({ ...formState, has_colokan: Boolean(checked) })}
                            className='cursor-pointer'
                        />
                        Colokan
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Checkbox
                            checked={formState.has_indoor}
                            onCheckedChange={(checked) => setFormState({ ...formState, has_indoor: Boolean(checked) })}
                            className='cursor-pointer'
                        />
                        Indoor
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Checkbox
                            checked={formState.has_outdoor}
                            onCheckedChange={(checked) => setFormState({ ...formState, has_outdoor: Boolean(checked) })}
                            className='cursor-pointer'
                        />
                        Outdoor
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Checkbox
                            checked={formState.has_smoking_area}
                            onCheckedChange={(checked) => setFormState({ ...formState, has_smoking_area: Boolean(checked) })}
                            className='cursor-pointer'
                        />
                        Smoking Area
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <Checkbox
                            checked={formState.meeting_room_available}
                            onCheckedChange={(checked) => setFormState({ ...formState, meeting_room_available: Boolean(checked) })}
                            className='cursor-pointer'
                        />
                        Meeting Room
                    </label>
                </div>
                {formState.meeting_room_available && (
                    <div className="space-y-2">
                        <Label>Meeting Room Capacity</Label>
                        <Input
                            type="number"
                            min="1"
                            value={formState.meeting_room_capacity}
                            onChange={(e) => setFormState({ ...formState, meeting_room_capacity: e.target.value })}
                        />
                        {errors.meeting_room_capacity && (
                            <p className="text-sm text-red-600">{errors.meeting_room_capacity}</p>
                        )}
                    </div>
                )}
            </div>

            <Separator />

            {renderPhotosSection()}
            {renderVideoSection()}

            <Separator />
            
            {renderTableInputs()}

            <Separator />

            {renderMenuInputs()}

        </div>
    );

    const renderDetailModal = () => {
        if (!selectedCafe) return null;

        return (
            <Dialog open={isDetailModalOpen} onOpenChange={handleDetailModalChange}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedCafe.name}</DialogTitle>
                        <DialogTitle>{selectedCafe.kategori}</DialogTitle>
                        <DialogDescription>{selectedCafe.location}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
                            <p className="mt-2 text-sm text-foreground">{selectedCafe.description}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground">No WhatsApp</h4>
                            <p className="mt-2 text-sm text-foreground">{selectedCafe.whatsapp}</p>
                        </div>

                        {selectedCafe.maps_embed_url && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">Maps</h4>
                                <div className="w-full aspect-video rounded-lg overflow-hidden border">
                                    <div 
                                        className="w-sm"
                                        dangerouslySetInnerHTML={{ __html: selectedCafe.maps_embed_url }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Facilities</CardTitle>
                                </CardHeader>
                                <CardContent>{renderFacilities(selectedCafe.facilities)}</CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Operational Hours</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {dayOptions.map((day) => (
                                        <div className="flex items-center justify-between" key={day.key}>
                                            <span className="text-muted-foreground">{day.label}</span>
                                            <span className="font-medium">{selectedCafe.operational_hours[day.key]}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {selectedCafe.tables.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground">Meja</h4>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {selectedCafe.tables.map((table) => (
                                        <Card key={table.id} className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Sofa className="h-6 w-6 text-primary" />
                                                <div>
                                                    <p className="font-semibold text-lg">Meja {table.table_number}</p>
                                                    <p className="text-sm text-muted-foreground">{table.capacity} Orang</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedCafe.photos.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground">Gallery</h4>
                                <div className="mt-3 grid gap-4 md:grid-cols-3">
                                    {selectedCafe.photos.map((photo) => (
                                        <img
                                            key={photo.id}
                                            src={photo.url}
                                            alt={selectedCafe.name}
                                            className="h-40 w-full rounded-lg object-cover"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedCafe.video_url && (
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground">Promo Video</h4>
                                <video controls src={selectedCafe.video_url} className="mt-3 w-full rounded-lg" />
                            </div>
                        )}

                        {selectedCafe.menus.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground">Menu</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {selectedCafe.menus.map((menu) => (
                                        <Card key={menu.id}>
                                            <CardContent className="flex gap-2 items-center">
                                                {menu.photo_url ? (
                                                    <img
                                                        src={menu.photo_url}
                                                        alt={menu.name}
                                                        className="h-16 w-16 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold">{menu.name}</p>
                                                    <p className="text-sm text-muted-foreground">{menu.category}</p>
                                                    <p className="text-sm font-medium">{formatCurrency(menu.price)}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Caffe & Resto" />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Manajemen Caffe & Resto</h1>
                        <p className="text-muted-foreground">
                            Kelola katalog Caffe & Resto Anda
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={openCreateModal} className='cursor-pointer'>
                            <PlusIcon/>
                            Add Caffe & Resto
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 flex justify-center items-center">
                            <div className="relative max-w-xl ">
                                <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {facilityOptions.map((facility) => {
                                    const isActive = selectedFacilities.includes(facility.key);
                                    return (
                                        <Button
                                            key={facility.key}
                                            type="button"
                                            variant={isActive ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleFacilityFilterToggle(facility.key)}
                                            className='cursor-pointer'
                                        >
                                            {isActive && <Check className="mr-2 h-4 w-4" />}
                                            {facility.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Caffe & Resto</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead className="text-end">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cafes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                                <ImageIcon className="h-10 w-10" />
                                                <p>Tidak ada data Caffe & Resto yang cocok.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {tableRows}
                            </TableBody>
                        </Table>
                        {pagination.total > 0 && (
                            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing page {pagination.current_page} of {pagination.last_page} | Total {pagination.total} lokasi
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.current_page <= 1}
                                        onClick={() => fetchCafes(pagination.current_page - 1)}
                                        className='cursor-pointer'
                                    >
                                        Prev
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.current_page >= pagination.last_page}
                                        onClick={() => fetchCafes(pagination.current_page + 1)}
                                        className='cursor-pointer'
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={handleCreateModalChange}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tambah Caffe & Resto</DialogTitle>
                        <DialogDescription>Lengkapi seluruh detail di bawah ini untuk menambah data baru.</DialogDescription>
                    </DialogHeader>
                    {renderForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className='cursor-pointer'>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className='cursor-pointer'>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={handleEditModalChange}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Caffe & Resto</DialogTitle>
                        <DialogDescription>Perbarui informasi di bawah ini.</DialogDescription>
                    </DialogHeader>
                    {renderForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className='cursor-pointer'>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className='cursor-pointer'>
                            {isSubmitting ? 'Updating...' : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {renderDetailModal()}

            {/* Delete Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={handleDeleteModalChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus data Caffe & Resto?</DialogTitle>
                        <DialogDescription>
                            Aksi ini akan menghapus data {deleteTarget?.name}. Data dapat dipulihkan melalui soft delete di database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className='cursor-pointer'>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} className='cursor-pointer'>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
