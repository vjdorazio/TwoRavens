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
        if (data.response !== 'Query is valid.' || debug) {
            alert(data.response);
        }
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

// create the editor
var container = document.getElementById("subsetCustomEditor");
var options = {
    mode: 'code',
    modes: ['code', 'form', 'text', 'tree', 'view'],
    onError: function (err) {
        alert(err.toString());
    }
};
var editor = new JSONEditor(container, options);


editor.set(JSON.parse(sampleQuery));
