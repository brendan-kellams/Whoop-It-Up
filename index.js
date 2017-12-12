var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');

var db = require('./models');

var pageRoutes = require('./routes/pageRoutes');
var profile = require('./routes/profile.controller');

var PORT = process.env.PORT || 8080;


var app = express();
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.png')))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

var hbs = require('hbs');
hbs.registerPartials(__dirname + '/views/partials');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/profile', express.static('public'));

app.use('/', pageRoutes);
app.use('/profile', profile);

db.sequelize.sync({ force: true }).then(function() {
  app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });
});