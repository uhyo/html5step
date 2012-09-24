//for node.js
var uhyoooooo=require('uhyoooooo'), http=require('http'), express=require('express');
var srv=express();

srv.get("/",function(req,res){
	res.sendfile("client.html");
});
srv.use("/images",express.static(__dirname+"/images"));
srv.use("/media",express.static(__dirname+"/media"));

var http_wrap=http.createServer(srv);
var app=uhyoooooo.createServer(http_wrap);
http_wrap.listen(8080);

app.init("step.js",{
	title:"html5step",
});


