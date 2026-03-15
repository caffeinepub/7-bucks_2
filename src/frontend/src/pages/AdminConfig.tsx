import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useGetConfig, useIsAdmin, useSetConfig } from "@/hooks/useQueries";
import { Eye, EyeOff, Loader2, Save, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MASK_DELAY = 20_000;

export default function AdminConfig() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: currentConfig } = useGetConfig();
  const setConfig = useSetConfig();

  const [merchantId, setMerchantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [acquireEndpoint, setAcquireEndpoint] = useState("");
  const [disburseEndpoint, setDisburseEndpoint] = useState("");
  const [sslPemContent, setSslPemContent] = useState("");
  const [masked, setMasked] = useState(false);

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
      setAcquireEndpoint(currentConfig.acquireEndpoint || "");
      setDisburseEndpoint(currentConfig.disburseEndpoint || "");
      setSslPemContent(currentConfig.sslPemContent || "");
      resetMaskTimer();
    }
  }, [currentConfig, resetMaskTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
        <Skeleton className="h-96 rounded-2xl bg-muted/20" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center"
        data-ocid="admin.error_state"
      >
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">
          Access Denied
        </h2>
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
            <h1 className="font-display font-bold text-3xl text-foreground mb-1">
              Admin Configuration
            </h1>
            <p className="text-muted-foreground text-sm">
              ContiPay credentials and SSL certificate.
            </p>
          </div>
          {masked ? (
            <button
              type="button"
              onClick={resetMaskTimer}
              data-ocid="admin.unmask.button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
        className="card-dark glow-border p-6 rounded-2xl space-y-5"
        data-ocid="admin.config.panel"
      >
        {/* Merchant ID */}
        <div className="space-y-1.5">
          <Label htmlFor="merchantId" className="text-sm text-muted-foreground">
            Merchant ID
          </Label>
          <div className={masked ? "masked-field" : ""}>
            <Input
              id="merchantId"
              placeholder="MERCHANT_12345"
              value={merchantId}
              onChange={(e) => {
                setMerchantId(e.target.value);
                handleInteraction();
              }}
              data-ocid="admin.merchant_id.input"
              className="bg-input/50 border-border/50 font-mono"
            />
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <Label htmlFor="apiKey" className="text-sm text-muted-foreground">
            API Key
          </Label>
          <div className={masked ? "masked-field" : ""}>
            <Input
              id="apiKey"
              type="password"
              placeholder="pk_live_••••••••"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                handleInteraction();
              }}
              data-ocid="admin.api_key.input"
              className="bg-input/50 border-border/50 font-mono"
            />
          </div>
        </div>

        {/* API Secret */}
        <div className="space-y-1.5">
          <Label htmlFor="apiSecret" className="text-sm text-muted-foreground">
            API Secret
          </Label>
          <div className={masked ? "masked-field" : ""}>
            <Input
              id="apiSecret"
              type="password"
              placeholder="sk_live_••••••••"
              value={apiSecret}
              onChange={(e) => {
                setApiSecret(e.target.value);
                handleInteraction();
              }}
              data-ocid="admin.api_secret.input"
              className="bg-input/50 border-border/50 font-mono"
            />
          </div>
        </div>

        {/* Acquire Endpoint */}
        <div className="space-y-1.5">
          <Label
            htmlFor="acquireEndpoint"
            className="text-sm text-muted-foreground"
          >
            Acquire Endpoint URL
          </Label>
          <Input
            id="acquireEndpoint"
            placeholder="https://api.contipay.co.zw/acquire"
            value={acquireEndpoint}
            onChange={(e) => {
              setAcquireEndpoint(e.target.value);
              handleInteraction();
            }}
            data-ocid="admin.acquire_endpoint.input"
            className="bg-input/50 border-border/50 font-mono text-xs"
          />
        </div>

        {/* Disburse Endpoint */}
        <div className="space-y-1.5">
          <Label
            htmlFor="disburseEndpoint"
            className="text-sm text-muted-foreground"
          >
            Disburse Endpoint URL
          </Label>
          <Input
            id="disburseEndpoint"
            placeholder="https://api.contipay.co.zw/disburse"
            value={disburseEndpoint}
            onChange={(e) => {
              setDisburseEndpoint(e.target.value);
              handleInteraction();
            }}
            data-ocid="admin.disburse_endpoint.input"
            className="bg-input/50 border-border/50 font-mono text-xs"
          />
        </div>

        {/* SSL PEM */}
        <div className="space-y-1.5">
          <Label
            htmlFor="sslPemContent"
            className="text-sm text-muted-foreground"
          >
            SSL Certificate (PEM)
          </Label>
          <div className={masked ? "masked-field" : ""}>
            <Textarea
              id="sslPemContent"
              placeholder={
                "-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----"
              }
              value={sslPemContent}
              onChange={(e) => {
                setSslPemContent(e.target.value);
                handleInteraction();
              }}
              data-ocid="admin.ssl_pem.textarea"
              className="bg-input/50 border-border/50 font-mono text-xs h-36 resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Paste the SSL certificate (.pem) used to sign ContiPay disburse
            requests.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={setConfig.isPending}
          data-ocid="admin.save.primary_button"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
            className="text-center text-sm text-emerald-400"
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
      </motion.div>
    </div>
  );
}
