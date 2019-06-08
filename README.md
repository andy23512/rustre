# rustre
> A small command line program extracting a subset of services from a docker-compose file.

## Installation
```shell
$ npm i -g andy23512/rustre (or yarn global add andy23512/rustre)
```

## Usage
```shell
$ rustre
```
It would default read the `docker-compose.yaml` or `docker-compose.yml` file in the current working directory, and display an interactive menu to choose the services you want to extract. The resulting docker-compose config would be printed out on screen.

For non-default situation, you can specify your docker-compose file path in the first argument.
```shell
$ rustre path_to_your_docker_compose_file
```

Then you can directly pipe the output to a docker-compose command. Like this,
```shell
$ rustre | docker-compose up -f -
```
