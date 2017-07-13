// Right panel of subsetting menu

// addGroup(document.getElementById('queryTree'), false);

var logDropdown =  '<div class="dropdown" style="display:inline;float:left"><button class="btn btn-primary dropdown-toggle btn-xs" type="button" data-toggle="dropdown"> and <span class="caret"></span></button>';
logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
    '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">and </a></li>' +
    '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">or </a></li>' +
    '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">nand </a></li>' +
    '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">nor </a></li>' +
    '</ul></div>';

var cancelButton = "<button type='button' class='btn btn-primary btn-xs' style='background:none;border:none;box-shadow:none;float:right;margin-top:3px' onclick='this.parentElement.remove()'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button></div>";

var data = [
    {
        name: 'Root',
        group: true,
        operation: 'and',
        children: [
            { name: 'Location Subset' },
            { name: 'Date Subset' }
        ]
    }
];

function togglebutton(id){
    return ' <button id="boolToggle" href="#node-'+ id +'" class="btn btn-primary btn-xs active" type="button" data-toggle="button" aria-pressed="true" data-node-id="'+
        id +'">not</button>'
}

function logicbutton(id){
    logDropdown =  '<div class="dropdown" style="display:inline;float:left"><button class="btn btn-primary dropdown-toggle btn-xs" type="button" data-toggle="dropdown"> and <span class="caret"></span></button>';
    logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">and </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">or </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">nand </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">nor </a></li>' +
        '</ul></div>';
    return logDropdown
}


$(function() {
    $('#queryTree').tree({
        data: data,
        dragAndDrop:true,
        autoOpen:true,
        selectable:false,
        onCreateLi: function(node, $li) {
            // Append a link to the jqtree-element div.
            // The link has an url '#node-[id]' and a data property 'node-id'.

            $li.find('.jqtree-element').append(togglebutton(node.id));
        }
    });
});


$('#queryTree').bind(
    'tree.click',
    function(event) {
        // The clicked node is 'event.node'
        var node = event.node;
        alert(node.name);
    }
);


a ="<button id='boolToggle' type='button' class='btn btn-primary btn-xs active' data-toggle='button' aria-pressed='true'>not</button> "
function addGroup(parent, cancellable=true){
    var container = "<div id='group' class='container' style='float:left;text-align:left;display:inline-block;background:rgba(90%,50%,20%,0.1);margin-top:3px;padding:3px 0 3px 13px;width:100%;'>"

    // var logToggle = "<button id='logToggle' type='button' class='btn btn-primary btn-xs active' onclick=changeLogical(this) data-toggle='button' aria-pressed='true' style='width:35px;'>and</button> ";

    var cancelButton = "<button type='button' class='btn btn-primary btn-xs' style='";
    if (!cancellable){
        cancelButton += 'visibility:hidden;';
    }
    cancelButton += "background:none !important;border:none;box-shadow:none;float:right;margin-top:3px' onclick='this.parentElement.remove()'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button>";

    var logDropdown =  '<div class="dropdown" style="display:inline;float:left"><button class="btn btn-primary dropdown-toggle btn-xs" type="button" data-toggle="dropdown"> and <span class="caret"></span></button>';
    logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">and </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">or </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">nand </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">nor </a></li>' +
        '</ul></div>';

    var addRuleButton = "<button type='button' class='btn btn-primary btn-xs' onclick='addRule(this.parentElement)' style='float:right;display:inline-block;'>Add Rule</button> ";
    var addGroupButton = "<button type='button' class='btn btn-primary btn-xs' onclick='addGroup(this.parentElement)' style='float:right;display:inline-block;'>Add Group</button>";

    parent.innerHTML += container + logDropdown + cancelButton + addGroupButton + addRuleButton + "</div>";
}

// When a rule is added:
// 1. add the tag 'data-subset=<subsetCount>' to the new rule div, and increment data-subsets
// 2. add a dictionary to subsetDicts that contains the current subset preferences

var subsetCount = 0;
var subsetDicts = [];

function addRule(){
    // Index zero is root node. Add subset pref to nodes
    data[0]['children'].push(getSubsetPreferences())
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
