import joi from 'joi';
import chalk from 'chalk';
import { readFileSync } from 'fs';

const { redBright } = chalk;

const pathRegex = /^\/([^?\/]+)/;
const cronRegex =
  /(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/;
const bucketNameRegex =
  /(?=^.{3,63}$)(?!^(\d+\.)+\d+$)(^(([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])$)/;

const bucketOptions = joi.object({
  secretAccesKey: joi.string(),
  accesKeyId: joi.string(),
  bucketName: joi.string().pattern(bucketNameRegex),
  region: joi.string(),
  endpoint: joi.string().optional(),
});

const fsOptions = joi.object({
  rootDir: joi.string().pattern(pathRegex),
});

const fromToObject = joi.object({
  driver: joi.string().valid('file-system', 'object-storage'),
  options: joi
    .alternatives()
    .conditional('driver', {
      is: 'object-storage',
      then: bucketOptions,
    })
    .conditional('driver', { is: 'file-system', then: fsOptions }),
});

const schema = joi.object({
  cron: joi.string().pattern(cronRegex),
  targets: joi.array().items(
    joi.object({
      from: fromToObject,
      to: fromToObject,
    })
  ),
});

export function read(path) {
  let config = {};
  try {
    config = JSON.parse(readFileSync(path).toString());
  } catch (error) {
    throw new Error(`Unable to read the config file at ${path}`);
  }

  const result = schema.validate(config);

  if (result.error) {
    console.error(redBright('Configuration is not valid:'));
    console.error(redBright(JSON.stringify(result.error.details, null, 2)));
    process.exit(2);
  }

  return config;
}
