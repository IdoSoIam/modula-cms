export function useLocalePath() {
  return (target: string | { path?: string; query?: Record<string, any>; hash?: string }) => target
}
