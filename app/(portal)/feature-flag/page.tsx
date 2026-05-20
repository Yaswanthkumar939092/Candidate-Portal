"use client"
import { Button } from "@/components/ui/button"

const FeatureFlagPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <h1 className="text-3xl font-bold mb-4">Feature Flags Coming Soon!!</h1>
            <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
    );
};

export default FeatureFlagPage;