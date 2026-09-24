"use client";
import { useEffect, useState } from "react";
import { UserPlus, IndianRupee, Star, Clock, XCircle } from "lucide-react";
import { PageHeader, PageLoader, EmptyState, StatCard } from "@/components/ui";
import api from "@/lib/api";

interface ActivityEvent {
  type: "signup" | "purchase" | "pending" | "failed" | "review";
  message: string;
  time: string;
  meta: Record<string, any>;
}

const ICONS: Record<string, any> = {
  signup: UserPlus,
  purchase: IndianRupee,
  pending: Clock,
  failed: XCircle,
  review: Star,
};

const COLORS: Record<string, string> = {
  signup: "text-blue-400 bg-blue-500/10",
  purchase: "text-emerald-400 bg-emerald-500/10",
  pending: "text-amber-400 bg-amber-500/10",
  failed: "text-red-400 bg-red-500/10",
  review: "text-yellow-400 bg-yellow-500/10",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [summary, setSummary] = useState({ newUsers: 0, newPurchases: 0, newReviews: 0 });
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/recent-activity");
      setEvents(data.data || []);
      setSummary(data.summary || { newUsers: 0, newPurchases: 0, newReviews: 0 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader title="Recent Activity" description="Everything that happened in the app in the last 48 hours" />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="New Sign-ups" value={summary.newUsers} icon={UserPlus} color="blue" />
        <StatCard label="Purchases" value={summary.newPurchases} icon={IndianRupee} color="green" />
        <StatCard label="New Reviews" value={summary.newReviews} icon={Star} color="amber" />
      </div>

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        {loading ? (
          <PageLoader />
        ) : events.length === 0 ? (
          <EmptyState title="No activity in the last 48 hours" />
        ) : (
          <div className="space-y-1">
            {events.map((ev, i) => {
              const Icon = ICONS[ev.type] || Clock;
              return (
                <div key={i} className="flex items-center gap-3 py-3 px-2 border-b border-[#1E1E2E] last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${COLORS[ev.type] || "text-gray-400 bg-gray-500/10"}`}>
                    <Icon size={14} />
                  </div>
                  <p className="text-white text-sm flex-1">{ev.message}</p>
                  <span className="text-gray-500 text-xs flex-shrink-0">{timeAgo(ev.time)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
