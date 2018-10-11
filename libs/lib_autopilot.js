/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  lib_autopilot: this library provides an interface for interacting with the Autopilot API.
 *  Currently the only external function it provides allows you to move a contact from 1 list
 *  to another.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const request = require("request");
const VError = require("verror");
const got = require("got");

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

/*
 * Given a list_id and email this function removes the contact associated with the Given
 * email from the given list. Returns {ok:true} or throws error
 */
 
const autopilot_remove_contact_from_list = async (email, list_id) => {
  if (!email){
    throw new VError(`missing email so cannot remove contact from list`);
  }
  
  if (!list_id){
    throw new VError(`missing list_id so cannot remove contact from list`);
  }
  
  const options = {
    method: 'DELETE',
    url: `${process.env.AUTOPILOY_API_BASE_URL}/list/${list_id}/contact/${email}`,
    headers: {
      'autopilotapikey': process.env.AUTOPILOT_API_KEY
    }
  };
  
  try{
    request(options, async (error, response, body) => {
      if (error){
        throw new VError(error, "Error removing contact from list in Autopilot");
      }
      
      if (response.statusCode != '200'){
        throw new VError (body.error, "non 200 response from Autopilot API when trying to remove contact from list");
      }
      
      return;
    });
  }catch (error){
    throw new VError(error);
  }
};

/*
 * Given an object with fields to update/include (format here: https://autopilot.docs.apiary.io/#reference/api-methods/addupdate-contact/add-or-update-contact)
 * this function updates the contact in Autopilot. SOME ASIDES:
 * 
 * - if you provide no email in the object it will create a new contact. Including an email will update
 *   an existing contact or create a new one if one does not already exist 
 * - if you include an _autopilot_list property in the object this call will also add the newly created/
 *   updated contact to the list with the matching ID
 */

const autopilot_update_or_create_contact = async (update_obj) => {
  if ((Object.keys(update_obj).length === 0 && update_obj.constructor === Object) || typeof update_obj !== 'object'){
    throw new VError("Cannot update contact in Autopilot as update_obj is not an object");
  }
  
  logger.info(`DEBUG: received object by AP lib: ${JSON.stringify(update_obj, null, 4)}`);
  logger.info(`DEBUG: the URL we are sending to: ${process.env.AUTOPILOY_API_BASE_URL}/contact`);
  const options = {
    headers: {
      'cache-control': 'no-cache',
      'autopilotapikey': process.env.AUTOPILOT_API_KEY,
      'content-type': 'application/json'
    },
    body: `{\"Email\":\"marcelo@stitchfox.com\"}`//JSON.stringify(update_obj)
  }
  
  try {
    const ret =  await got.post(`${process.env.AUTOPILOY_API_BASE_URL}/contact`, options);
    logger.info(`DEBUG: here's what's coming back from AP: ${response.statusCode} + ${JSON.stringify(response.body, null, 4)}`);
    if (response.statusCode != '200'){
      throw new VError (response.body.error, "non 200 response from Autopilot API when trying to add contact to list");
    }
      
    return;
  }catch (error){
    throw new VError(error);
  }
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * Private functions below
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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
exports.autopilot_update_or_create_contact = autopilot_update_or_create_contact;
