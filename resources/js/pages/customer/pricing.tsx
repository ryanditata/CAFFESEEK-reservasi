import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { Check, X, MessageSquare, ArrowLeft } from 'lucide-react';
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Lenis from "@studio-freight/lenis";

const ADMIN_WHATSAPP = '62895361206884';

interface Feature {
    text: string;
    available: boolean;
}

interface Package {
    name: string;
    price: string;
    price_note: string;
    features: Feature[];
    isRecommended: boolean;
    buttonText: string;
    buttonClass: string;
    isFree: boolean;
}

const pricingData: Package[] = [
    {
        name: "Free (Dasar)",
        price: "0",
        price_note: "IDR / Bulan",
        isFree: true,
        isRecommended: false,
        features: [
            { text: "Lihat Daftar Caffe & Resto", available: true },
            { text: "Lihat Katalog Caffe & Resto", available: true },
            { text: "Reservasi Caffe & Resto", available: true },
            { text: "Reservasi Ruang Meeting", available: true },
            { text: "Dukungan Prioritas", available: false },
        ],
        buttonText: "Paket Anda saat ini",
        buttonClass: "bg-gray-200 text-gray-400 hover:bg-gray-300 cursor-default",
    },
    {
        name: "Business (Premium)",
        price: "80.000",
        price_note: "IDR (Tidak termasuk PPN) / Bulan",
        isFree: false,
        isRecommended: true,
        features: [
            { text: "Analisis & Laporan Reservasi", available: true },
            { text: "Manajemen Caffe & Resto", available: true },
            { text: "Manajemen Meja, Ruang Meeting, dan Menu yang Fleksibel", available: true },
            { text: "Personalisasi Pengalaman Pelanggan", available: true },
            { text: "Dukungan Prioritas 24/7", available: true },
        ],
        buttonText: "Dapatkan Business",
        buttonClass: "bg-[#BDEE63] text-black hover:bg-[#333333] hover:text-white cursor-pointer",
    },
];

const handleGetBusiness = (packageName: string) => {
    const message = `Halo Admin, saya tertarik untuk mengaktifkan paket ${packageName} untuk Caffe & Resto saya. Mohon informasi lebih lanjut mengenai prosesnya. Terima kasih!`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encoded}`;
    window.open(url, "_blank");
};

export default function CafePricing() {
    const [offsetY, setOffsetY] = useState(0);

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

    return (
        <>
        <div className="min-h-screen bg-white flex flex-col items-center pb-16 px-4 sm:px-6 lg:px-8">
            {/* Navbar */}
            <nav className="w-full sticky top-0 z-99">
                <div className="py-4 md:py-6">
                    <button
                        onClick={() => router.get("/")}
                        className="flex items-center text-black cursor-pointer"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                </div>
            </nav>
            
            {/* Paket Langganan */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-10 text-center text-black">Tingkatkan Paket Untuk Caffe & Resto Anda</h1>
            
            <div className="flex bg-white border p-1 rounded-full mb-12">
                <button className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-400 text-sm">Pribadi</button>
                <button className="px-4 py-1.5 rounded-full bg-[#BDEE63] text-black text-sm">Business</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
                {pricingData.map((pkg) => (
                    <div 
                        key={pkg.name} 
                        className={`p-8 rounded-3xl shadow-xl transition duration-300 
                            ${pkg.isRecommended ? 'bg-white border-2 border-[#BDEE63]' : 'bg-white border border-gray-300'}`}
                    >
                        <CardTitle className="text-2xl font-bold mb-1 text-black">
                            {pkg.name}
                            {pkg.isRecommended && (
                                <span className="ml-3 text-xs font-semibold bg-[#BDEE63] text-black px-3 py-1 rounded-full uppercase">
                                    Direkomendasikan
                                </span>
                            )}
                        </CardTitle>
                        
                        <p className="text-4xl font-extrabold my-4 text-black">
                            {pkg.isFree ? pkg.price : `Rp ${pkg.price}`}
                            <span className="text-lg font-medium text-gray-600 ml-1">{pkg.price_note}</span>
                        </p>
                        
                        <p className="text-[#6BAA3E] font-semibold mb-6">
                            {pkg.isFree 
                                ? "Lihat apa yang dapat dilakukan secara mandiri"
                                : "Solusi Lengkap untuk Mengembangkan Caffe & Resto Anda"
                            }
                        </p>

                        <ul className="space-y-4 mb-8">
                            {pkg.features.map((feature, index) => (
                                <li key={index} className={`flex items-start gap-3 ${feature.available ? 'text-black' : 'text-gray-500'}`}>
                                    {feature.available 
                                        ? <Check className="w-5 h-5 text-[#6BAA3E] mt-0.5 flex-shrink-0" />
                                        : <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    }
                                    <span>{feature.text}</span>
                                </li>
                            ))}
                        </ul>

                        {pkg.isFree ? (
                            <Button className={pkg.buttonClass + " w-full py-6 text-sm"}>
                                {pkg.buttonText}
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => handleGetBusiness(pkg.name)}
                                className={pkg.buttonClass + " w-full py-6 text-sm flex items-center justify-center"}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {pkg.buttonText}
                            </Button>
                        )}

                        {!pkg.isFree && (
                            <p className="text-xs text-gray-600 mt-3 text-center">
                                PPN tidak dikenakan saat checkout jika memiliki ID PPN sah
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-12 text-sm text-gray-600">
                Sudah punya paket? <a href="" className="text-[#6BAA3E] hover:underline">Lihat bantuan penagihan</a>
            </div>

        </div>
        </>
    );
}
