import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { Rocket } from "lucide-react";
import { Alert, Button, Card, Input, Label, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCreateCampaign, usePredictedNextAddress } from "@/hooks/useActions";
import { useInvalidateOnSuccess } from "@/hooks/useInvalidateOnSuccess";
import { pinCampaignMetadata } from "@/lib/api";

const CATEGORIES = ["technology", "art", "music", "film", "games", "community", "environment", "other"];

export default function CreateCampaignPage() {
  const { address: account } = useAccount();
  const toast = useToast();
  const create = useCreateCampaign();
  const predictAddress = usePredictedNextAddress();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("technology");
  const [goalEth, setGoalEth] = useState("1");
  const [durationDays, setDurationDays] = useState("30");
  const [skipIpfs, setSkipIpfs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [predicted, setPredicted] = useState<`0x${string}` | null>(null);

  useInvalidateOnSuccess(create.phase);

  const successToasted = useRef(false);
  useEffect(() => {
    if (create.receipt.isSuccess && !successToasted.current) {
      successToasted.current = true;
      toast.success("Campaign contract deployed!");
    }
  }, [create.receipt.isSuccess, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      let ipfsHash = `manual-${Date.now().toString(36)}`;

      if (!skipIpfs) {
        try {
          const pin = await pinCampaignMetadata({
            title,
            description,
            category,
          });
          ipfsHash = pin.cid;
        } catch (err) {
          setFormError(
            `IPFS upload failed (${err instanceof Error ? err.message : err}). Enable "Skip IPFS" to proceed with a placeholder hash.`
          );
          return;
        }
      }

      const tx = await create.createCampaign(
        parseEther(goalEth),
        BigInt(Number(durationDays) * 86_400),
        ipfsHash
      );

      if (tx) {
        toast.info("Transaction submitted — waiting for confirmation…");
        setTimeout(async () => {
          try {
            setPredicted(await predictAddress());
          } catch {
            /* non-critical */
          }
        }, 2_000);
      } else if (create.error) {
        toast.error(create.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-slate-400">
        Connect your wallet to create a campaign.
      </div>
    );
  }

  if (create.receipt.isSuccess && predicted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Alert tone="success">
          <p className="font-semibold">Campaign deployed!</p>
          <p className="mt-1 font-mono text-xs">{predicted}</p>
          <Link to={`/campaign/${predicted}`} className="mt-3 inline-block underline">
            View your campaign →
          </Link>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        <Rocket className="text-violet-400" size={26} /> Launch a campaign
      </h1>

      <Card className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Build an open-source drone" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" required minLength={10} maxLength={10_000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you building and why does it matter?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="goal">Goal (ETH)</Label>
              <Input id="goal" type="number" min="0.001" step="0.001" required value={goalEth} onChange={(e) => setGoalEth(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (days)</Label>
            <Input id="duration" type="number" min="1" max="365" required value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={skipIpfs}
              onChange={(e) => setSkipIpfs(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-violet-600"
            />
            Skip IPFS upload (use placeholder hash — for local testing without backend)
          </label>

          {formError && <Alert>{formError}</Alert>}
          {create.error && <Alert>{create.error}</Alert>}

          <Button type="submit" className="w-full" loading={submitting || create.phase === "pending"}>
            {create.phase === "pending" ? "Deploying campaign…" : "Deploy campaign contract"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
