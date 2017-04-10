var chargebee = require( 'chargebee' );
var bodyparser = require( 'body-parser' );
var airtable = require( 'airtable' );
var base = new airtable( {
    apiKey: 'keyHuKKha0gYw95XY'
} ).base( 'app70ISKvV9oTqHeY' );
var app = require( 'express' )();
var https = require( 'https' );
var fs = require( 'fs' );
var sslPath = '/etc/letsencrypt/live/redirect.wowzers.work/';
var options = {
    key: fs.readFileSync( sslPath + 'privkey.pem' ),
    cert: fs.readFileSync( sslPath + 'fullchain.pem' )
};
var server = https.createServer( options, app );
chargebee.configure( {
    site: "testcorp-test",
    api_key: "test_htql10oiHR3mKzcuH0QhjIVse2dcugghIf"
} );

app.use( bodyparser.json() );
app.use( bodyparser.urlencoded( {
    extended: true
} ) );

app.get( '/', function ( req, res ) {

    /*
     *  TODO:
     *  - add some sort of validation here - header check for referrer OR some sort of manual verification code OR google something
     *  - set up helmut (maybe)
     *  - set up ufw firewall on stitchfox box
     *
     *  - add plan_id param to the form URL
     *
     */

    console.log( 'referrer: ' + req.get( 'Referer' ) );

    //dump to airtable first
    base( 'Table 1' ).create( {
        name: req.query.name,
        kid_gender: req.query.kid_gender,
        kid_name: req.query.kid_name,
        age: req.query.age,
        top_size: req.query.top_size,
        bottom_size: req.query.bottom_size,
        style: req.query.style,
        email: req.query.email,
        street_address: req.query.street_address,
        suburb: req.query.suburb,
        city: req.query.city,
        phone: req.query.phone
    }, function ( err, record ) {
        if ( err ) {
            console.error( err );
            return;
        }
        console.log( record.getId() );
    } );


    chargebee.hosted_page.checkout_new( {
        subscription: {
            plan_id: req.query.plan_id
        },
        customer: {
            email: req.query.email,
            first_name: req.query.name,
            //last_name: "Doe",
            //locale: "fr-CA",
            phone: req.query.phone,
            cf_im_shopping_for_a: req.query.kid_gender,
            cf_how_old_are_they: req.query.age,
            cf_kid_name: req.query.kid_name,
            cf_what_size_tops: req.query.top_size,
            cf_what_size_bottoms_do_they_wear: req.query.bottom_size,
            cf_whats_their_style: req.query.style
        },
        billing_address: {
            first_name: req.query.name,
            //last_name: "Doe",
            line1: req.query.street_address,
            line2: req.query.suburb,
            city: req.query.city,
            //zip: req.query.postcode,
            country: "NZ",
            phone: req.query.phone
        }
    } ).request( function ( error, result ) {
        if ( error ) {
            //handle error
            console.log( error );
        }
        else {
            console.log( result );
            var hosted_page = result.hosted_page;

            res.redirect( hosted_page.url );
        }
    } );

} );

server.listen( 443, function () {
    console.log( 'up and running...' );
} );
