const express = require('express');
const app = express();
const ticketmaster = require('./ticketmaster');
const cors = require('cors');

const routes = express.Router();
app.use(routes);

app.use(cors());

routes.get('/autoSuggest', ticketmaster.autoSuggestResponse);
routes.get('/eventSearch', ticketmaster.eventSearchResponse);
routes.get('/eventDetails', ticketmaster.eventDetailsResponse);

app.listen(3000, () => console.log("started listening"));
