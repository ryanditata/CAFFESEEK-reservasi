import Lenis from "@studio-freight/lenis";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselIndicators, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { ImageIcon, Minus, Plus, SearchIcon, ClipboardList, Trash2, MapPin, ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface Category {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface ProductPhoto {
    id: number;
    product_id: string;
    url: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

interface Product {
    id: string;
    name: string;
    category_id: number;
    price: number;
    created_at: string;
    updated_at: string;
    category?: Category;
    photos?: ProductPhoto[];
}

interface CartItem {
    product: Product;
    quantity: number;
    notes?: string;
}

interface Props {
    products: Product[];
    categories: Category[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        has_more_pages: boolean;
    };
}

interface HeaderProps {
  scrollToSection: (id: string) => void;
}

export default function CustomerIndex({ products: initialProducts, categories, pagination }: Props) {
    // State
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);

    // Infinite scroll state
    const [currentPage, setCurrentPage] = useState(pagination?.current_page || 1);
    const [hasMorePages, setHasMorePages] = useState(pagination?.has_more_pages || false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);

    // Scroll halus
    const [offsetY, setOffsetY] = useState(0);
    const lenisRef = useRef<Lenis | null>(null);

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        function onScroll(e: any) {
            setOffsetY(e.scroll);
        }
        lenis.on("scroll", onScroll);

        return () => {
            lenis.off("scroll", onScroll);
            lenis.destroy();
        };
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
            });
        }
    };

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('kasirku_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
                localStorage.removeItem('kasirku_cart');
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('kasirku_cart', JSON.stringify(cart));
    }, [cart]);

    // Update products when props change
    useEffect(() => {
        setProducts(initialProducts);
        setCurrentPage(pagination?.current_page || 1);
        setHasMorePages(pagination?.has_more_pages || false);
    }, [initialProducts, pagination]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filter products based on search term and category
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            product.category?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category_id.toString() === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Load more products function
    const loadMoreProducts = useCallback(async () => {
        if (isLoadingMore || !hasMorePages) return;

        setIsLoadingMore(true);

        try {
            const params = new URLSearchParams({
                page: (currentPage + 1).toString(),
            });

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            if (categoryFilter && categoryFilter !== 'all') {
                params.append('category', categoryFilter);
            }

            const response = await fetch(`/?${params.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();

                setProducts((prev) => [...prev, ...data.products]);
                setCurrentPage(data.pagination.current_page);
                setHasMorePages(data.pagination.has_more_pages);
            }
        } catch (error) {
            console.error('Failed to load more products:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, hasMorePages, isLoadingMore, debouncedSearchTerm, categoryFilter]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMorePages && !isLoadingMore) {
                    loadMoreProducts();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px',
            },
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        };
    }, [loadMoreProducts, hasMorePages, isLoadingMore]);

    // Reset pagination when search or filter changes
    useEffect(() => {
        // Reset products to initial when filtering
        setProducts(initialProducts);
        setCurrentPage(1);
        setHasMorePages(pagination?.has_more_pages || false);
    }, [debouncedSearchTerm, categoryFilter, initialProducts, pagination]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    // Get primary photo
    const getPrimaryPhoto = (photos: ProductPhoto[] = []) => {
        if (photos.length === 0) return null;
        const primary = photos.find((photo) => photo.is_primary);
        return primary?.url || photos[0]?.url || null;
    };

    // Cart functions
    const addToCart = (product: Product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            } else {
                return [...prevCart, { product, quantity: 1 }];
            }
        });
    };

    const updateCartItemQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart((prevCart) => prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)));
    };

    const removeFromCart = (productId: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const getProductQuantityInCart = (productId: string) => {
        const cartItem = cart.find((item) => item.product.id === productId);
        return cartItem ? cartItem.quantity : 0;
    };

    const goToCheckout = () => {
        console.log('Going to checkout with cart:', cart);

        // Save current cart to localStorage before navigation
        localStorage.setItem('kasirku_cart', JSON.stringify(cart));

        // Verify cart was saved
        const savedCart = localStorage.getItem('kasirku_cart');
        console.log('Cart saved to localStorage:', savedCart);

        setIsCartModalOpen(false);
        router.visit('/checkout');
    };

    return (
        <div className="min-h-screen bg-background">
        {/* Navbar */}
        <header
            className="w-full top-5 fixed z-99 bg-white/50 backdrop-blur-sm backdrop-saturate-250 flex items-center justify-between px-4 py-2 md:px-8 md:pt-[14px] md:pb-[14px] lg:px-[100px] lg:pt-[7px] lg:pb-[7px] xl:pt-[8px] xl:pb-[8px] h-fit rounded-full">
            <button
                onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                scrollToSection("hero-section");
                }}
                className="cursor-pointer object-cover w-20 md:w-25 lg:h-[80px] lg:w-[140px]"
            >
                <img
                src="/images/logo-navbar.png"
                alt="Logo"
                className="lg:h-20 md:h-16 h-12"
                />
            </button>

            <div className="relative w-[200px] md:w-sm lg:w-lg mr-10 md:mr-0 lg:mr-10">
                <SearchIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform" />
                <Input placeholder="Cari Caffe & Resto" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-black" />
            </div>

            {/* Reservasi */}
            <Dialog open={isCartModalOpen} onOpenChange={setIsCartModalOpen}>
                <DialogTrigger asChild>
                    <Button className="flex items-center justify-center text-black hover:text-white px-4 h-[43px] rounded-full bg-[#BDEE63] hover:bg-[#333333] transition duration-300 ease-in-out cursor-pointer relative">
                        <ShoppingCart className="h-5 w-5" />
                        {getTotalItems() > 0 && (
                            <Badge className="absolute -top-1 -right-1 md:-top-2 md:-right-2 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full p-0">
                                {getTotalItems()}
                            </Badge>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] max-w-sm md:mx-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Keranjang</DialogTitle>
                        <DialogDescription>Review keranjang Anda sebelum melakukan reservasi</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {cart.length === 0 ? (
                            <div className="py-8 text-center">
                                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">Keranjang Anda kosong</p>
                            </div>
                        ) : (
                            <>
                                {cart.map((item) => (
                                    <div key={item.product.id} className="flex items-center space-x-4 rounded-lg border p-4">
                                        <div className="h-16 w-16 flex-shrink-0">
                                            {getPrimaryPhoto(item.product.photos) ? (
                                                <img
                                                    src={getPrimaryPhoto(item.product.photos)!}
                                                    alt={item.product.name}
                                                    className="h-full w-full rounded object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center rounded bg-muted">
                                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-grow">
                                            <h4 className="font-medium">{item.product.name}</h4>
                                            <p className="text-sm text-muted-foreground">{formatCurrency(item.product.price)}</p>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>

                                            <span className="w-8 text-center">{item.quantity}</span>

                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeFromCart(item.product.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between text-lg font-semibold">
                                        <span>Total:</span>
                                        <span>{formatCurrency(getTotalPrice())}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="flex-col space-y-2">
                        {cart.length > 0 && (
                            <>
                                <Button variant="outline" className="w-full" onClick={clearCart}>
                                    Kosongkan Keranjang
                                </Button>
                                <Button className="w-full" onClick={goToCheckout}>
                                    Lanjut ke Reservasi ({getTotalItems()} item)
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>

        {/* Hero */}
        <div scrollToSection={scrollToSection} />
            <section id="hero" className="relative min-h-screen md:min-h-[1100px] lg:min-h-screen overflow-hidden bg-[#FFFFFF]">
                <div
                    className="absolute top-0 left-0 w-full min-h-screen md:min-h-[1100px] lg:min-h-screen bg-cover bg-center"
                    style={{
                    backgroundImage: "url('/images/bg-hero2.svg')",
                    transform: `translateY(${offsetY * 0.2}px)`,
                    }}
                >
                </div>
                <div className="h-screen flex justify-center items-center w-full relative">
                    <div className="font-raleway flex flex-col items-center justify-center text-white">
                    <div className="bg-[#333333] px-4 py-2 rounded-[48px] mb-4">
                        <p className="font-bold">CAFFESEEK</p>
                    </div>
                    <h1 className="text-[28px] md:text-[54px] lg:text-[60px] mb-6 font-audiowide font-bold text-center leading-none">
                        Temukan dan Pilih <br/> Caffe & Resto Favorit Anda
                    </h1>
                    <p className="px-6 md:px-0 font-semibold text-center text-[#BDEE63] text-lg md:text-xl mb-8 flex items-center justify-center gap-2">
                        <MapPin className="h-5"/>
                        Semarang, Indonesia.
                    </p>
                    <div className="flex gap-4 font-bold">
                        <a
                        onClick={() => scrollToSection("produk")}
                        className="cursor-pointer rounded-3xl text-white bg-[#333333] px-6 py-3 hover:ring-2 ring-inset ring-white transition duration-300 ease-in-out"
                        >
                        Explore
                        </a>
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
                    className="absolute w-55 md:w-90 lg:w-100 bottom-[-0px] left-[10px] md:bottom-[-5px] md:left-[10px] lg:top-[250px] lg:left-2 z-30 opacity-25"
                    style={{
                    transform: `translateY(${offsetY * 0.3}px)`,
                    }}
                >
                    <img src="/images/icon-store.svg" alt="" />
                </div>

                <div
                    className="absolute w-[50%] md:w-[70%] lg:w-fit bottom-[-0px] right-[-0px] md:bottom-[-0px] md:right-[-240px] lg:bottom-[-25px] lg:right-0 z-30"
                    style={{
                    transform: `translateY(${offsetY * 0.3}px)`,
                    }}
                >
                    <img src="/images/biji-kopi-kecil.svg" alt="" />
                </div>
                <div
                    className="absolute bottom-0 left-0 w-full h-[80px] md:h-[120px] lg:h-[162.25px] bg-white z-20"
                    style={{
                    clipPath: "polygon(50% 100%, 100% 0, 100% 100%, 0 100%, 0 0)",
                    }}>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Products Grid */}
                <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredProducts.map((product) => {
                        const quantityInCart = getProductQuantityInCart(product.id);

                        return (
                            <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                                <div className="relative aspect-square bg-muted">
                                    {product.photos && product.photos.length > 0 ? (
                                        product.photos.length === 1 ? (
                                            // Single image - no carousel needed
                                            <img src={product.photos[0].url} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            // Multiple images - use carousel
                                            <Carousel className="aspect-square w-full">
                                                <CarouselContent className="aspect-square">
                                                    {product.photos.map((photo, index) => (
                                                        <CarouselItem key={photo.id} className="aspect-square">
                                                            <img
                                                                src={photo.url}
                                                                alt={`${product.name} - Photo ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                <CarouselPrevious />
                                                <CarouselNext />
                                                <CarouselIndicators />
                                            </Carousel>
                                        )
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{product.name}</CardTitle>
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary">{product.category?.name}</Badge>
                                        <span className="text-lg font-semibold text-green-600">{formatCurrency(product.price)}</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    {quantityInCart > 0 ? (
                                        <div className="flex items-center justify-between gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => updateCartItemQuantity(product.id, quantityInCart - 1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>

                                            <span className="flex-grow text-center font-medium">{quantityInCart} di keranjang</span>

                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => updateCartItemQuantity(product.id, quantityInCart + 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button className="w-full" onClick={() => addToCart(product)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah ke Keranjang
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Infinite Scroll Observer */}
                {hasMorePages && (
                    <div ref={observerRef} className="flex justify-center py-8">
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                                <span className="text-muted-foreground">Memuat Caffe & Resto lainnya...</span>
                            </div>
                        ) : (
                            <div className="text-muted-foreground">Scroll ke bawah untuk memuat lebih banyak Caffe & Resto</div>
                        )}
                    </div>
                )}

                {/* End of results indicator */}
                {!hasMorePages && filteredProducts.length > 0 && (
                    <div className="flex justify-center py-8">
                        <div className="text-center text-muted-foreground">
                            <div className="mx-auto mb-4 h-px w-24 bg-border"></div>
                            <p>Anda telah melihat semua Caffe & Resto</p>
                            <p className="mt-1 text-sm">Menampilkan {filteredProducts.length} Caffe & Resto</p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {filteredProducts.length === 0 && !isLoadingMore && (
                    <div className="py-12 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium text-foreground">Tidak ada Caffe & Resto ditemukan</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {searchTerm || (categoryFilter && categoryFilter !== 'all')
                                ? 'Coba sesuaikan kriteria pencarian Anda'
                                : 'Belum ada Caffe & Resto yang tersedia'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
