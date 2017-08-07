// Right panel of subsetting menu


// This is the data node format
// {
//     id: String(nodeId++),    // Node number with post-increment
//     name: '[title]',         // 'Subsets', 'Group #', '[Selection] Subset' or tag name
//     operation: 'and',        // If exists, have a logical drop down
//     children: [],            // If children exist
//     negate: false,           // If exists, have a negation button
//     cancellable: false       // If exists and false, disable the delete button
// }

// Delete stored tree (debug)
// localStorage.removeItem('selectedVariables');
// localStorage.removeItem('subsetData');

var subsetData = [];
var variableData = [];
var nodeId = 2;
var groupId = 1;

// Create the rightpanel data tree
if (localStorage.getItem("subsetData") !== null) {
    // If the user has already submitted a query, restore the previous query from local data
    subsetData = JSON.parse(localStorage.getItem('subsetData'));
    nodeId = localStorage.getItem('nodeId');
    groupId = localStorage.getItem('groupId');
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
    var node = $('#subsetTree').tree('getNodeById', id);
    node.negate = bool;

    subsetData = JSON.parse($('#subsetTree').tree('toJson'));
    var qtree = $('#subsetTree');
    var state = qtree.tree('getState');
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
    // var logDropdown = ' <div class="dropdown" style="display:inline"><button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">' + state + ' <span class="caret"></span></button>';
    // logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackOperator(' + id + ', &quot;and&quot;)">and</a></li>' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackOperator(' + id + ', &quot;or&quot;)">or</a></li>' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackOperator(' + id + ', &quot;nand&quot;)">nand</a></li>' +
    //     '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackOperator(' + id + ', &quot;nor&quot;)">nor</a></li>' +
    //     '</ul></div> ';
}

function callbackOperator(id, operand) {
    var node = $('#subsetTree').tree('getNodeById', id);
    node.operation = operand;

    // Redraw tree
    subsetData = JSON.parse($('#subsetTree').tree('toJson'));
    var qtree = $('#subsetTree');
    var state = qtree.tree('getState');
    qtree.tree('loadData', subsetData, 0);
    qtree.tree('setState', state);
}

function buttonDelete(id) {
    return "<button type='button' class='btn btn-default btn-xs' style='background:none;border:none;box-shadow:none;float:right;margin-top:3px' onclick='callbackDelete(" + String(id) + ")'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button></div>";
}

function callbackDelete(id) {
    var node = $('#subsetTree').tree('getNodeById', id);

    if (node.children) {
        for (var i = node.children.length - 1; i >= 0; i--) {
            $('#subsetTree').tree('removeNode', node.children[i])
        }
    }
    $('#subsetTree').tree('removeNode', node);

    subsetData = JSON.parse($('#subsetTree').tree('toJson'));
    subsetData = hide_first(subsetData);

    var qtree = $('#subsetTree');
    var state = qtree.tree('getState');
    qtree.tree('loadData', subsetData, 0);
    qtree.tree('setState', state);
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
function reloadVariables() {
    variableData.length = 0;
    selectedVariables.forEach(function(element){
        variableData.push({
            name: element,
            cancellable: false,
            show_op: false
        })
    });

    var qtree = $('#variableTree');
    var state = qtree.tree('getState');
    qtree.tree('loadData', variableData, 0);
    qtree.tree('setState', state);
}

// Load stored variables into the rightpanel variable tree on initial page load
reloadVariables();

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
            // Subset and Group may be moved
            var is_country = ('type' in node && node.type === 'country');
            return (node.name.indexOf('Subset') !== -1 || node.name.indexOf('Group') !== -1 || is_country);
        },
        onCanMoveTo: function (moved_node, target_node, position) {
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
        var qtree = $('#subsetTree');
        var state = qtree.tree('getState');
        qtree.tree('loadData', subsetData, 0);
        qtree.tree('setState', state);
    }
);

function hide_first(data){
    for (var i = 0; i < data.length; i++) {
        data[i]['show_op'] = i !== 0;
        if (data[i]['name'].indexOf('Date Subset') === -1 && 'children' in data[i]){
            data[i]['children'] = hide_first(data[i]['children']);
        }
    }
    return data;
}

$('#subsetTree').on(
    'tree.click',
    function (event) {
        // TODO: Break if click occurred over one of the bootstrap buttons
        if (event.node.hasChildren()) {
            $('#subsetTree').tree('toggle', event.node);
        }
    }
);

function addGroup() {
    var movedChildren = [];
    var removeIds = [];

    if (subsetData.length === 0) {
        groupId = 1
    }

    // Make list of children to be moved
    for (var child_id in subsetData) {
        var child = subsetData[child_id];

        // Don't put groups inside groups! Only a drag can do that.
        if (child.name.indexOf('Subset') !== -1) {
            movedChildren.push(child);
            removeIds.push(child_id);
        }
    }
    if (movedChildren.length > 0) {
        movedChildren[0]['show_op'] = false;
    }

    // Delete elements from root directory that are moved
    for (var i = removeIds.length - 1; i >= 0; i--) {
        subsetData.splice(removeIds[i], 1);
    }

    subsetData.push(
        {
            id: String(nodeId++),
            name: 'Group ' + String(groupId++),
            operation: 'and',
            children: movedChildren,
            show_op: subsetData.length > 0
        });

    $('#subsetTree').tree('loadData', subsetData);


    var qtree = $('#subsetTree');
    var state = qtree.tree('getState');
    qtree.tree('loadData', subsetData, 0);
    qtree.tree('setState', state);
    qtree.tree('openNode', qtree.tree('getNodeById', nodeId - 1), true);
}

function addRule() {
    // Index zero is root node. Add subset pref to nodes
    if (subsetSelection !== "") {
        var preferences = getSubsetPreferences();

        if (subsetData.length === 0) {
            preferences['show_op'] = false;
        }

        subsetData.push(preferences);

        var qtree = $('#subsetTree');
        var state = qtree.tree('getState');
        qtree.tree('loadData', subsetData, 0);
        qtree.tree('setState', state);
        qtree.tree('closeNode', qtree.tree('getNodeById', preferences['id']), false);
        qtree.tree('openNode', qtree.tree('getNodeById', 1), true);
    }
}

/**
 * When a new rule is added, retrieve the preferences of the current subset panel
 * @returns {{}} : dictionary of preferences
 */
function getSubsetPreferences() {
    if (subsetSelection == 'Date') {

        // There is a small bug here, but the case isn't very important in the first place
        // // Don't add a rule if the dates have not been changed
        // if (dateminUser.getTime() === datemin.getTime() && datemaxUser.getTime() === datemax.getTime()){
        //     return {}
        // }

        // For mapping numerical months to strings in the child node name
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
            "July", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        return {
            id: String(nodeId++),
            name: 'Date Subset',
            children: [
                {
                    id: String(nodeId++),
                    name: 'From: ' + monthNames[dateminUser.getMonth()] + ' ' + String(dateminUser.getFullYear()),
                    fromDate: dateminUser,
                    cancellable: false,
                    show_op: false
                },
                {
                    id: String(nodeId++),
                    name: 'To:   ' + monthNames[datemaxUser.getMonth()] + ' ' + String(datemaxUser.getFullYear()),
                    toDate: datemaxUser,
                    cancellable: false,
                    show_op: false
                }
            ],
            operation: 'and'
        };
    }

    if (subsetSelection == 'Location') {
        // Make parent node
        var subset = {
            id: String(nodeId++),
            name: 'Location Subset',
            operation: 'and',
            children: []
        };

        // Add each country to the parent node as another rule
        var first = true;
        for (var country in mapListCountriesSelected) {
            if (mapListCountriesSelected[country]) {
                subset['children'].push({
                    id: String(nodeId++),
                    name: country,
                    show_op: !first,
                    operation: 'and',
                    type: 'country'
                });
                first = false;
            }
        }
        // Don't add a rule and ignore the stage if no countries are selected
        if (subset['children'].length === 0) {
            return {}
        }

        return subset
    }

    if (subsetSelection == 'Action') {
        return {
            id: String(nodeId++),
            name: 'Action Subset',
            operation: 'and',
            children: []
        }
    }
    if (subsetSelection == 'Actor') {
        // TODO: Retrieve actor preferences from actor panel
        return {
            id: String(nodeId++),
            name: 'Actor Subset',
            operation: 'and',
            children: []
        }
    }
}

/**
 * Structures rightpanel user preferences as a mongoDB CRUD query
 * @returns String
 */
function buildQuery() {
    localStorage.setItem('selectedVariables', JSON.stringify([...selectedVariables]));

    // Store the state of the tree in local data
    var subsetjson = $('#subsetTree').tree('toJson');
    localStorage.setItem('subsetData', subsetjson);
    localStorage.setItem('nodeId', nodeId);
    localStorage.setItem('groupId', groupId);

    var query = processGroup({'children': subsetData});
    console.log(JSON.stringify(query, null, '  '));

    return JSON.stringify(query);

    // First construct a boolean expression tree via operator precedence between group siblings
    // Then build query for each node and pass up the tree

    function processNode(node){
        if (node.name.indexOf('Group') !== -1 && 'children' in node && node.children.length !== 0) {
            // Recursively process subgroups
            return processGroup(node);
        } else {
            // Explicitly process rules
            return processRule(node);
        }
    }

    // Group precedence parser
    function processGroup(group) {

        // all rules are 'or'ed together
        var group_query = {'$or': []};

        // strings of rules conjuncted by 'and' operators are clotted in semigroups that act together as one rule
        var semigroup = [];

        for (var child_id = 0; child_id < group.children.length - 1; child_id++) {
            var op_self = group.children[child_id]['operation'];
            var op_next = group.children[child_id + 1]['operation'];

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
            semigroup.push(processNode(group.children[child_id]));
            group_query['$or'].push({'$and': semigroup.slice()})

        } else {
            group_query['$or'].push(processNode(group.children[child_id]));
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
        var rule_query = {};

        if (rule.name === 'Date Subset') {
            var rule_query_inner = {};
            for (var child_id in rule.children) {
                var child = rule.children[child_id];
                if ('fromDate' in child) {
                    rule_query_inner['$gte'] = child.fromDate;
                }
                if ('toDate' in child) {
                    rule_query_inner['$lte'] = child.toDate;
                }
            }
            // Wrap with conjunction operator if specified.
            if ('operation' in rule) {
                rule_query_inner = operatorWrap(rule.operation, rule_query_inner)
            }
            rule_query['date8'] = rule_query_inner;
        }

        if (rule.name === 'Location Subset'){
            rule_query['countrycode'] = processGroup(rule);
        }

        // Individual countries are themselves considered rules.
        // The code is structured this way to be able to use the group precedence parser on the country list
        if ('type' in rule && rule.type === 'country') {
            return rule.name;
        }

        return rule_query;
    }

    function operatorWrap(operation, json) {
        // If no operator is specified, mongoDB will assume 'and'
        var temp = {};

        // NAND is not explicitly defined in mongoDB, but there is an equivalent:
        // { '$nand': [content] } === { '$not': { '$and': [content] } }

        if (operation.indexOf('nand') === -1) {
            temp['$' + operation] = json;
        } else {
            temp['$not'] = {'$and': json};
        }
        return temp;
    }
}
