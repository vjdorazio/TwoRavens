let production = false;

let rappURL = '';
if (!production) {
    // base URL for the R apps:
    rappURL = "http://localhost:8000/custom/";
} else {
    rappURL = "https://beta.dataverse.org/custom/"; //this will change when/if the production host changes
}

// note that .textContent is the new way to write text to a div
$('#about div.panel-body').text('TwoRavens v0.1 "Dallas" -- The Norse god Odin had two talking ravens as advisors, who would fly out into the world and report back all they observed.  In the Norse, their names were "Thought" and "Memory".  In our coming release, our thought-raven automatically advises on statistical model selection, while our memory-raven accumulates previous statistical models from Dataverse, to provide cumulative guidance and meta-analysis.');
//This is the first public release of a new, interactive Web application to explore data, view descriptive statistics, and estimate statistical models.";

let subsetURL = rappURL + 'eventdataapp';
let query = {'subsets': {}, 'variables': {'Source': 1}};
let response = {'subsets': {}, 'variables': {}};

let variables = {};
let variablesSelected = {};

let subsetKeys = ["Date", "Location", "Action", "Actor"]; // Used to label buttons in the left panel

// Initial load of preprocessed data
makeCorsRequest(subsetURL, query, pageSetup);

function makeCorsRequest(url, post, callback) {
    let xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open('POST', url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open('POST', url);
    } else {
        // CORS not supported.
        xhr = null;
    }
    xhr.setRequestHeader('Content-Type', 'text/json');

    if (!xhr) {
        alert('CORS not supported');
        return;
    }

    xhr.onload = function () {
        let text = xhr.responseText;

        try {
            let json = JSON.parse(text);
            let names = Object.keys(json);


            if (names[0] === "warning") {
                alert("Warning: " + json.warning);
            } else {
                callback(json);
            }
        }
        catch (err) {
            estimateLadda.stop();
            selectLadda.stop();
            alert('Error: Could not parse incoming JSON.');
        }
    };

    xhr.onerror = function () {
        // note: xhr.readystate should be 4, and status should be 200.
        if (xhr.status == 0) {
            // occurs when the url becomes too large
            alert('There was an error making the request. xmlhttprequest status is 0.');
        }
        else if (xhr.readyState != 4) {
            alert('There was an error making the request. xmlhttprequest readystate is not 4.');
        }
        else {
            alert('There was an error making the request.');
        }
    };
    xhr.send('solaJSON='+ JSON.stringify(post));
}

function pageSetup(jsondata) {
    console.log(jsondata);

    d3.select("#variableList").selectAll("p")
        .data(jsondata['variables'])
        .enter()
        .append("p")
        .attr("id", function (d) {
            return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
        }) // perhapse ensure this id is unique by adding '_' to the front?
        .text(function (d) {return d;})
        .style('background-color', hexToRgba(varColor))
        .attr("data-container", "body")
        .attr("data-toggle", "popover")
        .attr("data-trigger", "hover")
        .attr("data-placement", "right")
        .attr("data-viewport", "{selector: '#body', padding: '62px'}")
        .attr("data-html", "true")
        .attr("onmouseover", "$(this).popover('toggle');")
        .attr("onmouseout", "$(this).popover('toggle');")
        .attr("data-original-title", "Summary Statistics")
        .on("click", function () {
            d3.select(this)
                .style('background-color', function (d) {
                    zparams.zvars = [];
                    let text = d3.select(this).text();
                    if (d3.rgb(d3.select(this).style('background-color')).toString().replace(/\s/g, '') == hexToRgba(varColor)) { // we are adding a var
                        nodes.push(findNode(text));
                        if (nodes.length == 0) nodes[0].reflexive = true;

                        return hexToRgba(selVarColor);
                    } else {
                        // dropping a variable
                        nodes.splice(findNode(text).index, 1);
                        spliceLinksForNode(findNode(text));
                        splice(text, [dvColor, 'zdv'], [csColor, 'zcross'], [timeColor, 'ztime'], [nomColor, 'znom']);
                        nodeReset(allNodes[findNodeIndex(text)]);
                        borderState();

                        return hexToRgba(varColor);
                    }
                });
        })
        .attr("data-original-title", "Summary Statistics");


    d3.select("#subsetList").selectAll("p")
        .data(subsetKeys)
        .enter()
        .append("p")
        .style("text-align", "center")
        .style('background-color', varColor)
        .attr("data-container", "body")
        .attr("data-toggle", "popover")
        .attr("data-trigger", "hover")
        .attr("data-placement", "right")
        .attr("data-html", "true")
        .on("click", function () {
            if (d3.select(this).text() == "Date") {
                document.getElementById("subsetDate").style.display = 'inline';

                document.getElementById("subsetLocation").style.display = 'none';
                document.getElementById("subsetActor").style.display = 'none';
                document.getElementById("subsetAction").style.display = 'none';

                selectionMadeSubset("Date");
                rightpanelMargin();
            }
            else if (d3.select(this).text() == "Location") {
                document.getElementById("subsetLocation").style.display = 'inline';

                document.getElementById("subsetDate").style.display = 'none';
                document.getElementById("subsetActor").style.display = 'none';
                document.getElementById("subsetAction").style.display = 'none';
                selectionMadeSubset("Location");
                d3loc();
                rightpanelMargin();
            }
            else if (d3.select(this).text() == "Actor") {
                document.getElementById("subsetActor").style.display = 'inline';

                document.getElementById("subsetDate").style.display = 'none';
                document.getElementById("subsetLocation").style.display = 'none';
                document.getElementById("subsetAction").style.display = 'none';
                selectionMadeSubset("Actor");
                d3actor();
                rightpanelMargin();
            }
            else if (d3.select(this).text() == "Action") {
                document.getElementById("subsetAction").style.display = 'inline';

                document.getElementById("subsetDate").style.display = 'none';
                document.getElementById("subsetLocation").style.display = 'none';
                document.getElementById("subsetActor").style.display = 'none';
                selectionMadeSubset("Action");
                d3action();
                rightpanelMargin();
            }
        });


    function selectionMadeSubset(n) {
        subsetSelection = n;

        d3.select("#tab2").selectAll("p").style('background-color', function (d) {
            if (d == n)
                return hexToRgba(selVarColor);
            else
                return varColor;
        })
    }
}
