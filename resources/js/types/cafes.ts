export interface CafePhoto {
  id: number;
  url: string;
  is_primary: boolean;
}

export interface CafeMenu {
  id?: number;
  name: string;
  category: string;
  price: number;
  photo_url?: string | null;
}

export interface Facilities {
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

export interface CafeTable {
  id?: number;
  table_number: number | '';
  capacity: number | '';  
}

export interface OperationalHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Cafe {
  id: number;
  name: string;
  kategori: string;
  description: string;
  location: string;
  whatsapp: string;
  maps_embed_url: string | null;
  video_url?: string | null;
  operational_hours: OperationalHours;
  facilities: Facilities;
  photos: CafePhoto[];
  menus: CafeMenu[];
  tables: CafeTable[];
}
