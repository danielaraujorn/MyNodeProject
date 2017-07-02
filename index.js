var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoose=require('mongoose'),
    relationship = require("mongoose-relationship");

const bluebird = require('bluebird')

mongoose.connect('mongodb://teste:PrimeiroApp123@ds143892.mlab.com:43892/primeiro_app', { useMongoClient: true,config: { autoIndex: false } });
mongoose.Promise = bluebird

var MySchema = new mongoose.Schema({
	lat:Number,
	lng:Number,
	ip:String,
	now:{ type: Boolean, default: true }
})
var Posicao = mongoose.model('Posicoes',MySchema)

io.on('connection', function(socket){
	Posicao.find({},(err,posicoes)=>{
		socket.emit('markers',posicoes);
	})
	var ip= socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
	socket.emit('returnip',ip)
	console.log("connected",ip);
	var thisPosition=null;

	Posicao.findOne({ 'ip': ip },function (err, thisPosition) {
	  if (err) return handleError(err);
	  thisPosition=thisPosition;
	})

	socket.on('disconnect', function () {
		console.log("disconnected",ip);
		Posicao.findOne({ 'ip': ip },function (err, thisPosition) {
		  if (err) return handleError(err);
		  if(thisPosition!==null){
		  	thisPosition.now=false;
				console.log('now = false',ip);
		  	thisPosition.save();
		  }
		})
  });

	socket.on('/put/posicao/',(item)=>{
		Posicao.findOne({ 'ip': ip },function (err, thisPosition) {
		  if (err) return handleError(err);
		  if(thisPosition===null){
				new Posicao(Object.assign(item,{ip:ip})).save((err)=>{
					if (err){
						console.log('error on put',ip)
					} 
					console.log('item saved',ip);
				})
		  }else{
		  	thisPosition.now=true;
				console.log('now = true',ip);
		  	thisPosition.save();
		  }
		})
	})
});

// app.get('/', function(req, res){
// res.sendFile(__dirname + '/index.html');
// });

http.listen(3000, function(){
  console.log('listening on *:3000');
});