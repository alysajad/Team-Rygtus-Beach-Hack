"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Loader2, KeyRound } from "lucide-react";
import { API_BASE_URL, api } from "@/lib/api";

export default function ConnectPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleManualAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setError("");

        try {
            // Validate token by calling an endpoint or just storing it and trying to fetch user
            // We will try to fetch user info to validate
            localStorage.setItem("github_token", token);

            // Test the token
            await api.post("/auth/github", { token });

            router.push("/repos");
        } catch (err: any) {
            console.error(err);
            setError("Invalid token or connection error. Please try again.");
            localStorage.removeItem("github_token");
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = () => {
        // Open OAuth in new window or same window
        window.open(`${API_BASE_URL}/oauth/login`, "_blank", "width=600,height=700");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <Card className="max-w-md w-full shadow-xl border-primary/10">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <Github className="size-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Connect to GitHub</CardTitle>
                    <CardDescription>
                        Authenticate to access your repositories and generate pipelines.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full h-12 text-base relative"
                            onClick={handleOAuthLogin}
                        >
                            <div className="absolute left-4">
                                <Github className="size-5" />
                            </div>
                            Continue with GitHub OAuth
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or verify token</span>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground text-center bg-secondary/50 p-3 rounded-md">
                            <strong>OAuth Note:</strong> After logging in via the popup, copy the <code>access_token</code> from the JSON response and paste it below.
                        </div>
                    </div>

                    <form onSubmit={handleManualAuth} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="ghp_..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading || !token}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify & Continue"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
