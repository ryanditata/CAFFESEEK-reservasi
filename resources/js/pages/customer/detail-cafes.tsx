import { Cigarette, DoorClosed, MapPin, PlayCircle, Plug, SunMedium, Users, Wifi, Sofa } from "lucide-react";
import { LucideIcon, ArrowLeft, ImageIcon } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import Lenis from "@studio-freight/lenis";
import { router } from "@inertiajs/react";

interface CafePhoto {
    id: number;
    url: string;
    is_primary: boolean;
}

interface CafeMenu {
    id: number;
    name: string;
    category: string;
    price: number;
    photo_url?: string | null;
}

interface CafeTable {
    id: number;
    table_number: number;
    capacity: number;
}

interface MeetingRoomFacility {
    available: boolean;
    capacity: number | null;
}

interface Facilities {
    colokan: boolean;
    wifi: boolean;
    indoor: boolean;
    outdoor: boolean;
    smoking_area: boolean;
    meeting_room: MeetingRoomFacility;
}

type OperationalHours = Record<string, string>;

export interface CafeDetail {
    id: number;
    name: string;
    kategori: string;
    description: string;
    location: string;
    maps_embed_url: string | null;
    video_url?: string | null;
    operational_hours: OperationalHours;
    facilities: Facilities;
    photos: CafePhoto[];
    menus: CafeMenu[];
    tables: CafeTable[];
}

type FacilityKey = "colokan" | "wifi" | "indoor" | "outdoor" | "smoking_area" | "meeting_room";

const PLACEHOLDER_IMAGE = "https://placehold.co/800x600/DFDFDF/333?text=CaffeSeek";

const facilityConfig: Record<
    FacilityKey,
    { label: string; icon: LucideIcon; getTrailingText?: (facilities: Facilities) => string | null }> = {
    colokan: { label: "Colokan", icon: Plug },
    wifi: { label: "WiFi", icon: Wifi },
    indoor: { label: "Indoor", icon: DoorClosed },
    outdoor: { label: "Outdoor", icon: SunMedium },
    smoking_area: { label: "Smoking Area", icon: Cigarette },
    meeting_room: {
        label: "Meeting Room",
        icon: Users,
        getTrailingText: (facilities) =>
            facilities.meeting_room.available && facilities.meeting_room.capacity
                ? `${facilities.meeting_room.capacity} pax`
                : null,
    },
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
});

export default function DetailCafes({ cafe }: { cafe: CafeDetail }) {
    const [offsetY, setOffsetY] = useState(0);
    const selectedCafe = cafe;

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        const raf = (time: number) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };

        requestAnimationFrame(raf);

        const onScroll = (e: { scroll: number }) => setOffsetY(e.scroll);
        lenis.on("scroll", onScroll);

        return () => {
            lenis.off("scroll", onScroll);
            lenis.destroy();
        };
    }, []);

    const operationalEntries = useMemo(
        () => Object.entries(selectedCafe.operational_hours ?? {}),
        [selectedCafe.operational_hours],
    );

    const galleryPhotos = selectedCafe.photos ?? [];
    const primaryPhoto = galleryPhotos.find((photo) => photo.is_primary) ?? galleryPhotos[0];

    const handleReservationClick = () => {
        if (!selectedCafe || typeof window === "undefined") {
            return;
        }
        window.open(`/reservasi?cafe=${selectedCafe.id}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-background text-[#1F1F1F]">

            {/* Navbar */}
            <nav className="w-full sticky top-0 z-99 bg-white shadow-md">
                <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 md:px-6 lg:px-0 py-6 md:py-8">
                    <button
                        onClick={() => router.get("/")}
                        className="flex items-center gap-2 text-black hover:text-gray-600 transition cursor-pointer"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                </div>
            </nav>

            {/* Detail Caffe & Resto */}
            <section id={`detail-cafes-${selectedCafe.id}`} className="bg-white py-5 md:py-10">
                <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-0">
                    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                        <div className="space-y-6">
                            <div className="relative overflow-hidden rounded-[32px] bg-[#F5F5F5]">
                                <img
                                    src={primaryPhoto?.url || PLACEHOLDER_IMAGE}
                                    alt={selectedCafe.name}
                                    className="h-full max-h-[460px] w-full object-cover"
                                />
                                {selectedCafe.video_url && (
                                    <a
                                        href={selectedCafe.video_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition hover:bg-black/50"
                                    >
                                        <PlayCircle className="h-16 w-16 drop-shadow-lg" />
                                    </a>
                                )}
                            </div>
                            {galleryPhotos.length > 1 && (
                                <div>
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Galeri</p>
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                        {galleryPhotos.slice(0, 4).map((photo) => (
                                            <div key={photo.id} className="overflow-hidden rounded-2xl border border-white/60 bg-[#F2F2F2]">
                                                <img src={photo.url} alt={`${selectedCafe.name} photo`} className="h-24 w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Video Tur</p>
                                {selectedCafe.video_url ? (
                                    <video controls src={selectedCafe.video_url} className="w-full rounded-[32px] border border-white/50 shadow-lg">
                                        Browser anda tidak mendukung pemutar video.
                                    </video>
                                ) : (
                                    <div className="flex items-center justify-center rounded-[32px] border border-dashed border-gray-300 bg-gray-50 py-16 text-gray-500">
                                        Video belum tersedia.
                                    </div>
                                )}
                            </div>
                            {selectedCafe.maps_embed_url && (
                                <div className="space-y-2">
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Maps</p>
                                    <div className="w-full aspect-video rounded-[32px] overflow-hidden border">
                                        <div 
                                            className="w-sm"
                                            dangerouslySetInnerHTML={{ __html: selectedCafe.maps_embed_url }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 rounded-[32px] bg-[#FDFDFD] p-6 shadow-[0_20px_45px_rgba(23,23,23,0.08)]">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#9AA05B]">{selectedCafe.kategori}</p>
                                <h3 className="text-3xl font-extrabold text-[#1F1F1F]">{selectedCafe.name}</h3>
                                <p className="mt-2 flex items-center gap-2 text-[#5E5E5E]">
                                    <MapPin className="h-4 w-4 text-[#BDEE63]" />
                                    {selectedCafe.location}
                                </p>
                            </div>

                            <p className="text-[#4A4A4A]">{selectedCafe.description}</p>

                            <div>
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Jam Operasional</p>
                                <div className="grid grid-cols-1 gap-3 rounded-3xl bg-[#F7F8F2] p-4 text-sm text-[#3C3C3C]">
                                    {operationalEntries.length ? (
                                        operationalEntries.map(([day, time]) => (
                                            <div key={day} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2">
                                                <span className="capitalize text-[#6D6D6D]">{day}</span>
                                                <span className="font-semibold">{time}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500">Belum ada jadwal.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Fasilitas</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {(Object.keys(facilityConfig) as FacilityKey[]).map((key) => {
                                        const config = facilityConfig[key];
                                        const isAvailable =
                                            key === "meeting_room"
                                                ? selectedCafe.facilities.meeting_room.available
                                                : selectedCafe.facilities[key as Exclude<FacilityKey, 'meeting_room'>];

                                        return (
                                            <div
                                                key={key}
                                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                                                    isAvailable ? "border-[#BDEE63] bg-[#F9FFE8] text-[#1F1F1F]" : "border-gray-200 text-gray-400"
                                                }`}
                                            >
                                                <config.icon className="h-5 w-5" />
                                                <div className="flex flex-col">
                                                    <span>{config.label}</span>
                                                    {config.getTrailingText && isAvailable ? (
                                                        <span className="text-xs font-medium text-[#7A7A7A]">
                                                            {config.getTrailingText(selectedCafe.facilities)}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedCafe.tables.length > 0 && (
                                <div>
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Daftar Meja</p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {selectedCafe.tables.map((table) => (
                                            <div key={table.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                                <Sofa className="h-10 w-10 text-[#BDEE63]" />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[#1F1F1F]">Meja {table.table_number}</span>
                                                    <span className="text-sm text-[#7A7A7A]">{table.capacity} Pax</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Menu & Harga</p>
                                <div className="space-y-3">
                                    {selectedCafe.menus.length ? (
                                        selectedCafe.menus.map((menu) => (
                                            <div key={menu.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3">
                                                <div className="flex items-start gap-4 flex-shrink-0">
                                                    <div className="flex-shrink-0">
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
                                                    </div>
                                                    
                                                    <div className="flex flex-col justify-center mt-2">
                                                        <p className="font-semibold text-[#1F1F1F]">{menu.name}</p>
                                                        <p className="text-xs uppercase tracking-widest text-[#9AA05B]">{menu.category}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-end flex-shrink-0">
                                                    <p className="text-lg font-bold text-[#1F1F1F]">
                                                        {currencyFormatter.format(menu.price)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-gray-500">
                                            Menu belum tersedia.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleReservationClick}
                                className="w-full rounded-full bg-[#BDEE63] px-6 py-4 text-center text-base font-bold text-[#1F1F1F] transition hover:bg-[#A3D347] cursor-pointer"
                            >
                                Reservasi Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}