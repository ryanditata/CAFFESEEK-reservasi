import Lenis from "@studio-freight/lenis";
import { router } from "@inertiajs/react";
import { toast } from "sonner"
import { Toaster } from "sonner";
import { MapPin, SearchIcon, ShoppingCart, Sofa, ImageIcon, Plus, Minus, XIcon, Presentation } from "lucide-react";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CafePhoto {
    id: number;
    url: string;
    is_primary: boolean;
}

interface CafeDetail {
    id: number;
    name: string;
    kategori: string;
    location: string;
    whatsapp: string;
    photos: CafePhoto[];
}

interface Props {
    cafes: CafeDetail[];
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

const PLACEHOLDER_IMAGE = "https://placehold.co/800x600/DFDFDF/333?text=CaffeSeek";

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

const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
});

export default function CustomerIndex({ cafes: initialCafes }: Props) {
    const [offsetY, setOffsetY] = useState(0);
    const [cafes] = useState<CafeDetail[]>(initialCafes);
    const [isRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
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

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
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
        const cafeInCart = cart.length > 0 ? filteredCafes.find(c => c.id === Number(localStorage.getItem("cafeseek_cafe_id"))) : null;

        if (!cart.length || !cafeInCart) {
            toast.error("Keranjang Kosong", {
                description: "Tambahkan item untuk reservasi.",
            });
            return;
        }

        const cafe = cafeInCart;
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
            duration: 3000,
        });

        window.open(url, "_blank");
    };

    const uniqueLocations = [...new Set(cafes.map((cafe) => cafe.location))];

    const filteredCafes = cafes.filter((cafe) => {
        const matchesSearch =
            cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cafe.kategori.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLocation =
            filterLocation === "" ||
            filterLocation === "all" || cafe.location === filterLocation;

        return matchesSearch && matchesLocation;
    });

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
            <header className="w-full top-5 fixed z-[99] bg-white shadow-xl flex items-center justify-between px-4 py-2 md:px-8 lg:px-[100px] h-fit rounded-full">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("hero");
                    }}
                    className="object-cover"
                >
                    <img src="/images/logo-navbar.png" alt="Logo" className="lg:h-20 md:h-16 h-12" />
                </button>

                <div className="grid gap-4 flex justify-center items-center">
                    <div className="relative max-w-xl w-full">
                        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-black"/>
                        <input 
                            className="pl-10 pr-4 py-1 md:py-2 lg:py-2 bg-white border border-black rounded-full w-3xs md:w-xs lg:w-sm"
                            placeholder="Search by name or kategori..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

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
            </header>

            {/* Hero */}
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
                        <p className="px-6 md:px-0 font-semibold text-center text-[#333333] text-lg md:text-xl mb-8 flex items-center justify-center gap-2">
                            <MapPin className="h-6 w-6 text-[#BDEE63]" />
                            Semarang, Indonesia.
                        </p>
                        <div className="flex gap-4 font-bold">
                            <button
                                onClick={() => scrollToSection("cafes")}
                                className="rounded-3xl text-white bg-[#333333] px-6 py-3 hover:ring-2 ring-inset ring-white cursor-pointer transition duration-300 ease-in-out"
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
                    className="absolute bottom-0 left-0 w-full h-[80px] md:h-[120px] lg:h-[162.25px] bg-[#F7F8F2] z-20"
                    style={{ clipPath: "polygon(50% 100%, 100% 0, 100% 100%, 0 100%, 0 0)" }}
                />
            </section>

            {/* Caffe & Resto */}
            <section id="cafes" className="relative z-10 bg-[#F7F8F2] py-16 md:py-24">
                <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:px-6 lg:px-0">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#9AA05B]">Daftar Café & Resto</p>
                            <h2 className="text-3xl font-extrabold text-[#1F1F1F] md:text-4xl mb-10">Eksplorasi Caffe & Resto Pilihan Kami</h2>
                        </div>

                        <div className="relative">
                            <Select 
                                value={filterLocation} 
                                onValueChange={setFilterLocation}
                            >
                                <SelectTrigger 
                                    className="w-[160px] rounded-xl h-9 border border-black" 
                                >
                                    <SelectValue placeholder="Semua Lokasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-semibold">Semua Lokasi</SelectItem>
                                    {uniqueLocations.map(location => (
                                        <SelectItem 
                                            key={location} 
                                            value={location}
                                        >
                                            {location}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {isRefreshing && cafes.length === 0
                            ? [...Array(3)].map((_, idx) => <CafeSkeletonCard key={`skeleton-${idx}`} />)
                            : filteredCafes.map((cafe) => {
                                  const photo = cafe.photos.find((p) => p.is_primary) ?? cafe.photos[0];
                                  return (
                                      <article
                                          key={cafe.id}
                                          className={`group flex flex-col overflow-hidden rounded-[32px] border bg-white shadow-[0_20px_45px_rgba(23,23,23,0.08)] transition hover:-translate-y-2 border-white/40`}
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
                                                  onClick={() => router.get(`/cafes/${cafe.id}`)}
                                                  className="mt-auto inline-flex items-center justify-center rounded-full bg-[#333333] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#BDEE63] hover:text-black cursor-pointer"
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

        </div>
        </>
    );
}
