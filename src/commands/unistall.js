import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { spawnSync, spawn } from 'child_process';
import ora from 'ora';
import { readPackage } from '../utils/read-package-json.js';

const { redBright, greenBright } = chalk;
const packagejson = readPackage();

const program = new Command('uninstall');

program.option('-s, --sudo', 'Run npm command as sudo');

const spinner = ora();

program.action(async function exportProgram() {
  const { sudo } = program.opts();
  const confirm = await inquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    message: 'Are you sure to disable and uninstall this package?',
  });

  if (!confirm.confirm) {
    process.exit(0);
  }

  const bin = Object.keys(packagejson.bin)[0];

  const oldCrontabsProcess = spawnSync('crontab -l', {
    shell: true,
    env: process.env,
  });

  let oldCrontabs = false;
  if (oldCrontabsProcess.stderr.length === 0) {
    oldCrontabs = oldCrontabsProcess.stdout.toString();
  }

  if (!oldCrontabs) {
    console.log(redBright('There is nothing to remove'));
    process.exit(1);
  }

  const filteredCrontab = oldCrontabs
    .split('\n')
    .filter((cron) => !cron.includes(bin))
    .join('\n');

  const crontabMinE = spawnSync(`echo "${filteredCrontab}" | crontab -`, {
    shell: true,
    env: process.env,
  });

  if (crontabMinE.stderr.length > 0) {
    console.log(redBright('Unable to unistall the cron:'));
    console.log(redBright(crontabMinE.stderr.toString()));
    process.exit(1);
  }
  try {
    await unistallPackage(bin, sudo);
  } catch (error) {
    console.log(redBright(error));
    process.exit(2);
  }

  console.log(greenBright('Unistallation completed'));
});

function unistallPackage(bin, asSudo) {
  return new Promise((res, rej) => {
    const isInstalled = !spawnSync(`which ${bin}`, {
      shell: true,
      env: program.env,
    })
      .stdout.toString()
      .includes('not found');

    if (isInstalled) {
      const installationProces = spawn(
        `${asSudo ? 'sudo ' : ''}npm uninstall -g ${packagejson.name}`,
        {
          shell: true,
          env: program.env,
        }
      );
      const errorChunks = [];
      installationProces.stdout.pipe(process.stdout);
      installationProces.stdin.pipe(process.stdin);
      installationProces.stderr.on('data', (errorData) => {
        errorChunks.push(errorData.toString());
      });
      installationProces.on('exit', (code) => {
        if (code === 0) {
          res();
        } else {
          rej(
            new Error(
              `Unable to unistall the package error above:\n${errorChunks.join(
                '\n'
              )}`
            )
          );
        }
      });
    } else {
      console.log(blueBright('Package already removed'));
      res();
    }
  });
}

export default program;
