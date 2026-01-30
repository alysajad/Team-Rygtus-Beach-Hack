import axios from "axios";

// Constants
export const API_BASE_URL = "http://localhost:8000";

// Create Axios Instance
export const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request Interceptor to add Token
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("github_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Helper types
export interface User {
    login: string;
    id: number;
    avatar_url: string;
    name: string;
}

export interface Repo {
    id: number;
    name: string;
    full_name: string;
    owner: string;
    html_url: string;
    description: string;
    private: boolean;
}

export interface StackInfo {
    language: string;
    framework: string;
    has_dockerfile: boolean;
    dependency_file: string | null;
    detected_files: string[];
}

export interface PipelineSuggestion {
    stack: StackInfo;
    suggested_steps: string[];
}
