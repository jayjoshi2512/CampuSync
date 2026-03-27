import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ToastProvider";
import MemoryWall from "@/components/memories/MemoryWall";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { ArrowLeft, Calendar, Briefcase } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface Memory {
  id: number;
  media_type: "photo" | "video";
  cloudinary_url: string;
  thumbnail_url?: string;
  caption?: string;
  uploader?: { name: string; avatar_url?: string };
  reaction_counts?: Record<string, number>;
  viewer_reactions?: string[];
  created_at: string;
}

interface UserProfile {
  id: number;
  name: string;
  avatar_url?: string;
  branch?: string;
  batch_year?: number;
}

export default function UserMemoryProfile() {
  const { user_id } = useParams<{ user_id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCompactLayout = useMediaQuery("(max-width: 760px)");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    loadUserMemories();
  }, [user_id]);

  const loadUserMemories = async (nextCursor?: string) => {
    if (!user_id) return;
    try {
      const params: any = { limit: 20 };
      if (nextCursor) params.cursor = nextCursor;
      const { data } = await api.get(`/memories/profile/${user_id}`, {
        params,
      });
      setUser(data.user);
      setMemories((prev) =>
        nextCursor ? [...prev, ...data.memories] : data.memories,
      );
      setCursor(data.nextCursor || null);
      setHasMore(!!data.hasMore);
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to load memories", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (cursor && hasMore) {
      loadUserMemories(cursor);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 8,
            }}
          >
            Profile Not Found
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-text-muted)",
              marginBottom: 24,
            }}
          >
            This user profile doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "var(--color-brand)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Fixed Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "var(--color-bg-secondary)",
          borderBottom: "1px solid var(--color-border-subtle)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 100,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Memory Wall
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero + Profile */}
      <div style={{ paddingTop: 56 }}>
        <div
          style={{
            background: "linear-gradient(135deg, var(--color-brand), #059669)",
            height: isCompactLayout ? 100 : 140,
            position: "relative",
          }}
        />
        <div
          style={{
            padding: "0 16px 24px",
            position: "relative",
            marginTop: isCompactLayout ? -40 : -48,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: isCompactLayout ? 64 : 80,
                height: isCompactLayout ? 64 : 80,
                borderRadius: "50%",
                background: "var(--color-bg-secondary)",
                border: "4px solid var(--color-bg-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isCompactLayout ? 28 : 36,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                user.name[0]
              )}
            </div>
            <div style={{ flex: 1, marginBottom: 4 }}>
              <h1
                style={{
                  fontSize: isCompactLayout ? 18 : 22,
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--color-text-primary)",
                }}
              >
                {user.name}
              </h1>
              {(user.branch || user.batch_year) && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-muted)",
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {user.branch && (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Briefcase size={12} /> {user.branch}
                    </span>
                  )}
                  {user.batch_year && (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Calendar size={12} /> {user.batch_year}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              background: "var(--color-bg-secondary)",
              borderRadius: 10,
              border: "1px solid var(--color-border-default)",
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
            <strong style={{ color: "var(--color-text-primary)" }}>
              {memories.length}
            </strong>{" "}
            memories shared
          </div>
        </div>
      </div>

      {/* Memories Grid */}
      <div style={{ padding: "0 16px 40px", maxWidth: 1200, margin: "0 auto" }}>
        {memories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 16px",
              color: "var(--color-text-muted)",
            }}
          >
            <p style={{ fontSize: 14, marginBottom: 0 }}>No memories yet</p>
          </div>
        ) : (
          <>
            <MemoryWall
              memories={memories}
              canReact={false}
              loading={false}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </>
        )}
      </div>
    </div>
  );
}
