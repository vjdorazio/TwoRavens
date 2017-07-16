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
// localStorage.removeItem('treeData');

// Create the rightpanel data tree
if (localStorage.getItem("treeData") !== null) {
    // If the user has already submitted a query, restore the previous query from local data
    var data = JSON.parse(localStorage.getItem('treeData'));
    var nodeId = localStorage.getItem('nodeId');
    var groupId = localStorage.getItem('groupId');
} else {
    // Otherwise, start a new tree
    var data = [
        // All variables are stored as children of this node
        {
            id: '0',
            name: 'Variables',
            cancellable: false
        },
        // All subsets are stored as children of this node
        {
            id: '1',
            name: 'Subsets',
            operation: 'and',
            cancellable: false
        }
    ];
    var nodeId = 2;
    var groupId = 1;
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
    var node = $('#queryTree').tree('getNodeById', id);
    node.negate = bool;

    // TODO: There should be a more efficient way to update this data
    data = JSON.parse($('#queryTree').tree('toJson'));
    var qtree = $('#queryTree');
    var state = qtree.tree('getState');
    qtree.tree('loadData', data, 0);
    qtree.tree('setState', state);
}

function buttonLogic(id, state) {
    var logDropdown = ' <div class="dropdown" style="display:inline"><button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">' + state + ' <span class="caret"></span></button>';
    logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackLogic(' + id + ', &quot;and&quot;)">and</a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackLogic(' + id + ', &quot;or&quot;)">or</a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackLogic(' + id + ', &quot;nand&quot;)">nand</a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackLogic(' + id + ', &quot;nor&quot;)">nor</a></li>' +
        '</ul></div> ';
    return logDropdown
}

function callbackLogic(id, operand) {
    var node = $('#queryTree').tree('getNodeById', id);
    node.operation = operand;

    // TODO: There should be a more efficient way to update this data
    data = JSON.parse($('#queryTree').tree('toJson'));
    var qtree = $('#queryTree');
    var state = qtree.tree('getState');
    qtree.tree('loadData', data, 0);
    qtree.tree('setState', state);
}

function buttonDelete(id) {
    return "<button type='button' class='btn btn-default btn-xs' style='background:none;border:none;box-shadow:none;float:right;margin-top:3px' onclick='callbackDelete(" + String(id) + ")'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button></div>";
}

function callbackDelete(id) {
    var node = $('#queryTree').tree('getNodeById', id);

    if (node.children) {
        for (var i = node.children.length - 1; i >= 0; i--) {
            $('#queryTree').tree('removeNode', node.children[i])
        }
    }
    $('#queryTree').tree('removeNode', node);
    // TODO: There should be a more efficient way to update this data
    data = JSON.parse($('#queryTree').tree('toJson'))
}

// Create the query tree
$(function () {
    $('#queryTree').tree({
        data: data,
        saveState: true,
        dragAndDrop: true,
        autoOpen: true,
        selectable: false,

        // Executed for every node and leaf in the tree
        onCreateLi: function (node, $li) {
            if ('operation' in node) {
                $li.find('.jqtree-element').append(buttonLogic(node.id, node.operation));
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
            if (node.name.indexOf('Subset') !== -1 || node.name.indexOf('Group') !== -1) {
                // Catches the case for the root subsets node, which cannot be moved
                return (node.name.indexOf('Subsets') === -1);
            }
        },
        onCanMoveTo: function (moved_node, target_node, position) {
            // Nodes may not be moved outside of the root group
            if (target_node.getLevel() === 1 && target_node.name.indexOf('Subsets') === -1) {
                return false;
            }
            // Rules may be moved next to another rule or grouping
            if (position == 'after' && (target_node.name.indexOf('Subsets') !== -1 || target_node.name.indexOf('Group') !== -1)) {
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

$('#queryTree').on(
    'tree.move',
    function (event) {
        event.preventDefault();
        event.move_info.do_move();
        // Save changes when an element is moved
        data = JSON.parse($('#queryTree').tree('toJson'))
    }
);

$('#queryTree').on(
    'tree.click',
    function (event) {
        // TODO: Break if click occurred over one of the bootstrap buttons
        if (event.node.hasChildren()) {
            $('#queryTree').tree('toggle', event.node);
        }
    }
);

function addGroup() {
    // If no children in root, create an empty list and reset the group id.
    if (!('children' in data[1])) {
        data[1]['children'] = [];
        groupId = 1;
    }

    data[1]['children'].push(
        {
            id: String(nodeId++),
            name: 'Group ' + String(groupId++),
            operation: 'and',
            children: []
        });
    $('#queryTree').tree('loadData', data);
}

function addRule() {
    // Index zero is root node. Add subset pref to nodes
    if (subsetSelection !== "") {
        var preferences = getSubsetPreferences();
        if (Object.keys(preferences).length === 0) {
            return
        }

        if (!('children' in data[1])) {
            data[1]['children'] = [];
        }
        data[1]['children'].push(preferences);

        var qtree = $('#queryTree');
        var state = qtree.tree('getState');
        qtree.tree('loadData', data, 0);
        qtree.tree('setState', state);
        qtree.tree('closeNode', qtree.tree('getNodeById', preferences['id']), false);
        qtree.tree('openNode', qtree.tree('getNodeById', 1), true);
    }
}

function reloadVariables() {
    console.log(selectedVariables)
    data[0]['children'] = [];
    selectedVariables.forEach(function(element){
        data[0]['children'].push({
            id: String(nodeId++),
            name: element,
            cancellable: false
        })
    });

    var qtree = $('#queryTree');
    var state = qtree.tree('getState');
    qtree.tree('loadData', data, 0);
    qtree.tree('setState', state);
    qtree.tree('openNode', qtree.tree('getNodeById', 0), true);
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
                    cancellable: false
                },
                {
                    id: String(nodeId++),
                    name: 'To:   ' + monthNames[datemaxUser.getMonth()] + ' ' + String(datemaxUser.getFullYear()),
                    toDate: datemaxUser,
                    cancellable: false
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
        for (var country in mapListCountriesSelected) {
            if (mapListCountriesSelected[country]) {
                subset['children'].push({
                    id: String(nodeId++),
                    negate: false,
                    name: country
                });
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
            name: 'Action Subset',
            operation: 'and',
            children: []
        }
    }
    if (subsetSelection == 'Actor') {
        // TODO: Retrieve actor preferences from actor panel
        return {
            name: 'Actor Subset',
            operation: 'and',
            children: []
        }
    }
}

/**
 * Structures the data variable as a mongoDB CRUD query
 * @returns String
 */
function buildQuery() {
    // Store the state of the tree in local data
    var tree_json = $('#queryTree').tree('toJson');
    localStorage.setItem('treeData', tree_json);
    localStorage.setItem('nodeId', nodeId);
    localStorage.setItem('groupId', groupId);

    var query = processNode(data[1]);
    console.log(JSON.stringify(query, null, '  '));

    return JSON.stringify(query);

    // Return a mongoDB query for a group data structure
    function processNode(node) {
        var node_query = {};

        var operator = '$' + node['operation'];
        node_query[operator] = [];
        for (var child_id in node.children) {
            var child = node.children[child_id];

            // Check if child node is a group
            if ('children' in child && child.children.length !== 0) {

                if (child.name.indexOf('Group') !== -1) {
                    // Recursively process subgroups
                    node_query[operator].push(processNode(child));
                } else {
                    // Explicitly process rules
                    node_query[operator].push(processRule(child));
                }
            }
        }
        return node_query;
    }

    // Return a mongoDB query for a rule data structure
    function processRule(rule) {
        var rule_query = {};

        switch (rule.name) {
            case 'Date Subset':
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
                break;

            case 'Location Subset':
                var rule_query_inner = [];
                for (var child_id in rule.children) {
                    var child = rule.children[child_id];

                    if ('negate' in child && child.negate) {
                        // Wrap in negation if set
                        rule_query_inner.push({'$not': child.name})
                    } else {
                        rule_query_inner.push(child.name)
                    }
                }

                // Wrap with conjunction operator if specified.
                if ('operation' in rule) {
                    rule_query_inner = operatorWrap(rule.operation, rule_query_inner)
                }

                rule_query['countrycode'] = rule_query_inner;
                break;

            case 'Action Subset':
                break;

            case 'Actor Subset':
                break;
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
