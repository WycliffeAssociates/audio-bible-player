const config = {
  bermuda: {
    playlist: "eng-bermuda-nt",
    title: "Bermuda New Testament",
    description: "The New Testament Audio of the Bermuda Bible",
  },
} as const;
type configType = typeof config;
export {config, type configType};
