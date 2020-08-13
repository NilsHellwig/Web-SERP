// init result list
resultList = document.querySelector(".result_list");

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

function getSelectedSearchMode() {
  radioButtons = document.querySelectorAll("input");
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked == true) {
      return radioButtons[i].id;
    }
  }
  return null;
}

function getInputFromSearchBar() {
  searchBar = document.getElementById("input");
  return searchBar.value;
}

// createResultListElement is a method that will create an element for a document in the result list
// createResultListElement("23 Neue Corona-Fälle in Köln", 232323929, "Gesundheit", "NZZ", "27.07.2020");


// this event listener is waiting for the user to click on the search button

function getQueryText(searchMode, query) {
  return query_text = {
    "size": 10000,
    "query": {
      "match": {
        [searchMode]: query,
      }
    }
  };
}

function createResults(hits) {
  resultList.innerHTML = "";
  hits.forEach((hit, i) => {
    let source = hit._source;
    createResultListElement(source.title, source.id, source["media-type"], source.source, source.published)
  });
}

function fetchResultsAndDisplayThese(queryText) {
  // Fetching
  /*
  Add This to elasticsearch.yml:
  http.cors.enabled: true
  http.cors.allow-origin: /https?:\/\/(localhost)?(127.0.0.1)?(:[0-9]+)?/
  */
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
    },
    error: function(result) {
      console.log("ERROR");
    },

  });
}

searchButton = document.getElementById("send_query");
searchButton.addEventListener("click", function() {
  if (getSelectedSearchMode() !== null) {
    let queryText = getQueryText(getSelectedSearchMode(), getInputFromSearchBar());
    fetchResultsAndDisplayThese(queryText);
  }
});
