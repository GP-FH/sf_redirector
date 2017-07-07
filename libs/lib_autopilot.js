var request = require( 'request' );
var logger = require( './lib_logger.js' );

var autopilot_move_contact_to_new_list = function ( from, to, email ) {

    //  check if the current user is on the 'from' list
    var options = {
        method: 'GET',
        url: process.env.AUTOPILOY_API_BASE_URL + '/list/' + from + '/contact/' + email,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'autopilotapikey': process.env.AUTOPILOT_API_KEY
        }
    };

    request( options, function ( error, response, body ) {

        if ( error ) {
            logger.error( 'Failed to check list for contact - reason: ' + error );
        }
        else if ( response.statusCode != 200 || response.statusCode != 404 ) {
            logger.error( 'Failed to check list for contact - status code ' + response.statusCode + ' reason: ' + body.error );
        }
        else if ( response.statusCode == 200 ) {
            //  if the user is found, we need to remove them from the 'from' list
            local_autopilot_remove_list_contact( email, from, function ( err, result ) {
                if ( err ) {
                    logger.error( 'Failed to remove contact from list - reason: ' + error );
                }
                else if ( !result.ok ) {
                    logger.error( 'Failed to remove contact from list - reason: ' + result.msg );
                }
                else {

                    //  then add them to the 'to' list.
                    local_autopilot_add_list_user( email, to, function ( err, result ) {
                        if ( err ) {
                            logger.error( 'Failed to add contact to list - reason: ' + error );
                        }
                        else if ( !result.ok ) {
                            logger.error( 'Failed to add contact to list - reason: ' + result.msg );
                        }
                        else {
                            logger.info( 'Successfully moved user with email: ' + email + ' from autopilot list: ' + from + ' to ' + to );
                        }
                    } );
                }
            } );
        }
        else {
            logger.info( 'No autopilot list move necessary' );
        }
    } );
};

function local_autopilot_remove_list_contact( email, list_id, callback ) {

    var options = {
        method: 'DELETE',
        url: process.env.AUTOPILOY_API_BASE_URL + '/list/' + list_id + '/contact/' + email,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'autopilotapikey': process.env.AUTOPILOT_API_KEY
        }
    };

    request( options, function ( error, response, body ) {

        if ( error ) {
            return callback( 'Error removing user from list: ' + error );
        }
        else if ( response.statusCode != 200 ) {
            return callback( null, {
                ok: false,
                msg: 'status code ' + response.statusCode + ' reason: ' + body.error
            } );
        }
        else {
            return callback( null, {
                ok: true
            } );
        }

    } );

}

function local_autopilot_add_list_user( email, list_id, callback ) {

    var options = {
        method: 'POST',
        url: process.env.AUTOPILOY_API_BASE_URL + '/list/' + list_id + '/contact/' + email,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'autopilotapikey': process.env.AUTOPILOT_API_KEY
        }
    };

    request( options, function ( error, response, body ) {

        if ( error ) {
            return callback( 'Error adding user to list: ' + error );
        }
        else if ( response.statusCode != 200 ) {
            return callback( null, {
                ok: false,
                msg: 'status code ' + response.statusCode + ' reason: ' + body.error
            } );
        }
        else {
            return callback( null, {
                ok: true
            } );
        }

    } );

}

exports.autopilot_move_contact_to_new_list = autopilot_move_contact_to_new_list;
