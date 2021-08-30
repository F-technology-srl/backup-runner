import { Command } from 'commander';
import { spawnSync, spawn } from 'child_process';
import { read } from '../utils/config-read.js';
import chalk from 'chalk';
import { readPackage } from '../utils/read-package-json.js';

const { greenBright, redBright, blueBright } = chalk;

const packagejson = readPackage();

const program = new Command('install');

program.requiredOption(
  '-c, --configPath <configPath>',
  'The config absolute path'
);

program.option('-sk, --skipInstallation', 'Skip package installation');
program.option('-s, --sudo', 'Run npm command as sudo');

program.action(async function installProgram() {
  const { configPath, skipInstallation, sudo } = program.opts();
  const bin = Object.keys(packagejson.bin)[0];

  const config = read(configPath);

  await installPackage(bin, skipInstallation, sudo);

  const oldCrontabsProcess = spawnSync('crontab -l', {
    shell: true,
    env: process.env,
  });
  let oldCrontabs = '';
  if (oldCrontabsProcess.stderr.length === 0) {
    oldCrontabs = oldCrontabsProcess.stdout.toString();
  }

  const cronString = `${config.cron} node ${bin} --configPath ${configPath}`;

  const isAlreadyInstalled = oldCrontabs.includes(cronString);

  if (isAlreadyInstalled) {
    console.log(greenBright(`Cron already installed as ${config.cron}`));
    process.exit(0);
  }

  const crontabMinE = spawnSync(
    `echo "${cronString}\n${oldCrontabs}" | crontab -`,
    {
      shell: true,
      env: process.env,
    }
  );

  if (crontabMinE.stderr.length > 0) {
    console.log(redBright('Unable to install the cron:'));
    console.log(redBright(crontabMinE.stderr.toString()));
    process.exit(1);
  }

  const test = spawnSync('crontab -l', {
    shell: true,
    env: process.env,
  });

  if (!test.output.toString().includes(cronString)) {
    console.log(redBright('Unable to install the cron'));
    process.exit(1);
  }

  const currentUser = spawnSync('echo ${USER}', {
    shell: true,
    env: process.env,
  }).stdout.toString();

  console.log(
    greenBright(`Cron installed with user: ${currentUser} on "${config.cron}"`)
  );
  process.exit(0);
});

function installPackage(bin, skipInstallation, sudo) {
  return new Promise((res, rej) => {
    const isInstalled = !spawnSync(`which ${bin}`, {
      shell: true,
      env: program.env,
    })
      .stdout.toString()
      .includes('not found');

    if (!isInstalled && !skipInstallation) {
      const installationProces = spawn(
        `${sudo ? 'sudo ' : ''}npm install -g ${packagejson.name}`,
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
              `Unable to install the package error above:\n${errorChunks.join(
                '\n'
              )}`
            )
          );
        }
      });
    } else {
      console.log(
        blueBright(
          `Skipping package installation${
            isInstalled ? ', package already installed' : ''
          }`
        )
      );
      res();
    }
  });
}

export default program;
