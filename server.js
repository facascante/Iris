/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var config = require('./config');
var qs = require('querystring');
var url = require('url');

process.hook = require('./hook');

//API functions
var chat = {};
chat.api = {};

// Automatically load modules
config.modules_enabled.forEach(function (element, index) {
    chat.api[element.name] = require('./chat_modules/' + element.name);
    chat.api[element.name].options = element.options;
    if (chat.api[element.name].init) {
        chat.api[element.name].init();
    }
    console.log(element.name + " module enabled");
});

//Server and request function router

process.server = http.createServer(function (req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
    });


    
    var body = '';
    
    if (req.method === "POST") {
        //Check if request is empty
        if (req.headers["content-length"] === "0") {
            res.end("Empty request");
        }
        
        req.on('data', function (data) {
            
            body += data;
            
            req.on('end', function () {
                var requestUrl = url.parse(req.url, true),
                    requestPost = qs.parse(body),
                    hookurl = requestUrl.pathname.split('/').join('_');
                process.hook('hook_post' + hookurl, {'url': req.url, 'post': requestPost, 'res': res});
                
                process.on('complete_hook_post' + hookurl, function (data) {
                    res.end(data.returns);
                });
                
            });
        });
    } else if (req.method === "GET") {
        var requestUrl = url.parse(req.url, true),
            requestGet = qs.parse(requestUrl.query),
            hookurl = requestUrl.pathname.split('/').join('_');

        process.hook('hook_get' + hookurl, {'url': requestUrl.pathname, 'get': requestGet, 'res': res});

        process.on('complete_hook_get' + hookurl, function (data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(data.returns);
            res.end();
        });
        
    } else {
        res.end("Unknown action");
    }

    //Functions, each get a request argument and paramaters

}).listen(config.port);