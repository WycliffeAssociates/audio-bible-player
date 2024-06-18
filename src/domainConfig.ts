const config = {
  bermuda: {
    playlist: "eng-bermuda-nt",
    title: "Bermuda New Testament",
  },
} as const;
type configType = typeof config;
export {config, type configType};
