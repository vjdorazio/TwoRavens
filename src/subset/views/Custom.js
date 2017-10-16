function validateCustom(text, debug=false) {
    try {
        JSON.parse(text);
    } catch (e) {
        if (debug) {
            alert(e);
        }
        return e;
    }

    function callbackValidate(data) {
        alert(data.response);
    }

    if (debug) {
        // Check if query is compatible with API
        let post = {
            'subsets': text.replace(/\s/g,''),
            'type': 'validate'
        };

        makeCorsRequest(subsetURL, post, callbackValidate);
    }
    return true;
}
