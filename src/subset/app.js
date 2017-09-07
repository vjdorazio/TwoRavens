let production = false;

let rappURL = '';
if (!production) {
    // base URL for the R apps:
    rappURL = "http://localhost:8000/custom/";
} else {
    rappURL = "https://beta.dataverse.org/custom/"; //this will change when/if the production host changes
}

let subsetURL = rappURL + 'eventdataapp';

let variables = ["X","GID","Date","Year","Month","Day","Source","SrcActor","SrcAgent","SOthAgent","Target","TgtActor",
    "TgtAgent","TOthAgent","CAMEO","RootCode","QuadClass","Goldstein","None","Lat","Lon","Geoname","CountryCode",
    "AdminInfo","ID","URL","sourcetxt"];
let variablesSelected = new Set();

let subsetKeys = ["Actor", "Date", "Action", "Location"]; // Used to label buttons in the left panel
let subsetKeySelected = 'Actor';


let varColor = 'rgba(240,248,255, 1.0)';   //d3.rgb("aliceblue");
let selVarColor = 'rgba(250,128,114, 0.5)';    //d3.rgb("salmon");

let dateData = [];
let countryData = [];
let actorData = [];
let actionData = {};

// This is set once data is loaded and the graphs can be drawn. Subset menus will not be shown until this is set
let initialLoad = false;

let subsetData = [];

// Attempt to load stored settings
if (localStorage.getItem("subsetData") !== null) {
    // Since the user has already submitted a query, restore the previous preferences from local data
    // All stored data is cleared on reset
    variablesSelected = new Set(JSON.parse(localStorage.getItem('variablesSelected')));
    subsetData = JSON.parse(localStorage.getItem('subsetData'));
}

let variableQuery = buildVariables();
let subsetQuery = buildSubset();

console.log(JSON.stringify(subsetQuery));
console.log(JSON.stringify(variableQuery, null, '  '));

let query = {'subsets': JSON.stringify(subsetQuery), 'variables': JSON.stringify(variableQuery)};

reloadLeftpanelVariables();
$("#searchvar").keyup(reloadLeftpanelVariables);

function reloadLeftpanelVariables() {
    // Subset variable list by search term. Empty string returns all.
    let search_term = $("#searchvar").val().toUpperCase();
    let matchedVariables = [];

    for (let idx in variables) {
        if (variables[idx].toUpperCase().indexOf(search_term) !== -1) {
            matchedVariables.push(variables[idx])
        }
    }

    $('#variableList').empty();
    d3.select("#variableList").selectAll("p")
        .data(matchedVariables)
        .enter()
        .append("p")
        .text(function (d) {return d;})
        .style('background-color', function () {
            if (variablesSelected.has(d3.select(this).text())) return selVarColor;
            return varColor
        })
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

            reloadRightPanelVariables()
        });

}

d3.select("#subsetList").selectAll("p")
    .data(subsetKeys)
    .enter()
    .append("p")
    .text(function (d) {return d;})
    .style("text-align", "center")
    .style('background-color', function() {
        if (d3.select(this).text() === subsetKeySelected) return selVarColor;
        else return varColor;
    })
    .on("click", function () {

        subsetKeySelected = d3.select(this).text();
        d3.select('#subsetList').selectAll("p").style('background-color', function (d) {
            if (d === subsetKeySelected) return selVarColor;
            else return varColor;
        });

        if (!initialLoad) {
            alert("Resources are still being loaded from the server. The plots will render once resources have been loaded");
        } else {
            showSubset(subsetKeySelected);
        }

    });

function showSubset(subsetKeySelected) {
    if (subsetKeySelected !== ""){
        $("#main").children().hide();
        $("#subset" + subsetKeySelected).css('display', 'inline');
        if (subsetKeySelected === "Actor") {
            d3actor();
        }
        rightpanelMargin();
    }
}

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
    console.log(jsondata);

    dateData.length = 0;
    for (let idx in jsondata.date_data) {
        dateData.push(JSON.parse(jsondata.date_data[idx]))
    }
    d3date(true);

    countryData = {};
    for (let idx in jsondata.country_data) {
        let parsed = JSON.parse(jsondata.country_data[idx]);
        countryData[parsed['state']] = parsed['total']
    }
    d3loc();


    actionData = {};
    for (let idx in jsondata.action_data) {
        let parsed = JSON.parse(jsondata.action_data[idx]);
        actionData[parsed['action']] = parsed['total']
    }
    d3action();

    actorData = jsondata.actor_data;
    actorDataLoad();

    // If first load of data, user may have selected a subset and is waiting. Render page now that data is available
    if (!initialLoad) {
        initialLoad = true;
        // In the case where the user has not yet made a subset selection, this is ignored
        showSubset(subsetKeySelected);
    }
}

// Select which tab is shown in the left panel
function tabLeft(tab) {

    document.getElementById('variableTab').style.display = 'none';
    document.getElementById('subsetTab').style.display = 'none';

    $("#leftpanelButtons").children().addClass("btn btn-default").removeClass("active");

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

// Keep right panel closed on initial load
toggleRightPanel();

window.onresize = rightpanelMargin;

function rightpanelMargin() {
    let main = $("#main");
    if (main.get(0).scrollHeight > main.get(0).clientHeight) {
        // Vertical scrollbar
        document.getElementById("rightpanel").style.right = "27px";
        if ($('#rightpanel').hasClass('closepanel')) {
            document.getElementById("stageButton").style.right = "56px";
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


// Right panel of subset menu

// This is the subset node format for creating the jqtrees
// {
//     id: String(nodeId++),    // Node number with post-increment
//     name: '[title]',         // 'Subsets', 'Group #', '[Selection] Subset' or tag name
//     show_op: true,           // If true, show operation menu element
//     operation: 'and',        // Stores preference of operation menu element
//     children: [],            // If children exist
//     negate: false,           // If exists, have a negation button
//     editable: true,          // If false, operation cannot be edited
//     cancellable: false       // If exists and false, disable the delete button
//     cancel_prompt: false     // If exists and true, prompt before deletion, and un-subset data
// }

// variableData is used to create the tree gui on the right panel
// names of variables comes from 'variablesSelected' variable
var variableData = [];

var nodeId = 1;
var groupId = 1;
var queryId = 1;

if (localStorage.getItem("nodeId") !== null) {
    // If the user has already submitted a query, restore the previous query from local data
    nodeId = localStorage.getItem('nodeId');
    groupId = localStorage.getItem('groupId');
    queryId = localStorage.getItem('queryId');
}


// Define negation toggle, logic dropdown and delete button, as well as their callbacks
function buttonNegate(id, state) {
    // This state is negated simply because the buttons are visually inverted. An active button appears inactive
    // This is due to css tomfoolery
    if (!state) {
        return '<button id="boolToggle" class="btn btn-default btn-xs active" type="button" data-toggle="button" aria-pressed="true" onclick="callbackNegate(' + id + ', true)">not</button> '
    } else {
        return '<button id="boolToggle" class="btn btn-default btn-xs" type="button" data-toggle="button" aria-pressed="true" onclick="callbackNegate(' + id + ', false)">not</button> '
    }
}

function callbackNegate(id, bool) {
    let node = $('#subsetTree').tree('getNodeById', id);
    node.negate = bool;

    subsetData = JSON.parse($('#subsetTree').tree('toJson'));
    let qtree = $('#subsetTree');
    let state = qtree.tree('getState');
    qtree.tree('loadData', subsetData, 0);
    qtree.tree('setState', state);
}

function buttonOperator(id, state) {
    if (state === 'and') {
        return '<button class="btn btn-default btn-xs active" style="width:35px" type="button" data-toggle="button" aria-pressed="true" onclick="callbackOperator(' + id + ', &quot;or&quot;)">and</button> '
    } else {
        return '<button class="btn btn-default btn-xs active" style="width:35px" type="button" data-toggle="button" aria-pressed="true" onclick="callbackOperator(' + id + ', &quot;and&quot;)">or</button> '
    }

    // To enable nand and nor, comment above and uncomment below. Please mind; the query builder does not support nand/nor
    // let logDropdown = ' <div class="dropdown" style="display:inline"><button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">' + state + ' <span class="caret"></span></button>';
    // logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackOperator(' + id + ', &quot;and&quot;)">and</a></li>' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackOperator(' + id + ', &quot;or&quot;)">or</a></li>' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackOperator(' + id + ', &quot;nand&quot;)">nand</a></li>' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackOperator(' + id + ', &quot;nor&quot;)">nor</a></li>' +
    //     '</ul></div> ';
}

function callbackOperator(id, operand) {
    let node = $('#subsetTree').tree('getNodeById', id);
    if (!('editable' in node) || ('editable' in node && node.editable)) {
        node.operation = operand;

        // Redraw tree
        subsetData = JSON.parse($('#subsetTree').tree('toJson'));
        let qtree = $('#subsetTree');
        let state = qtree.tree('getState');
        qtree.tree('loadData', subsetData, 0);
        qtree.tree('setState', state);
    }
}

function buttonDelete(id) {
    return "<button type='button' class='btn btn-default btn-xs' style='background:none;border:none;box-shadow:none;float:right;margin-top:3px' onclick='callbackDelete(" + String(id) + ")'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button></div>";
}

function callbackDelete(id) {
    let node = $('#subsetTree').tree('getNodeById', id);
    if ('cancel_prompt' in node && node.cancel_prompt) {
        if (!confirm("You are deleting a query. This will return your subsetting to an earlier state.")) {
            return;
        }
    }

    if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
            $('#subsetTree').tree('removeNode', node.children[i])
        }
    }
    $('#subsetTree').tree('removeNode', node);

    subsetData = JSON.parse($('#subsetTree').tree('toJson'));
    subsetData = hide_first(subsetData);

    let qtree = $('#subsetTree');
    let state = qtree.tree('getState');
    qtree.tree('loadData', subsetData, 0);
    qtree.tree('setState', state);

    if ('cancel_prompt' in node && node.cancel_prompt) {
        let variableQuery = buildVariables();
        let subsetQuery = buildSubset();

        console.log(JSON.stringify(subsetQuery));
        console.log(JSON.stringify(variableQuery, null, '  '));

        query = {'subsets': JSON.stringify(subsetQuery), 'variables': JSON.stringify(variableQuery)};
        makeCorsRequest(subsetURL, query, pageSetup);
    }
}

// Variables menu
$(function () {
    $('#variableTree').tree({
        data: variableData,
        saveState: true,
        dragAndDrop: false,
        autoOpen: true,
        selectable: false
    });
});

// Updates the rightpanel variables menu
function reloadRightPanelVariables() {
    variableData.length = 0;
    [...variablesSelected].forEach(function(element){
        variableData.push({
            name: element,
            cancellable: false,
            show_op: false
        })
    });

    let qtree = $('#variableTree');
    let state = qtree.tree('getState');
    qtree.tree('loadData', variableData, 0);
    qtree.tree('setState', state);
}

// Load stored variables into the rightpanel variable tree on initial page load
reloadRightPanelVariables();

// Create the query tree
$(function () {
    $('#subsetTree').tree({
        data: subsetData,
        saveState: true,
        dragAndDrop: true,
        autoOpen: true,
        selectable: false,

        // Executed for every node and leaf in the tree
        onCreateLi: function (node, $li) {

            if (!('show_op' in node) || ('show_op' in node && node.show_op)) {
                $li.find('.jqtree-element').prepend(buttonOperator(node.id, node.operation));
            }
            if ('negate' in node) {
                $li.find('.jqtree-element').prepend(buttonNegate(node.id, node.negate));
            }
            if (!('cancellable' in node) || (node['cancellable'] === true)) {
                $li.find('.jqtree-element').append(buttonDelete(node.id));
            }
            // Set a left margin on the first element of a leaf
            if (node.children.length === 0) {
                $li.find('.jqtree-element:first').css('margin-left', '14px');
            }
        },
        onCanMove: function (node) {
            // Cannot move nodes in uneditable queries
            if ('editable' in node && !node.editable) {
                return false
            }

            // Subset and Group may be moved
            let is_country = ('type' in node && node.type === 'country');
            return (node.name.indexOf('Subset') !== -1 || node.name.indexOf('Group') !== -1 || is_country);
        },
        onCanMoveTo: function (moved_node, target_node, position) {

            // Cannot move to uneditable queries
            if ('editable' in target_node && !target_node.editable) {
                return false
            }

            // Countries can be moved to child of location subset group
            if ('type' in moved_node && moved_node.type === 'country') {
                return position === 'after' && target_node.parent.name === 'Location Subset';
            }
            // Rules may be moved next to another rule or grouping
            if (position == 'after' && (target_node.name.indexOf('Subset') !== -1 || target_node.name.indexOf('Group') !== -1)) {
                return true;
            }
            // Rules may be moved inside a group or root
            if ((position === 'inside') && (target_node.name.indexOf('Subsets') !== -1 || target_node.name.indexOf('Group') !== -1)) {
                return true;
            }
            return false;
        }
    });
});

$('#subsetTree').on(
    'tree.move',
    function (event) {
        event.preventDefault();
        event.move_info.do_move();

        // Save changes when an element is moved
        subsetData = JSON.parse($('#subsetTree').tree('toJson'));

        subsetData = hide_first(subsetData);
        let qtree = $('#subsetTree');
        let state = qtree.tree('getState');
        qtree.tree('loadData', subsetData, 0);
        qtree.tree('setState', state);
    }
);

function hide_first(data){
    for (let i = 0; i < data.length; i++) {
        data[i]['show_op'] = i !== 0;
    }
    return data;
}

$('#subsetTree').on(
    'tree.click',
    function (event) {
        if (event.node.hasChildren()) {
            $('#subsetTree').tree('toggle', event.node);
        }
    }
);

function addGroup(query=false) {
    // When the query argument is set, groups will be included under a 'query group'
    let movedChildren = [];
    let removeIds = [];

    // If everything is deleted, then restart the ids
    if (subsetData.length === 0) {
        groupId = 1;
        queryId = 1;
    }

    // Make list of children to be moved
    for (let child_id in subsetData) {
        let child = subsetData[child_id];

        // Don't put groups inside groups! Only a drag can do that.
        if (!query && child.name.indexOf('Subset') !== -1) {
            movedChildren.push(child);
            removeIds.push(child_id);

            // A query grouping can, however put groups inside of groups.
        } else if (query && child.name.indexOf('Query') === -1) {
            movedChildren.push(child);
            removeIds.push(child_id);
        }
    }
    if (movedChildren.length > 0) {
        movedChildren[0]['show_op'] = false;
    }

    // Delete elements from root directory that are moved
    for (let i = removeIds.length - 1; i >= 0; i--) {
        subsetData.splice(removeIds[i], 1);
    }

    if (query) {
        subsetData.push({
            id: String(nodeId++),
            name: 'Query ' + String(queryId++),
            operation: 'and',
            children: movedChildren,
            show_op: subsetData.length > 0
        });
    } else {
        subsetData.push({
            id: String(nodeId++),
            name: 'Group ' + String(groupId++),
            operation: 'and',
            children: movedChildren,
            show_op: subsetData.length > 0
        });
    }

    $('#subsetTree').tree('loadData', subsetData);


    let qtree = $('#subsetTree');
    let state = qtree.tree('getState');
    qtree.tree('loadData', subsetData, 0);
    qtree.tree('setState', state);
    if (!query) {
        qtree.tree('openNode', qtree.tree('getNodeById', nodeId - 1), true);
    }
}

function addRule() {
    // Index zero is root node. Add subset pref to nodes
    if (subsetKeySelected !== "") {
        let preferences = getSubsetPreferences();

        // Don't add an empty preference
        if (Object.keys(preferences).length === 0) {
            alert("No options have been selected. Please make a selection.");
            return;
        }

        if ($('#rightpanel').hasClass('closepanel')) toggleRightPanel();

        // Don't show the boolean operator on the first element
        if (subsetData.length === 0) {
            preferences['show_op'] = false;
        }

        subsetData.push(preferences);

        let qtree = $('#subsetTree');
        let state = qtree.tree('getState');
        qtree.tree('loadData', subsetData, 0);
        qtree.tree('setState', state);
        qtree.tree('closeNode', qtree.tree('getNodeById', preferences['id']), false);
    }
}

/**
 * When a new rule is added, retrieve the preferences of the current subset panel
 * @returns {{}} : dictionary of preferences
 */
function getSubsetPreferences() {
    if (subsetKeySelected === 'Date') {

        // If the dates have not been modified, force bring the date from the slider
        if (dateminUser - datemin === 0 && datemaxUser - datemax === 0){
            setDatefromSlider();

            // Ignore the rule if still dates are still not modified
            if (dateminUser - datemin === 0 && datemaxUser - datemax === 0) {
                return {};
            }
        }

        // For mapping numerical months to strings in the child node name
        let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
            "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return {
            id: String(nodeId++),
            name: 'Date Subset',
            children: [
                {
                    id: String(nodeId++),
                    name: 'From: ' + monthNames[dateminUser.getMonth()] + ' ' + String(dateminUser.getFullYear()),
                    fromDate: new Date(dateminUser.getTime()),
                    cancellable: false,
                    show_op: false
                },
                {
                    id: String(nodeId++),
                    name: 'To:   ' + monthNames[datemaxUser.getMonth()] + ' ' + String(datemaxUser.getFullYear()),
                    toDate: new Date(datemaxUser.getTime()),
                    cancellable: false,
                    show_op: false
                }
            ],
            operation: 'and'
        };
    }

    if (subsetKeySelected === 'Location') {
        // Make parent node
        let subset = {
            id: String(nodeId++),
            name: 'Location Subset',
            operation: 'and',
            children: []
        };

        // Add each country to the parent node as another rule
        for (let country in mapListCountriesSelected) {
            if (mapListCountriesSelected[country]) {
                subset['children'].push({
                    id: String(nodeId++),
                    name: country,
                    show_op: false
                });
            }
        }
        // Don't add a rule and ignore the stage if no countries are selected
        if (subset['children'].length === 0) {
            return {}
        }

        return subset
    }

    if (subsetKeySelected === 'Action') {
        return {
            id: String(nodeId++),
            name: 'Action Subset',
            operation: 'and',
            children: []
        }
    }
    if (subsetKeySelected === 'Actor') {
        // Make parent node
        let subset = {
            id: String(nodeId++),
            name: 'Actor Subset',
            operation: 'and',
            children: []
        };
        // Add each link to the parent node as another rule
        for (let linkId in actorLinks) {
            let link = {
                id: String(nodeId++),
                name: 'Link ' + String(linkId),
                show_op: linkId !== 0,
                operation: 'and',
                children: [{
                    id: String(nodeId++),
                    name: 'Source: ' + actorLinks[linkId].source.name,
                    show_op: false,
                    children: []
                }, {
                    id: String(nodeId++),
                    name: 'Target: ' + actorLinks[linkId].target.name,
                    show_op: false,
                    children: []
                }]
            };

            for (let sourceId in actorLinks[linkId].source.group) {
                link['children'][0]['children'].push({
                    id: String(nodeId++),
                    name: actorLinks[linkId].source.group[sourceId],
                    show_op: false
                });
            }
            for (let targetId in actorLinks[linkId].target.group) {
                link['children'][1]['children'].push({
                    id: String(nodeId++),
                    name: actorLinks[linkId].source.group[targetId],
                    show_op: false
                });
            }
            subset['children'].push(link);
        }

        // Don't add a rule and ignore the stage if no links are made
        if (subset['children'].length === 0) {
            return {}
        }

        return subset
    }
}

function reset() {
    // suppress server queries from the reset button when the webpage is already reset
    let suppress = variablesSelected.size === 0 && subsetData.length === 0;

    localStorage.removeItem('variablesSelected');
    localStorage.removeItem('subsetData');
    localStorage.removeItem('nodeId');
    localStorage.removeItem('groupId');
    localStorage.removeItem('queryId');

    subsetData.length = 0;
    $('#subsetTree').tree('loadData', subsetData, 0);

    variablesSelected.clear();

    reloadLeftpanelVariables();
    reloadRightPanelVariables();

    if (!suppress) {
        let query = {'subsets': JSON.stringify({}), 'variables': JSON.stringify({})};
        makeCorsRequest(subsetURL, query, pageSetup);
    }
}

/**
 * Makes web request for rightpanel preferences
 */
function submitQuery() {
    console.log(subsetData);

    // Only construct and submit the query if new subsets have been added since last query
    let newSubsets = false;
    for (let idx in subsetData) {
        if (subsetData[idx].name.indexOf('Query') === -1) {
            newSubsets = true;
            break
        }
    }
    if (!newSubsets) return;

    let variableQuery = buildVariables();
    let subsetQuery = buildSubset();

    // True for adding a query group, all existing preferences are grouped under a 'query group'
    addGroup(true);

    // Store user preferences in local data (must be stored after adding the query group)
    localStorage.setItem('variablesSelected', JSON.stringify([...variablesSelected]));

    localStorage.setItem('subsetData', $('#subsetTree').tree('toJson'));
    localStorage.setItem('nodeId', nodeId);
    localStorage.setItem('groupId', groupId);
    localStorage.setItem('queryId', queryId);

    // Add all nodes to selection
    let qtree = $('#subsetTree');
    let nodeList = [...Array(nodeId).keys()];

    nodeList.forEach(
        function(node_id){
            const node = qtree.tree("getNodeById", node_id);

            if (node) {
                qtree.tree("addToSelection", node);
                node.editable = false;

                if (node.name.indexOf('Query') === -1) {
                    node.cancellable = false;
                } else {
                    node.cancel_prompt = true;
                }
            }
        }
    );

    // Redraw tree
    subsetData = JSON.parse($('#subsetTree').tree('toJson'));
    let state = qtree.tree('getState');
    qtree.tree('loadData', subsetData, 0);
    qtree.tree('setState', state);

    console.log(JSON.stringify(subsetQuery));
    console.log(JSON.stringify(variableQuery, null, '  '));

    query = {'subsets': JSON.stringify(subsetQuery), 'variables': JSON.stringify(variableQuery)};

    makeCorsRequest(subsetURL, query, pageSetup);
}

// Construct mongoDB selection (subsets columns)
function buildVariables(){
    let fieldQuery = {};
    let variablelist = [...variablesSelected];
    for (let idx in variablelist) {
        fieldQuery[variablelist[idx]] = 1;
    }
    return fieldQuery;
}

// Construct mongoDB filter (subsets rows)
function buildSubset(){
    if (subsetData.length === 0) return {};

    let subsetQuery = processGroup({'children': subsetData});

    // First construct a boolean expression tree via operator precedence between group siblings
    // Then build query for each node and pass up the tree

    function processNode(node){
        if (node.name.indexOf('Group') !== -1 && 'children' in node && node.children.length !== 0) {
            // Recursively process subgroups
            return processGroup(node);
        } else if (node.name.indexOf('Query') !== -1 && 'children' in node && node.children.length !== 0) {
            // Recursively process query
            return processGroup(node);
        }
        else {
            // Explicitly process rules
            return processRule(node);
        }
    }

    // Group precedence parser
    function processGroup(group) {

        // all rules are 'or'ed together
        let group_query = {'$or': []};

        // strings of rules conjuncted by 'and' operators are clotted in semigroups that act together as one rule
        let semigroup = [];

        for (let child_id = 0; child_id < group.children.length - 1; child_id++) {
            let op_self = group.children[child_id]['operation'];
            let op_next = group.children[child_id + 1]['operation'];

            // Clot together and operators
            if (op_self === 'and' || op_next === 'and') {
                semigroup.push(processNode(group.children[child_id]));
                if (op_next === 'or') {
                    group_query['$or'].push({'$and': semigroup.slice()});
                    semigroup = [];
                }
            }

            // If not part of an 'and' clot, simply add to the query
            if (op_self === 'or' && op_next === 'or') {
                group_query['$or'].push(processNode(group.children[child_id]));
            }
        }

        // Process final sibling
        if (group.children[group.children.length - 1]['operation'] === 'and') {
            semigroup.push(processNode(group.children[group.children.length - 1]));
            group_query['$or'].push({'$and': semigroup.slice()})

        } else {
            group_query['$or'].push(processNode(group.children[group.children.length - 1]));
        }

        // Collapse unnecessary conjunctors
        if (group_query['$or'].length === 1) {
            group_query = group_query['$or'][0]
        }
        if ('$and' in group_query && group_query['$and'].length === 1) {
            group_query = group_query['$and'][0]
        }

        return group_query;
    }

    // Return a mongoDB query for a rule data structure
    function processRule(rule) {
        let rule_query = {};

        if (rule.name === 'Date Subset') {

            function pad(number) {
                if (number <= 9) {
                    return ("0" + number.toString());
                }
                else {
                    return number.toString()
                }
            }

            let rule_query_inner = {};
            for (let child_id in rule.children) {
                let child = rule.children[child_id];
                if ('fromDate' in child) {

                    // There is an implicit cast somewhere in the code, and I cannot find it.
                    child.fromDate = new Date(child.fromDate);

                    let date = child.fromDate.getFullYear().toString() +
                        pad(child.fromDate.getMonth()) +
                        pad(child.fromDate.getDay());
                    rule_query_inner['$gte'] = parseInt(date);
                }
                if ('toDate' in child) {

                    // There is an implicit cast somewhere in the code, and I cannot find it.
                    child.toDate = new Date(child.toDate);

                    let date = child.toDate.getFullYear().toString() +
                        pad(child.toDate.getMonth()) +
                        pad(child.toDate.getDay());
                    rule_query_inner['$lte'] = parseInt(date);
                }
            }
            rule_query['Date'] = rule_query_inner;
        }

        if (rule.name === 'Location Subset'){
            let rule_query_inner = [];
            for (let child_id in rule.children) {
                rule_query_inner.push(rule.children[child_id].name);
            }

            if ('not' in rule) {
                rule_query_inner = {'$not': rule_query_inner}
            }
            rule_query['AdminInfo'] = {'$in': rule_query_inner};
        }

        if (rule.name === 'Actor Subset'){
            let link_list = [];
            for (let idx in rule.children) {
                let link_rule = {};

                let sourceList = [];
                for (let idxsource in rule.children[idx].children[0].children) {
                    sourceList.push(rule.children[idx].children[0].children[idxsource].name);
                }
                link_rule['Source'] = {'$in': sourceList};

                let targetList = [];
                for (let idxtarget in rule.children[idx].children[1].children) {
                    targetList.push(rule.children[idx].children[0].children[idxtarget].name)
                }
                link_rule['Target'] = {'$in': targetList};

                link_list.push(link_rule)
            }
            rule_query['$and'] = link_list;
        }

        return rule_query;
    }

    function operatorWrap(operation, json) {
        // If no operator is specified, mongoDB will assume 'and'
        let temp = {};

        // NAND is not explicitly defined in mongoDB, but there is an equivalent:
        // { '$nand': [content] } === { '$not': { '$and': [content] } }

        if (operation.indexOf('nand') === -1) {
            temp['$' + operation] = json;
        } else {
            temp['$not'] = {'$and': json};
        }
        return temp;
    }
    return subsetQuery;
}
