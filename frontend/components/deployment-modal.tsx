"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AKSConfig, configureDeployment } from "@/lib/api";
import { Loader2, Settings } from "lucide-react";

interface DeploymentModalProps {
    onConfigured: () => void;
    // In a real app we'd pass owner/repo here, but for now relying on backend context 
    // or assuming user is in the right session.
    // Actually, the AKSConfig requires owner/repo.
    // We should pass them from the page.
    owner: string;
    repo: string;
}

export function DeploymentModal({ onConfigured, owner, repo }: DeploymentModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<AKSConfig>>({
        owner,
        repo,
        azure_credentials: "",
        acr_name: "",
        aks_cluster: "",
        resource_group: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await configureDeployment(formData as AKSConfig);
            setOpen(false);
            onConfigured();
        } catch (err) {
            console.error(err);
            alert("Failed to configure deployment. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                    <Settings className="size-4" />
                    Configure Deployment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configure AKS Deployment</DialogTitle>
                    <DialogDescription>
                        Enter your Azure details. We will safely create GitHub Secrets for you.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="azure_credentials">Azure Credentials (JSON)</Label>
                        <Input
                            id="azure_credentials"
                            name="azure_credentials"
                            placeholder='{"clientId": "...", ...}'
                            value={formData.azure_credentials}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Output from: <code>az ad sp create-for-rbac --sdk-auth</code>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="acr_name">ACR Name</Label>
                            <Input
                                id="acr_name"
                                name="acr_name"
                                placeholder="myregistry"
                                value={formData.acr_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="resource_group">Resource Group</Label>
                            <Input
                                id="resource_group"
                                name="resource_group"
                                placeholder="my-rg"
                                value={formData.resource_group}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="aks_cluster">AKS Cluster Name</Label>
                        <Input
                            id="aks_cluster"
                            name="aks_cluster"
                            placeholder="my-aks-cluster"
                            value={formData.aks_cluster}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Save & Configure"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
