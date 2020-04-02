const http = require("http");
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const cors = require("cors");
const userRoutes = require("./routes/user");
const port = 3001;

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(cors());

app.use("/user", userRoutes); //  http://127.0.0.1:3001/user/register/....

app.set("port", port);


const server = http.createServer(app);
server.listen(port);
server.on("listening", onListening);

function onListening(){
    const address = server.address();
    console.log("Application started on port " + address.port);
}