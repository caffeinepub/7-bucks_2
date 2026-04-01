import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useGetConfig, useIsAdmin, useSetConfig } from "@/hooks/useQueries";
import { Eye, EyeOff, Info, Loader2, Save, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MASK_DELAY = 20_000;
const UAT_ACQUIRE = "https://api-uat.contipay.net/acquire/payment";
const LIVE_DISBURSE = "https://api-v2.contipay.co.zw/disburse/payment";

export default function AdminConfig() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: currentConfig } = useGetConfig();
  const setConfig = useSetConfig();

  const [merchantId, setMerchantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [acquireEndpoint, setAcquireEndpoint] = useState(UAT_ACQUIRE);
  const [disburseEndpoint, setDisburseEndpoint] = useState(LIVE_DISBURSE);
  const [sslPemContent, setSslPemContent] = useState("");
  const [masked, setMasked] = useState(false);
  const [env, setEnv] = useState<"test" | "live">("test");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetMaskTimer = useCallback(() => {
    setMasked(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMasked(true), MASK_DELAY);
  }, []);

  useEffect(() => {
    if (currentConfig) {
      setMerchantId(currentConfig.merchantId || "");
      setApiKey(currentConfig.apiKey || "");
      setApiSecret(currentConfig.apiSecret || "");
      setAcquireEndpoint(currentConfig.acquireEndpoint || UAT_ACQUIRE);
      setDisburseEndpoint(currentConfig.disburseEndpoint || LIVE_DISBURSE);
      setSslPemContent(currentConfig.sslPemContent || "");
      resetMaskTimer();
    }
  }, [currentConfig, resetMaskTimer]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  /* Switch env presets */
  const handleEnvSwitch = (newEnv: "test" | "live") => {
    setEnv(newEnv);
    if (newEnv === "test") {
      setAcquireEndpoint("https://api-uat.contipay.net/acquire/payment");
      setDisburseEndpoint("https://api-uat.contipay.net/disburse/payment");
    } else {
      setAcquireEndpoint("https://api-v2.contipay.co.zw/acquire/payment");
      setDisburseEndpoint("https://api-v2.contipay.co.zw/disburse/payment");
    }
    resetMaskTimer();
  };

  const handleInteraction = useCallback(
    () => resetMaskTimer(),
    [resetMaskTimer],
  );

  const handleSave = async () => {
    resetMaskTimer();
    try {
      await setConfig.mutateAsync({
        merchantId,
        apiKey,
        apiSecret,
        acquireEndpoint,
        disburseEndpoint,
        sslPemContent,
      });
      toast.success("Configuration saved successfully.");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to save configuration.";
      toast.error(msg);
    }
  };

  if (adminLoading) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-4"
        data-ocid="admin.loading_state"
      >
        <Skeleton className="h-10 w-48 bg-muted/20" />
        <Skeleton className="h-[480px] rounded-2xl bg-muted/20" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center"
        data-ocid="admin.error_state"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have administrator privileges.
        </p>
      </div>
    );
  }

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-10"
      onMouseMove={handleInteraction}
      onKeyDown={handleInteraction}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl mb-1">
              Admin Configuration
            </h1>
            <p className="text-muted-foreground text-sm">
              ContiPay credentials &amp; SSL certificate setup.
            </p>
          </div>
          {masked ? (
            <button
              type="button"
              onClick={resetMaskTimer}
              data-ocid="admin.unmask.button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary/40"
            >
              <Eye className="w-3.5 h-3.5" /> Reveal
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <EyeOff className="w-3.5 h-3.5" /> Auto-hides in 20s
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
        data-ocid="admin.config.panel"
      >
        {/* Environment toggle */}
        <div className="card-dark p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Environment
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleEnvSwitch("test")}
              data-ocid="admin.env.test.toggle"
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                env === "test"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Sandbox (UAT)
            </button>
            <button
              type="button"
              onClick={() => handleEnvSwitch("live")}
              data-ocid="admin.env.live.toggle"
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                env === "live"
                  ? "bg-warning text-background font-bold"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Live (Production)
            </button>
          </div>
          {env === "live" && (
            <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-warning/8 border border-warning/25">
              <Info className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning/90">
                Live environment processes real money. Ensure credentials are
                correct before saving.
              </p>
            </div>
          )}
        </div>

        {/* Main config form */}
        <div className="card-dark glow-border p-6 rounded-2xl space-y-5">
          {/* Merchant ID */}
          <div className="space-y-1.5">
            <Label
              htmlFor="merchantId"
              className="text-xs text-muted-foreground"
            >
              Merchant ID *
            </Label>
            <Input
              id="merchantId"
              placeholder="12345"
              value={merchantId}
              onChange={(e) => {
                setMerchantId(e.target.value);
                handleInteraction();
              }}
              data-ocid="admin.merchant_id.input"
              className="bg-input/40 border-border/60 font-mono"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="apiKey" className="text-xs text-muted-foreground">
              Auth Key (API Key) *
            </Label>
            <div className={masked ? "masked-field" : ""}>
              <Input
                id="apiKey"
                type="text"
                placeholder="your_auth_key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  handleInteraction();
                }}
                data-ocid="admin.api_key.input"
                className="bg-input/40 border-border/60 font-mono"
              />
            </div>
          </div>

          {/* API Secret */}
          <div className="space-y-1.5">
            <Label
              htmlFor="apiSecret"
              className="text-xs text-muted-foreground"
            >
              Auth Secret (API Secret) *
            </Label>
            <div className={masked ? "masked-field" : ""}>
              <Input
                id="apiSecret"
                type="text"
                placeholder="your_auth_secret"
                value={apiSecret}
                onChange={(e) => {
                  setApiSecret(e.target.value);
                  handleInteraction();
                }}
                data-ocid="admin.api_secret.input"
                className="bg-input/40 border-border/60 font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for Basic Auth:{" "}
              <code className="font-mono text-xs bg-muted/20 px-1 py-0.5 rounded">
                btoa(authKey:authSecret)
              </code>
            </p>
          </div>

          {/* Acquire Endpoint */}
          <div className="space-y-1.5">
            <Label
              htmlFor="acquireEndpoint"
              className="text-xs text-muted-foreground"
            >
              Acquire Endpoint URL
            </Label>
            <Input
              id="acquireEndpoint"
              placeholder={UAT_ACQUIRE}
              value={acquireEndpoint}
              onChange={(e) => {
                setAcquireEndpoint(e.target.value);
                handleInteraction();
              }}
              data-ocid="admin.acquire_endpoint.input"
              className="bg-input/40 border-border/60 font-mono text-xs"
            />
          </div>

          {/* Disburse Endpoint */}
          <div className="space-y-1.5">
            <Label
              htmlFor="disburseEndpoint"
              className="text-xs text-muted-foreground"
            >
              Disburse Endpoint URL
            </Label>
            <Input
              id="disburseEndpoint"
              placeholder={LIVE_DISBURSE}
              value={disburseEndpoint}
              onChange={(e) => {
                setDisburseEndpoint(e.target.value);
                handleInteraction();
              }}
              data-ocid="admin.disburse_endpoint.input"
              className="bg-input/40 border-border/60 font-mono text-xs"
            />
          </div>

          {/* SSL PEM */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sslPemContent"
              className="text-xs text-muted-foreground"
            >
              SSL Private Key (PEM) *
            </Label>
            <div className={masked ? "masked-field" : ""}>
              <Textarea
                id="sslPemContent"
                placeholder={
                  "-----BEGIN PRIVATE KEY-----\nMIIB...\n-----END PRIVATE KEY-----"
                }
                value={sslPemContent}
                onChange={(e) => {
                  setSslPemContent(e.target.value);
                  handleInteraction();
                }}
                data-ocid="admin.ssl_pem.textarea"
                className="bg-input/40 border-border/60 font-mono text-xs h-36 resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              SSL private key (.pem) for signing ContiPay disburse requests via
              SHA256 checksum. Checksum fields:{" "}
              <code className="font-mono bg-muted/20 px-1 rounded">
                authKey + reference + merchantId + account + accountNumber +
                amount
              </code>
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={setConfig.isPending}
            data-ocid="admin.save.primary_button"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          >
            {setConfig.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Configuration
              </>
            )}
          </Button>

          {setConfig.isSuccess && (
            <div
              className="text-center text-sm text-success"
              data-ocid="admin.save.success_state"
            >
              ✓ Configuration saved successfully
            </div>
          )}
          {setConfig.isError && (
            <div
              className="text-center text-sm text-destructive"
              data-ocid="admin.save.error_state"
            >
              ✗ Failed to save. Please try again.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
