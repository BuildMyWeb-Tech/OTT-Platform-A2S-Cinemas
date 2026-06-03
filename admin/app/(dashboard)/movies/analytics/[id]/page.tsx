"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Download, Users, IndianRupee,
    Star, ShoppingCart, FileText, FileSpreadsheet,
} from "lucide-react";
import { PageLoader, Badge, Table, Button } from "@/components/ui";
import api from "@/lib/api";

interface AnalyticsData {
    movie: { _id: string; title: string; poster: string; price: number; genre: string };
    summary: {
        totalPurchases: number;
        totalRevenue: number;
        averageRating: number;
        reviewCount: number;
        ratingDistribution: { star: number; count: number }[];
    };
    purchasers: {
        userId: string;
        name: string;
        email: string;
        purchaseDate: string;
        amountPaid: number;
        licenseStatus: "active" | "expired" | "revoked" | "none";
    }[];
    period: string;
}

const LICENSE_VARIANT = {
    active: "green", expired: "gray", revoked: "red", none: "gray",
} as const;

const PERIODS = [
    { label: "All Time", value: "all" },
    { label: "7 Days",   value: "7d"  },
    { label: "30 Days",  value: "30d" },
    { label: "90 Days",  value: "90d" },
];

function StatCard({ label, value, icon: Icon, color }: {
    label: string; value: string | number;
    icon: React.ElementType; color: string;
}) {
    return (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-sm">{label}</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                </div>
            </div>
            <p className="text-white text-2xl font-semibold">{value}</p>
        </div>
    );
}

export default function MovieAnalyticsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("all");
    const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);

    const fetchAnalytics = async (p: string) => {
        setLoading(true);
        try {
            const { data: res } = await api.get(`/admin/analytics/${params.id}?period=${p}`);
            setData(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAnalytics(period); }, [period]);

    const handleExport = async (format: "csv" | "excel") => {
        setExporting(format);
        try {
            const res = await api.get(
                `/admin/analytics/${params.id}/export?format=${format}&period=${period}`,
                { responseType: "blob" }
            );
            const ext = format === "csv" ? "csv" : "xlsx";
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data?.movie.title ?? "analytics"}-${period}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) { console.error(e); }
        finally { setExporting(null); }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    if (loading) return <PageLoader />;
    if (!data) return <p className="text-gray-500">Analytics not found</p>;

    const maxRatingCount = Math.max(...data.summary.ratingDistribution.map((r) => r.count), 1);

    return (
        <div>
            <Link href="/movies" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
                <ArrowLeft size={15} />
                Back to Movies
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <img src={data.movie.poster} alt={data.movie.title}
                        className="w-12 h-16 object-cover rounded" />
                    <div>
                        <h1 className="text-xl font-semibold text-white">{data.movie.title}</h1>
                        <p className="text-gray-500 text-sm mt-0.5">{data.movie.genre} · ₹{data.movie.price}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        loading={exporting === "csv"}
                        onClick={() => handleExport("csv")}
                    >
                        <FileText size={14} />
                        Export CSV
                    </Button>
                    <Button
                        variant="secondary"
                        loading={exporting === "excel"}
                        onClick={() => handleExport("excel")}
                    >
                        <FileSpreadsheet size={14} />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Period filter */}
            <div className="flex gap-2 mb-6">
                {PERIODS.map((p) => (
                    <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            period === p.value
                                ? "bg-[#E50914] text-white"
                                : "bg-[#111118] border border-[#1E1E2E] text-gray-400 hover:text-white"
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Purchases"
                    value={data.summary.totalPurchases}
                    icon={ShoppingCart}
                    color="bg-blue-500/10 text-blue-400"
                />
                <StatCard
                    label="Total Revenue"
                    value={`₹${data.summary.totalRevenue.toLocaleString("en-IN")}`}
                    icon={IndianRupee}
                    color="bg-emerald-500/10 text-emerald-400"
                />
                <StatCard
                    label="Average Rating"
                    value={`${data.summary.averageRating} ★`}
                    icon={Star}
                    color="bg-amber-500/10 text-amber-400"
                />
                <StatCard
                    label="Total Reviews"
                    value={data.summary.reviewCount}
                    icon={Users}
                    color="bg-purple-500/10 text-purple-400"
                />
            </div>

            {/* Rating distribution */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 mb-6">
                <h2 className="text-white font-medium text-sm mb-4">Rating Distribution</h2>
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const item = data.summary.ratingDistribution.find((r) => r.star === star);
                        const count = item?.count ?? 0;
                        const pct = maxRatingCount > 0 ? Math.round((count / maxRatingCount) * 100) : 0;
                        return (
                            <div key={star} className="flex items-center gap-3">
                                <span className="text-amber-400 text-sm w-6">{star}★</span>
                                <div className="flex-1 bg-[#1E1E2E] rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-gray-500 text-xs w-6 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Purchasers table */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                <h2 className="text-white font-medium text-sm mb-4">
                    Purchasers ({data.purchasers.length})
                </h2>
                {data.purchasers.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No purchases in this period</p>
                ) : (
                    <Table headers={["User", "Email", "Purchase Date", "Amount", "License Status"]}>
                        {data.purchasers.map((p, i) => (
                            <tr key={i} className="hover:bg-[#1A1A24] transition-colors">
                                <td className="py-3 px-4 first:pl-0">
                                    <p className="text-white text-sm font-medium">{p.name}</p>
                                </td>
                                <td className="py-3 px-4">
                                    <p className="text-gray-400 text-sm">{p.email}</p>
                                </td>
                                <td className="py-3 px-4">
                                    <p className="text-gray-400 text-sm">{formatDate(p.purchaseDate)}</p>
                                </td>
                                <td className="py-3 px-4">
                                    <p className="text-white text-sm font-medium">₹{p.amountPaid}</p>
                                </td>
                                <td className="py-3 px-4">
                                    <Badge variant={LICENSE_VARIANT[p.licenseStatus]}>
                                        {p.licenseStatus}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </div>
        </div>
    );
}