"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = require("js-yaml");
const fs_1 = require("fs");
// Read from argv
const dockerComposeFile = process.argv[2];
const selectedServices = process.argv[3];
// Validation
if (!dockerComposeFile) {
    throw new Error('No docker-compose file was given in command.');
}
else if (!fs_1.existsSync(dockerComposeFile) ||
    !fs_1.lstatSync(dockerComposeFile).isFile()) {
    throw new Error('No docker-compose file founded at the given path.');
}
const dockerComposeContent = fs_1.readFileSync(dockerComposeFile, 'utf8');
if (!selectedServices) {
    // no service selected, then pass whole docker-compose file content
    console.log(dockerComposeContent);
}
else {
    // parse compose file
    const doc = js_yaml_1.safeLoad(dockerComposeContent);
    let queue = selectedServices.split(',');
    let startServices = [...queue];
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
    const newDoc = Object.assign({}, doc);
    newDoc.services = {};
    startServices.forEach(service => {
        newDoc.services[service] = doc.services[service];
    });
    console.log(js_yaml_1.safeDump(newDoc, { lineWidth: Number.MAX_SAFE_INTEGER }));
}
//# sourceMappingURL=rustre.js.map