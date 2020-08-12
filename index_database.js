const {
  Client
} = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://localhost:9200'
})

// callback API
/* client.search({
  index: 'root_db',
  body: {
    query: {
      match: {
        name: 'Henry IV'
      }
    }
  }
}, (err, result) => {
  console.log(result.body.hits.hits[0]._source);
  if (err) console.log(err)
}) */

client.index({
  index: 'root_db',
  // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
  body: {
    name: 'Henry IV',
    quote: 'hello world'
  }
})
