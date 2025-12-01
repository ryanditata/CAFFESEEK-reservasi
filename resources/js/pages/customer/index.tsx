import Lenis from "@studio-freight/lenis";
import { router } from "@inertiajs/react";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";

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
    photos: CafePhoto[];
}

interface Props {
    cafes: CafeDetail[];
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

export default function CustomerIndex({ cafes: initialCafes }: Props) {
    const [offsetY, setOffsetY] = useState(0);
    const [cafes] = useState<CafeDetail[]>(initialCafes);
    const [isRefreshing] = useState(false);

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

    return (
        <div className="min-h-screen bg-background text-[#1F1F1F]">
            {/* Navbar */}
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
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {isRefreshing && cafes.length === 0
                            ? [...Array(3)].map((_, idx) => <CafeSkeletonCard key={`skeleton-${idx}`} />)
                            : cafes.map((cafe) => {
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
                                                  className="mt-auto inline-flex items-center justify-center rounded-full bg-[#333333] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#BDEE63] hover:text-[#1F1F1F] cursor-pointer"
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
    );
}
