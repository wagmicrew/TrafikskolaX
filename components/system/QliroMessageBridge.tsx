"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function QliroMessageBridge() {
  const { toast } = useToast();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data || {};
      if (
        data && (
          data.type === "qliro:completed" ||
          data.event === "payment_completed" ||
          data.event === "CheckoutCompleted" ||
          data.status === "Paid" ||
          data.status === "Completed"
        )
      ) {
        try {
          window.dispatchEvent(new CustomEvent("qliro:completed", { detail: data }));
        } catch {}
        toast({ title: "Betalning klar", description: "Du kan fortsätta." });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [toast]);

  return null;
}


