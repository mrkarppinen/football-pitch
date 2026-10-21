var http = require('http');
var url = require('url');
var fs = require('fs');

const server = http.createServer((req, res) => {
    var q = url.parse(req.url, true);

  var filename = "." + q.pathname;

  fs.readFile(filename, function(err, data) {

    if (err) {

      res.writeHead(404, {'Content-Type': 'text/html'});
      return res.end("404 Not Found");

    } 

    if (filename.endsWith('.js')) {
      res.writeHead(200, {'Content-Type': 'text/javascript'});
    } else if (filename.endsWith('.css')) {
      res.writeHead(200, {'Content-Type': 'text/css'});
    } else if (filename.endsWith('.html')) {
      res.writeHead(200, {'Content-Type': 'text/html'});
    } else {
      res.writeHead(200, {'Content-Type': 'application/octet-stream'});
    }
    res.write(data);
    return res.end();

  });
});

server.listen(3000, () => {
    console.log(`Server running at http://localhost:3000/`);
});
