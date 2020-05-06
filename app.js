const http = require("http");
const express = require("express");
const bodyParser = require('body-parser');
const session = require("express-session");
const app = express();
require("dotenv").config();
const cors = require("cors");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const gameRoute = require('./routes/games');
const contentRoute = require('./routes/contents');
const port = 3001;
const MySQLStore = require('express-mysql-session')(session);

var storeOptions = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};
 
var sessionStore = new MySQLStore(storeOptions);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const corsOptions = {
    origin: process.env.APP_URL,
    credentials: true
}

app.use(cors(corsOptions));

app.use(session({ 
    key:'oepp2020project',
    secret: 'somerandonstuffsoepp2020',
    name: 'oepp2020project',
    saveUninitialized: false,
    resave: false, 
    rolling: true,
    store: sessionStore,
    cookie: { 
        httpOnly: true,
        expires: 48000
    } 
}));

app.use("/user", userRoutes);
app.use("/category",categoryRoutes);
app.use("/games",gameRoute);
app.use("/contents",contentRoute);
app.set("port", port);


const server = http.createServer(app);
server.listen(port);
server.on("listening", onListening);

function onListening(){
    const address = server.address();
    console.log("Application started on port " + address.port);
}