import { existsSync, lstatSync, readFileSync } from 'fs';
import inquirer from 'inquirer';
import { safeLoad, safeDump } from 'js-yaml';
import storage from 'node-persist';
import { join, resolve } from 'path';

import { DockerCompose } from './models';

// Read from argv
let dockerComposeFile = process.argv[2];

// auto determine default docker-compose file
if (!dockerComposeFile) {
  if (existsSync(resolve('docker-compose.yml'))) {
    dockerComposeFile = 'docker-compose.yml';
  } else if (existsSync(resolve('docker-compose.yaml'))) {
    dockerComposeFile = 'docker-compose.yaml';
  } else {
    throw new Error(
      'No docker-compose file was founded or given in command argument.'
    );
  }
}
const dockerComposeFilePath = resolve(dockerComposeFile);

// Validation
if (!existsSync(dockerComposeFile) || !lstatSync(dockerComposeFile).isFile()) {
  throw new Error('No docker-compose file founded at the given path.');
}

const dockerComposeContent = readFileSync(dockerComposeFile, 'utf8');
const doc: DockerCompose = safeLoad(dockerComposeContent);
const allServices = Object.keys(doc.services);

(async () => {
  await storage.init({
    dir: join(__dirname, '../.store')
  });
  let previousSelectedServices: string[] = await storage.getItem(
    dockerComposeFilePath
  );
  if (!previousSelectedServices) {
    previousSelectedServices = [];
  }
  console.clear();
  const prompt = inquirer.createPromptModule({ output: process.stderr });
  const { services } = await prompt<{ services: string[] }>([
    {
      type: 'checkbox',
      name: 'services',
      message:
        'Choose the services to run (dependency services are automatically added)',
      choices: allServices.map(name => ({
        name,
        value: name,
        checked: previousSelectedServices.includes(name)
      })),
      pageSize: 20
    }
  ]);
  await filterService(services);
})();

async function filterService(services: string[]) {
  await storage.setItem(dockerComposeFilePath, services);
  let queue = [...services];
  let startServices = [...services];
  // extract depends_on field of each selected service
  while (queue.length) {
    const currentService = queue.shift();
    if (!doc.services[currentService]) {
      continue;
    }
    const dependServices = doc.services[currentService].depends_on;
    if (dependServices) {
      queue = [...queue, ...dependServices];
      startServices = [...startServices, ...queue];
    }
  }

  // form new doc
  const newDoc: DockerCompose = { ...doc };
  newDoc.services = {};
  startServices.forEach(service => {
    if (doc.services) {
      newDoc.services[service] = doc.services[service];
    }
  });
  console.log(safeDump(newDoc, { lineWidth: Number.MAX_SAFE_INTEGER }));
}
