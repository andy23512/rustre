// this is only a simplified interface of docker-compose file
// only used fields are listed
export interface DockerCompose {
  services: {
    [key: string]: {
      depends_on?: string[];
    };
  };
}
