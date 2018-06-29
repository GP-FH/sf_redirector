/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * mw_verification_token_check.js: this middleware function checks all incoming requests for a valid
 * verification token/api token. No token, no access.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const verification_token_check = (req, res, next) => {
  if ( req.query.token == process.env.VERIFICATION_TOKEN ) {
    next();
  }else{
    res.status( 403 ).send();
  }
};

const internal_callback_api_check = (req, res, next) => {
  if ( req.query.token == "8oMUcp4iSkrHQ5563omj") { 
    next();
  }else{
    res.status( 403 ).send();
  }
}

exports.verification_token_check = verification_token_check;
exports.internal_callback_api_check = internal_callback_api_check;
