const axios = require('axios');
const { json } = require('body-parser');
const { async } = require('rxjs');
const geohash = require('ngeohash');
const segmentMap = {'Music': 'KZFzniwnSyZfZ7v7nJ', 'Sports': 'KZFzniwnSyZfZ7v7nE', 'Arts': 'KZFzniwnSyZfZ7v7na', 'Film': 'KZFzniwnSyZfZ7v7nn', 'Miscellaneous': 'KZFzniwnSyZfZ7v7n1'};

const autoSuggestResponse =  async (req, res) => {
    var keyword = req.query.keyword
    if(keyword == undefined || keyword == 'undefined') {
        console.log("Keyword is empty");
        return res.status(200).json({'suggestions': []});
    }
    const params = new URLSearchParams([['keyword', keyword], ['apikey', '']]);
    const tmResponse = await axios.get("https://app.ticketmaster.com/discovery/v2/suggest", {params});
    console.log("received request", params);
    jsonRespnse = JSON.parse(JSON.stringify(tmResponse.data));
    attractionNames = [];

    var attractions = (!jsonRespnse.hasOwnProperty('_embedded') || !jsonRespnse._embedded.hasOwnProperty('attractions')) ? {} : jsonRespnse._embedded.attractions;
    for(let i = 0; i < attractions.length; i++) {
        var attraction = attractions[i];
        attractionNames.push(attraction.name);
    }
    //console.log(attractions);
    //console.log(tmResponse.data);
    res.header('Access-Control-Allow-Origin', '*');
    return res.status(200).json({'suggestions': attractionNames});
}

const eventSearchResponse = async (req, res) => {
    var keyword = req.query.keyword;
    //var address = req.query.address;
    var lat = req.query.lat;
    var lon = req.query.lon;
    //const mapsResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json?key=" + address);
    /*if(mapsResponse.status == 200) {
        let latLong = JSON.parse(JSON.stringify(mapsResponse.data))?.results[0]?.geometry?.location;
        lat = latLong.lat;
        lon = latLong.lng;
    }*/

    var geoHash = geohash.encode(lat,lon, precision=9);
    var distance = req.query.distance
    var category = req.query.category;
    const params = new URLSearchParams([['keyword', keyword], ['geoPoint', geoHash], ['radius', distance],['apikey', '']]);
    if(category != 'Default') {
        params.append('segmentId', segmentMap[category]);
    }
    console.log("category is:" + category);
    console.log("segment is:" + segmentMap[category]);

    const tmResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events', {params});
    console.log(tmResponse.status);
    res.header('Access-Control-Allow-Origin', '*');
    if(tmResponse.status == 200) {
        console.log(tmResponse.data);
        if(!tmResponse.data.hasOwnProperty('_embedded')) {
            return res.status(200).json({'events':[]});
        }
        eventDetails = tmResponse.data._embedded.events;
        events = [];
        for(let i = 0; i < eventDetails.length; i++) {
            var event = eventDetails[i];
            var result = {}
            result['name'] = event.name;
            result['images'] = event.images;
            result['localDate'] = event.dates.start.localDate;
            result['localTime'] = event.dates.start.localTime;
            result['venue'] = event._embedded.venues[0];
            result['classifications'] = event.classifications;
            result['id'] = event.id;
            events.push(result);
        }
        return res.status(200).json({"events":events});
    } else {
        return res.status(200).json({"events":[]});
    }
    
    
}

const eventDetailsResponse = async (req, res) => {
    var id = req.query.id;
    const params = new URLSearchParams([['apikey', '']]);
    const tmResponse = await axios.get("https://app.ticketmaster.com/discovery/v2/events/"+id, {params});
    res.header('Access-Control-Allow-Origin', '*');
    if(tmResponse.status == 200) {
        return res.status(200).json(tmResponse.data);
    } else {
        return res.status(200).json({});
    }

}   

module.exports = {
    autoSuggestResponse,
    eventSearchResponse,
    eventDetailsResponse
}