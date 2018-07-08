$(document).ready(() => {
  $( "#sub_search_input" ).submit((event) => {
    event.preventDefault();
    const data = $("#sub_search_input :input");

    for (let i = 0; i < 50; i++ ){
      $("#results").append(`<div class="col-lg-3 col-md-4 col-xs-6"><a href="#" class="d-block mb-4 h-100"><figure class="figure"><img class="figure-img img-fluid img-thumbnail" src="https://d1yx6mil86g02p.cloudfront.net/uploads/variant_image/image/16709483/medium_RYU-SFX-Sae.jpg" alt=""><figcaption class="figure-caption">[SKU]: [BRAND] [PRODUCT_NAME] [COLOUR] [SIZE]</figcaption></figure></a></div>`);
    }
  });
});
