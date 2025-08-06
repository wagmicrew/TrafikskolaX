import * as React from "react"
import { TooltipProvider as TooltipPrimitiveProvider, Tooltip as TooltipPrimitive, TooltipTrigger as TooltipPrimitiveTrigger, TooltipContent as TooltipPrimitiveContent } from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitiveProvider

const Tooltip = TooltipPrimitive

const TooltipTrigger = TooltipPrimitiveTrigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitiveContent>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitiveContent>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitiveContent
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-primary bg-primary text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))

TooltipContent.displayName = TooltipPrimitiveContent.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

