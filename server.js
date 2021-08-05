const express = require('express')
const cors = require('cors')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const diff_match_patch = require('diff-match-patch')

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`))

const archivePrefix = "https://web.archive.org/web/"
const timeMapPrefix = "https://web.archive.org/web/timemap/"

const getFirstTimestamp = (data) => {
    const re = /\d{14}/;
    if (re.test(data)) {
        return data.match(re)[0];
    } else {
        return ""
    }
}

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
            timestamp = getFirstTimestamp(data)

            if (timestamp) {
                let archiveUrl = archivePrefix + getFirstTimestamp(data) + '/' + url;
                archive_data.url = archiveUrl;
                return archiveUrl;
            } else {
                return null
            }
        })
        .then((archive) => {
            if (!archive) {
                console.log("No archive exists for this page")
                res.send({ message: "No archive exists for this page" })
            }
            console.log(archive);
            fetch(archive)
                .then((r) => r.text())
                .then((data) => {

                    const $ = cheerio.load(data);

                    archive_data.headline = $('h1').text();

                    if (url.match(/www\.cnn\.com/)) {
                        $('p').each(function (i, elm) {
                            archive_data.body[i] = $(this).text();
                        })
                    } else {
                        $('.zn-body__paragraph').each(function (i, elm) {
                            archive_data.body[i] = $(this).text();
                        })

                    }

                    console.log(req.body.headline)
                    console.log(`Paragraphs in current article: ${page_body.length}`)
                    console.log(`Paragraphs in archived article: ${archive_data.body.length}`)

                    if (page_body.length < archive_data.body.length) {
                        res.send({ message: "The page you're viewing may be behind a paywall. Would you like to load an archived copy?" })
                    } else {

                        while (archive_data.body.length < page_body.length) {
                            archive_data.body.push(" ")
                        };

                        console.log(archive_data.body.length);
                        console.log(page_body.length);

                        const diff_data = {
                            headline: '',
                            body: []
                        }
                        const dmp = new diff_match_patch();

                        let headline_diffs = dmp.diff_main(archive_data.headline, headline );
                        dmp.diff_cleanupSemantic(headline_diffs);
                        diff_data.headline = dmp.diff_prettyHtml(headline_diffs);

                        for (let i = 0; i < page_body.length; i++) {
                            let body_diffs = dmp.diff_main(archive_data.body[i], page_body[i]);
                            dmp.diff_cleanupSemantic(body_diffs);
                            diff_data.body[i] = dmp.diff_prettyHtml(body_diffs);
                        }
                        console.log(diff_data);
                        res.send(diff_data);

                    }


                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))

});