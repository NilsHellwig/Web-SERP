// init result list
var resultList = document.querySelector(".result_list");
var radioButtons = document.getElementsByClassName("radioButtons");

from = 0;
amount = parseInt($("#amount").val());



function createResultListElement(title, id, mediaType, source, published) {
  newResultElement = document.createElement("div");
  newResultElement.setAttribute("class", "result");
  resultList.append(newResultElement);
  resultTileElement = document.createElement("h2");
  resultTileElement.setAttribute("class", "result-title");
  resultIdElement = document.createElement("h3");
  resultIdElement.setAttribute("class", "result-id");
  resultMediaTypeElement = document.createElement("h3");
  resultMediaTypeElement.setAttribute("class", "result-media-type");
  resultSourceElement = document.createElement("h5");
  resultSourceElement.setAttribute("class", "result-source");
  resultPublishedElement = document.createElement("h5");
  resultPublishedElement.setAttribute("class", "result-published");
  resultTileElement.innerHTML = title;
  resultIdElement.innerHTML = "ID: " + id;
  resultMediaTypeElement.innerHTML = mediaType;
  resultSourceElement.innerHTML = source;
  resultPublishedElement.innerHTML = published;
  newResultElement.append(resultTileElement);
  newResultElement.append(resultIdElement);
  newResultElement.append(resultMediaTypeElement);
  newResultElement.append(resultSourceElement);
  newResultElement.append(resultPublishedElement);
}

function getInputFromSearchBar() {
  searchBar = document.getElementById("input");
  return searchBar.value;
}

function createResults(hits) {
  resultList.innerHTML = "";
  hits.forEach((hit, i) => {
    let source = hit._source;
    createResultListElement(source.title, source.id, source["media-type"], source.source, source.published)
  });
}

function getQueryText(searchMode, query) {
  return query_text = {
    "size": amount + from,
    "from": from,
    "query": {
      "multi_match": {
        "query": query,
        "fields": searchMode
      }
    }
  };
}

function fetchResultsAndDisplayThese(queryText) {
  // Fetching
  /*
  Add This to elasticsearch.yml:
  http.cors.enabled: true
  http.cors.allow-origin: /https?:\/\/(localhost)?(127.0.0.1)?(:[0-9]+)?/
  */
  //console.log(queryText);
  $.ajax({
    url: "http://localhost:9200/newsarticles/_search",
    type: "GET",
    dataType: "json",
    contentType: "application/json",
    crossDomain: true,
    data: {
      source: JSON.stringify(queryText),
      source_content_type: "application/json"
    },
    success: function(result) {
      let hits = result.hits.hits;

      createResults(hits);
      buildPagination(result);
    },
    error: function(result) {
      console.log("ERROR");
    },

  });
}

function getSelectedSearchMode() {
  let selectedFields = []
  radioButtons = document.querySelectorAll("input");
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked == true) {
      selectedFields.push(radioButtons[i].id);
    }
  }
  if (selectedFields.length === 0) {
    return null;
  }
  return selectedFields;
}

function buildPagination(result) {

  $(".pagination-item").remove();
  $(".pagination-spacing").remove();

  var totalResults = result.hits.total.value;
  var resultsFrom = from + 1;
  var resultsTo = Math.min(from + amount, totalResults) ;
  $("#amountInfo").text("showing results " + resultsFrom + " to " + resultsTo + " out of " +totalResults);
  var currentPage = Math.floor(from/amount);
  var maxPages = Math.ceil(totalResults/amount);
  for(var i = 0; i<maxPages; i++){
    //make sure pagination is only shown for first 2 items, then for the surrounding 2 of current i and maybe last one
    if(i == 0 || i == 1 || ( i>= (currentPage-2) && i<= (currentPage+2)) || i == (maxPages-1)){
      $("#pagination").append("<span class='pagination-item " + ((i == currentPage) ? "active" : "") + "' data-num='"+i+"'>"+(i+1)+"</span>");
    }
    if(( i == (currentPage-3) || i == (currentPage+3))){
      $("#pagination").append("<span class='pagination-spacing'>...</span>");
    }
    
  }
}

function doSearch() {
  if (getSelectedSearchMode() !== null) {
    from = 0;
    let queryText = getQueryText(getSelectedSearchMode(), getInputFromSearchBar());
    //console.log(queryText);
    
    amount = parseInt($("#amount").val());
    fetchResultsAndDisplayThese(queryText);
  }
}

$(document).ready(function() {
  // this event listener is waiting for the user to click on the search button
  searchButton = document.getElementById("send_query");
  searchButton.addEventListener("click", function() {
    doSearch();
  });

  $("#amount").change(function() {
    amount = parseInt($(this).val());
    from = 0;
    doSearch();
  });

  $(document).on("click", ".pagination-item", function() {
   
    from = parseInt($(this).data("num")) * amount;

    let queryText = getQueryText(getSelectedSearchMode(), getInputFromSearchBar());
    fetchResultsAndDisplayThese(queryText)
    $('html, body').animate({
        scrollTop: $(".result_list").offset().top
    }, 200);

  });

});
