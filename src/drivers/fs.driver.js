import { join, parse } from 'path';
import {
  existsSync,
  mkdir,
  mkdirSync,
  writeFile,
  readdir,
  readFile,
  lstat,
} from 'fs';
import { makeCurrentDirectoryName } from '../utils/create-backup-dir-name.js';
import { lookup } from 'mime-types';

function recursiveNavigateDir(path = '', cb, rootDirToRemove) {
  lstat(path, (err, stats) => {
    if (err) {
      return cb(err);
    }
    if (stats.isDirectory()) {
      cb(null, {
        path: path.replace(rootDirToRemove, ''),
        contentType: 'application/json',
        body: Buffer.from([]),
        size: 0,
        isDirectory: true,
      });
      readdir(path, (err, files) => {
        if (err) {
          return cb(err);
        }
        files.forEach((file) =>
          recursiveNavigateDir(join(path, file), cb, rootDirToRemove)
        );
      });
    } else {
      readFile(path, (err, data) => {
        if (err) {
          return cb(err);
        }
        cb(null, {
          path: path.replace(rootDirToRemove, ''),
          contentType: lookup(path) || '',
          body: data,
          size: data.length * data.byteLength,
          isDirectory: false,
        });
      });
    }
  });
}

export async function read(options, cb) {
  const baseDir = options.rootDir;
  recursiveNavigateDir(baseDir, cb, baseDir);
}

export async function write(options, data) {
  const { path, contentType, body, size, isDirectory } = data;
  const backupDirName = makeCurrentDirectoryName();
  const backupDir = join(options.rootDir, backupDirName);
  const filePath = join(backupDir, path);

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    if (isDirectory) {
      mkdir(filePath, { recursive: true }, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    } else {
      writeFileSafe(filePath, body, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    }
  });
}

function writeFileSafe(path = '', data, cb) {
  const parsed = parse(path);
  mkdir(parsed.dir, { recursive: true }, (err) => {
    if (err) {
      return cb(err);
    }
    writeFile(path, data, cb);
  });
}

export default {
  write,
  read,
};
