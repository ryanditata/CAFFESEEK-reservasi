import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coffee, Utensils, Sofa, Users, TrendingUp, MapPin, Store } from "lucide-react";
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale'; 
import { BreadcrumbItem } from '@/types';
import { Cafe } from '@/types/cafes';
import AnalyticsChart from "@/components/AnalyticsChart";

interface Props {
  cafes: Cafe[];
  facilities: Facilities;
  totalUsers: number;
  chartData: { month: string; total: number }[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard' },
];

const PLACEHOLDER_IMAGE = "https://placehold.co/80x80/DFDFDF/333?text=Img";

const getPrimaryPhotoUrl = (photos: CafePhoto[] = []): string => {
    if (!photos || photos.length === 0) return PLACEHOLDER_IMAGE;

    const primary = photos.find(photo => photo.is_primary);
    return primary?.url || photos[0]?.url || PLACEHOLDER_IMAGE;
};

const AdminDashboard: React.FC<Props> = ({ cafes = [], chartData = []}) => {
  const totalCafes = cafes.length;
  const totalTables = cafes.reduce((acc, cafe) => acc + (cafe.tables?.length || 0), 0);
  const totalMenus = cafes.reduce((acc, cafe) => acc + (cafe.menus?.length || 0), 0);
  const totalMeetingRooms = cafes.filter(c => c.facilities?.meeting_room?.available).length;
  
  const kpiData = [
    { title: "Total Caffe & Resto", value: totalCafes, icon: Store, color: "text-blue-600", bg: "bg-blue-50", subtitle: "Entitas yang Dikelola" },
    { title: "Total Meja", value: totalTables, icon: Sofa, color: "text-yellow-600", bg: "bg-yellow-50", subtitle: `${totalMeetingRooms} Ruang Meeting` },
    { title: "Total Menu", value: totalMenus, icon: Utensils, color: "text-green-600", bg: "bg-green-50", subtitle: "Item di semua kafe" },
    { title: "Total Pengguna", value: totalCafes, icon: Users, color: "text-purple-600", bg: "bg-purple-50", subtitle: "Pengguna terdaftar" },
  ];

  const latestCafes = cafes
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const facilityLabels: Record<string, string> = {
    wifi: 'WiFi',
    colokan: 'Colokan',
    indoor: 'Indoor',
    outdoor: 'Outdoor',
    smoking_area: 'Smoking',
    meeting_room: 'Meeting Room',
  };

  const formatFacilityBadges = (cafe: Cafe) => {
    const facilities: Record<string, any> = cafe.facilities || {};

    return Object.entries(facilities)
        .filter(([key, value]) => {
            if (typeof value === 'boolean') {
                return value;
            }
            if (typeof value === 'object' && value !== null && 'available' in value) {
                return value.available;
            }
            return false;
        })
        .map(([key]) => (
            <Badge key={key} variant="outline" className="mr-1 mt-1 text-xs">
                {facilityLabels[key] || key}
            </Badge>
        ));
  };
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <Card key={kpi.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                    {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {kpi.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
            
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Overview Caffe & Resto</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart data={chartData} />
                </CardContent>
            </Card>

            <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Aktivitas Cepat</CardTitle>
                    <Button size="sm" onClick={() => router.get('/admin/cafes')} variant="link" className="p-0">
                        Lihat Semua
                    </Button>
                </CardHeader>
                <CardContent>
                    {latestCafes.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground text-sm">Tidak ada kafe terbaru yang dicatat.</p>
                    ) : (
                        <div className="space-y-4">
                            {latestCafes.map((cafe) => (
                                <div key={cafe.id} className="flex items-start justify-between border-b pb-3 last:border-b-0">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full bg-[#BDEE63]/20">
                                            <Coffee className="w-4 h-4 text-[#BDEE63]" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{cafe.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3"/> {cafe.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary" className="text-xs">{cafe.kategori}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {cafe.created_at ? format(new Date(cafe.created_at), 'dd MMM yyyy', { locale: id }) : '-'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detail Caffe & Resto Terbaru</CardTitle>
          </CardHeader>

          <CardContent>
            {latestCafes.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Tidak ada kafe terbaru untuk ditampilkan secara detail.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[400px]">Caffe & Resto</TableHead>
                      <TableHead className="w-[280px]">Lokasi</TableHead>
                      <TableHead className="w-[280px]">Fasilitas Utama</TableHead>
                      <TableHead className="text-center w-[10px]">Meja</TableHead>
                      <TableHead className="text-center w-[10px]">Menu</TableHead>
                      <TableHead className="w-[180px]">Dibuat Pada</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {latestCafes.map((cafe) => {
                      const photoUrl = getPrimaryPhotoUrl(cafe.photos);

                      return (
                        <TableRow key={cafe.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <img
                                src={photoUrl}
                                alt={cafe.name}
                                className="w-14 h-14 rounded object-cover flex-shrink-0"
                              />

                              <div className="flex flex-col">
                                <p className="font-semibold text-sm">{cafe.name || "Tidak ada nama."}</p>

                                <Badge className="w-fit mt-1 text-xs">
                                  {cafe.kategori || "Tanpa Kategori"}
                                </Badge>

                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-xs">
                                  {cafe.description || "Tidak ada deskripsi."}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {cafe.location || "Tidak ada lokasi."}
                            </div>
                          </TableCell>

                          <TableCell className="max-w-md">
                            <div className="flex flex-wrap">
                              {formatFacilityBadges(cafe) || "Tidak ada fasilitas."}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">{cafe.tables?.length || 0}</TableCell>
                          <TableCell className="text-center">{cafe.menus?.length || 0}</TableCell>

                          <TableCell className="text-sm">
                            {cafe.created_at
                              ? format(new Date(cafe.created_at), "dd MMM yyyy", { locale: id })
                              : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
};

export default AdminDashboard;