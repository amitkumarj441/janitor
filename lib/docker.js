// Copyright © 2016 Jan Keromnes. All rights reserved.
// The following code is covered by the AGPL-3.0 license.

var exec = require('child_process').exec;


// Use the Docker daemon locally (FIXME: Use remote API instead).

function docker (command, options, callback) {

  var cmd = 'docker --tlsverify --tlscacert=ca.crt --tlscert=client.crt ';
  cmd += '--tlskey=client.key -H=localhost:2376 ';

  switch (command) {
    case 'build':
      cmd += 'build';
      var image = options.image;
      if (image) {
        cmd += ' -t ' + image;
      }
      cmd += ' -';
      break;
    case 'images':
      cmd += 'images';
      break;
    case 'run':
      cmd += 'run -d';
      var ports = options.ports || [];
      ports.forEach(function (port) {
        cmd += ' -p ' + port;
      });
      cmd += ' ' + options.image;
      break;
    default:
      callback('Unauthorized Docker command "' + command + '"');
      return;
  }

  var opts = {
    maxBuffer: 10 * 1024 * 1024 // Allow buffers up to 10MB.
  };

  var child = exec(cmd, opts, function (error, stdout, stderr) {
    callback(error, stdout, stderr);
  });

  if (options.stdin) {
    child.stdin.setEncoding('utf8');
    child.stdin.end(options.stdin);
  }

} // Don't export `docker`.


// Build a Docker image with a given Docker command.

function buildImage (image, command, callback) {

  var options = {
    image: image,
    stdin: command + '\n'
  };

  docker('build', options, function (error, stdout, stderr) {
    var logs = 'STDERR:\n' + stderr + '\n\nSTDOUT:\n' + stdout;
    callback(error, logs);
  });

}

exports.buildImage = buildImage;


// Start a new Docker container from a given image.

function runContainer (image, ports, callback) {

  var options = {
    image: image,
    ports: ports
  }

  docker('run', options, function (error, stdout, stderr) {
    var logs = 'STDERR:\n' + stderr + '\n\nSTDOUT:\n' + stdout;
    callback(error, logs);
  });

}

exports.runContainer = runContainer;