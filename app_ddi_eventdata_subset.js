let production = false;

let rappURL = '';
if (!production) {
    // base URL for the R apps:
    rappURL = "http://localhost:8000/custom/";
} else {
    rappURL = "https://beta.dataverse.org/custom/"; //this will change when/if the production host changes
}

let subsetURL = rappURL + 'eventdataapp';
let query = {'subsets': {}, 'variables': {'Source': 1}};
let response = {};

let variables = ["X","GID","Date","Year","Month","Day","Source","SrcActor","SrcAgent","SOthAgent","Target","TgtActor",
    "TgtAgent","TOthAgent","CAMEO","RootCode","QuadClass","Goldstein","None","Lat","Lon","Geoname","CountryCode",
    "AdminInfo","ID","URL","sourcetxt"];
let variablesSelected = new Set();

let subsetKeys = ["Date", "Location", "Action", "Actor"]; // Used to label buttons in the left panel
let subsetKeySelected = '';


let varColor = '#f0f8ff';   //d3.rgb("aliceblue");
let selVarColor = '#fa8072';    //d3.rgb("salmon");

let dateData = [];
let countryData = [];

d3.select("#variableList").selectAll("p")
    .data(variables)
    .enter()
    .append("p")
    .text(function (d) {return d;})
    .style('background-color', varColor)
    .on("click", function () {
        d3.select(this).style('background-color', function () {

                let text = d3.select(this).text();
                if (variablesSelected.has(text)) {
                    variablesSelected.delete(text);
                    return varColor

                } else {
                    variablesSelected.add(text);
                    return selVarColor
                }
            });

        reloadVariables()
    });


d3.select("#subsetList").selectAll("p")
    .data(subsetKeys)
    .enter()
    .append("p")
    .text(function (d) {return d;})
    .style("text-align", "center")
    .style('background-color', varColor)
    .on("click", function () {
        subsetKeySelected = d3.select(this).text();

        d3.select('#subsetList').selectAll("p").style('background-color', function (d) {
            if (d === subsetKeySelected)
                return selVarColor;
            else
                return varColor;
        });

        if (subsetKeySelected === "Date") {
            document.getElementById("subsetDate").style.display = 'inline';

            document.getElementById("subsetLocation").style.display = 'none';
            document.getElementById("subsetActor").style.display = 'none';
            document.getElementById("subsetAction").style.display = 'none';
        }

        else if (subsetKeySelected === "Location") {
            document.getElementById("subsetLocation").style.display = 'inline';

            document.getElementById("subsetDate").style.display = 'none';
            document.getElementById("subsetActor").style.display = 'none';
            document.getElementById("subsetAction").style.display = 'none';
            d3loc();
        }

        else if (subsetKeySelected === "Actor") {
            document.getElementById("subsetActor").style.display = 'inline';

            document.getElementById("subsetDate").style.display = 'none';
            document.getElementById("subsetLocation").style.display = 'none';
            document.getElementById("subsetAction").style.display = 'none';
            d3actor();
        }

        else if (subsetKeySelected === "Action") {
            document.getElementById("subsetAction").style.display = 'inline';

            document.getElementById("subsetDate").style.display = 'none';
            document.getElementById("subsetLocation").style.display = 'none';
            document.getElementById("subsetActor").style.display = 'none';
            d3action();

        }
        rightpanelMargin();
    });

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
        let json = '';
        let names = [];

        try {
            json = JSON.parse(text);
            names = Object.keys(json);
        }
        catch (err) {
            console.log(err);
            alert('Error: Could not parse incoming JSON.');
        }
        if (names[0] === "warning") {
            console.log(json.warning);
            alert('Warning: Additional information in console.')
        }
        callback(json)
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
    console.log(jsondata)

    dateData.length = 0;
    for (let idx in jsondata.date_data) {
        dateData.push(JSON.parse(jsondata.date_data[idx]))
    }
    createDateplot()

}


// Select which tab is shown in the left panel
function tabLeft(tab) {

    document.getElementById('variableTab').style.display = 'none';
    document.getElementById('subsetTab').style.display = 'none';

    $(".btn-group").children().addClass("btn btn-default").removeClass("active");

    switch (tab) {
        case "variableTab":
            document.getElementById('btnVariables').setAttribute("class", "btn active");

            break;
        case "subsetTab":
            document.getElementById('btnSubset').setAttribute("class", "btn active");
    }

    d3.select("#leftpanel").attr("class", "sidepanel container clearfix");
    document.getElementById(tab).style.display = 'block';
}


window.onresize = rightpanelMargin;
rightpanelMargin();

function rightpanelMargin() {
    main = $("#main");
    if (main.get(0).scrollHeight > main.get(0).clientHeight) {
        // Vertical scrollbar
        document.getElementById("rightpanel").style.right = "27px";
        if ($('#rightpanel').hasClass('closepanel')) {
            document.getElementById("stageButton").style.right = "56px"
        } else {
            document.getElementById("stageButton").style.right = "286px"
        }
    } else {
        // No vertical scrollbar
        document.getElementById("rightpanel").style.right = "10px";
        if ($('#rightpanel').hasClass('closepanel')) {
            document.getElementById("stageButton").style.right = "40px"
        } else {
            document.getElementById("stageButton").style.right = "270px"
        }
    }

    if (main.get(0).scrollWidth > main.get(0).clientWidth) {
        // Horizontal scrollbar
        document.getElementById("rightpanel").style.height = "calc(100% - 139px)";
        document.getElementById("stageButton").style.bottom = "73px";
    } else {
        // No horizontal scrollbar
        document.getElementById("rightpanel").style.height = "calc(100% - 122px)";
        document.getElementById("stageButton").style.bottom = "56px";
    }
}
