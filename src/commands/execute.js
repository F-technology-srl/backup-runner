import chalk from 'chalk';
import { Command } from 'commander';
import objectStorageDriver from '../drivers/object-storage.driver.js';
import fsDriver from '../drivers/fs.driver.js';

import { read } from '../utils/config-read.js';

const { blueBright, redBright, greenBright } = chalk;

const program = new Command('execute');

program.requiredOption(
  '-c, --configPath <configPath>',
  'The config absolute path'
);

program.option('-v, --verbose', 'Print more info');

program.action(async function exportProgram() {
  const { configPath, verbose } = program.opts();
  const config = read(configPath);

  console.log(
    blueBright(`Start processing ${config.targets.length} targets...`)
  );

  for (const target of config.targets) {
    const from = target.from;
    const to = target.to;
    const read = readFromTarget(from);
    const write = writeFromTarget(to);
    await read(from.options, (error, data) => {
      if (error) {
        console.log(redBright(`Unable to read one object, the error is:`));
        console.log(redBright(error));
        return;
      }
      write(to.options, data)
        .then(() => {
          if (verbose) {
            console.log(greenBright(`Item saved with success: ${data.path}`));
          }
        })
        .catch((error) => {
          console.log(redBright(`Unable to write one object, the error is:`));
          console.log(redBright(error));
        });
    });
  }
});

function readFromTarget(target) {
  switch (target.driver) {
    case 'object-storage':
      return objectStorageDriver.read;

    case 'file-system':
      return fsDriver.read;

    default:
      throw new Error(`Driver is not valid ${target.driver}`);
  }
}

function writeFromTarget(target) {
  switch (target.driver) {
    case 'object-storage':
      return objectStorageDriver.write;

    case 'file-system':
      return fsDriver.write;

    default:
      throw new Error(`Driver is not valid ${target.driver}`);
  }
}

export default program;
