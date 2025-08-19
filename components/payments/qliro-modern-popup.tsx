"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, X, CreditCard, AlertCircle } from "lucide-react";
import { useQliroListener } from "@/hooks/use-qliro-listener";
import { useToast } from "@/hooks/use-toast";

interface QliroStep {
  id: string;
  title: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface QliroModernPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  description: string;
  onCompleted?: () => void;
  onError?: (error: any) => void;
}

const CHECKOUT_STEPS: QliroStep[] = [
  { id: 'warming', title: 'Värmer upp Qliro-anslutning...', status: 'pending' },
  { id: 'creating', title: 'Skapar ordern', status: 'pending' },
  { id: 'fetching', title: 'Hämtar detaljer', status: 'pending' },
  { id: 'showing', title: 'Visar betalning', status: 'pending' },
  { id: 'listening', title: 'Väntar på betalning', status: 'pending' }
];

export function QliroModernPopup({
  isOpen,
  onClose,
  orderId,
  amount,
  description,
  onCompleted,
  onError
}: QliroModernPopupProps) {
  const [steps, setSteps] = useState<QliroStep[]>(CHECKOUT_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkoutHtml, setCheckoutHtml] = useState<string>('');
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [error, setError] = useState<string>('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const checkoutContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Qliro completion listener
  useQliroListener({
    onCompleted: () => {
      console.log('[QliroModernPopup] Payment completed');
      setIsPaymentCompleted(true);
      updateStepStatus(4, 'completed');
      onCompleted?.();
      toast({
        title: "Betalning genomförd!",
        description: "Din betalning har behandlats framgångsrikt.",
        variant: "default"
      });
    },
    onDeclined: (reason, message) => {
      console.log('[QliroModernPopup] Payment declined:', { reason, message });
      const errorMsg = `Betalning nekades: ${[reason, message].filter(Boolean).join(' - ')}`;
      setError(errorMsg);
      updateStepStatus(currentStep, 'error');
      toast({
        title: "Betalning nekades",
        description: errorMsg,
        variant: "destructive"
      });
    },
    onError: (errorData) => {
      console.error('[QliroModernPopup] Payment error:', errorData);
      const errorMsg = 'Ett fel uppstod med betalningen';
      setError(errorMsg);
      updateStepStatus(currentStep, 'error');
      onError?.(errorData);
      toast({
        title: "Betalningsfel",
        description: errorMsg,
        variant: "destructive"
      });
    },
    onLoaded: () => {
      console.log('[QliroModernPopup] Checkout loaded');
      updateStepStatus(3, 'completed');
      moveToNextStep(4);
    }
  });

  const updateStepStatus = (stepIndex: number, status: QliroStep['status']) => {
    setSteps(prevSteps => 
      prevSteps.map((step, index) => 
        index === stepIndex ? { ...step, status } : step
      )
    );
  };

  const moveToNextStep = (nextStepIndex: number) => {
    if (nextStepIndex < steps.length) {
      setCurrentStep(nextStepIndex);
      updateStepStatus(nextStepIndex, 'loading');
    }
  };

  const processCheckoutFlow = async () => {
    try {
      // Step 1: Warming up connection
      updateStepStatus(0, 'loading');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate connection warming
      updateStepStatus(0, 'completed');
      moveToNextStep(1);

      // Step 2: Creating order (already done, just visual feedback)
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(1, 'completed');
      moveToNextStep(2);

      // Step 3: Fetching order details
      const response = await fetch(`/api/payments/qliro/get-order?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status}`);
      }
      
      const orderData = await response.json();
      console.log('[QliroModernPopup] Order data received:', {
        orderId: orderData.OrderId,
        hasHtmlSnippet: !!orderData.OrderHtmlSnippet,
        status: orderData.CustomerCheckoutStatus
      });

      if (!orderData.OrderHtmlSnippet) {
        throw new Error('No HTML snippet received from Qliro');
      }

      updateStepStatus(2, 'completed');
      moveToNextStep(3);

      // Step 4: Show payment (inject HTML snippet)
      setCheckoutHtml(orderData.OrderHtmlSnippet);
      
      // Wait a moment for DOM to update, then inject the snippet
      setTimeout(() => {
        if (checkoutContainerRef.current) {
          checkoutContainerRef.current.innerHTML = orderData.OrderHtmlSnippet;
          
          // Manually trigger any scripts in the snippet
          const scripts = checkoutContainerRef.current.querySelectorAll('script');
          scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
              newScript.src = script.src;
            } else {
              newScript.textContent = script.textContent;
            }
            document.head.appendChild(newScript);
          });
        }
      }, 100);

    } catch (err: any) {
      console.error('[QliroModernPopup] Checkout flow error:', err);
      const errorMsg = err.message || 'Ett fel uppstod vid hämtning av betalningsformuläret';
      setError(errorMsg);
      updateStepStatus(currentStep, 'error');
      onError?.(err);
    }
  };

  // Start checkout flow when popup opens
  useEffect(() => {
    if (isOpen && orderId) {
      setSteps(CHECKOUT_STEPS);
      setCurrentStep(0);
      setError('');
      setIsPaymentCompleted(false);
      setCheckoutHtml('');
      setShowCloseConfirm(false);
      processCheckoutFlow();
    }
  }, [isOpen, orderId]);

  const StepIndicator = ({ step, index }: { step: QliroStep; index: number }) => {
    const getStepIcon = () => {
      switch (step.status) {
        case 'loading':
          return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
        case 'completed':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'error':
          return <XCircle className="w-4 h-4 text-red-600" />;
        default:
          return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
      }
    };

    const getStepTextColor = () => {
      switch (step.status) {
        case 'loading':
          return 'text-blue-600 font-medium';
        case 'completed':
          return 'text-green-600';
        case 'error':
          return 'text-red-600';
        default:
          return 'text-gray-500';
      }
    };

    return (
      <div className="flex items-center gap-3 py-2">
        {getStepIcon()}
        <span className={`text-sm ${getStepTextColor()}`}>
          {step.title}
        </span>
      </div>
    );
  };

  const handleClose = () => {
    if (isPaymentCompleted) {
      onClose();
    } else {
      setShowCloseConfirm(true);
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px] max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        {/* Glassmorphism Container */}
        <div className="relative bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-white/50 to-blue-50/50 rounded-xl sm:rounded-2xl"></div>

          {/* Scrollable Content Container */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Qliro Checkout</h2>
                  <p className="text-sm text-gray-600">{description} • {amount} kr</p>
                </div>
              </div>

            </div>

            {/* Two-column layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left column - Steps */}
              <div className="w-1/3 border-r border-gray-200 bg-gray-50 p-4 sm:p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Betalningsförlopp</h3>
                <div className="space-y-1">
                  {steps.map((step, index) => (
                    <StepIndicator key={step.id} step={step} index={index} />
                  ))}
                </div>
              </div>

              {/* Right column - Qliro DOM */}
              <div className="w-2/3 bg-white p-4 sm:p-6 overflow-y-auto">
                {error ? (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Något gick fel</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={onClose} variant="outline" className="rounded-xl">
                      Stäng
                    </Button>
                  </div>
                ) : isPaymentCompleted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Betalning genomförd!</h3>
                    <p className="text-gray-600 mb-4">Din betalning har behandlats framgångsrikt.</p>
                    <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 rounded-xl">
                      Stäng
                    </Button>
                  </div>
                ) : currentStep >= 3 ? (
                  // Show Qliro checkout form
                  <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div 
                      ref={checkoutContainerRef}
                      className="qliro-checkout-container h-full overflow-y-auto"
                      style={{ minHeight: '400px' }}
                    />
                    {!checkoutHtml && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-gray-600">Laddar betalningsformulär...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show loading state
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-gray-600">Förbereder betalning...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Close Confirmation Dialog */}
        {showCloseConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Avbryt betalning?</h3>
                  <p className="text-sm text-gray-600">Är du säker på att du vill avbryta betalningen?</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={cancelClose}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Fortsätt betalning
                </Button>
                <Button
                  onClick={confirmClose}
                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
