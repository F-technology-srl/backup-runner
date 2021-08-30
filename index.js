#!/usr/bin/env node

import { Command } from 'commander';
import { readPackage } from './src/utils/read-package-json.js';

import installCommand from './src/commands/install.js';
import executeCommand from './src/commands/execute.js';
import unistallCommand from './src/commands/unistall.js';

const packagejson = readPackage();

const main = new Command();

main.version(packagejson.version);
main.addCommand(executeCommand);
main.addCommand(installCommand);
main.addCommand(unistallCommand);

main.parse(process.argv);
