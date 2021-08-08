const diff_match_patch = require('diff-match-patch')

function getFirstTimestamp (data) {
    const re = /\d{14}/;
    if (re.test(data)) {
        return data.match(re)[0];
    } else {
        return ""
    }
}
function pageDiffs(headline, page_body, archive_data) {
    const diff_data = {
        headline: '',
        body: [],
        archive_url: archive_data.url
    };
    const dmp = new diff_match_patch();

    let a = dmp.diff_linesToChars_(headline, archive_data.headline);
    let lineText1 = a.chars1;
    let lineText2 = a.chars2;
    let lineArray = a.lineArray;
    let headline_diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(headline_diffs, lineArray);
    dmp.diff_cleanupSemantic(headline_diffs);
    diff_data.headline = dmp.diff_prettyHtml(headline_diffs);

    // let headline_diffs = dmp.diff_main(headline, archive_data.headline);
    // dmp.diff_cleanupSemantic(headline_diffs);
    // diff_data.headline = dmp.diff_prettyHtml(headline_diffs);


    for (let i = 0; i < page_body.length; i++) {
        let a = dmp.diff_linesToChars_(archive_data.body[i], page_body[i]);
        let lineText1 = a.chars1;
        let lineText2 = a.chars2;
        let lineArray = a.lineArray;
        let body_diffs = dmp.diff_main(lineText1, lineText2, false);
        dmp.diff_charsToLines_(body_diffs, lineArray);
        dmp.diff_cleanupSemantic(body_diffs);
        diff_data.body[i] = dmp.diff_prettyHtml(body_diffs);
        // let body_diffs = dmp.diff_main(archive_data.body[i], page_body[i]);
        // dmp.diff_cleanupSemantic(body_diffs);
        // diff_data.body[i] = dmp.diff_prettyHtml(body_diffs);
    }
    return diff_data
}

this['getFirstTimestamp'] = getFirstTimestamp;
this['pageDiffs'] = pageDiffs;
