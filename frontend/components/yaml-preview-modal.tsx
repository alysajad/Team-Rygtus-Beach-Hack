"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileCode } from "lucide-react";

interface YamlPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialYaml: string;
    onCommit: (finalYaml: string) => Promise<void>;
    isCommitting: boolean;
}

export function YamlPreviewModal({
    open,
    onOpenChange,
    title,
    initialYaml,
    onCommit,
    isCommitting,
}: YamlPreviewModalProps) {
    const [yaml, setYaml] = useState(initialYaml);

    // Update local state when initialYaml changes (e.g. when opening modal with new content)
    useEffect(() => {
        setYaml(initialYaml);
    }, [initialYaml, open]);

    const handleCommit = () => {
        onCommit(yaml);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileCode className="size-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        Review and edit the generated pipeline YAML before committing.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 py-4">
                    <Textarea
                        value={yaml}
                        onChange={(e) => setYaml(e.target.value)}
                        className="font-mono text-xs h-full resize-none p-4"
                        spellCheck={false}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCommitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleCommit} disabled={isCommitting}>
                        {isCommitting ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Committing...
                            </>
                        ) : (
                            "Confirm & Commit"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
