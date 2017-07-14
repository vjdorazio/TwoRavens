// Right panel of subsetting menu


// This is the data node format
// {
//     id: String(nodeId++),    // Node number with post-increment
//     name: 'Root',            // 'Root', 'Subgroup #', '[Selection] Subset' or tag name
//     operation: 'and',        // If exists, have a logical drop down
//     children: [],            // If exists, have a triangle expander
//     negate: false,           // If exists, have a negation button
//     open: true,              // If a group, remember if open or closed
//     cancellable: false       // If exists and false, disable the delete button
// }

var nodeId = 1;

if (localStorage.getItem("treeData") !== null) {
    // If the user has already submitted a query, restore the previous query from local data
    var data = JSON.parse(localStorage.getItem('treeData'));
} else {
    // Otherwise, start a new root node
    var data = [
        {
            id: '0',
            name: 'Root',
            operation: 'and',
            children: [],
            cancellable: false
        }
    ];
}

// Define negation toggle, logic dropdown and delete button, as well as their callbacks
function buttonNegate(id, state) {
    // This state is negated simply because the buttons are visually inverted. An active button appears inactive
    // This is due to css tomfoolery
    if (!state){
        return ' <button id="boolToggle" class="btn btn-default btn-xs active" type="button" data-toggle="button" aria-pressed="true" onclick="callbackNegate(' + id + ', true)">not</button>'
    } else {
        return ' <button id="boolToggle" class="btn btn-default btn-xs" type="button" data-toggle="button" aria-pressed="true" onclick="callbackNegate(' + id + ', false)">not</button>'
    }
}

function callbackNegate(id, state){
    var node = $('#queryTree').tree('getNodeById', id);
    node.negate = state;

    // TODO: There should be a more efficient way to update this data
    data = JSON.parse($('#queryTree').tree('toJson'))
    var qtree = $('#queryTree')
    var state = qtree.tree('getState');
    qtree.tree('loadData', data, 0);
    qtree.tree('setState', state);
}

function buttonLogic(id, state) {
    logDropdown = ' <div class="dropdown" style="display:inline;"><button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">' + state + '<span class="caret"></span></button>';
    logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackLogic(' + id + ', &quot;and &quot;)">and </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackLogic(' + id + ', &quot;or &quot;)">or </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1" onclick="callbackLogic(' + id + ', &quot;nand &quot;)">nand </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2" onclick="callbackLogic(' + id + ', &quot;nor &quot;)">nor </a></li>' +
        '</ul></div>';
    return logDropdown
}

function callbackLogic(id, state){
    var node = $('#queryTree').tree('getNodeById', id);
    node.operation = state;

    // TODO: There should be a more efficient way to update this data
    data = JSON.parse($('#queryTree').tree('toJson'))
    var qtree = $('#queryTree')
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

$(function () {
    $('#queryTree').tree({
        data: data,
        saveState: true,
        dragAndDrop: true,
        autoOpen: true,
        selectable: false,
        onCreateLi: function (node, $li) {
            // Insert bootstrap gui elements into table upon creation
            if ('operation' in node) {
                $li.find('.jqtree-element').append(buttonLogic(node.id, node.operation));
            }
            if ('negate' in node) {
                $li.find('.jqtree-element').append(buttonNegate(node.id, node.negate));
            }
            if (!('cancellable' in node) || (node['cancellable'] === true)) {
                $li.find('.jqtree-element').append(buttonDelete(node.id));
            }
        },
        onCanMove: function (node) {
            // Only rules may be moved
            if (node.name.indexOf('Subset') !== -1) {
                return true;
            }
        },
        onCanMoveTo: function (moved_node, target_node, position) {
            // Nodes may not be moved outside of the root group
            if (target_node.getLevel() === 1 && target_node.name.indexOf('Root') === -1) {
                return false;
            }
            // Rules may be moved next to another rule or grouping
            if (position == 'after' && (target_node.name.indexOf('Subset') !== -1 || target_node.name.indexOf('Subgroup') !== -1)) {
                return true;
            }

            // Rules may be moved inside a group or root
            if ((position === 'inside') && (target_node.name.indexOf('Root') !== -1 || target_node.name.indexOf('Subgroup') !== -1)) {
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
        data = JSON.parse($('#queryTree').tree('toJson'))
    }
);

var groupCount = 0;

function addGroup() {
    groupCount += 1;
    data[0]['children'].push(
        {
            id: String(nodeId++),
            name: 'Subgroup ' + String(groupCount),
            operation: 'and',
            children: []
        });
    $('#queryTree').tree('loadData', data);
}

function addRule() {
    // Index zero is root node. Add subset pref to nodes
    if (subsetSelection !== "") {
        var preferences = getSubsetPreferences();

        if (!('children' in data[0])) {
            data[0]['children'] = [];
        }
        data[0]['children'].push(preferences);

        var qtree = $('#queryTree')
        var state = qtree.tree('getState');
        qtree.tree('loadData', data, 0);
        qtree.tree('setState', state);
        qtree.tree('closeNode', qtree.tree('getNodeById', preferences['id']), false);
    }
}

/**
 * When a new rule is added, retrieve the preferences of the current subset panel
 * @returns {{}} : dictionary of preferences
 */
function getSubsetPreferences() {
    if (subsetSelection == 'Date') {

        // Don't add a rule if the dates have not been changed
        if (dateminUser === datemin && datemaxUser === datemax){
            return {}
        }

        // For mapping numerical months to strings in the child node name
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
            "July", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        return {
            id: String(nodeId++),
            name: 'Date Subset',
            is_open: false,
            children: [
                {
                    id: String(nodeId++),
                    name: 'From: ' + monthNames[dateminUser.getMonth()] + ' ' + String(dateminUser.getFullYear()),
                    fromDate: dateminUser
                },
                {
                    id: String(nodeId++),
                    name: 'To:   ' + monthNames[datemaxUser.getMonth()] + ' ' + String(datemaxUser.getFullYear()),
                    toDate: datemaxUser
                }
            ],
            // Just assume the user means to 'and' the two date constraints together. Uncomment to re-add.
            // operation: 'and',
            open: false
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
                    negate: true,
                    name: country
                });
            }
        }
        // Don't add a rule and ignore the stage if no countries are selected
        if (subset['children'].length === 0){
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
 * @returns {Array}
 */
function buildQuery() {
    var tree_json = $('#queryTree').tree('toJson');
    localStorage.setItem('treeData', tree_json);

}
