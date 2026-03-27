import { useState, useEffect } from "react";
import api from "@/utils/api";
import GlassCard from "@/components/GlassCard";
import { Calendar, MapPin, Clock, Loader2, Users } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface OrgEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
}

export default function EventsTab() {
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpIds, setRsvpIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    api
      .get("/features")
      .then((res) => {
        const data = res.data.features || {};
        setEvents(data.events || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRsvp = (id: string) => {
    if (rsvpIds.includes(id)) {
      setRsvpIds((prev) => prev.filter((x) => x !== id));
      toast("RSVP cancelled", "info");
    } else {
      setRsvpIds((prev) => [...prev, id]);
      toast("RSVP successful! See you there", "success");
    }
  };

  return (
    <div className="px-10 py-8 max-w-[1200px] mx-auto">
      {loading ? (
        <div className="flex justify-center py-[100px]">
          <Loader2
            size={32}
            className="animate-[spin_1s_linear_infinite] text-[var(--color-brand)]"
          />
        </div>
      ) : events.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: "center" }}>
          <Calendar
            size={32}
            className="text-[var(--color-text-muted)] mx-auto block mb-4"
          />
          <h3 className="m-0 mb-2 text-[var(--color-text-primary)]">
            No upcoming events
          </h3>
          <p className="m-0 text-[var(--color-text-muted)] text-[14px]">
            Check back later for new events.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {events.map((e) => {
            const isRsvp = rsvpIds.includes(e.id);
            return (
              <GlassCard
                key={e.id}
                elevation={1}
                style={{ padding: 24, display: "flex", flexDirection: "column" }}
              >
                <div className="flex gap-3 mb-4">
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl px-3.5 py-2.5 flex flex-col items-center justify-center border border-[var(--color-border-subtle)]">
                    <span className="text-[12px] font-semibold text-[var(--color-brand)] uppercase">
                      {new Date(e.date).toLocaleString("default", { month: "short" })}
                    </span>
                    <span className="text-[22px] font-bold text-[var(--color-text-primary)]">
                      {new Date(e.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="m-0 mb-1.5 text-[16px] font-semibold text-[var(--color-text-primary)] leading-snug">
                      {e.title}
                    </h3>
                    <div className="flex gap-3 text-[var(--color-text-muted)] text-[12px] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {e.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {e.location}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="m-0 mb-5 text-[13px] text-[var(--color-text-secondary)] leading-relaxed flex-1">
                  {e.description}
                </p>
                <div className="flex justify-between items-center border-t border-[var(--color-border-subtle)] pt-4">
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
                    <Users size={14} /> {e.attendees + (isRsvp ? 1 : 0)} attending
                  </span>
                  <button
                    onClick={() => handleRsvp(e.id)}
                    className="py-2 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-200"
                    style={{
                      background: isRsvp ? "var(--color-bg-tertiary)" : "var(--color-brand)",
                      color: isRsvp ? "var(--color-brand)" : "#fff",
                      border: isRsvp ? "1px solid var(--color-border-default)" : "none",
                    }}
                  >
                    {isRsvp ? "Going ✓" : "RSVP Now"}
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
