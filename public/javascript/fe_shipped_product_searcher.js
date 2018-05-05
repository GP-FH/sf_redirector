const logger = require("../../libs/lib_logger");

function sps_check(){
  logger.info(`hit sps_check client js function: ${document.getElementById("email_sku_check_form")}`);
}

function sps_get(){
  logger.info(`hit sps_get client js function: ${document.getElementById("email_get_form")}`);
}
