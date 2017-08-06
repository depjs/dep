const url = require('./index')
const assert = require('assert')

// console.log('https://www.github.com/ : host `github` =>', url('https://www.github.com/').host === 'github');
// console.log('www.twitter.com : domain `twitter.com` =>', url('www.twitter.com').domain === 'twitter.com');
// console.log('twitter.com : subdomain `null` =>', url('twitter.com').subdomain === null);
// console.log('www.twitter.com : subdomain `www` =>', url('www.twitter.com').subdomain === null);

console.log(url('urbanhire.com/id/company/convergence-ventures/572048e71173d1ec2e7eafe9'))
console.log(url('www.github.com?utm_source=urbanhire.com'))
console.log(url('id.indeed.com'))
console.log(url('trovit.co.id'))
console.log(url({}))
