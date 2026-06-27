export function usePublicLocalePath() {
  const { buildPublicLocalePath } = useContentLocale();

  return (target: string | { path?: string; query?: Record<string, any>; hash?: string }) => {
    if (typeof target === "string") {
      return buildPublicLocalePath(target);
    }

    return {
      ...target,
      path: buildPublicLocalePath(target.path || "/"),
    };
  };
}
