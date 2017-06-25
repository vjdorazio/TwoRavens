// Right panel of subsetting menu

function addGroup(parent){
    var container = "<div id='group' class='container' data-elements='0' style='text-align:left;background:rgba(90%,50%,20%,0.1);margin-top:3px;padding-top:3px;width:100%;padding-right:0'>"

    // Keep the first logical toggle of each group hidden
    var logToggle = "<button id='logToggle' type='button' class='btn btn-primary btn-xs active' onclick=changeLogical(this) data-toggle='button' aria-pressed='true' style='width:35px;";
    if (parent.getAttribute('data-elements') === '0'){
        logToggle += 'visibility:hidden;';
    }
    parent.setAttribute('data-elements', String(parseInt(parent.getAttribute('data-elements')) + 1));
    logToggle += "'>and</button> ";

    var boolToggle =  "<button id='boolToggle' type='button' class='btn btn-primary btn-xs active' data-toggle='button' aria-pressed='true'>not</button> ";
    var cancelButton = "<button type='button' class='btn btn-primary btn-xs' style='background:none !important;border:none;box-shadow:none;float:right' onclick='removeRule(this.parentElement)'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button>";

    // If nested groups are desired, replace addRule with addDropdown. Listeners for the dropdown options are not included.
    // var addDropdown =  '<div class="dropdown" style="display:inline;float:right"><button class="btn btn-primary dropdown-toggle btn-xs" type="button" data-toggle="dropdown">Add <span class="caret"></span></button>';
    // addDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:right;margin:0;padding:0;width:45px;min-width:45px"><li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">Rule</a></li><li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">Group</a></li></ul></div>';
    // var addGroup = "<button type='button' class='btn btn-primary btn-xs' onclick='addGroup(this.parentElement)' style='float:right'>Add Group</button>";

    var addRule = "<button type='button' class='btn btn-primary btn-xs' onclick='addRule(this.parentElement)' style='float:right'>Add Rule</button></div>";

    parent.innerHTML += container + logToggle + boolToggle + cancelButton + addRule;
}

// When a rule is added:
// 1. add the tag 'data-subset=<subsetCount>' to the new rule div, and increment data-subsets
// 2. add a dictionary to subsetDicts that contains the current subset preferences

var subsetCount = 0;
var subsetDicts = [];

function addRule(parent){

    if (subsetSelection !== "") {
        var ruleMeta = "<div id='rule' data-subset=" + String(subsetCount) +  " style='text-align:left;margin-top:3px;padding-left:15px'>";
        subsetDicts.push(getSubsetPreferences());
        // Uncomment to view the preferences dict collected from current subset panel
        // console.log(subsetDicts[subsetCount]);
        subsetCount++;

        // Hide boolean logic toggle if first element
        var logToggle = "<button id='logToggle' type='button' class='btn btn-primary btn-xs active' onclick=changeLogical(this) data-toggle='button' aria-pressed='true' style='width:35px;";
        if (parent.getAttribute('data-elements') === '0'){
            logToggle += 'visibility:hidden;';
        }
        parent.setAttribute('data-elements', String(parseInt(parent.getAttribute('data-elements')) + 1));
        logToggle += "'>and</button> ";

        // Add negation toggle, subset and cancel
        var boolToggle = "<button id='boolToggle' type='button' class='btn btn-primary btn-xs active' data-toggle='button' aria-pressed='true'>not</button> ";
        var subsetIcon = "<span class='label label-default'>" + subsetSelection + " Subset</span> ";
        var cancelButton = "<button type='button' class='btn btn-primary btn-xs' style='background:none;border:none;box-shadow:none;float:right' onclick='removeRule(this.parentElement)'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button></div>";

        parent.innerHTML += ruleMeta + logToggle + boolToggle + subsetIcon + cancelButton
    }
}

function removeRule(element){
    // NOTE: This function also removes groups

    // When adding elements, disable the logical if there are zero elements in the group. So keep count of number of elements.
    element.parentElement.setAttribute('data-elements', String(parseInt(element.parentElement.getAttribute('data-elements')) - 1));

    var parent = element.parentNode;
    element.remove();
    var siblings = parent.childNodes;

    // Hide visibility of the first logical in the group
    var cont = false;
    var index = 0;
    while (!cont){
        if (siblings[index].nodeName === 'DIV' && (siblings[index].getAttribute('id') === 'rule' || siblings[index].getAttribute('id') === 'group')){
            siblings[index].querySelector('#logToggle').style.visibility = 'hidden';
            cont = true;
        }
        index++;
    }
    element.remove();
}

// Used as a callback for the rule and group logical toggles
function changeLogical(button) {
    if (button.innerHTML == 'and'){
        button.innerHTML = 'or ';
    } else {
        button.innerHTML = 'and';
    }
}

/**
 * When a new rule is added, retrieve the preferences of the current subset panel
 * @returns {{}} : dictionary of preferences
 */
function getSubsetPreferences(){
    if (subsetSelection == 'Date') {
        return {
            fromDate: dateminUser,
            toDate: datemaxUser
        };
    }
    if (subsetSelection == 'Location'){
        // TODO: Retrieve country listing from location panel, wrap in dictionary
        return {}
    }
    if (subsetSelection == 'Action'){
        return {}
    }
    if (subsetSelection == 'Actor'){
        // TODO: Retrieve actor preferences from actor panel
        return {}
    }
}

/**
 * Organizes all rightpanel modifiers and stored dictionaries into a single list of rules
 * @param node: root DOM element of the rightpanel SQL div tree
 * @returns {Array}
 */
function buildQuery(node) {

    var children = node.childNodes;
    var query = [];

    for (var i = 0; i < children.length; i++){

        if (children[i].id === 'rule'){
            // subsetData is recalled from subsetDicts with the index of the data-subset attribute
            query.push({
                type: 'rule',
                boolState: $(children[i].querySelector("#boolToggle")).hasClass('active'),
                logState: $(children[i].querySelector("#logToggle")).hasClass('active'),
                subsetData: subsetDicts[parseInt(children[i].getAttribute('data-subset'))]
            });
        }

        if (children[i].id === 'group'){
            query.push({
                type: 'group',
                data: buildQuery(children[i])
            });
        }
    }
    return query;
}
