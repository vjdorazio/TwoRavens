function validateCustom(text, debug=false) {

    try {
        JSON.stringify(text);
    } catch (e) {
        if (debug) {
            alert(e);
        }
        return false;
    }

    function callbackValidate(data) {
        if (data.response !== 'Query is valid.' || debug) {
            alert(data.response);
        }
    }

    // Check if query is compatible with API
    let post = {
        'subsets': JSON.stringify(text).replace(/\s/g,''),
        'dataset': dataset,
        'type': 'validate'
    };

    makeCorsRequest(subsetURL, post, callbackValidate);
    return true;
}
