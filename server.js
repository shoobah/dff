var static = require('node-static');

var file = new static.Server('./mapimages');
var port = 8090;

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response, function (err, result) {
            if (err) {
                //Om bilden inte hittas (eller annat fel) returneras ingen felkod, slipper en massa 404 :)
                response.end();
                if (err.status === 500) {
                    console.log('Fel!', err);
                }
            }
        });
    }).resume();
}).listen(port);

//Detta är ett test med att använda node och node-static som en minimal webserver för bilder.
//
//När man startar denna med "node server" från cmd eller ps 
//så startar en filserver på port 8080 som delar ut alla filer under mapimages
//Som exempel pekar Sälen delen i settings.json på denna.