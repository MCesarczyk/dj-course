const cache = new Map<string, string>();

export async function loadLogo(path: string): Promise<string | null> {
  if (cache.has(path)) return cache.get(path)!;
  try {
    const response = await fetch(path);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    cache.set(path, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}
