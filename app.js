const http = require("http");
const express = require("express");
const bodyParser = require('body-parser');
const session = require("express-session");
const app = express();
require("dotenv").config();
const cors = require("cors");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const port = 3001;


app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(cors());

app.use(session({ 
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false, 
    saveUninitialized: false, 
    cookie: { expires: 6000000 } 
}));

app.use("/user", userRoutes);
app.use("/category",categoryRoutes);
app.set("port", port);


const server = http.createServer(app);
server.listen(port);
server.on("listening", onListening);

function onListening(){
    const address = server.address();
    console.log("Application started on port " + address.port);
}