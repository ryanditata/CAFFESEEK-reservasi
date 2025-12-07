import { Cigarette, DoorClosed, MapPin, PlayCircle, Plug, SunMedium, Users, Wifi, Sofa,
        LucideIcon, ArrowLeft, ImageIcon, ShoppingCart, Plus, Minus, XIcon, Presentation } from "lucide-react";
import { toast } from "sonner"
import { Toaster } from "sonner";
import { useMemo, useEffect, useState } from "react";
import Lenis from "@studio-freight/lenis";
import { router } from "@inertiajs/react";
import { Badge } from '@/components/ui/badge';

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
    whatsapp: string;
    maps_embed_url: string | null;
    video_url?: string | null;
    operational_hours: OperationalHours;
    facilities: Facilities;
    photos: CafePhoto[];
    menus: CafeMenu[];
    tables: CafeTable[];
}

interface CartItem {
    id: number;
    type: "menu" | "table" | "meeting_room";
    name: string;
    price: number;
    quantity: number;
    photo?: string;
    capacity?: number;
    table_number?: number;
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
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [customerWhatsapp, setCustomerWhatsapp] = useState("");
    const [reservationDate, setReservationDate] = useState("");
    const [reservationTime, setReservationTime] = useState("");
    const [meetingStart, setMeetingStart] = useState("");
    const [meetingEnd, setMeetingEnd] = useState("");

    useEffect(() => {
        const savedCart = localStorage.getItem("cafeseek_cart");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("cafeseek_cart", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const savedCafeId = localStorage.getItem("cafeseek_cafe_id");

        if (savedCafeId && Number(savedCafeId) !== cafe.id) {
            localStorage.removeItem("cafeseek_cart");
            setCart([]);

            toast.warning("Keranjang Dikosongkan", {
                description: "Anda berpindah Caffe & Resto. Satu reservasi hanya berlaku untuk satu Caffe & Resto.",
            });
        }

        localStorage.setItem("cafeseek_cafe_id", String(cafe.id));
    }, [cafe.id]);

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

    const addToCartMenu = (menu: CafeMenu) => {
        setCart((prev) => {
            const exists = prev.find((i) => i.type === "menu" && i.id === menu.id);

            if (exists) {
                return prev.map((i) =>
                    i.id === menu.id && i.type === "menu"
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }

            return [
                ...prev,
                {
                    id: menu.id,
                    type: "menu",
                    name: menu.name,
                    quantity: 1,
                    price: menu.price,
                    photo: menu.photo_url || undefined,
                },
            ];
        });
    };

    const addToCartTable = (table: CafeTable) => {
        const exists = cart.find((i) => i.type === "table" && i.id === table.id);
        if (exists) return;

        setCart((prev) => [
            ...prev,
            {
                id: table.id,
                type: "table",
                name: `Meja ${table.table_number}`,
                table_number: table.table_number,
                quantity: 1,
                price: 0,
                capacity: table.capacity,
            },
        ]);
    };

    const addMeetingRoom = () => {
        if (!cafe.facilities.meeting_room.available) return;

        const exists = cart.find((i) => i.type === "meeting_room");
        if (exists) return;

        setCart((prev) => [
            ...prev,
            {
                id: 999,
                type: "meeting_room",
                name: "Meeting Room",
                quantity: 1,
                price: 0,
                capacity: cafe.facilities.meeting_room.capacity || undefined,
            },
        ]);
    };

    const getTotalItems = () => {
        return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    };


    const increaseItem = (id: number, type: string) => {
        setCart((prev) =>
            prev.map((i) =>
                i.id === id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i
            )
        );
    };

    const decreaseItem = (id: number, type: string) => {
        setCart((prev) =>
            prev
                .map((i) =>
                    i.id === id && i.type === type
                        ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                        : i
                )
                .filter((i) => i.quantity > 0)
        );
    };

    const removeItem = (id: number, type: string) => {
        setCart((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
    };

    const checkoutToWhatsapp = () => {
        if (cart.length === 0) {
            toast.error("Keranjang Kosong", {
                description: "Tambahkan item untuk reservasi.",
            });
            return;
        }
        const hasMeetingRoom = cart.some((i) => i.type === "meeting_room");

        if (!customerName || !customerWhatsapp || !reservationDate) {
            toast.error("Validasi Gagal", {
                description: "Lengkapi Data Diri: Nama, WhatsApp, dan Tanggal Reservasi.",
            });
            return;
        }

        if (hasMeetingRoom && (!meetingStart || !meetingEnd)) {
            toast.error("Validasi Gagal", {
                description: "Waktu Meeting Belum Lengkap: Isi Waktu Mulai & Selesai.",
            });
            return;
        }

        if (!hasMeetingRoom && !reservationTime) {
            toast.error("Validasi Gagal", {
                description: "Waktu Reservasi Belum Diisi.",
            });
            return;
        }

        let message = `RESERVASI - CaffeSeek\n`;
        message += `====================================\n`;
        message += `Caffe & Resto : ${cafe.name}\n`;
        message += `Lokasi              : ${cafe.location}\n`;
        message += `====================================\n\n`;

        message += `DETAIL PESANAN\n`;

        let total = 0;

        cart.forEach((item) => {
            if (item.type === "menu") {
                total += item.price * item.quantity;
                message += `• ${item.name} x${item.quantity} — ${currencyFormatter.format(item.price)}\n`;
            }

            if (item.type === "meeting_room") {
                message += `• Meeting Room (Kapasitas ${item.capacity} Orang)\n`;
            }

            if (item.type === "table") {
                message += `• Meja ${item.table_number} (Kapasitas ${item.capacity} Orang)\n`;
            }
        });

        if (total > 0) {
            message += `\nTOTAL MENU : ${currencyFormatter.format(total)}\n`;
        }

        message += `\n====================================\n`;

        message += `Tanggal    : ${reservationDate}\n`;

        if (hasMeetingRoom) {
            message += `Waktu       : ${meetingStart} - ${meetingEnd}\n`;
        } else {
            message += `Jam          : ${reservationTime}\n`;
        }

        message += `====================================\n\n`;

        message += `DATA PEMESAN\n`;
        message += `Nama          : ${customerName}\n`;
        message += `WhatsApp   : ${customerWhatsapp}\n\n`;

        message += `====================================\n\n`;

        message += `Catatan Tambahan:\n`;
        message += `- Mohon dipersiapkan sebelum kedatangan.\n\n`;

        message += `TERIMA KASIH.\n`;
        message += `Kami menunggu konfirmasi dari pihak cafe.`;

        const encoded = encodeURIComponent(message);
        const whatsappNumber = cafe.whatsapp; 
        const url = `https://wa.me/${whatsappNumber}?text=${encoded}`;

        localStorage.removeItem("cafeseek_cart");
        setCart([]);
        setShowCart(false);

        toast.success("Reservasi Berhasil!", {
            description: "Reservasi Terkirim! Cek WhatsApp Anda untuk konfirmasi.",
        });

        window.open(url, "_blank");
    };

    return (
        <>

        <Toaster position="top-right" richColors />

        {showCart && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-l-3xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                    
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold">Keranjang Reservasi</h2>
                            <p className="mb-4">Lengkapi seluruh detail di bawah ini untuk reservasi.</p>
                        </div>
                        <button
                            onClick={() => setShowCart(false)}
                            className="cursor-pointer"
                        >
                            <XIcon className="h-6 w-6"/>
                        </button>
                    </div>

                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500">Keranjang masih kosong.</p>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {item.type === "menu" ? (
                                            item.photo ? (
                                                <img
                                                    src={item.photo}
                                                    alt={item.name}
                                                    className="h-16 w-16 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )
                                        ) : item.type === "meeting_room" ? (
                                            <Presentation className="h-10 w-10 text-[#BDEE63]" />
                                        ) : (
                                            <Sofa className="h-10 w-10 text-[#BDEE63]" />
                                        )}

                                        <div className="flex flex-col">
                                            <p className="font-semibold text-[#1F1F1F]">{item.name}</p>
                                                {item.type === "menu" && (
                                                    <p className="text-xs tracking-widest text-[#9AA05B]">
                                                        {currencyFormatter.format(item.price)}
                                                    </p>
                                                )}

                                                {item.type === "meeting_room" && (
                                                    <p className="text-xs tracking-widest text-[#9AA05B]">Fasilitas</p>
                                                )}

                                                {item.capacity && (
                                                    <p className="text-sm text-[#7A7A7A]">
                                                        Kapasitas {item.capacity} Orang
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {item.type === "menu" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => decreaseItem(item.id, item.type)}
                                                    className="px-2 py-2 bg-gray-200 rounded-lg cursor-pointer"
                                                >
                                                    <Minus className="h-3 w-3"/>
                                                </button>

                                                <span>{item.quantity}</span>

                                                <button
                                                    onClick={() => increaseItem(item.id, item.type)}
                                                    className="px-2 py-2 bg-gray-200 rounded-lg cursor-pointer"
                                                >
                                                    <Plus className="h-3 w-3"/>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400 pr-2">Fixed</div>
                                        )}

                                        <button
                                            onClick={() => removeItem(item.id, item.type)}
                                            className="bg-red-100 text-red-500 hover:bg-red-200 px-2 py-2 rounded-full cursor-pointer"
                                        >
                                            <XIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 space-y-3">
                        <input
                            type="text"
                            placeholder="Nama Lengkap"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full border rounded-xl p-3"
                        />
                        <input
                            type="text"
                            placeholder="Nomor WhatsApp"
                            value={customerWhatsapp}
                            onChange={(e) => setCustomerWhatsapp(e.target.value)}
                            className="w-full border rounded-xl p-3"
                        />
                        <input
                            type="date"
                            value={reservationDate}
                            onChange={(e) => setReservationDate(e.target.value)}
                            className="w-full border rounded-xl p-3 cursor-pointer"
                        />
                        {cart.some((i) => i.type === "meeting_room") ? (
                            <>
                                <input
                                    type="time"
                                    placeholder="Start Time"
                                    value={meetingStart}
                                    onChange={(e) => setMeetingStart(e.target.value)}
                                    className="w-full border rounded-xl p-3 cursor-pointer"
                                />

                                <input
                                    type="time"
                                    placeholder="End Time"
                                    value={meetingEnd}
                                    onChange={(e) => setMeetingEnd(e.target.value)}
                                    className="w-full border rounded-xl p-3 cursor-pointer"
                                />
                            </>
                        ) : (
                            <input
                                type="time"
                                value={reservationTime}
                                onChange={(e) => setReservationTime(e.target.value)}
                                className="w-full border rounded-xl p-3 cursor-pointer"
                            />
                        )}
                    </div>

                    <button
                        onClick={() => checkoutToWhatsapp()}
                        className="w-full mt-6 rounded-full bg-[#BDEE63] hover:bg-[#333333] px-6 py-3 font-bold text-black hover:text-white cursor-pointer"
                    >
                        Reservasi via WhatsApp
                    </button>

                    <button
                        onClick={() => setShowCart(false)}
                        className="w-full mt-2 text-center text-gray-500 underline cursor-pointer"
                    >
                        Batal
                    </button>
                </div>
            </div>
        )}

        <div className="min-h-screen bg-background text-[#1F1F1F]">
            {/* Navbar */}
            <nav className="w-full sticky top-0 z-99 bg-white shadow-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center gap-4 px-4 md:px-6 lg:px-0 py-3 md:py-4">
                    <button
                        onClick={() => router.get("/")}
                        className="flex items-center text-black cursor-pointer"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>

                    <button
                        onClick={() => setShowCart(true)}
                        className="relative flex items-center bg-[#BDEE63] text-black px-3 py-3 md:px-4 md:py-4 rounded-full cursor-pointer"
                    >
                        <ShoppingCart className="w-4 h-4 md:h-5 md:w-5" />
                        {getTotalItems() > 0 && (
                            <Badge className="absolute -top-2 -right-1 md:-top-2 md:-right-2 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full p-0">
                                {getTotalItems()}
                            </Badge>
                        )}
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

                            {selectedCafe.facilities.meeting_room?.available && (
                                <div className="mt-6">
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">
                                        Meeting Room
                                    </p>

                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                        <Presentation className="h-10 w-10 text-[#BDEE63]" />

                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[#1F1F1F]">Meeting Room</span>
                                            <span className="text-sm text-[#7A7A7A]">
                                                Kapasitas {selectedCafe.facilities.meeting_room.capacity} Orang
                                            </span>
                                        </div>

                                        <button
                                            onClick={addMeetingRoom}
                                            className="bg-[#BDEE63] hover:bg-[#333333] text-black hover:text-white rounded-full px-2 py-2 cursor-pointer"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedCafe.tables.length > 0 && (
                                <div>
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9AA05B]">Daftar Meja</p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {selectedCafe.tables.map((table) => (
                                            <div key={table.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                                <Sofa className="h-10 w-10 text-[#BDEE63]" />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[#1F1F1F]">Meja {table.table_number}</span>
                                                    <span className="text-sm text-[#7A7A7A]">{table.capacity} Pax</span>
                                                </div>

                                                <button
                                                    onClick={() => addToCartTable(table)}
                                                    className="bg-[#BDEE63] hover:bg-[#333333] text-black hover:text-white rounded-full px-2 py-2 cursor-pointer"
                                                >
                                                    <ShoppingCart className="w-4 h-4"/>
                                                </button>
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

                                                    <button
                                                        onClick={() => addToCartMenu(menu)}
                                                        className="mt-2 bg-[#BDEE63] hover:bg-[#333333] text-black hover:text-white px-2 py-2 rounded-full cursor-pointer"
                                                    >
                                                        <ShoppingCart className="w-4 h-4"/>
                                                    </button>
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
                                onClick={() => checkoutToWhatsapp()}
                                className="w-full rounded-full bg-[#BDEE63] hover:bg-[#333333] text-black hover:text-white px-6 py-4 text-center text-base font-bold transition cursor-pointer"
                            >
                                Reservasi Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </section>

        </div>
        </>
    );
}