/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  lib_autopilot: this library provides an interface for interacting with the Autopilot API.
 *  Currently the only external function it provides allows you to move a contact from 1 list
 *  to another.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const request = require("request");
const VError = require("verror");

const logger = require("./lib_logger");

const autopilot_move_contact_to_new_list = async ( from, to, email ) => {
  //  check if the current user is on the 'from' list
  const options = {
    method: 'GET',
    url: process.env.AUTOPILOY_API_BASE_URL + '/list/' + from + '/contact/' + email,
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'autopilotapikey': process.env.AUTOPILOT_API_KEY
    }
  };

  try{
    request( options, async function ( err, response, body ) {
      if ( err ) {
        throw new VError (err, "Failed to check for contact in Autopilot" );
      }
      else if ( response.statusCode != '200' && response.statusCode != '404' ) {
        throw new VError ( body.error, "non 200 response from Autopilot API" );
      }
      else if ( response.statusCode == '200' ) {
        // If the user is found, we need to remove them from the 'from' list
        await local_autopilot_remove_list_contact( email, from );

        // Then add them to the 'to' list.
        await local_autopilot_add_list_user( email, to);
      }

      return;
    } );
  }
  catch ( err ) {
    throw new VError ( err, "Error transferring contact between lists in Autopilot");
  }
};

const autopilot_remove_contact_from_list = async (email, list_id) => {
  return true;
};

const autopilot_update_contact = async (update_obj) => {
  return true;
};

const autopilot_add_contact_to_list = async (email, list_id) => {
  return true;
};

function local_autopilot_remove_list_contact( email, list_id ) {
  const options = {
    method: 'DELETE',
    url: process.env.AUTOPILOY_API_BASE_URL + '/list/' + list_id + '/contact/' + email,
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'autopilotapikey': process.env.AUTOPILOT_API_KEY
    }
  };

  request( options, async function ( err, response, body ) {
    if ( err ) {
      throw new VError ( err, "Error removing contact from list in Autopilot" );
    }
    else if ( response.statusCode != '200' ) {
      throw new VError ( body.error, "non 200 response from Autopilot API" );
    }

    return;
  } );
}

function local_autopilot_add_list_user( email, list_id ) {
  const options = {
    method: 'POST',
    url: process.env.AUTOPILOY_API_BASE_URL + '/list/' + list_id + '/contact/' + email,
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'autopilotapikey': process.env.AUTOPILOT_API_KEY
    }
  };

  request( options, async function ( err, response, body ) {
    if ( err ) {
      throw new VError ( err, "Error adding contact to list in Autopilot" );
    }
    else if ( response.statusCode != '200' ) {
      throw new VError ( body.error, "non 200 response from Autopilot API" );
    }

    return;
  } );
}

exports.autopilot_move_contact_to_new_list = autopilot_move_contact_to_new_list;
exports.autopilot_remove_contact_from_list = autopilot_remove_contact_from_list;
exports.autopilot_update_contact = autopilot_update_contact;
exports.autopilot_add_contact_to_list = autopilot_add_contact_to_list;
