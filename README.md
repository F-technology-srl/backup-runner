# Backup runner

This is a small cli utils to setup and configure a cron based backup operation with node

## Configuration

The configuration is a json file that can be placed or created on your target system. It uses a structure like this. (see .config-examples directory)

```json
{
  "cron": "* 1 * * *", // Here you can describe the cron string
  "targets": [
    {
      "from": {
        // Here goes the configuration where the utility gets the data
      },
      "to": {
        // Here the configuration where the utility save the data
      }
    }
    // there can be any number of targets, they will be runned in parallel
  ]
}
```

The utility support multiple configuration for the from and to keys, we are going to call them drivers.

### File system driver

This use the machine filesystem to read and store files, the json configuration is simple

```json
{
  "driver": "file-system",
  "options": {
    "rootDir": "/some/direcotry/from/root" // The directory where to read or store files
  }
}
```

### Object storage driver

This driver use an object storage system with s3 like api, the configuration is something like this

```json
{
  "driver": "object-storage",
  "options": {
    "secretAccesKey": "", // The secret access key
    "accesKeyId": "VKIL43D5ARVMGFCY4YPD", // The access key id
    "bucketName": "test-way-bucket-for-e2e-delete-me", // The bucket name where to get or store the data
    "region": "fra1", // The region of the bucket
    "endpoint": "fra1.digitaloceanspaces.com" // The uri endpoint, could be also "s3.amazonaws.com"
  }
}
```

## Installation

To install and setup this utils run

`npx backup-runner install --configPath {absolute path of the config}`

This will start a process that will install the utils localy and it will setup a cron using the configuration that is given, after this process do not remove or rename the configuration, you could add other targets tho.

## Other command

Run `backup-runner --help` to see other command and options
