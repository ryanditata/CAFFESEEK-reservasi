import Lenis from "@studio-freight/lenis";
import { router } from "@inertiajs/react";
import {
    Cigarette,
    DoorClosed,
    Loader2,
    MapPin,
    PlayCircle,
    Plug,
    RefreshCw,
    SunMedium,
    Users,
    Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

interface CafeDetail {
    id: number;
    name: string;
    kategori: string;
    description: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    video_url?: string | null;
    operational_hours: OperationalHours;
    facilities: Facilities;
    photos: CafePhoto[];
    menus: CafeMenu[];
}

interface Props {
    cafes: CafeDetail[];
}

type FacilityKey = "colokan" | "wifi" | "indoor" | "outdoor" | "smoking_area" | "meeting_room";

const PLACEHOLDER_IMAGE = "https://placehold.co/800x600/DFDFDF/333?text=CaffeSeek";

const facilityConfig: Record<
    FacilityKey,
    { label: string; icon: LucideIcon; getTrailingText?: (facilities: Facilities) => string | null }
> = {
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

const CafeSkeletonCard = () => (
    <div className="animate-pulse rounded-3xl border border-gray-100 bg-white">
        <div className="aspect-video w-full rounded-3xl rounded-b-none bg-gray-200" />
        <div className="space-y-3 p-5">
            <div className="h-4 w-24 rounded-full bg-gray-200" />
            <div className="h-5 w-2/3 rounded-full bg-gray-200" />
            <div className="h-4 w-full rounded-full bg-gray-200" />
            <div className="h-10 w-full rounded-full bg-gray-200" />
        </div>
    </div>
);

export default function CustomerIndex({ cafes: initialCafes }: Props) {
    const [offsetY, setOffsetY] = useState(0);
    const [cafes, setCafes] = useState<CafeDetail[]>(initialCafes);
    const [selectedCafe, setSelectedCafe] = useState<CafeDetail | null>(initialCafes[0] ?? null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    useEffect(() => {
        setCafes(initialCafes);
        setSelectedCafe((prev) => {
            if (!prev) {
                return initialCafes[0] ?? null;
            }
            return initialCafes.find((cafe) => cafe.id === prev.id) ?? initialCafes[0] ?? null;
        });
    }, [initialCafes]);

    const handleSelectCafe = (cafe: CafeDetail) => {
        setSelectedCafe(cafe);
        document.getElementById("detail-cafe")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    };

    const operationalEntries = useMemo(
        () => Object.entries(selectedCafe?.operational_hours ?? {}),
        [selectedCafe?.operational_hours],
    );

    const galleryPhotos = selectedCafe?.photos ?? [];
    const primaryPhoto = galleryPhotos.find((photo) => photo.is_primary) ?? galleryPhotos[0];

    const handleReservationClick = () => {
        if (!selectedCafe || typeof window === "undefined") {
            return;
        }
        window.open(`/reservasi?cafe=${selectedCafe.id}`, "_blank");
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({ only: ["cafes"] });
        setIsRefreshing(false);
    };

    return (
        <div className="min-h-screen bg-background text-[#1F1F1F]">
            <header className="w-full top-5 fixed z-[99] bg-white/90 backdrop-blur-xl shadow-xl flex items-center justify-between px-4 py-2 md:px-8 lg:px-[100px] h-fit rounded-full">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("hero");
                    }}
                    className="cursor-pointer object-cover w-20 md:w-24 lg:h-[80px] lg:w-[140px]"
                >
                    <img src="/images/logo-navbar.png" alt="Logo" className="lg:h-20 md:h-16 h-12" />
                </button>
            </header>

            <section id="hero" className="relative min-h-screen md:min-h-[1100px] lg:min-h-screen overflow-hidden bg-[#FFFFFF]">
                <div
                    className="absolute top-0 left-0 w-full min-h-screen md:min-h-[1100px] lg:min-h-screen bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/images/bg-hero2.svg')",
                        transform: `translateY(${offsetY * 0.2}px)`,
                    }}
                />
                <div className="h-screen flex justify-center items-center w-full relative">
                    <div className="font-raleway flex flex-col items-center justify-center text-white">
                        <div className="bg-[#333333] px-4 py-2 rounded-[48px] mb-4">
                            <p className="font-bold">CAFFESEEK</p>
                        </div>
                        <h1 className="text-[28px] md:text-[54px] lg:text-[60px] mb-6 font-audiowide font-bold text-center leading-none">
                            Temukan dan Pilih <br /> Café & Resto Favorit Anda
                        </h1>
                        <p className="px-6 md:px-0 font-semibold text-center text-[#BDEE63] text-lg md:text-xl mb-8 flex items-center justify-center gap-2">
                            <MapPin className="h-5" />
                            Semarang, Indonesia.
                        </p>
                        <div className="flex gap-4 font-bold">
                            <button
                                onClick={() => scrollToSection("daftar-cafe")}
                                className="rounded-3xl text-white bg-[#333333] px-6 py-3 hover:ring-2 ring-inset ring-white transition duration-300 ease-in-out"
                            >
                                Explore
                            </button>
                            <a
                                href="/login"
                                className="rounded-3xl text-black bg-white px-6 py-3 hover:bg-[#BDEE63] transition duration-300 ease-in-out"
                            >
                                Join Now!
                            </a>
                        </div>
                    </div>
                </div>
                <div
                    className="absolute w-55 md:w-90 lg:w-100 bottom-0 left-[10px] md:left-[10px] lg:top-[250px] lg:left-2 z-30 opacity-25"
                    style={{ transform: `translateY(${offsetY * 0.3}px)` }}
                >
                    <img src="/images/icon-store.svg" alt="" />
                </div>
                <div
                    className="absolute w-[50%] md:w-[70%] lg:w-fit bottom-0 right-0 md:right-[-240px] lg:bottom-[-25px] lg:right-0 z-30"
                    style={{ transform: `translateY(${offsetY * 0.3}px)` }}
                >
                    <img src="/images/biji-kopi-kecil.svg" alt="" />
                </div>
                <div
                    className="absolute bottom-0 left-0 w-full h-[80px] md:h-[120px] lg:h-[162.25px] bg-white z-20"
                    style={{ clipPath: "polygon(50% 100%, 100% 0, 100% 100%, 0 100%, 0 0)" }}
                />
            </section>

            <section id="daftar-cafe" className="relative z-10 bg-[#F7F8F2] py-16 md:py-24">
                <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:px-6 lg:px-0">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#9AA05B]">Daftar Café & Resto</p>
                            <h2 className="text-3xl font-extrabold text-[#1F1F1F] md:text-4xl">Eksplorasi Kurasi Pilihan Kami</h2>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-2 self-start rounded-full border border-[#BDEE63] bg-white px-5 py-2 text-sm font-semibold text-[#3B3B3B] transition hover:bg-[#BDEE63]/20 disabled:opacity-60"
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
                            Muat Ulang
                        </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {isRefreshing && cafes.length === 0
                            ? [...Array(3)].map((_, idx) => <CafeSkeletonCard key={`skeleton-${idx}`} />)
                            : cafes.map((cafe) => {
                                  const photo = cafe.photos.find((p) => p.is_primary) ?? cafe.photos[0];
                                  const isActive = selectedCafe?.id === cafe.id;
                                  return (
                                      <article
                                          key={cafe.id}
                                          className={`group flex flex-col overflow-hidden rounded-[32px] border bg-white shadow-[0_20px_45px_rgba(23,23,23,0.08)] transition hover:-translate-y-2 ${
                                              isActive ? "border-[#BDEE63]" : "border-white/40"
                                          }`}
                                      >
                                          <div className="relative aspect-video w-full overflow-hidden bg-[#F5F5F5]">
                                              <img
                                                  src={photo?.url || PLACEHOLDER_IMAGE}
                                                  alt={cafe.name}
                                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                              />
                                              <div className="absolute left-4 top-4 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold text-[#3B3B3B]">
                                                  {cafe.kategori}
                                              </div>
                                          </div>
                                          <div className="flex flex-1 flex-col gap-4 p-6">
                                              <div>
                                                  <h3 className="text-xl font-bold text-[#131313]">{cafe.name}</h3>
                                                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[#5E5E5E]">
                                                      <MapPin className="h-4 w-4 text-[#BDEE63]" />
                                                      {cafe.location}
                                                  </p>
                                              </div>
                                              <button
                                                  onClick={() => handleSelectCafe(cafe)}
                                                  className="mt-auto inline-flex items-center justify-center rounded-full bg-[#333333] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#BDEE63] hover:text-[#1F1F1F]"
                                              >
                                                  Lihat Detail
                                              </button>
                                          </div>
                                      </article>
                                  );
                              })}
                        {!cafes.length && !isRefreshing && (
                            <p className="col-span-full rounded-3xl border border-dashed border-gray-300 bg-white/40 py-10 text-center text-sm text-gray-500">
                                Belum ada café terdaftar.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section id="detail-cafe" className="bg-white py-16 md:py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-0">
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#9AA05B]">Detail Café</p>
                        <h2 className="text-3xl font-extrabold text-[#1F1F1F] md:text-4xl">Informasi Lengkap Untuk Reservasi</h2>
                    </div>

                    {selectedCafe ? (
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
                                                    : selectedCafe.facilities[key];

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

                                <div>
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Menu & Harga</p>
                                    <div className="space-y-3">
                                        {selectedCafe.menus.length ? (
                                            selectedCafe.menus.map((menu) => (
                                                <div key={menu.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold text-[#1F1F1F]">{menu.name}</p>
                                                        <p className="text-xs uppercase tracking-widest text-[#9AA05B]">{menu.category}</p>
                                                    </div>
                                                    <p className="text-lg font-bold text-[#1F1F1F]">
                                                        {currencyFormatter.format(menu.price)}
                                                    </p>
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
                                    className="w-full rounded-full bg-[#BDEE63] px-6 py-4 text-center text-base font-bold text-[#1F1F1F] transition hover:bg-[#A3D347]"
                                >
                                    Reservasi Sekarang
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500">
                            Pilih café dari daftar untuk melihat detailnya.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
