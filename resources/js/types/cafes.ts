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