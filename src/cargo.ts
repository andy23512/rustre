import { safeLoad, safeDump } from 'js-yaml';
import { existsSync, lstatSync, readFileSync } from 'fs';

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

if (!selectedServices) {
  // no service selected, then pass whole docker-compose file content
  console.log(dockerComposeContent);
} else {
  // parse compose file
  const doc: DockerCompose = safeLoad(dockerComposeContent);

  let queue: string[] = selectedServices.split(',');
  let startServices: string[] = [...queue];
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
}
