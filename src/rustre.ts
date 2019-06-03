import { existsSync, lstatSync, readFileSync } from 'fs';
import inquirer from 'inquirer';
import { safeLoad, safeDump } from 'js-yaml';

import { DockerCompose } from './models';

// Read from argv
const dockerComposeFile = process.argv[2];
const selectedServices = process.argv[3];

// Validation
if (!dockerComposeFile) {
  throw new Error('No docker-compose file was given in command.');
} else if (
  !existsSync(dockerComposeFile) ||
  !lstatSync(dockerComposeFile).isFile()
) {
  throw new Error('No docker-compose file founded at the given path.');
}

const dockerComposeContent = readFileSync(dockerComposeFile, 'utf8');
const doc: DockerCompose = safeLoad(dockerComposeContent);
const allServices = Object.keys(doc.services);
console.clear();
const prompt = inquirer.createPromptModule({ output: process.stderr });
prompt<{ services: string[] }>([
  {
    type: 'checkbox',
    name: 'services',
    message:
      'Choose the services to run (dependency services are automatically added)',
    choices: allServices,
    pageSize: 20
  }
]).then(({ services }) => {
  let queue: string[] = [...services];
  let startServices: string[] = [...services];
  // extract depends_on field of each selected service
  while (queue.length) {
    const currentService = queue.shift();
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
    newDoc.services[service] = doc.services[service];
  });
  console.log(safeDump(newDoc, { lineWidth: Number.MAX_SAFE_INTEGER }));
});
