var http = require('http'),
    express = require('express'),
    app = express(),
    server = http.Server(app);
app.use(express.static(__dirname + '/public'));
var port = process.env.PORT || 8080;
server.listen(port, () => console.log('Listening on port', port));