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
// createResultListElement("Title", "ID", "Media Type", "Source", "Published");

// getSelectedSearchMode is a method to see which radio button is selected
getSelectedSearchMode();

// getInputFromSearchBar is a method to get the entered text from the search bar.
getInputFromSearchBar();

// this event listener is waiting for the user to click on the search button

searchButton = document.getElementById("send_query");
searchButton.addEventListener("click", function() {
  console.log("search button clicked");
});
