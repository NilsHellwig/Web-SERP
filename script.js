// init result list
var resultList = document.querySelector(".result_list");
var radioButtons = document.getElementsByClassName("radioButtons");

from = 0;
amount = parseInt($("#amount").val());
resultListEval = [];
sessionAPs = [];

function createResultListElement(title, id, mediaType, source, published, content) {
  newResultElement = document.createElement("div");
  newResultElement.setAttribute("class", "result");
  resultList.append(newResultElement);
  resultTileElement = document.createElement("h6");
  resultTileElement.setAttribute("class", "result-title");
  resultIdElement = document.createElement("h3");
  resultIdElement.setAttribute("class", "result-id");
  resultMediaTypeElement = document.createElement("h3");
  resultMediaTypeElement.setAttribute("class", "result-media-type");
  resultSourceElement = document.createElement("h5");
  resultSourceElement.setAttribute("class", "result-source");
  resultPublishedElement = document.createElement("h5");
  resultPublishedElement.setAttribute("class", "result-published");
  showContentElement = document.createElement("h3");
  showContentElement.setAttribute("class", "result-content-link");
  showContentElement.innerHTML = "Show content...";
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
  newResultElement.append(showContentElement);
  waitForFullContentView(content, newResultElement, showContentElement, resultPublishedElement);
}

function waitForFullContentView(content, newResultElement, showContentElement, resultPublishedElement) {
  let fullViewOpened = false;
  let contentElement;
  showContentElement.addEventListener("click", function() {
    if (fullViewOpened === true) {
      fullViewOpened = false;
      showContentElement.innerHTML = "Show content..."
      contentElement.remove();
    } else {
      fullViewOpened = true;
      contentElement = document.createElement("h3");
      contentElement.setAttribute("class", "result-content");
      contentElement.innerHTML = content;
      resultPublishedElement.append(contentElement);
      showContentElement.innerHTML = "Close content..."
    }
  });
}

function getInputFromSearchBar() {
  searchBar = document.getElementById("input");
  return searchBar.value;
}

function createResults(hits) {
  console.log("Amount of Hits: ", hits.length);
  resultList.innerHTML = "";
  hits.forEach((hit, i) => {
    let source = hit._source;
    createResultListElement(source.title, source.id, source["media-type"], source.source, source.published, source.content)
  });
}

function getQueryText(searchMode, query, fromOverride, amountOverride) {
  let fromQuery = from;
  let amountQuery = amount;
  if(typeof(fromOverride) !== 'undefined') {
    fromQuery = fromOverride;
  }
  if(typeof(amountOverride) !== 'undefined') {
    amountQuery = amountOverride;
  }

  return query_text = {
    "size": amountQuery,
    "from": fromQuery,
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

function getSelectedSearchMode(forceAll) {
  var forceAdd = false;
  if(typeof(forceAll) !== 'undefined') {
    forceAdd = forceAll;
  }
  let selectedFields = []
  radioButtons = document.querySelectorAll("input.search-mode");
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked == true || forceAdd) {
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
  var resultsTo = Math.min(from + amount, totalResults);
  $("#amountInfo").text("showing results " + resultsFrom + " to " + resultsTo + " out of " + totalResults);
  var currentPage = Math.floor(from / amount);
  var maxPages = Math.ceil(totalResults / amount);
  for (var i = 0; i < maxPages; i++) {
    //make sure pagination is only shown for first 2 items, then for the surrounding 2 of current i and maybe last one
    if (i == 0 || i == 1 || (i >= (currentPage - 2) && i <= (currentPage + 2)) || i == (maxPages - 1)) {
      $("#pagination").append("<span class='pagination-item " + ((i == currentPage) ? "active" : "") + "' data-num='" + i + "'>" + (i + 1) + "</span>");
    }
    if ((i == (currentPage - 3) || i == (currentPage + 3))) {
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

function readCsv(event) {
  var rows = event.target.result.split("\n");
  var query;
  var fieldArr = [];
  for (var i = 0; i < rows.length; i++) {
    if(i == 0) {
      //read query
      query = rows[i].trim();
      continue;
    }
    if(i == 1) {
      //read fields
      fieldArr = rows[i].trim().split(",");
      continue;
    }
    resultListEval.push(rows[i].trim());
  }

  handleEvaluation(query, fieldArr);

}

async function handleEvaluation(query, fields) {
  var results = await fetchAllResults(query, fields);
  console.log("=====================");
  console.log("=====================");
  console.log("%cCurrently evaluating: '" + query +"'", "color: red");
  
  doOverallEvaluation(results);
  doEvaluationAtK(results, 10);
  doEvaluationAtK(results, 20);
  doEvaluationAtK(results, 30);

}

function doEvaluationAtK(results, k) {
  console.log("=====================");
  console.log("=====================");
  console.log("%cEvaluation at " + k, "color: blue");
  let hits = results.hits.hits;
  let totalRelevantItems = resultListEval.length;
  let totalFoundItems = hits.length;
  var tpCount = 0;
  var fpCount = 0;
  for(var i = 0; i<hits.length; i++) {
    if(i == k){
      break;
    }
    let hitId = hits[i]._source.id;
    if(resultListEval.includes(hitId)){
      tpCount++;
    }else{
      fpCount++;
    }
  }
  var fnCount = totalRelevantItems - tpCount
  let precision = tpCount / (tpCount + fpCount);
  let recall = tpCount / (tpCount + fnCount);

  console.log("Relevant items: " + totalRelevantItems);
  console.log("total found items: " + k);
  console.log("TP: " + tpCount);
  console.log("FP: " + fpCount);
  console.log("Precision at "+k+": " + precision);
  console.log("Recall: at "+k+": " + recall);  
  console.log("F-Measure: " + calculateFMeasure(precision, recall, 1));
}

function doOverallEvaluation(results) {
  console.log("=====================");
  console.log("=====================");
  console.log("%cOverall: ", "color: blue");
  let hits = results.hits.hits;
  let totalRelevantItems = resultListEval.length;
  let totalFoundItems = hits.length;
  var tpCount = 0;
  var fpCount = 0;
  for(var i = 0; i<hits.length; i++) {
    let hitId = hits[i]._source.id;
    if(resultListEval.includes(hitId)){
      tpCount++;
    }else{
      fpCount++;
    }
  }
  var fnCount = totalRelevantItems - tpCount
  let precision = tpCount / (tpCount + fpCount);
  if(isNaN(precision)) {
    precision = 0;
  }
  let recall = tpCount / (tpCount + fnCount);

  console.log("Relevant items: " + totalRelevantItems);
  console.log("total found items: " + totalFoundItems);
  console.log("TP: " + tpCount);
  console.log("FP: " + fpCount);
  console.log("Precision: " + precision);
  console.log("Recall: " + recall);  
  console.log("F-Measure: " + calculateFMeasure(precision, recall, 1)); 

  var prAtKs = calculatePRAtAllK(results);
  var averagePrecision = calculateAveragePrecision(prAtKs);
  sessionAPs.push(averagePrecision);
  console.log("Average Precision: " + averagePrecision);
  console.log("mAP so far: " + calculateMAP());
}

function calculateFMeasure(precision, recall, beta) {
  //avoid NaN
  if(precision == 0 || recall == 0){
    return 0;
  }
  return ((beta*beta+1) * precision * recall) / (beta*beta*precision + recall)
}

function calculatePRAtAllK(results) {
  let hits = results.hits.hits;
  let totalRelevantItems = resultListEval.length;
  var tpCount = 0;
  var fpCount = 0;
  var precisionsAtK = []
  var recallsAtK = []
  for(var i = 0; i<hits.length; i++) {
    let hitId = hits[i]._source.id;
    if(resultListEval.includes(hitId)){
      tpCount++;
    }else{
      fpCount++;
    }
    precisionsAtK[i] = tpCount / (i+1);
    recallsAtK[i] = tpCount / totalRelevantItems;
  }
  return {
    "precision": precisionsAtK,
    "recall": recallsAtK
  };

}

function calculateAveragePrecision(prAtK) {
  var lastPrecision = 0;
  var pAtKs = [];
  for(var i = 0; i<prAtK.precision.length; i++) {
    if(prAtK.precision[i] > lastPrecision) {
      //precision goes up, take that P@K-value
      pAtKs.push(prAtK.recall[i]);
    }
    lastPrecision = prAtK.precision[i];
  }
  return averageArray(pAtKs);
}

function calculateMAP(){
  return averageArray(sessionAPs);
}

async function fetchAllResults(query, fields){
  let queryText = getQueryText(fields, query, 0, 10000);
  const result = await handleAjaxAsync({
    url: "http://localhost:9200/newsarticles/_search",
    type: "GET",
    dataType: "json",
    contentType: "application/json",
    crossDomain: true,
    data: {
      source: JSON.stringify(queryText),
      source_content_type: "application/json"
    }
  });

  return result;
}

function averageArray(arr) {
  if(arr.length == 0){
    return 0;
  }
  var total = 0;
  for(var i = 0; i < arr.length; i++) {
      total += arr[i];
  }
  return total / arr.length;
}

async function handleAjaxAsync(data) {
  try {
    const res = await $.ajax(data);
    return res;
  } catch (error) {
    console.log(error);
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

  $("#evaluate").click(function () {
    var fileUpload = document.getElementById("evaluationInput");
    
    
    for(var i = 0; i<fileUpload.files.length;i++) {
      var reader = new FileReader();  
      reader.onload = readCsv;
      reader.readAsText(fileUpload.files[i]);
    }
    
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
