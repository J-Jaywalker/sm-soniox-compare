import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FeatureComparisonTable } from "@/components/feature-comparison-table";
import { Button } from "./ui/button";
import { X } from "lucide-react";

export const FeatureComparisonDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full bg-soniox text-sm font-medium">
          Compare all features
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:w-[1100px] max-w-[92dvw] sm:max-w-[90dvw] max-h-[564px] h-full flex flex-col p-0"
      >
        <DialogTitle className="sr-only">Feature Comparison</DialogTitle>
        <DialogDescription className="sr-only">
          Compare features of different speech providers
        </DialogDescription>
        <DialogClose asChild className="absolute -top-4.5 -right-4.5 z-10">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        <div className="relative rounded-lg overflow-hidden flex-grow">
          <FeatureComparisonTable />
        </div>
      </DialogContent>
    </Dialog>
  );
};
