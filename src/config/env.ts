export const env = {
    get geminiApiKey(): string {
        const envKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || "";
        const localKey = localStorage.getItem("om_gemini_api_key");
        return localKey || envKey;
    }
};
