$(document).ready(() => {
  $( "#sub_search_input" ).submit((event) => {
    event.preventDefault();
    const data = $("#sub_search_input :input");

    for (let i = 0; i < 50; i++ ){
      $("#results").append(`<div class="col-lg-3 col-md-4 col-xs-6"><a href="#" class="d-block mb-4 h-100"><img class="img-fluid img-thumbnail" src="http://placehold.it/400x300" alt=""></a></div>`);
    }
  });
});
