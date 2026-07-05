// Beautiful, modern color palette for clusters
export const clusterColors = [
  "#4f46e5", // Indigo
  "#7c3aed", // Purple
  "#2563eb", // Blue
  "#0891b2", // Cyan
  "#059669", // Emerald
  "#dc2626", // Red
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#0284c7", // Sky
  "#65a30d", // Lime
  "#0d9488", // Teal
  "#9333ea", // Purple
  "#e11d48", // Rose
  "#2563eb", // Blue
];

export const getColor = (id: string | number): string => {
  const index =
    typeof id === "string"
      ? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : id;
  return clusterColors[index % clusterColors.length];
};

export const getColorWithOpacity = (
  id: string | number,
  opacity: number = 0.2
): string => {
  const color = getColor(id);
  // Convert hex to rgba
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Status colors
export const statusColors = {
  idle: "#64748b",
  pending: "#f59e0b",
  running: "#3b82f6",
  completed: "#22c55e",
  failed: "#ef4444",
};
