/** Derives up to 2 uppercase initials from a full name, e.g. "Anna Nowak" -> "AN". */
export function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
