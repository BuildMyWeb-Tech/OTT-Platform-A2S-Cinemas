"use client";
import { useEffect, useState } from "react";
import { UserPlus, IndianRupee, Star, Clock, XCircle } from "lucide-react";
import { PageHeader, PageLoader, EmptyState, StatCard, Table, Badge } from "@/components/ui";
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

const BADGE_VARIANT: Record<string, "green" | "amber" | "red" | "blue" | "gray"> = {
  signup: "blue",
  purchase: "green",
  pending: "amber",
  failed: "red",
  review: "gray",
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

function exactDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [summary, setSummary] = useState({ newUsers: 0, newPurchases: 0, newReviews: 0 });
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/recent-activity");
      setEvents(data.data || []);
      setSummary(data.summary || { newUsers: 0, newPurchases: 0, newReviews: 0 });
      setUsedFallback(!!data.usedFallback);
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
      <PageHeader title="Recent Activity" description="Everything that happened in the app in the last 56 hours" />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="New Sign-ups" value={summary.newUsers} icon={UserPlus} color="blue" />
        <StatCard label="Purchases" value={summary.newPurchases} icon={IndianRupee} color="green" />
        <StatCard label="New Reviews" value={summary.newReviews} icon={Star} color="amber" />
      </div>

      {usedFallback && !loading && events.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">
          <p className="text-amber-400 text-sm">
            Nothing happened in the last 56 hours — showing the last 3 activities instead.
          </p>
        </div>
      )}

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        {loading ? (
          <PageLoader />
        ) : events.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <Table headers={["Type", "Details", "Date & Time", "Time Ago"]}>
            {events.map((ev, i) => {
              const Icon = ICONS[ev.type] || Clock;
              return (
                <tr key={i} className="hover:bg-[#1A1A24] transition-colors">
                  <td className="py-3 px-4 first:pl-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${COLORS[ev.type] || "text-gray-400 bg-gray-500/10"}`}>
                        <Icon size={13} />
                      </div>
                      <Badge variant={BADGE_VARIANT[ev.type] || "gray"}>{ev.type}</Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-white text-sm">{ev.message}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-400 text-sm">{exactDateTime(ev.time)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-500 text-xs">{timeAgo(ev.time)}</span>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}
