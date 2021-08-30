import { readFileSync } from 'fs';
import { join } from 'path';

let json = null;

export function readPackage() {
  if (!json) {
    json = JSON.parse(
      readFileSync(
        join(
          import.meta.url.replace('file:', ''),
          '..',
          '..',
          '..',
          'package.json'
        )
      ).toString()
    );
  }
  return json;
}
