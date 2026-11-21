export const imageUrl = (name: string | null | undefined) => (name ? `/api/uploads/${name}` : null);
