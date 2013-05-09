# Sling JCR Sync

Forked and derived from less-monitor

## following content needs to be updated

## Features

- Watch and upload changed files to sling / cq5 repository

- Fully customizable. (see options)

## Instalation

### Requirements:

- Node.js Platform and npm package manager:
  - [Visit node.js website](http://nodejs.org/).

### Installing

git clone https://github.com/mszlapa/slingjcr-sync.git

cd slingjcr-sync

npm link

## Usage

Go to your  folder and type:
```
slingjcr-sync [options]

It requires curl in directory: \\cygwin\\bin\\curl

```

## Options ( NOTE those will change)

```
  --directory, -d     Define the root directory to watch, if this is not
                      defined the program will use the current working
                      directory.

  --output, -o        Define the directory to output the files, if this is not
                      defined the program will use the same directory from file.



  --match, -m         Matching files that will be processed. Defaults to
                      **/*.less

  --extension, -e     Sets the extension of the files that will be generated.
                      Defaults to .css

  --force, -f         Force to recompile all files on startup before start
                      watching files.

  --ignore, -i        Define the ignore file list. Can be a file or directory.
                      Ex: **/src/_*.less

  --interval, -t      Sets the interval in miliseconds of the files that will
                      be watching. Defaults to 250

  --nofollow, -n      If set will not follow @import dependencies. Defaults to
                      false.

  --optimization, -p  Sets the optimization level for the less compiler,
                      options are: 0, 1, and 2.

  --compress, -c      Compresses the output

  --silent, -s        Sets to silent mode. Starts without log output.

  --options, -u       Show options on startup.

  --master, -x        Process only master files. Master files are not dependent
                      from any others. Defaults to false

  --help, -h          Show this message
```

