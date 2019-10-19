var debug = require('debug')('log')
var http = require('http');
var fs = require('fs');

var server = http.createServer((request, response)=>{
    debug('request received');
    switch (request.url) {
        case '/':
            debug('Loading index page');
            loadFile('./index.html',response);
            break;
        case '/list':
            debug('Loading registered people files')
            loadFile('./registered.html',response);
            break;
        case '/save':
            let participant = "";
            request.on('data',(data)=>{participant+=data;});
            request.on('end', () => { saveTicket(participant.split('=')[1], response);})
            break;
        case '/number':
            readNumber(response);
            break;
        default:
            debug('loading: '+request.url);
            loadFile('.'+request.url,response);
    }
});

server.on('listening',()=>{debug('Server listening on 127.0.0.1:8080');});
server.listen(8080, '127.0.0.1');

function loadFile(filename,response) {
    if(fs.existsSync(filename)) {
        if (filename.endsWith('.json')) {
            fs.readFile(filename,(err,data)=>{
                debug("Finished reading: "+filename);
                response.writeHead(200,{'Content-Type': 'application/json'});
                response.write(data);
                debug("Finished writing: "+filename);
                response.end();
                debug("JSON response sent to browser");
            });
        }else{
            let file = fs.createReadStream(filename);
            let split = filename.split('.');
            split = split[split.length - 1];
            debug("Content-type: " + split);

            response.writeHead(200, { 'Content-Type': 'text/' + split });

            debug(filename + ' opened');
            file.on('data', (data) => {
                response.write(data);
                debug('Writing ' + filename + ' to browser stream');
            });
            file.on('close', () => {
                response.end();
                debug(filename + ' writing complete');
            });
        }
    } else{
        debug('File not found :'+filename);
        response.writeHead(404, { 'Content-Type': 'text/plain'});
        response.write('Not found');
        response.end();
    }
}

function readNumber(response) {
    fs.readFile('num.txt', (err,data)=>{
        let resp = {};
        resp.number = parseInt(data)+1;
        
        fs.writeFile('num.txt', resp.number.toString(),(err)=>{
            debug('Counter updated');
            if (err) {
                resp.status = "BAD";
            }else{
                resp.status = "OK";
            }
            response.write(JSON.stringify(resp));
            response.end();
        });
    });
}

function saveTicket(item, response) {
    item = JSON.parse(unescape(item).split('+').join(' '));
    fs.readFile('registered.json',(err,data)=>{
        data = JSON.parse(data);
        debug(data);
        data.push(item);
        debug(data);
        fs.writeFile('registered.json', JSON.stringify(data), (err) => {
            if (err)
                response.write("Impossible d'ecrire les donnees");
            else
                response.write("Enregistre!");
            response.end();
        });
    });
}