"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const inquirer_1 = __importDefault(require("inquirer"));
const js_yaml_1 = require("js-yaml");
const node_persist_1 = __importDefault(require("node-persist"));
const path_1 = require("path");
// Read from argv
let dockerComposeFile = process.argv[2];
// auto determine default docker-compose file
if (!dockerComposeFile) {
    if (fs_1.existsSync(path_1.resolve('docker-compose.yml'))) {
        dockerComposeFile = 'docker-compose.yml';
    }
    else if (fs_1.existsSync(path_1.resolve('docker-compose.yaml'))) {
        dockerComposeFile = 'docker-compose.yaml';
    }
    else {
        throw new Error('No docker-compose file was founded or given in command.');
    }
}
const dockerComposeFilePath = path_1.resolve(dockerComposeFile);
// Validation
if (!fs_1.existsSync(dockerComposeFile) || !fs_1.lstatSync(dockerComposeFile).isFile()) {
    throw new Error('No docker-compose file founded at the given path.');
}
const dockerComposeContent = fs_1.readFileSync(dockerComposeFile, 'utf8');
const doc = js_yaml_1.safeLoad(dockerComposeContent);
const allServices = Object.keys(doc.services);
(() => __awaiter(this, void 0, void 0, function* () {
    yield node_persist_1.default.init({
        dir: path_1.join(__dirname, '../.store')
    });
    let previousSelectedServices = yield node_persist_1.default.getItem(dockerComposeFilePath);
    if (!previousSelectedServices) {
        previousSelectedServices = [];
    }
    console.clear();
    const prompt = inquirer_1.default.createPromptModule({ output: process.stderr });
    const { services } = yield prompt([
        {
            type: 'checkbox',
            name: 'services',
            message: 'Choose the services to run (dependency services are automatically added)',
            choices: allServices.map(name => ({
                name,
                value: name,
                checked: previousSelectedServices.includes(name)
            })),
            pageSize: 20
        }
    ]);
    yield filterService(services);
}))();
function filterService(services) {
    return __awaiter(this, void 0, void 0, function* () {
        yield node_persist_1.default.setItem(dockerComposeFilePath, services);
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
        const newDoc = Object.assign({}, doc);
        newDoc.services = {};
        startServices.forEach(service => {
            if (doc.services) {
                newDoc.services[service] = doc.services[service];
            }
        });
        console.log(js_yaml_1.safeDump(newDoc, { lineWidth: Number.MAX_SAFE_INTEGER }));
    });
}
//# sourceMappingURL=rustre.js.map