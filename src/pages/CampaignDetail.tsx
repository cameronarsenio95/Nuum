import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Edit2,
  Trash2,
  FileText,
  X,
  Link2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { AdSetFormModal } from "../components/campaigns/AdSetFormModal";
import { LinkContentModal } from "../components/modals/LinkContentModal";
import type { Database } from "../lib/database.types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type AdSet = Database["public"]["Tables"]["ad_sets"]["Row"];
type Creator = Database["public"]["Tables"]["creators"]["Row"];
type ContentMedia = Database["public"]["Tables"]["content_media"]["Row"];

interface CampaignDetailProps {
  campaignId: string;
  workspaceId: string;
  onBack: () => void;
}

interface CreatorWithRevenue extends Creator {
  total_revenue: number;
  ad_sets_count: number;
}

interface AdSetWithContent extends AdSet {
  creators: Creator | null;
  content_count?: number;
}

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case "active":
      return "bg-nuum-dark-green text-nuum-accent-green";
    case "draft":
      return "bg-gray-700 text-gray-300";
    case "completed":
      return "bg-nuum-dark-blue text-nuum-accent-blue";
    case "paused":
      return "bg-yellow-900/30 text-yellow-500";
    case "archived":
      return "bg-gray-800 text-gray-400";
    default:
      return "bg-gray-700 text-gray-300";
  }
};

const getDealTypeBadge = (dealType: string | null) => {
  if (!dealType) return null;
  const badges = {
    spark: "bg-nuum-dark-blue text-nuum-accent-blue",
    barter: "bg-nuum-dark-green text-nuum-accent-green",
    gifting: "bg-nuum-accent-brown text-nuum-accent-orange",
  };
  return badges[dealType as keyof typeof badges] || "bg-gray-700 text-gray-300";
};

const formatDuration = (durationDays: number | null) => {
  if (!durationDays) return "—";
  return `${durationDays} days`;
};

export function CampaignDetail({
  campaignId,
  workspaceId,
  onBack,
}: CampaignDetailProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [adSets, setAdSets] = useState<AdSetWithContent[]>([]);
  const [creators, setCreators] = useState<CreatorWithRevenue[]>([]);
  const [showAdSetModal, setShowAdSetModal] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);
  const [showLinkContentModal, setShowLinkContentModal] = useState(false);
  const [linkContentAdSet, setLinkContentAdSet] =
    useState<AdSetWithContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentMedia[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adSetToDelete, setAdSetToDelete] = useState<AdSet | null>(null);

  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    roi: 0,
    totalCreators: 0,
  });

  useEffect(() => {
    loadCampaignData();
  }, [campaignId, workspaceId]);

  const loadCampaignData = async () => {
    setLoading(true);
    const { data: campaignData } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();
    if (!campaignData) return setLoading(false);
    setCampaign(campaignData);

    const { data: adSetsData } = await supabase
      .from("ad_sets")
      .select("*, creators(*)")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (adSetsData) {
      const adSetsWithContent = await Promise.all(
        adSetsData.map(async (adSet) => {
          const { count } = await supabase
            .from("content_media")
            .select("*", { count: "exact", head: true })
            .eq("ad_set_id", adSet.id);
          return { ...adSet, content_count: count || 0 };
        })
      );
      setAdSets(adSetsWithContent);
    }
    setLoading(false);
  };

  const handleDeleteAdSet = async () => {
    if (!adSetToDelete) return;
    try {
      console.log("[DELETE] Trying with workspace_id:", workspaceId);
      let { error, count } = await supabase
        .from("ad_sets")
        .delete({ count: "exact" })
        .eq("id", adSetToDelete.id)
        .eq("workspace_id", workspaceId);

      // fallback
      if (error || count === 0) {
        console.warn("[DELETE] Fallback delete without workspace_id");
        const res = await supabase
          .from("ad_sets")
          .delete()
          .eq("id", adSetToDelete.id);
        if (res.error) {
          console.error("[DELETE_ERROR]", res.error);
          alert("Failed to delete ad set.");
          return;
        }
      }

      setAdSets((prev) =>
        prev.filter((set) => set.id !== adSetToDelete.id)
      );
      setShowDeleteConfirm(false);
      setAdSetToDelete(null);
      console.log("[DELETE_SUCCESS]", adSetToDelete.id);
    } catch (err) {
      console.error("[DELETE_EXCEPTION]", err);
      alert("Unexpected error while deleting ad set.");
    }
  };

  if (loading)
    return <div className="text-nuum-text-secondary">Loading campaign...</div>;
  if (!campaign)
    return <div className="text-nuum-text-secondary">Campaign not found</div>;

  return (
    <>
      {/* modal voor verwijderen */}
      {showDeleteConfirm && adSetToDelete && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-nuum-surface border border-nuum-border rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-nuum-text-primary mb-4">
              Delete Ad Set
            </h3>
            <p className="text-nuum-text-secondary mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-nuum-text-primary">
                {adSetToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-nuum-border rounded-lg text-nuum-text-secondary hover:bg-nuum-border/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdSet}
                className="flex-1 px-4 py-2 bg-nuum-accent-red hover:bg-nuum-accent-red/90 text-white rounded-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-nuum-text-secondary hover:text-nuum-text-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-nuum-text-primary">
            {campaign.name}
          </h1>
        </div>

        <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-nuum-accent-blue" />
              <h2 className="text-lg font-semibold text-nuum-text-primary">
                Ad Sets
              </h2>
            </div>
            <button
              onClick={() => setShowAdSetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-nuum-accent-blue hover:bg-nuum-accent-blue/90 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Ad Set
            </button>
          </div>

          {adSets.length === 0 ? (
            <div className="text-center py-12 text-nuum-text-secondary">
              No ad sets yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-nuum-border">
                  <th className="py-3 px-3 text-left text-xs text-nuum-text-secondary">
                    Name
                  </th>
                  <th className="py-3 px-3 text-left text-xs text-nuum-text-secondary">
                    Platform
                  </th>
                  <th className="py-3 px-3 text-right text-xs text-nuum-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {adSets.map((adSet) => (
                  <tr
                    key={adSet.id}
                    className="border-b border-nuum-border hover:bg-nuum-background transition-all"
                  >
                    <td className="py-3 px-3 text-sm text-nuum-text-primary">
                      {adSet.name}
                    </td>
                    <td className="py-3 px-3 text-sm text-nuum-text-secondary capitalize">
                      {adSet.platform}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setAdSetToDelete(adSet);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 hover:bg-nuum-dark-red rounded-lg text-nuum-text-secondary hover:text-nuum-accent-red transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
