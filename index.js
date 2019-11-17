const app = require('./app.js');

var port = process.env.PORT || 3000;

app.listen(port);

console.log('Prerender server running on port ' + port);

