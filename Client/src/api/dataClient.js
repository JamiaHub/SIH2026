const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MarineEye API returned ${response.status}`);
  }

  return response.json();
};

export const getMarineEyeData = () => fetchJson("/api/data");

export const getHealth = () => fetchJson("/api/health");
