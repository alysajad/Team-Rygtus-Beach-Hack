"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Server,
    Activity,
    BarChart3,
    Mail,
    MessageSquare,
    AlertTriangle,
    Database,
    Globe,
    Bug,
    Bell,
    MessageCircle,
    FileText,
    Shield,
    TrendingUp,
    Trash2,
} from "lucide-react";

// Custom Node Component
const CustomNode = ({ data, id }: { data: any; id: string }) => {
    const IconComponent = data.icon;
    const isServerNode = data.label === "Server";
    const isServerLogsNode = data.label === "Server Logs";

    return (
        <div className="px-3 py-2 shadow-xl rounded-xl border-2 bg-gradient-to-br from-white to-gray-50 min-w-[140px] relative hover:shadow-2xl transition-all duration-200 hover:scale-105"
            style={{ borderColor: data.color }}>
            {/* Input Handle (left side) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 !border-2 !border-white shadow-md transition-all hover:scale-125"
                style={{ backgroundColor: data.color }}
            />

            <div className="flex items-center gap-3">
                <div
                    className="p-2.5 rounded-lg shadow-sm"
                    style={{ backgroundColor: data.color + "25" }}
                >
                    <IconComponent
                        className="size-6"
                        style={{ color: data.color }}
                    />
                </div>
                <div className="font-bold text-sm text-black">{data.label}</div>
            </div>

            {/* API Input for Server Node */}
            {isServerNode && (
                <div className="mt-3">
                    <Input
                        type="text"
                        placeholder="Enter API (e.g., 20.197.7.126:9100)"
                        value={data.apiEndpoint || ""}
                        onChange={(e) => data.onApiChange?.(id, e.target.value)}
                        className="text-xs h-8 text-black"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Log Input for Server Logs Node */}
            {isServerLogsNode && (
                <div className="mt-3 space-y-2">
                    <textarea
                        placeholder="Paste server logs here or click 'Fetch Logs' below..."
                        value={data.logData || ""}
                        onChange={(e) => data.onLogChange?.(id, e.target.value)}
                        className="text-xs p-2 border rounded w-full h-24 text-black resize-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                data.onLogChange?.(id, "Fetching logs...");
                                const res = await fetch('http://localhost:8000/automation/fetch-logs', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ lines: 100 })
                                });
                                if (!res.ok) throw new Error("Failed to fetch logs");
                                const result = await res.json();
                                data.onLogChange?.(id, result.logs);
                            } catch (err) {
                                data.onLogChange?.(id, `Error fetching logs: ${err instanceof Error ? err.message : String(err)}`);
                            }
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Fetch Logs (journalctl)
                    </button>
                </div>
            )}

            {/* Email Composition for Send Mail Node */}
            {data.label === "Send Mail" && (
                <div className="mt-3 space-y-2 min-w-[280px]">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 shadow-sm">
                        {/* Recipient */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-green-900 flex items-center gap-1">
                                <Mail className="size-3" />
                                Recipient
                            </label>
                            <Input
                                type="email"
                                placeholder="recipient@example.com"
                                value={data.recipientEmail || ""}
                                onChange={(e) => data.onEmailChange?.(id, e.target.value)}
                                className="text-xs h-8 text-black bg-white border-green-300 focus:border-green-500 focus:ring-green-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Subject */}
                        <div className="space-y-1 mt-2">
                            <label className="text-xs font-semibold text-green-900 flex items-center gap-1">
                                <FileText className="size-3" />
                                Subject
                            </label>
                            <Input
                                type="text"
                                placeholder="Email subject line"
                                value={data.emailSubject || ""}
                                onChange={(e) => data.onEmailSubjectChange?.(id, e.target.value)}
                                className="text-xs h-8 text-black bg-white border-green-300 focus:border-green-500 focus:ring-green-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Message Body */}
                        <div className="space-y-1 mt-2">
                            <label className="text-xs font-semibold text-green-900 flex items-center gap-1">
                                <MessageSquare className="size-3" />
                                Message
                            </label>
                            <textarea
                                placeholder="Type your message here..."
                                value={data.emailBody || ""}
                                onChange={(e) => data.onEmailBodyChange?.(id, e.target.value)}
                                className="text-xs p-2 border border-green-300 rounded w-full h-20 text-black bg-white resize-none focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                </div>
            )}


            {/* Output Handle (right side) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-4 h-4 !border-2 !border-white shadow-md transition-all hover:scale-125"
                style={{ backgroundColor: data.color }}
            />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// Node type definitions
const nodeDefinitions = [
    {
        type: "server",
        label: "Server",
        icon: Server,
        color: "#3b82f6",
    },
    {
        type: "serverLogs",
        label: "Server Logs",
        icon: FileText,
        color: "#6366f1",
    },
    {
        type: "telemetry",
        label: "Telemetry",
        icon: Activity,
        color: "#8b5cf6",
    },
    {
        type: "prometheus",
        label: "Prometheus",
        icon: BarChart3,
        color: "#f97316",
    },
    {
        type: "sendMail",
        label: "Send Mail",
        icon: Mail,
        color: "#10b981",
    },
    {
        type: "sendSms",
        label: "Send SMS",
        icon: MessageSquare,
        color: "#06b6d4",
    },
    {
        type: "healthAgent",
        label: "Health Agent",
        icon: Shield,
        color: "#22c55e",
    },
    {
        type: "logAnalyzer",
        label: "Investigator Agent",
        icon: Shield,
        color: "#eab308",
    },
    {
        type: "reliabilityAgent",
        label: "Reliability Agent",
        icon: TrendingUp,
        color: "#10b981",
    },
    {
        type: "alertAgent",
        label: "Alert Agent",
        icon: Bell,
        color: "#ef4444",
    },
    {
        type: "httpRequest",
        label: "HTTP Request",
        icon: Globe,
        color: "#8b5cf6",
    },
];

export default function AutomationPage() {
    const router = useRouter();
    const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
    const nodeIdCounter = React.useRef(0);
    const [sidebarContent, setSidebarContent] = useState<any>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Handle API endpoint change for server nodes
    const handleApiChange = useCallback((nodeId: string, apiEndpoint: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, apiEndpoint } }
                    : node
            )
        );
    }, [setNodes]);

    // Handle log data change for server logs nodes
    const handleLogChange = useCallback((nodeId: string, logData: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, logData } }
                    : node
            )
        );
    }, [setNodes]);

    // Handle email change for send mail nodes
    const handleEmailChange = useCallback((nodeId: string, recipientEmail: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, recipientEmail } }
                    : node
            )
        );
    }, [setNodes]);

    // Handle email subject change for send mail nodes
    const handleEmailSubjectChange = useCallback((nodeId: string, emailSubject: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, emailSubject } }
                    : node
            )
        );
    }, [setNodes]);

    // Handle email body change for send mail nodes
    const handleEmailBodyChange = useCallback((nodeId: string, emailBody: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, emailBody } }
                    : node
            )
        );
    }, [setNodes]);

    // Add node to canvas
    const addNode = (nodeType: typeof nodeDefinitions[0]) => {
        nodeIdCounter.current += 1;
        const newNode: Node = {
            id: `${nodeType.type}-${nodeIdCounter.current}-${Date.now()}`,
            type: "custom",
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
            },
            data: {
                label: nodeType.label,
                icon: nodeType.icon,
                color: nodeType.color,
                apiEndpoint: "",
                logData: "",
                recipientEmail: "",
                emailSubject: "",
                emailBody: "",
                onApiChange: handleApiChange,
                onLogChange: handleLogChange,
                onEmailChange: handleEmailChange,
                onEmailSubjectChange: handleEmailSubjectChange,
                onEmailBodyChange: handleEmailBodyChange,
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // Drag and drop handlers
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData("application/reactflow");
            if (!type) return;

            const nodeDef = nodeDefinitions.find((n) => n.type === type);
            if (!nodeDef) return;

            const reactFlowBounds = (
                event.target as HTMLElement
            ).getBoundingClientRect();
            const position = {
                x: event.clientX - reactFlowBounds.left - 80,
                y: event.clientY - reactFlowBounds.top - 20,
            };

            nodeIdCounter.current += 1;
            const newNode: Node = {
                id: `${nodeDef.type}-${nodeIdCounter.current}-${Date.now()}`,
                type: "custom",
                position,
                data: {
                    label: nodeDef.label,
                    icon: nodeDef.icon,
                    color: nodeDef.color,
                    apiEndpoint: "",
                    logData: "",
                    recipientEmail: "",
                    emailSubject: "",
                    emailBody: "",
                    onApiChange: handleApiChange,
                    onLogChange: handleLogChange,
                    onEmailChange: handleEmailChange,
                    onEmailSubjectChange: handleEmailSubjectChange,
                    onEmailBodyChange: handleEmailBodyChange,
                },
            };

            setNodes((nds) => [...nds, newNode]);
        },
        [setNodes, handleApiChange, handleLogChange, handleEmailChange, handleEmailSubjectChange, handleEmailBodyChange]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    // Execute workflow - run all matching distinct patterns
    const executeWorkflow = async () => {
        setIsLoadingMetrics(true);
        setShowSidebar(false); // Hide sidebar during execution
        setSidebarContent(null);

        const executionResults: any[] = [];
        let latestAlertData: any = null; // Track alert data locally for email sending

        // Find nodes
        const prometheusNode = nodes.find(n => n.data.label === "Prometheus");
        const serverNode = nodes.find(n => n.data.label === "Server");
        const serverLogsNode = nodes.find(n => n.data.label === "Server Logs");
        const healthAgentNode = nodes.find(n => n.data.label === "Health Agent");
        const investigatorNode = nodes.find(n => n.data.label === "Investigator Agent");
        const reliabilityNode = nodes.find(n => n.data.label === "Reliability Agent");
        const alertAgentNode = nodes.find(n => n.data.label === "Alert Agent");

        // Validation Checks
        if (serverNode && !serverNode.data.apiEndpoint) {
            alert("Server endpoint is missing! Please enter an API endpoint in the Server node.");
            setIsLoadingMetrics(false);
            return;
        }

        if (serverLogsNode && !serverLogsNode.data.logData) {
            alert("Server log is missing! Please paste logs in the Server Logs node.");
            setIsLoadingMetrics(false);
            return;
        }

        try {
            // --- Flow 1: Server Logs -> Investigator Agent ---
            if (serverLogsNode && investigatorNode) {
                const isConnected = edges.some(edge =>
                    (edge.source === serverLogsNode.id && edge.target === investigatorNode.id) ||
                    (edge.source === investigatorNode.id && edge.target === serverLogsNode.id)
                );

                if (isConnected) {
                    console.log("[Flow 1] Executing Server Logs -> Investigator...");
                    try {
                        const logData = serverLogsNode.data.logData;
                        if (!logData) throw new Error("No log data provided in Server Logs node");

                        const res = await fetch('http://localhost:8000/automation/investigate-logs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ log_data: logData })
                        });

                        if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.detail || "Investigation failed");
                        }

                        const data = await res.json();
                        executionResults.push({
                            agentIds: [serverLogsNode.id, investigatorNode.id],
                            agentName: "Investigator Agent (Logs)",
                            agentType: "investigatorAgent",
                            status: "success",
                            summary: data.investigation.message || `Investigated server logs.\nStatus: ${data.investigation.status}`,
                            details: data.investigation,
                            timestamp: new Date().toISOString()
                        });

                    } catch (e) {
                        console.error("[Flow 1] Error:", e);
                        executionResults.push({
                            agentIds: [serverLogsNode.id, investigatorNode.id],
                            agentName: "Investigator Agent (Logs)",
                            agentType: "investigatorAgent",
                            status: "error",
                            summary: `Failed to investigate logs: ${e instanceof Error ? e.message : String(e)}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            // --- Flow 2: Server -> Reliability Agent ---
            if (serverNode && reliabilityNode) {
                const isConnected = edges.some(edge =>
                    (edge.source === serverNode.id && edge.target === reliabilityNode.id) ||
                    (edge.source === reliabilityNode.id && edge.target === serverNode.id)
                );

                if (isConnected) {
                    console.log("[Flow 2] Executing Server -> Reliability Agent...");
                    try {
                        const endpoint = serverNode.data.apiEndpoint;
                        if (!endpoint) throw new Error("No API endpoint in Server node");

                        // Fetch metrics first
                        const metricsRes = await fetch('http://localhost:8000/automation/metrics', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ endpoint })
                        });

                        if (!metricsRes.ok) throw new Error("Failed to fetch metrics");
                        const metricsData = await metricsRes.json();

                        // Analyze reliability
                        const relRes = await fetch('http://localhost:8000/automation/analyze-reliability', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ metrics_data: metricsData.data })
                        });

                        if (!relRes.ok) throw new Error("Reliability analysis failed");
                        const relData = await relRes.json();

                        // Format simple summary with top risk
                        let relSummary = `Reliability Score: ${relData.reliability.reliability_score}\nStatus: ${relData.reliability.status}`;
                        if (relData.reliability.predicted_risks && relData.reliability.predicted_risks.length > 0) {
                            const risks = [...relData.reliability.predicted_risks].sort((a: any, b: any) => b.probability - a.probability);
                            const topRisk = risks[0];
                            relSummary += `\n⚠️ ${topRisk.type} (${Math.round(topRisk.probability * 100)}%)`;
                        }

                        executionResults.push({
                            agentIds: [serverNode.id, reliabilityNode.id],
                            agentName: "Reliability Agent",
                            agentType: "reliabilityAgent",
                            status: relData.reliability.status === "critical" ? "warning" : "success",
                            summary: relSummary,
                            details: relData.reliability,
                            timestamp: new Date().toISOString()
                        });

                    } catch (e) {
                        console.error("[Flow 2] Error:", e);
                        executionResults.push({
                            agentIds: [serverNode.id, reliabilityNode.id],
                            agentName: "Reliability Agent",
                            agentType: "reliabilityAgent",
                            status: "error",
                            summary: `Analysis failed: ${e instanceof Error ? e.message : String(e)}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            // --- Flow 4: Server → Alert Agent ---
            if (serverNode && alertAgentNode) {
                const isConnected = edges.some(edge =>
                    (edge.source === serverNode.id && edge.target === alertAgentNode.id) ||
                    (edge.source === alertAgentNode.id && edge.target === serverNode.id)
                );

                if (isConnected) {
                    console.log("[Flow 4] Executing Server → Alert Agent...");
                    try {
                        const endpoint = serverNode.data.apiEndpoint;
                        if (!endpoint) throw new Error("No API endpoint in Server node");

                        // Fetch metrics first
                        const metricsRes = await fetch('http://localhost:8000/automation/metrics', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ endpoint })
                        });

                        if (!metricsRes.ok) throw new Error("Failed to fetch metrics");
                        const metricsData = await metricsRes.json();

                        // Analyze with Alert Agent (uses Gemini AI)
                        const alertRes = await fetch('http://localhost:8000/automation/analyze-alert', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ metrics_data: metricsData.data })
                        });

                        if (!alertRes.ok) throw new Error("Alert analysis failed");
                        const alertData = await alertRes.json();

                        // Store alert data locally for email sending
                        if (alertData.alert && alertData.alert.status === "success") {
                            latestAlertData = {
                                agentName: "Alert Agent",
                                agentType: "alertAgent",
                                data: alertData.alert.analysis,
                                timestamp: alertData.alert.timestamp
                            };

                            // Set sidebar content with alert details
                            setSidebarContent(latestAlertData);
                            setShowSidebar(true);
                        }

                        executionResults.push({
                            agentIds: [serverNode.id, alertAgentNode.id],
                            agentName: "Alert Agent",
                            agentType: "alertAgent",
                            status: alertData.alert.status === "success" ? "success" : "warning",
                            summary: alertData.alert.analysis ?
                                `Issue: ${alertData.alert.analysis.issue}\nSuggestion: ${alertData.alert.analysis.suggestion}` :
                                "Alert analysis completed",
                            details: alertData.alert,
                            timestamp: new Date().toISOString()
                        });

                    } catch (e) {
                        console.error("[Flow 4] Error:", e);
                        executionResults.push({
                            agentIds: [serverNode.id, alertAgentNode.id],
                            agentName: "Alert Agent",
                            agentType: "alertAgent",
                            status: "error",
                            summary: `Alert analysis failed: ${e instanceof Error ? e.message : String(e)}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            // --- Flow 4b: Server Logs → Alert Agent ---
            if (serverLogsNode && alertAgentNode) {
                const isConnected = edges.some(edge =>
                    (edge.source === serverLogsNode.id && edge.target === alertAgentNode.id) ||
                    (edge.source === alertAgentNode.id && edge.target === serverLogsNode.id)
                );

                if (isConnected) {
                    console.log("[Flow 4b] Executing Server Logs → Alert Agent...");
                    try {
                        const logData = serverLogsNode.data.logData;
                        if (!logData) throw new Error("No log data provided in Server Logs node");

                        // For logs, we'll use the investigator endpoint which can analyze text
                        // Then format it as an alert
                        const res = await fetch('http://localhost:8000/automation/investigate-logs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ log_data: logData })
                        });

                        if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.detail || "Log analysis failed");
                        }

                        const data = await res.json();

                        // Transform investigation result to alert format
                        // Prioritize AI-generated fields (issue, why, suggestion) if available
                        const alertAnalysis = {
                            issue: data.investigation.issue || data.investigation.message || "Log Analysis Complete",
                            why: data.investigation.why || `Analysis of server logs revealed: ${data.investigation.status}`,
                            suggestion: data.investigation.suggestion || (data.investigation.errors?.length > 0
                                ? `Address the following errors: ${data.investigation.errors.join(", ")}`
                                : "Continue monitoring logs for any anomalies")
                        };

                        // Store alert data locally for email sending
                        latestAlertData = {
                            agentName: "Alert Agent (Logs)",
                            agentType: "alertAgent",
                            data: alertAnalysis,
                            timestamp: Math.floor(Date.now() / 1000)
                        };

                        // Set sidebar content with alert details
                        setSidebarContent(latestAlertData);
                        setShowSidebar(true);

                        executionResults.push({
                            agentIds: [serverLogsNode.id, alertAgentNode.id],
                            agentName: "Alert Agent (Logs)",
                            agentType: "alertAgent",
                            status: data.investigation.errors?.length > 0 ? "warning" : "success",
                            summary: `Issue: ${alertAnalysis.issue}\nSuggestion: ${alertAnalysis.suggestion}`,
                            details: { ...data.investigation, alertAnalysis },
                            timestamp: new Date().toISOString()
                        });

                    } catch (e) {
                        console.error("[Flow 4b] Error:", e);
                        executionResults.push({
                            agentIds: [serverLogsNode.id, alertAgentNode.id],
                            agentName: "Alert Agent (Logs)",
                            agentType: "alertAgent",
                            status: "error",
                            summary: `Log analysis failed: ${e instanceof Error ? e.message : String(e)}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }


            // --- Flow 4c: Alert Agent → Send Mail ---
            const sendMailNode = nodes.find(n => n.data.label === "Send Mail");
            if (alertAgentNode && sendMailNode) {
                const isConnected = edges.some(edge =>
                    (edge.source === alertAgentNode.id && edge.target === sendMailNode.id) ||
                    (edge.source === sendMailNode.id && edge.target === alertAgentNode.id)
                );

                if (isConnected && latestAlertData && latestAlertData.agentType === "alertAgent") {
                    console.log("[Flow 4c] Executing Alert Agent → Send Mail...");
                    try {
                        const recipientEmail = sendMailNode.data.recipientEmail;
                        const emailSubject = sendMailNode.data.emailSubject;
                        const emailBody = sendMailNode.data.emailBody;

                        if (!recipientEmail) throw new Error("No recipient email in Send Mail node");

                        // Prepare email payload - use custom subject/body if provided, otherwise use alert data
                        const emailPayload: any = {
                            to_email: recipientEmail,
                        };

                        if (emailSubject && emailBody) {
                            // Custom email mode
                            emailPayload.subject = emailSubject;
                            emailPayload.body = emailBody;
                        } else {
                            // Alert-based email mode
                            emailPayload.alert_data = latestAlertData.data;
                        }

                        // Send email
                        const res = await fetch('http://localhost:8000/automation/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(emailPayload)
                        });

                        if (!res.ok) throw new Error("Failed to send email");
                        const emailData = await res.json();

                        executionResults.push({
                            agentIds: [alertAgentNode.id, sendMailNode.id],
                            agentName: "Email Notification",
                            agentType: "sendMail",
                            status: "success",
                            summary: `Email sent to ${recipientEmail}${emailSubject ? ` - ${emailSubject}` : ''}`,
                            details: emailData,
                            timestamp: new Date().toISOString()
                        });

                    } catch (e) {
                        console.error("[Flow 4c] Error:", e);
                        executionResults.push({
                            agentIds: [alertAgentNode.id, sendMailNode.id],
                            agentName: "Email Notification",
                            agentType: "sendMail",
                            status: "error",
                            summary: `Email failed: ${e instanceof Error ? e.message : String(e)}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
            // --- Flow 5: Prometheus -> Health / Investigator ---
            // Only strictly requires Prometheus + connection to Agent. Server node is optional if Prom URL is direct?
            // Existing logic checked for Server node supplying the endpoint. We will maintain that dependency.
            if (serverNode && prometheusNode) {
                const isPromConnected = edges.some(edge =>
                    (edge.source === serverNode.id && edge.target === prometheusNode.id) ||
                    (edge.source === prometheusNode.id && edge.target === serverNode.id)
                );

                if (isPromConnected) {
                    const isHealthConnected = healthAgentNode && edges.some(edge =>
                        (edge.source === prometheusNode.id && edge.target === healthAgentNode.id) ||
                        (edge.source === healthAgentNode.id && edge.target === prometheusNode.id)
                    );

                    const isInvestigatorConnected = investigatorNode && edges.some(edge =>
                        (edge.source === prometheusNode.id && edge.target === investigatorNode.id) ||
                        (edge.source === investigatorNode.id && edge.target === prometheusNode.id)
                    );

                    if (isHealthConnected || isInvestigatorConnected) {
                        console.log("[Flow 3] Executing Prometheus Flows...");
                        try {
                            const endpoint = serverNode.data.apiEndpoint;
                            if (!endpoint) throw new Error("No API endpoint in Server node");

                            // Fetch metrics
                            const metricsRes = await fetch('http://localhost:8000/automation/metrics', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ endpoint })
                            });

                            if (!metricsRes.ok) throw new Error("Failed to fetch Prometheus metrics");
                            const metricsData = await metricsRes.json();

                            // 3a. Health Agent
                            if (isHealthConnected) {
                                try {
                                    const hRes = await fetch('http://localhost:8000/automation/analyze-health', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ metrics_data: metricsData.data })
                                    });

                                    if (!hRes.ok) throw new Error("Health analysis failed");
                                    const hData = await hRes.json();

                                    executionResults.push({
                                        agentIds: [serverNode.id, prometheusNode.id, healthAgentNode!.id],
                                        agentName: "Health Agent",
                                        agentType: "healthAgent",
                                        status: hData.health_status === "healthy" ? "success" : "warning",
                                        summary: hData.message || `Health Status: ${hData.health_status}\nIssues: ${hData.issues.length}`,
                                        details: hData,
                                        timestamp: new Date().toISOString()
                                    });
                                } catch (e) {
                                    executionResults.push({
                                        agentIds: [healthAgentNode!.id],
                                        agentName: "Health Agent",
                                        agentType: "healthAgent",
                                        status: "error",
                                        summary: `Health Check Failed: ${e instanceof Error ? e.message : String(e)}`,
                                        timestamp: new Date().toISOString()
                                    });
                                }
                            }

                            // 3b. Investigator Agent (Metrics)
                            if (isInvestigatorConnected) {
                                try {
                                    const iRes = await fetch('http://localhost:8000/automation/investigate', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ metrics_data: metricsData.data })
                                    });

                                    if (!iRes.ok) throw new Error("Investigation failed");
                                    const iData = await iRes.json();

                                    executionResults.push({
                                        agentIds: [serverNode.id, prometheusNode.id, investigatorNode!.id],
                                        agentName: "Investigator Agent (Metrics)",
                                        agentType: "investigatorAgent",
                                        status: iData.investigation.status === "healthy" || iData.investigation.status === "success" ? "success" : "warning",
                                        summary: iData.investigation.message || `Metric Investigation: ${iData.investigation.status}`,
                                        details: iData.investigation,
                                        timestamp: new Date().toISOString()
                                    });
                                } catch (e) {
                                    executionResults.push({
                                        agentIds: [investigatorNode!.id],
                                        agentName: "Investigator Agent (Metrics)",
                                        agentType: "investigatorAgent",
                                        status: "error",
                                        summary: `Investigation Failed: ${e instanceof Error ? e.message : String(e)}`,
                                        timestamp: new Date().toISOString()
                                    });
                                }
                            }

                        } catch (e) {
                            console.error("Prometheus Flow Error:", e);
                            // If fetching metrics failed, both agents fail
                            executionResults.push({
                                agentIds: [],
                                agentName: "Prometheus Metrics",
                                agentType: "prometheus",
                                status: "error",
                                summary: `Failed to fetch metrics for agents: ${e instanceof Error ? e.message : String(e)}`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            // --- Finish ---
            if (executionResults.length === 0) {
                alert("No valid connections found. Connect nodes to form a workflow (e.g. Server -> Reliability Agent).");
                setIsLoadingMetrics(false);
                return;
            }

            // Save and Redirect
            console.log("Execution Results:", executionResults);
            localStorage.setItem("unifiedDashboardData", JSON.stringify(executionResults));
            setIsLoadingMetrics(false);
            router.push("/observability/dashboard");

        } catch (error) {
            console.error("Global Execution Error:", error);
            alert(`Execution error: ${error instanceof Error ? error.message : String(error)}`);
            setIsLoadingMetrics(false);
        }
    };

    // Persistence Load
    React.useEffect(() => {
        const saved = localStorage.getItem("automationGraphData");
        if (saved) {
            try {
                const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);

                // Hydrate nodes (restore icons and callbacks)
                const hydratedNodes = (savedNodes || []).map((node: any) => {
                    // Find definition to restore icon
                    const def = nodeDefinitions.find(d => d.label === node.data.label);
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            icon: def ? def.icon : Server, // Fallback to Server icon if not found
                            onApiChange: handleApiChange,
                            onLogChange: handleLogChange,
                            onEmailChange: handleEmailChange,
                            onEmailSubjectChange: handleEmailSubjectChange,
                            onEmailBodyChange: handleEmailBodyChange
                        }
                    };
                });

                setNodes(hydratedNodes);
                setEdges(savedEdges || []);
            } catch (e) {
                console.error("Failed to load graph", e);
            }
        }
    }, [handleApiChange, handleLogChange, handleEmailChange, handleEmailSubjectChange, handleEmailBodyChange]);

    // Persistence Save
    React.useEffect(() => {
        if (nodes.length > 0 || edges.length > 0) {
            localStorage.setItem("automationGraphData", JSON.stringify({ nodes, edges }));
        }
    }, [nodes, edges]);

    // Trash Drop Handler
    const trashRef = React.useRef<HTMLDivElement>(null);
    const onNodeDragStop = useCallback(
        (_: any, node: Node) => {
            if (trashRef.current) {
                const trashRect = trashRef.current.getBoundingClientRect();
                // Get node position in screen coordinates?
                // Actually ReactFlow node position is internal.
                // We need the mouse event... ReactFlow onNodeDragStop gives (event, node).
                // Let's rely on the mouse event from the callback arguments if available.
                // onNodeDragStop signature: (event: React.MouseEvent, node: Node)
            }
        },
        [setNodes]
    );

    // Revised Handler consuming event
    const onNodeDragStopReal = useCallback(
        (event: React.MouseEvent, node: Node) => {
            if (!trashRef.current) return;

            const trashRect = trashRef.current.getBoundingClientRect();
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            if (
                mouseX >= trashRect.left &&
                mouseX <= trashRect.right &&
                mouseY >= trashRect.top &&
                mouseY <= trashRect.bottom
            ) {
                // Delete node
                setNodes((nds) => nds.filter((n) => n.id !== node.id));
            }
        },
        [setNodes]
    );

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b bg-background px-6 py-4 flex items-center gap-4 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push("/pipeline")}
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Workflow Automation</h1>
                    <p className="text-sm text-white">
                        Drag nodes from the palette and connect them to build your workflow
                    </p>
                </div>
                <Button
                    variant="default"
                    onClick={executeWorkflow}
                    className="mr-2"
                    disabled={isLoadingMetrics}
                >
                    {isLoadingMetrics ? "Executing..." : "Execute"}
                </Button>
                <Button variant="outline">Save Workflow</Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar - Node Palette */}
                <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
                    <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-black">
                        Node Palette
                    </h2>
                    <div className="space-y-3">
                        {nodeDefinitions.map((nodeDef) => {
                            const IconComponent = nodeDef.icon;
                            return (
                                <Card
                                    key={nodeDef.type}
                                    className="p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 hover:scale-102 bg-white border-2"
                                    style={{
                                        borderColor: nodeDef.color + "40",
                                    }}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, nodeDef.type)}
                                    onClick={() => addNode(nodeDef)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-2.5 rounded-lg shadow-sm"
                                            style={{
                                                backgroundColor: nodeDef.color + "25",
                                            }}
                                        >
                                            <IconComponent
                                                className="size-5"
                                                style={{ color: nodeDef.color }}
                                            />
                                        </div>
                                        <span className="font-semibold text-sm text-black">
                                            {nodeDef.label}
                                        </span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50/80 rounded-lg border border-blue-200 shadow-sm">
                        <p className="text-xs text-blue-900 leading-relaxed">
                            💡 <strong>Tip:</strong> Drag nodes onto the canvas or click to add them. Connect nodes by dragging from one node's edge to another. Drop nodes on the trash to delete.
                        </p>
                    </div>
                </div>

                {/* Center - React Flow Canvas */}
                <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeDragStop={onNodeDragStopReal}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gradient-to-br from-gray-50 to-gray-100"
                        defaultEdgeOptions={{
                            animated: true,
                            style: { stroke: '#94a3b8', strokeWidth: 2 },
                        }}
                    >
                        <Controls className="!bg-white !shadow-xl !rounded-lg !border !border-gray-200 [&>button]:!text-gray-800 [&>button:hover]:!bg-gray-100" />
                        <MiniMap
                            nodeColor={(node) => {
                                return (node.data.color as string) || "#3b82f6";
                            }}
                            className="!bg-white !border !border-gray-200 !shadow-xl !rounded-lg"
                            maskColor="rgba(240, 240, 240, 0.6)"
                        />
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#d1d5db" className="bg-gray-50" />
                    </ReactFlow>

                    {/* Trash Drop Zone */}
                    <div
                        ref={trashRef}
                        className="absolute bottom-6 left-20 z-50 p-3 bg-white rounded-full shadow-xl border border-red-100 hover:bg-red-50 hover:scale-110 transition-all cursor-pointer group"
                    >
                        <Trash2 className="size-6 text-red-500 group-hover:text-red-600" />
                    </div>
                </div>

                {/* Right Sidebar - Agent Output Display */}
                {showSidebar && sidebarContent && (
                    <div className="w-96 border-l bg-white p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-50">
                                    <Bell className="size-5 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg text-black">{sidebarContent.agentName}</h2>
                                    <p className="text-xs text-gray-500">
                                        {new Date(sidebarContent.timestamp * 1000).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSidebar(false)}
                            >
                                Close
                            </Button>
                        </div>

                        {/* Alert Analysis Display */}
                        {sidebarContent.data && (
                            <div className="space-y-4">
                                {/* Issue Card */}
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2 mb-2">
                                        <AlertTriangle className="size-5 text-red-600 mt-0.5" />
                                        <h3 className="font-semibold text-red-900">Issue Detected</h3>
                                    </div>
                                    <p className="text-sm text-red-800 leading-relaxed">
                                        {sidebarContent.data.issue}
                                    </p>
                                </div>

                                {/* Why/Cause Card */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2 mb-2">
                                        <MessageCircle className="size-5 text-blue-600 mt-0.5" />
                                        <h3 className="font-semibold text-blue-900">Root Cause</h3>
                                    </div>
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        {sidebarContent.data.why}
                                    </p>
                                </div>

                                {/* Suggestion Card */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2 mb-2">
                                        <Shield className="size-5 text-green-600 mt-0.5" />
                                        <h3 className="font-semibold text-green-900">Recommended Action</h3>
                                    </div>
                                    <p className="text-sm text-green-800 leading-relaxed">
                                        {sidebarContent.data.suggestion}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
