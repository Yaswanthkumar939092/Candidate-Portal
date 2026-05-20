export const featureFlagsService = {
  getFeatureFlags: async () => {
    const res = await fetch("/api/candidate-feature-flags", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Feature flags request failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.flags;
  },
};
