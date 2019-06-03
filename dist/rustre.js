"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const inquirer_1 = __importDefault(require("inquirer"));
const js_yaml_1 = require("js-yaml");
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
const doc = js_yaml_1.safeLoad(dockerComposeContent);
const allServices = Object.keys(doc.services);
console.clear();
const prompt = inquirer_1.default.createPromptModule({ output: process.stderr });
prompt([
    {
        type: 'checkbox',
        name: 'services',
        message: 'Choose the services to run (dependency services are automatically added)',
        choices: allServices,
        pageSize: 20
    }
]).then(({ services }) => {
    let queue = [...services];
    let startServices = [...services];
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
});
//# sourceMappingURL=rustre.js.map