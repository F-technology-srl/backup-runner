let nameCache = null;

export function makeCurrentDirectoryName() {
  if (nameCache) {
    return nameCache;
  }
  const now = new Date();
  const newName = `backup-${now.getDate()}-${now.getMonth()}-${now.getFullYear()}--${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  nameCache = newName;
  return nameCache;
}
