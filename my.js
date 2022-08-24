const http = require('http');
const qs = require('qs');
const url = require('url');
const fs = require('fs');
const localStorage = require('local-storage');
const port = 8081;


let handlers = {};

handlers.login = function (req,res){
    fs.readFile('./views/login.html','utf8',(err,data)=>{
        if(err){
            throw new Error(err.message);
        }
        res.writeHead(200,{'Content-Type':'text/html'});
        res.write(data);
        return res.end();
    });
};


handlers.notfound = function (rep, res) {
    fs.readFile('./views/notfound.html','utf8', function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
};

handlers.home = function (req,res){
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    });
    req.on('end',()=>{
        data = qs.parse(data);
        let expires = Date.now()*1000*60*60;
        // let string = [{name:data.name,email:data.email,password:data.password,expires:expires}];
        let jsonString = "{\"username\":\""+data.username+"\",\"email\":\""+data.email+"\",\"password\":\""+data.password+"\",\"expires\":"+expires+"}";
        // let jsonString = JSON.stringify(string);
        console.log(jsonString);
        let tokenId = randomString(20);
        createSessionToken(tokenId,jsonString);
        localStorage.set('token', tokenId);
        fs.readFile('./views/home.html','utf8',(err,dataHtml)=>{
            if(err){
                throw new Error(err.message);
            }
            dataHtml = dataHtml.replace("{name}",data.username);
            dataHtml = dataHtml.replace("{email}",data.email);
            dataHtml = dataHtml.replace("{password}",data.password);
            res.writeHead(200,{'Content-Type':'text/html'});
            res.write(dataHtml);
            return res.end();
        });
    });
    req.on('error',()=>{
        console.log("error")
    });
};

let router = {
    'login': handlers.login,
    'home': handlers.home,
    'notfound': handlers.notfound
}

function randomString(strLength){
    strLength=typeof strLength === 'number' && strLength > 0?strLength:false;
    if(strLength){
        let possibleChar = 'abcdefghiklmnopqwerszx1234567890';
        let str='';
        for(let i=0; i<strLength; i++){
            let randomChar = possibleChar.charAt(Math.floor(Math.random()*possibleChar.length));
            str += randomChar;
        }
        return str;
    }
}

function createSessionToken(fileName,data){
    fileName='./token/'+fileName;
    fs.writeFile(fileName,data,err=>{
    })
}

const server = http.createServer((req, res)=>{
    readSession(req,res);
});

server.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
})

function readSession(req,res){
    let tokenID=localStorage.get('token');
    console.log(tokenID);
    if(tokenID){
        console.log(tokenID);
        let sessionString='';
        let expires=0;
        fs.readFile('./token/'+tokenID,'utf8',(err,data)=>{
            if(err) throw err;
            sessionString = String(data);
            expires=JSON.parse(sessionString).expires;
            let now = Date.now();
            if(now>expires){
                // let parseUrl = url.parse(req.url);
                // let path=parseUrl.pathname;
                // let trimPath = path.replace(/^\/+|\/+$/g, '');
                // let chosenHandler = (typeof (router[trimPath]) !== 'undefined') ? router[trimPath] : handlers.notfound;
                // chosenHandler(req, res);
                fs.readFile('./views/login.html','utf8',(err,dataHtmllogin)=>{
                    if(err) throw err;
                    let jsonString=JSON.parse(sessionString)
                    dataHtmllogin = dataHtmllogin.replace('{name}',jsonString.username);
                    dataHtmllogin = dataHtmllogin.replace('{email}',jsonString.email);
                    dataHtmllogin = dataHtmllogin.replace("{password}",data.password);
                    res.writeHead(200,{'Content-type':'text/html'});
                    res.write(dataHtmllogin );
                    res.end();
                })
            }else {
                fs.readFile('./views/logged.html','utf8',(err,dataHtml)=>{
                    if(err) throw err;
                    let jsonString=JSON.parse(sessionString)
                    dataHtml = dataHtml.replace('{name}',jsonString.username);
                    dataHtml = dataHtml.replace('{email}',jsonString.email);
                    res.writeHead(200,{'Content-type':'text/html'});
                    res.write(dataHtml );
                    res.end();
                })
            }
        })
    }else {
        // chưa đăng nhập
        let parseUrl = url.parse(req.url, true);
        let path = parseUrl.pathname;
        let trimPath = path.replace(/^\/+|\/+$/g, '');
        let chosenHandler = (typeof (router[trimPath]) !== 'undefined') ? router[trimPath] : handlers.notfound;
        chosenHandler(req, res);
    }
}
