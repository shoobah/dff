//Detta �r ett test med att anv�nda node och node-static som en minimal webserver f�r bilder.
//
//N�r man startar denna med "node server" fr�n cmd eller ps 
//s� startar en filserver p� port 8080 som delar ut alla filer under mapimages
//Som exempel pekar S�len-node delen i settings.json p� denna.
var statics = require('node-static');

var file = new statics.Server('./mapimages');
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
