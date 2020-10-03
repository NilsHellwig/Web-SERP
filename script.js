// init result list
var resultList = document.querySelector(".result_list");
var radioButtons = document.getElementsByClassName("radioButtons");

from = 0;
amount = parseInt($("#amount").val());
resultListEval = [];
sessionAPs = [];
sessionRRs = [];
sessionnDcg = [];
sessionPrecision = [];
sessionFmeasure = [];

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

  let queryinfo = parseQuery(query);
  let fields = queryinfo.fields;

  /*
  {
    "query": queryActual,
    "fields": fields
  };
   */

   if(Object.keys(queryinfo.fields).length == 0) {
     // only  a query, no additional fields
      query_text = {
      "size": amountQuery,
      "from": fromQuery,
      "query": {
        "query_string": {
          "query": queryinfo.query,
//        "default_field": "content"
        }
      }
    }
   }else{

    /*
    
      fields["id"] = field.replace("id:", "");
      fields["content"] = field.replace("content:", "");
      fields["title"] = field.replace("mediatype:", "");
      fields["mediatype"] = field.replace("mediatype:", "");
      fields["source"] = field.replace("source:", "");
      fields["published"] = field.replace("published:", "");
    */

     //additional fields set, do some magic stuff
     query_text = {
       "query": {
         "bool": {
           "must": [],
           "should": []
         }
       }
     };
     var multi_match_fields = [];
     if(fields.hasOwnProperty("id")) {
       query_tex["query"]["bool"]["must"].push({
         "match": {
           "id": fields.id
         }
       });
     }else{
      query_text["query"]["bool"]["should"].push({
        "match": {
          "id": queryinfo.query
        }
      });
     }
     if(fields.hasOwnProperty("content")) {
      query_text["query"]["bool"]["must"].push({
        "match": {
          "content": fields.content
        }
      });
    }else{
      query_text["query"]["bool"]["should"].push({
        "match": {
          "content": queryinfo.query
        }
      });
    }
    if(fields.hasOwnProperty("title")) {
      query_text["query"]["bool"]["must"].push({
        "match": {
          "title": fields.title
        }
      });
    }else{
      query_text["query"]["bool"]["should"].push({
        "match": {
          "title": queryinfo.query
        }
      });
    }
    if(fields.hasOwnProperty("mediatype")) {
      query_text["query"]["bool"]["must"].push({
        "match": {
          "media-type": fields.mediatype
        }
      });
    }else{
      query_text["query"]["bool"]["should"].push({
        "match": {
          "media-type": queryinfo.query
        }
      });
    }
    if(fields.hasOwnProperty("source")) {
      query_text["query"]["bool"]["must"].push({
        "match": {
          "source": fields.source
        }
      });
    }else{
      query_text["query"]["bool"]["should"].push({
        "match": {
          "source": queryinfo.query
        }
      });
    }
    if(fields.hasOwnProperty("published" && isValidDate(fields.published))) {
      query_text["query"]["bool"]["must"].push({
        "match": {
          "published": fields.published
        }
      });
    }else{
      //ignore this
      
    }
   }
  
   return query_text;
/*  return query_text = {
    "size": amountQuery,
    "from": fromQuery,
    "query": {
      "multi_match": {
        "query": query,
        "fields": searchMode
      }
    }
  };
  */
}

function isValidDate(date_str) {
  return /\d\d\d\d-(\d\d-\d\d(T\d\d:\d\d:\d\d)?)?/.test(date_str)
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

    amount = parseInt($("#amount").val());
    fetchResultsAndDisplayThese(queryText);
  }
}

async function readCsv(event) {
  console.log("Evaluation has started, this can take a bit...");
  var topics = JSON.parse(event.target.result)["topics"];
  sessionAPs = [];
  sessionRRs = [];
  //handle topics
  for await (const topic of topics) {
   
    await handleTopic(topic)
  }

  console.log("Average f-measure: " + calculateAverageFMeasure());
  console.log("Average nDCG: " + calculateAveragenDcg());
  console.log("Average MRR: " + calculateMRR());
  console.log("Mean average Precision: " + calculateMAP());
  /*
  topics.forEach(async function(topic) {
    await handleTopic(topic).done;
  });
  */
}

function calculateAverageFMeasure(){
  return averageArray(sessionFmeasure);
}
function calculateAveragenDcg() {
  return averageArray(sessionnDcg);
}


async function handleTopic(topic) {
  let queries = topic["queries"];

  for await (const query of queries) {
    await handleEvaluation(query, topic);
  }
/*  queries.forEach(async function(query){
    await handleEvaluation(query, topic);
  });
*/
}

async function handleEvaluation(queries, topic) {
  let query = queries["query"];
  let fields = queries["fields"];
  
  var results = await fetchAllResults(query, fields);
  
  resultListEval = queries["relevantResults"].map(function(item){
    return item["queryId"];
  });
  
  console.log("=====================");
  console.log("=====================");
  console.log("%cEvaluating Topic: '" + topic["topic"] +"'", "color: red");

  console.log("%cCurrently evaluating: '" + query +"'", "color: red");
  console.log("%cCurrent query ID: '" + queries["id"] +"'", "color: red");
  
  //doOverallEvaluation(results);
  
  //doEvaluationAtK(results, 30);
  //evaluateDCGatK(results, 30);
  //evaluatenDCGatK(results, 30);
  let k = 30;
  doEvaluationAtK(results, k);
  let mrr = await evaluateMRRatK(results, k);
  let dcg = await evaluateDCGatK(results, k);
  let nDcg = await evaluatenDCGatK(results, k);
  sessionnDcg.push(nDcg);
  console.log("Mean reciprocal Rank at " + k + ": " + mrr);
  console.log("Discounted cumulative Gain at " + k + ": " + dcg);
  console.log("Normalized discouted cumulative Gain at " + k + ": " + nDcg);
  return true;
}

async function evaluateDCGatK(results, k) {
  var dcg = 0;
  let hits = results.hits.hits;
  for(var i = 0; i<hits.length; i++) {
    if(i == k) {
      break;
    }
    let hitId = hits[i]._source.id;

    let relevance = resultListEval.includes(hitId) | 0;//binary, so we just take if it is relevant or not
    let dividend = Math.pow(2, relevance) - 1;
    let divisor = Math.log(i+1+1); //i+1 to start from 1, using ln just like mentioned in croft et al
    dcg += dividend/divisor;

  }
  return dcg;
}

async function evaluatenDCGatK(results, k) {
  let dcgAtK = await evaluateDCGatK(results, k);
  let idealDCG = generateIdealDCGatK(k, resultListEval.length);
  return dcgAtK/idealDCG;
}

function generateIdealDCGatK(k, relevantAmount) {
  let sum = 0;

  for(var i = 0; i<k; i++){
    let relevance =  (i<relevantAmount)|0;
    let dividend = Math.pow(2, relevance) - 1;
    let divisor = Math.log(i+1+1); //i+1 to start from 1
    sum += dividend/divisor;
  }
  return sum;
}

async function evaluateMRRatK(results, k) {
  let hits = results.hits.hits;
  //default if nothing is found
  var rr = 0;
  for(var i = 1; i<=hits.length; i++) {
    if(i == k+1) {
      break;
    }
    
    let hitId = hits[i-1]._source.id;
    if(resultListEval.includes(hitId)){
      rr = 1/i;
      break;
    }
  }
  sessionRRs.push(rr);
  return rr;
}

function doEvaluationAtK(results, k) {
  console.log("=====================");
  console.log("%cEvaluation at " + k, "color: blue");
  let hits = results.hits.hits;
//  let totalRelevantItems = resultListEval.length;
  let totalRelevantItems = k;
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

  sessionPrecision.push(precision);
  sessionFmeasure.push(calculateFMeasure(precision, recall, 1));


  var prAtK = calculatePRAtAllK(results, k);
  var averagePrecision = calculateAveragePrecision(prAtK);
  sessionAPs.push(averagePrecision);
  console.log("Relevant items: " + totalRelevantItems);
  console.log("total found items: " + k);
  console.log("TP: " + tpCount);
  console.log("FP: " + fpCount);
  console.log("Precision at " + k + ": " + precision);
  console.log("Recall at " + k + ": " + recall);  
  console.log("F-Measure at " + k + ": " + calculateFMeasure(precision, recall, 1));
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

function calculatePRAtAllK(results, k = -1) {
  let hits = results.hits.hits;
  let totalRelevantItems = resultListEval.length;
  var tpCount = 0;
  var fpCount = 0;
  var precisionsAtK = []
  var recallsAtK = []
  if(k == -1){
    k = Infinity;
  }
  for(var i = 0; i<hits.length; i++) {
    if (i == k) {
      break;
    }
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
  var lastRecall = 0;
  var pAtKs = [];

  for(var i = 0; i<prAtK.precision.length; i++) {
    if(prAtK.recall[i] > lastRecall) {
      //recall goes up, take that P@K-value
      pAtKs.push(prAtK.precision[i]);
    }
    lastRecall = prAtK.recall[i];
  }
  return averageArray(pAtKs);
}

function calculateMAP(){
  return averageArray(sessionAPs);
}

function calculateMRR() {
  return averageArray(sessionRRs);
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

function parseQuery(queryString) {
  console.log(queryString);
  let exploded = queryString.replaceAll(/\s(id:|content:|title:|mediatype:|source:|published:)/g, "|||||$1").split("|||||");

  let queryActual = exploded[0];
  var fields = {};

  for(var i = 1; i<exploded.length; i++) {
    let field =  exploded[i];
   
    if(field.startsWith("id:")) {
      fields["id"] = field.replace("id:", "");
    }
    if(field.startsWith("content:")) {
      fields["content"] = field.replace("content:", "");
    }
    if(field.startsWith("title:")) {
      fields["title"] = field.replace("title:", "");
    }
    if(field.startsWith("mediatype:")) {
      fields["mediatype"] = field.replace("mediatype:", "");
    }
    if(field.startsWith("source:")) {
      fields["source"] = field.replace("source:", "");
    }
    if(field.startsWith("published:")) {
      fields["published"] = field.replace("published:", "");
    }
    
  }

  return {
    "query": queryActual,
    "fields": fields
  };

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

function handleKeyEnter(e) {
  if(e.keyCode === 13){
      e.preventDefault(); // Ensure it is only this code that rusn
      doSearch();
  }
}