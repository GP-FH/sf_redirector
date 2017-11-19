/*
 *  lib_autopilot.js test suite: unit tests to make sure lib functions are returning expected values
 */

var nock = require( 'nock' );

//  mock call - check list for user
nock( 'https://api2.autopilothq.com:443', {
        "encodedQueryParams": true
    } )
    .get( '/v1/list/contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072/contact/asdas@asjdnas.com' )
    .reply( 200, {}, [ 'Last-Modified', //user found
        'Wed, 12 Jul 2017 12:37:07 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '2',
        'Date',
        'Wed, 12 Jul 2017 12:37:09 GMT',
        'Connection',
        'close'
    ] );

//  mock call - delete user from list
nock( 'https://api2.autopilothq.com:443', {
        "encodedQueryParams": true
    } )
    .delete( '/v1/list/contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072/contact/asdas@asjdnas.com' )
    .reply( 200, {}, [ 'Last-Modified', //  user deleted successfully
        'Wed, 12 Jul 2017 12:37:10 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '2',
        'Date',
        'Wed, 12 Jul 2017 12:37:11 GMT',
        'Connection',
        'close'
    ] );

//  mock request -> add contact to list
nock( 'https://api2.autopilothq.com:443', {
        "encodedQueryParams": true
    } )
    .post( '/v1/list/contactlist_1C4F1411-4376-4FEC-8B63-3ADA5FF4EBBD/contact/asdas@asjdnas.com' )
    .reply( 200, {}, [ 'Last-Modified', //success
        'Wed, 12 Jul 2017 12:37:12 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '2',
        'Date',
        'Wed, 12 Jul 2017 12:37:13 GMT',
        'Connection',
        'close'
    ] );
