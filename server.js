const express = require('express')
const Nightmare = require("nightmare");
const moment = require('moment')
const app = express()
const server = require('https').Server(app)
var bodyParser = require('body-parser')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
    let body = '<form method="post">'
    body = body + 'user<input type="text" name="user" /> <br>'
    body = body + 'password<input type="password" name="password" /> <br>'
    body = body + 'month<select name="month">'
    for (let i = 1; i < 12; i++) {
        body = body + '<option value="'+i+'">'+i+'</option>'
    }
    body = body + '</select><br>'
    body = body + '<button type="submit"> send </button>'
    body = body + '</form>'
    res.send(body)
})
app.post('/', (req, res) => {
    let month = req.body.month
    if (month !== undefined && month.length > 0) {
        const Nightmare = require('nightmare')
        const nightmare = Nightmare({show: false})
        nightmare
            .goto('https://app.rework.nl/sign_in')
            .type('#account_email', req.body.user)
            .type('#account_password', req.body.password)
            .click('input.control__button')
            .wait('li[data-role=prinav_calendar] > a')
            .click('li[data-role=prinav_calendar] > a')
            .evaluate((month) => {
                return new Promise((resolve, reject) => {
                    let date = new Date(new Date().getFullYear(), parseInt(month)-1, 1);
                    let param = window.location.pathname;
                    let start = moment(date).format('YYYY-MM-DD')
                    let end = moment(new Date(date.setMonth(date.getMonth()+1))).format('YYYY-MM-DD');
                    $.ajax({
                        url: "https://app.rework.nl/" + param + "/slots?start=" + start + "&end=" + end + "&_=1641376170730",
                        type: "GET",
                    })
                        .then(response => {
                            resolve(response)
                        })
                })
            }, month)
            .end()
            .then(response => {
                let calendar = response;
                let summary = {}
                let holidays = {}
                let rule = ''
                calendar.forEach(item => {
                    if (item.user_name) {
                        rule = '';
                        if (summary[item.user_name] === undefined) summary[item.user_name] = []
                        if (item.rule !== null && item.rule.freq !== undefined) rule = item.rule.freq
                        summary[item.user_name].push(
                            {
                                "start": item.start,
                                "end": item.end,
                                "allDay": item.allDay,
                                "rule": rule
                            }
                        )
                    } else {
                        if (holidays[item.title] === undefined) holidays[item.title] = []
                        holidays[item.title].push(
                            {
                                "start": item.start,
                                "end": item.end,
                                "allDay": item.allDay
                            }
                        )
                    }
                })

                res.send(JSON.stringify({
                    summary: summary,
                    holidays: holidays
                }));
            })
            .catch(error => {
                console.error('Search failed:', error)
            })
    } else {
        res.send('Month missing [host]?month=01');
    }
})

server.listen(process.env.PORT || 3035);