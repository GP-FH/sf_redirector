/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * This route handles DO Load Balancer health checks
 * For settings see sf-lb-001 load balancer in DigitalOcean
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const express = require("express");
const router = express.Router();

router.get( '/', async function ( req, res, next) {
  res.status( 200 ).send();
});

module.exports = router;  
