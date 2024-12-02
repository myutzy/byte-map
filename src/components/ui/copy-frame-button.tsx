"use client";

import * as React from "react";
import { DropdownMenuTriggerProps } from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CopyFrameButtonProps extends DropdownMenuTriggerProps {
  frameBytes: string[];
  className?: string;
}

export function CopyFrameButton({
  frameBytes,
  className,
  ...props
}: CopyFrameButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  const copyToClipboard = React.useCallback((value: string) => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
  }, []);

  const getHexString = () => frameBytes.join(" ");

  const getBinaryString = () => {
    return frameBytes
      .map((hex) => parseInt(hex, 16).toString(2).padStart(8, "0"))
      .join(" ");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "relative z-10 h-6 w-6 bg-gray-50 text-gray-700 hover:bg-gray-100",
            className
          )}
        >
          {hasCopied ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <ClipboardIcon className="h-3 w-3" />
          )}
          <span className="sr-only">Copy</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => copyToClipboard(getHexString())}>
          Hex
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyToClipboard(getBinaryString())}>
          Binary
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
