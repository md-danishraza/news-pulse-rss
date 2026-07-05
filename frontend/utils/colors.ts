export const clusterColors = [
  "#6366f1", // Sleek Indigo
  "#8b5cf6", // Radiant Violet
  "#3b82f6", // Electric Blue
  "#06b6d4", // Polar Cyan
  "#10b981", // Emerald Mint
  "#f43f5e", // Rosewood Pink
  "#f59e0b", // Golden Amber
  "#0284c7", // Deep Sky Blue
  "#84cc16", // Lime Punch
  "#14b8a6", // Sea Foam Teal
  "#a855f7", // Royalty Purple
  "#ec4899", // Magenta Flush
  "#f97316", // Electric Orange
  "#64748b", // Premium Slate
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
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const statusColors = {
  idle: "#64748b", // Slate
  pending: "#f59e0b", // Amber
  running: "#3b82f6", // Blue
  completed: "#10b981", // Emerald
  failed: "#f43f5e", // Rose
};
