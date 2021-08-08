const express = require('express')
const cors = require('cors')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const utils = require('./utils')

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`))

const archivePrefix = "https://web.archive.org/web/"
const timeMapPrefix = "https://web.archive.org/web/timemap/"

app.post('/', (req, res) => {

    const url = req.body.url;
    const page_body = req.body.body;

    const headline = req.body.headline;

    let archive_data = {
        url: "",
        headline: "",
        body: []
    }
    // console.log(url);

    fetch(timeMapPrefix + url)
        .then((r) => r.text())
        .then((data) => {
            // console.log(data)
            timestamp = utils.getFirstTimestamp(data)

            if (timestamp) {
                let archiveUrl = archivePrefix + timestamp + '/' + url;
                archive_data.url = archiveUrl;
                return archiveUrl;
            } else {
                return null
            }
        })
        .then((archive) => {
            if (!archive) {
                console.log("No archive exists for this page")
                res.send({
                    message: "archive not found",
                    body: null
                })
            }

            // if (req.body.paywall) {
            //     res.send({
            //         message: 'paywall',
            //         body: archive
            //     })
            // }

            archive_data.archive_url = archive;
            fetch(archive)
                .then((r) => r.text())
                .then((data) => {

                    const $ = cheerio.load(data);

                    archive_data.headline = $('h1').text();

                    if (url.match(/www\.cnn\.com/)) {
                        $('.zn-body__paragraph').each(function (i, elm) {
                            archive_data.body[i] = $(this).text();
                        });
                        $('p.paragraph').each(function (i, elm) {
                            archive_data.body[i] = $(this).text();
                        });
                    } else {
                        $('p').each(function (i, elm) {
                            archive_data.body[i] = $(this).text();
                        });

                    }

                    while (archive_data.body.length < page_body.length) {
                        archive_data.body.push(" ")
                    };

                    while (archive_data.body.length < page_body.length) {
                        archive_data.body.push(" ")
                    };

                    const diff_data = utils.pageDiffs(headline, page_body, archive_data);

                    res.send({
                        message: 'success',
                        archiveUrl: archive_data.url,
                        body: diff_data
                    });
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
});