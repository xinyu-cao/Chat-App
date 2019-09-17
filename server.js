const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(3000).sockets;

// Connect to MongoDB
const connect_url = 'mongodb+srv://cassiecao2016:c9977112288C@cluster0-0xlhw.mongodb.net/test?retryWrites=true&w=majority/mongochat-app'
mongo.connect(connect_url, { useUnifiedTopology: true, useNewUrlParser: true}, function(err, database){
    if(err){
        console.log(err);
    }
    
    console.log('MongoDB connected...');

    // Connect to socket.io
    client.on('connection',function(socket){
        let obj = database.db('mongo');
        let chat = obj.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s); // emit to send something from server->client or client->server
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err){
                console.log(err);
            }

            // Emit the message
            socket.emit('output',res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;


            // Check for name and msg
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message.');
            }
            else {
                // Insert message
                chat.insertOne({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message Sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from the collection 'chat'
            chat.removeOne({}, function(){
                // Emit cleared to let the user know everything is cleared
                socket.emit('cleared');
            });
        });
    });
});
